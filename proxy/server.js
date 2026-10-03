/**
 * Ruijie Cloud API Proxy
 * ----------------------
 * The Ruijie Cloud open API does not send CORS headers, so a browser-based
 * web app cannot call it directly. This tiny proxy forwards requests
 * server-side and adds CORS headers.
 *
 *  POST /api/ruijie   { cloud, appid, secret, method, path, query, body }
 *  GET  /health
 *  POST /telemetry   { events: [{ ts, app, type, msg, data }] } — app event inbox
 *  GET  /telemetry?since=<ms>[&key=...] — read recent events (monitoring)
 *  POST /api/devices/register { deviceId, model, manufacturer, android, appVersion, profile, src } — device install registry (v1.5.143)
 *  GET  /api/devices/check?deviceId=... — install status: allowed|pending|blocked|unknown
 *  GET  /api/devices/list?profile=... — all devices + config (admin: profile=praythein)
 *  POST /api/devices/set { profile, deviceId, status, by } — allow/pending/block a device (admin)
 *  POST /api/devices/config { profile, maxDevices, requireApproval } — device cap config (admin)
 *  GET  /api/profiles/:name — named login profile (tier 2: render disk, tier 3: github)
 *  PUT  /api/profiles/:name { profile, key } — save profile (disk + github write-through)
 *  GET  /amh-wifi/<token> — AMH customer self-service page (capability URL, no login form)
 *  GET  /amh-wifi/<token>/info — the VLAN-30 SSID name
 *  POST /amh-wifi/<token>/set-password { newPassword } — change ONLY that SSID's password
 *  POST /api/pc/queue { key, cmd } — owner queues a shell command for their PC
 *  GET  /api/pc/queue?key=... — the PC polls & drains pending commands
 *  POST /api/pc/result { key, id, output, exit } — the PC posts a command result
 *  GET  /api/pc/result/<id>?key=... — owner polls for a command result
 *
 * - Tokens are cached in memory per (cloud, appid) and auto-refreshed.
 * - App secrets are NEVER written to disk or logs; tokens live only in RAM.
 *   (Exception, v1.5.79: named login profiles ARE persisted to disk and
 *   optionally GitHub by explicit user request — treat that store as secret
 *   material: private repo, limited server access, never log its contents.)
 * - Telemetry is an in-memory ring buffer (last 300 events); the app must
 *   NEVER send secrets (appid/secret/password/token) — only event types,
 *   voucher codes and error messages. Keys that look like credentials are
 *   stripped server-side as a second layer of defense.
 * - Zero npm dependencies: runs with plain `node server.js`.
 *
 * Env:
 *   PORT            default 3001
 *   ALLOWED_ORIGINS comma-separated list, default "*"
 *   RATE_PER_MIN    simple per-IP rate limit, default 120
 *   TELEMETRY_KEY   if set, GET /telemetry requires ?key=TELEMETRY_KEY
 *   PROFILES_KEY    if set, PUT /api/profiles/:name requires matching {key} in body
 *   GITHUB_TOKEN    optional: token with contents:read/write on the profiles repo
 *   GITHUB_PROFILES_REPO   optional: "owner/repo" holding the profiles file
 *   GITHUB_PROFILES_PATH   default "profiles.json"
 *   GITHUB_PROFILES_BRANCH default "main"
 */

'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const Profiles = require('./profiles');
const AmhWifi = require('./amh-wifi');
const Devices = require('./devices'); // v1.5.143: app install device registry

const PORT = parseInt(process.env.PORT || '3001', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
const RATE_PER_MIN = parseInt(process.env.RATE_PER_MIN || '120', 10);
const FIXED_TOKEN_PARAM = 'd63dss0a81e4415a889ac5b78fsc904a'; // per Ruijie doc: fixed value
const TOKEN_TTL_MS = 25 * 24 * 3600 * 1000; // refresh proactively (doc says 30 days)
const MAX_BODY = 1 * 1024 * 1024;

// in-memory token cache: key -> { token, fetchedAt }
const tokenCache = new Map();
// in-memory rate limiter: ip -> { count, windowStart }
const rateMap = new Map();

// ---- Telemetry inbox (v1.5.75): the app POSTs lifecycle/error events here;
// a monitoring agent GETs recent events and alerts the owner on problems.
// In-memory ring buffer (last TELEMETRY_MAX events); nothing hits disk.
// The app must NEVER send secrets — only event types, voucher codes and
// error messages. Credential-looking keys are stripped here as well.
const TELEMETRY_KEY = process.env.TELEMETRY_KEY || '';
const TELEMETRY_MAX = 300;
const telemetryBuf = []; // oldest-first: { ts, app, type, msg, data }
function telePush(ev) {
  const clean = {
    ts: Number(ev.ts) || Date.now(),
    app: String(ev.app || '').slice(0, 16),
    type: String(ev.type || 'unknown').slice(0, 48),
    msg: String(ev.msg || '').slice(0, 500),
  };
  if (ev.data && typeof ev.data === 'object') {
    const d = {};
    for (const k of Object.keys(ev.data).slice(0, 12)) {
      if (/secret|password|token|appid|api_?key|auth|cookie|session/i.test(k)) continue;
      const val = ev.data[k];
      d[String(k).slice(0, 32)] =
        typeof val === 'string' ? val.slice(0, 200) : (typeof val === 'number' && isFinite(val) ? val : null);
    }
    if (Object.keys(d).length) clean.data = d;
  }
  telemetryBuf.push(clean);
  if (telemetryBuf.length > TELEMETRY_MAX) telemetryBuf.splice(0, telemetryBuf.length - TELEMETRY_MAX);
}
async function handleTelemetryPost(req, res) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  const events = Array.isArray(payload.events) ? payload.events : (payload && payload.type ? [payload] : []);
  if (!events.length || events.length > 50) return send(res, req, 400, { code: -1, msg: 'events must be a non-empty array (max 50)' });
  let n = 0;
  for (const ev of events) { if (ev && typeof ev === 'object') { telePush(ev); n++; } }
  return send(res, req, 200, { ok: true, received: n });
}
function handleTelemetryGet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  if (TELEMETRY_KEY && u.searchParams.get('key') !== TELEMETRY_KEY) {
    return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  }
  const since = Number(u.searchParams.get('since')) || 0;
  const list = telemetryBuf.filter(e => e.ts > since).slice(-100);
  return send(res, req, 200, { ok: true, count: list.length, events: list });
}

/* ── PC command relay (v1.5.118) ────────────────────────────────
 * The assistant's VM cannot open direct tunnels (egress proxy MITMs TLS,
 * breaking Tailscale's client-cert handshake; Cloudflare's argotunnel edge
 * is SNI-filtered). Instead the owner's PC polls this queue over plain
 * HTTPS and runs commands locally, posting results back. Full shell access
 * with a few seconds of latency — enough to drive ADB, check the PC, etc.
 * Auth reuses TELEMETRY_KEY on purpose: it is already set on Render, so no
 * dashboard change is needed. In-memory only; a Render restart drops
 * pending commands (the PC just polls again).
 * The PC agent is a ~30-line PowerShell loop (see docs/pc-relay-agent.ps1). */
const pcQueue = [];   // [{ id, cmd, ts }]
const pcResults = new Map(); // id -> { output, exit, ts }
let pcSeq = 0;
function pcCheckKey(u, payload) {
  if (!TELEMETRY_KEY) return true; // open only if no key configured (dev)
  const k = (payload && payload.key) || u.searchParams.get('key');
  return k === TELEMETRY_KEY;
}
async function handlePcQueuePost(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (!pcCheckKey(u, payload)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const cmd = String(payload.cmd || '').slice(0, 4000);
  if (!cmd.trim()) return send(res, req, 400, { code: -1, msg: 'cmd is required' });
  const id = 'c' + Date.now().toString(36) + (++pcSeq).toString(36);
  pcQueue.push({ id, cmd, ts: Date.now() });
  if (pcQueue.length > 50) pcQueue.splice(0, pcQueue.length - 50);
  return send(res, req, 200, { ok: true, id });
}
function handlePcQueueGet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  if (!pcCheckKey(u, null)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const commands = pcQueue.splice(0, pcQueue.length);
  return send(res, req, 200, { ok: true, commands });
}
async function handlePcResultPost(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (!pcCheckKey(u, payload)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const id = String(payload.id || '');
  if (!id) return send(res, req, 400, { code: -1, msg: 'id is required' });
  pcResults.set(id, {
    output: String(payload.output || '').slice(0, 20000),
    exit: Number(payload.exit) || 0,
    ts: Date.now(),
  });
  if (pcResults.size > 100) {
    const first = pcResults.keys().next().value;
    pcResults.delete(first);
  }
  return send(res, req, 200, { ok: true });
}
function handlePcResultGet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  if (!pcCheckKey(u, null)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const segs = u.pathname.split('/');
  const id = decodeURIComponent(segs[segs.length - 1] || '');
  const r = pcResults.get(id);
  if (!r) return send(res, req, 200, { ok: true, done: false });
  pcResults.delete(id);
  return send(res, req, 200, { ok: true, done: true, output: r.output, exit: r.exit });
}

/* ── Agent-to-agent chat board (2026-10-03) ──────────────────────
 * Shared message board so two Muse agents (A = main chat, B = browser
 * session) can talk directly without the user relaying messages.
 *   POST /api/agents/chat { key, from, text } -> { ok, id, ts }
 *   GET  /api/agents/chat?key=...&since=<ms epoch> -> { ok, messages: [{id, from, text, ts}] }
 * Auth reuses TELEMETRY_KEY. In-memory only (Render restart clears it).
 * Rate-limited like the PC endpoints. Messages capped at 2000 chars,
 * board keeps the last 200 messages. */
const agentChatBuf = []; // [{ id, from, text, ts }]
let agentChatSeq = 0;
async function handleAgentChatPost(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (!pcCheckKey(u, payload)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const from = String(payload.from || '').slice(0, 40).trim();
  const text = String(payload.text || '').slice(0, 2000);
  if (!from || !text.trim()) return send(res, req, 400, { code: -1, msg: 'from and text are required' });
  const id = 'm' + Date.now().toString(36) + (++agentChatSeq).toString(36);
  const ts = Date.now();
  agentChatBuf.push({ id, from, text, ts });
  if (agentChatBuf.length > 200) agentChatBuf.splice(0, agentChatBuf.length - 200);
  return send(res, req, 200, { ok: true, id, ts });
}
function handleAgentChatGet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  if (!pcCheckKey(u, null)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const since = Number(u.searchParams.get('since')) || 0;
  const messages = agentChatBuf.filter(m => m.ts > since);
  return send(res, req, 200, { ok: true, messages });
}

/* ── Named login profiles (v1.5.79) ─────────────────────────────
 * Tier 2 (render disk) + tier 3 (github) of the 3-tier profile lookup.
 * Tier 1 (phone localStorage) is handled client-side and never hits this server.
 * Secrets in profiles are NEVER logged. */
const PROFILES_KEY = process.env.PROFILES_KEY || '';
const GH_TOKEN = process.env.GITHUB_TOKEN || '';
const GH_REPO = process.env.GITHUB_PROFILES_REPO || '';
const GH_PATH = process.env.GITHUB_PROFILES_PATH || 'profiles.json';
const GH_BRANCH = process.env.GITHUB_PROFILES_BRANCH || 'main';
const PROFILES_FILE = path.join(__dirname, 'profiles.json');

function profilesReadDisk() {
  try {
    const raw = fs.readFileSync(PROFILES_FILE, 'utf8');
    return Profiles.normalizeStore(JSON.parse(raw));
  } catch (e) { return { profiles: {} }; }
}
function profilesWriteDisk(store) {
  const tmp = PROFILES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, PROFILES_FILE);
}

/** GitHub Contents API helper. method GET returns {sha, store} | null; PUT returns sha | null. */
async function githubFile(method, storeObj) {
  if (!GH_TOKEN || !GH_REPO) return null;
  const apiPath = `/repos/${GH_REPO}/contents/${encodeURIComponent(GH_PATH)}`;
  const headers = {
    'User-Agent': 'ruijie-proxy',
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${GH_TOKEN}`,
  };
  const res = await new Promise((resolve, reject) => {
    // __sha is transport-only (needed for the update call); never stored in the file.
    const { __sha: _drop, ...cleanStore } = storeObj || {};
    const body = method === 'PUT' && storeObj
      ? JSON.stringify({
          message: `profiles: upsert ${new Date().toISOString()}`,
          content: Buffer.from(JSON.stringify(cleanStore, null, 2), 'utf8').toString('base64'),
          sha: storeObj.__sha || undefined,
          branch: GH_BRANCH,
        })
      : null;
    const req = https.request({
      hostname: 'api.github.com', port: 443, path: apiPath + (method === 'GET' ? `?ref=${encodeURIComponent(GH_BRANCH)}` : ''),
      method, headers: { ...headers, ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}) },
      timeout: 20000,
    }, resp => {
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => resolve({ status: resp.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('github timeout')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
  if (method === 'GET') {
    if (res.status !== 200) return null;
    try {
      const j = JSON.parse(res.text);
      const content = Buffer.from(j.content || '', 'base64').toString('utf8');
      return { sha: j.sha, store: Profiles.normalizeStore(JSON.parse(content)) };
    } catch (e) { return null; }
  }
  if (res.status === 200 || res.status === 201) {
    try { return JSON.parse(res.text).content.sha; } catch (e) { return null; }
  }
  return null;
}

async function handleProfileGet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  const segs = u.pathname.split('/');
  const name = Profiles.normName(decodeURIComponent(segs[segs.length - 1] || ''));
  if (!name) return send(res, req, 400, { code: -1, msg: 'Invalid profile name' });
  const disk = profilesReadDisk();
  if (disk.profiles[name]) {
    return send(res, req, 200, { ok: true, source: 'render', profile: Profiles.sanitizeProfile(disk.profiles[name]) });
  }
  // tier 3: github read-through (cached to disk on hit)
  try {
    const gh = await githubFile('GET');
    if (gh && gh.store.profiles[name]) {
      const merged = Profiles.mergeStores(disk, gh.store);
      try { profilesWriteDisk(merged); } catch (e) { /* cache best-effort */ }
      return send(res, req, 200, { ok: true, source: 'github', profile: Profiles.sanitizeProfile(merged.profiles[name]) });
    }
  } catch (e) { /* github failure -> 404 below, never leak details */ }
  return send(res, req, 404, { ok: false, code: -7, msg: 'Profile not found' });
}

async function handleProfilePut(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (PROFILES_KEY && payload.key !== PROFILES_KEY) {
    return send(res, req, 403, { code: -6, msg: 'Forbidden: bad sync key' });
  }
  const segs = u.pathname.split('/');
  const urlName = Profiles.normName(decodeURIComponent(segs[segs.length - 1] || ''));
  const errField = Profiles.validateProfile(payload.profile);
  if (errField || !urlName) {
    return send(res, req, 400, { code: -1, msg: 'Invalid profile (' + (errField || 'name') + ')' });
  }
  const profile = Profiles.buildProfile({ ...payload.profile, name: urlName });
  const disk = profilesReadDisk();
  disk.profiles[urlName] = profile;
  try { profilesWriteDisk(disk); }
  catch (e) { return send(res, req, 500, { code: -9, msg: 'Could not save profile on server' }); }
  // tier 3: github write-through (best-effort; disk already saved)
  let github = 'skipped';
  if (GH_TOKEN && GH_REPO) {
    try {
      const cur = await githubFile('GET');
      const storeObj = Profiles.mergeStores({ profiles: {} }, cur ? cur.store : { profiles: {} });
      storeObj.profiles[urlName] = profile;
      if (cur && cur.sha) storeObj.__sha = cur.sha;
      const sha = await githubFile('PUT', storeObj);
      github = sha ? 'ok' : 'error';
    } catch (e) { github = 'error'; }
  }
  return send(res, req, 200, { ok: true, source: 'render', github, profile: Profiles.sanitizeProfile(profile) });
}

/* ── App settings sync (v1.5.120) ────────────────────────────────
 * Per-user app settings sync across phones. Same 3-tier pattern as profiles:
 * phone localStorage -> render disk -> github write-through.
 * NEVER syncs secrets: gwPass/gwIp/gwAuto are stripped server-side too.
 * Body: { settings: {...}, updatedAt, key } — key gated by PROFILES_KEY.
 * Conflict: last-write-wins by updatedAt. */
const SETTINGS_NEVER_SYNC = ['gwPass', 'gwIp', 'gwAuto'];
function sanitizeSettings(s) {
  if (!s || typeof s !== 'object') return {};
  const out = {};
  for (const k of Object.keys(s)) {
    if (SETTINGS_NEVER_SYNC.includes(k)) continue;
    const v = s[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}
async function handleSettingsGet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  const segs = u.pathname.split('/');
  const name = Profiles.normName(decodeURIComponent(segs[segs.length - 1] || ''));
  if (!name) return send(res, req, 400, { code: -1, msg: 'Invalid profile name' });
  const disk = profilesReadDisk();
  const entry = disk.settings && disk.settings[name];
  if (entry) {
    return send(res, req, 200, { ok: true, source: 'render', settings: sanitizeSettings(entry.settings), updatedAt: entry.updatedAt || 0 });
  }
  try {
    const gh = await githubFile('GET');
    if (gh && gh.store.settings && gh.store.settings[name]) {
      const merged = Profiles.mergeStores(disk, gh.store);
      try { profilesWriteDisk(merged); } catch (e) {}
      const e2 = merged.settings[name];
      return send(res, req, 200, { ok: true, source: 'github', settings: sanitizeSettings(e2.settings), updatedAt: e2.updatedAt || 0 });
    }
  } catch (e) {}
  return send(res, req, 404, { ok: false, code: -7, msg: 'Settings not found' });
}
async function handleSettingsPut(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (PROFILES_KEY && payload.key !== PROFILES_KEY) {
    return send(res, req, 403, { code: -6, msg: 'Forbidden: bad sync key' });
  }
  const segs = u.pathname.split('/');
  const urlName = Profiles.normName(decodeURIComponent(segs[segs.length - 1] || ''));
  if (!urlName || !payload.settings || typeof payload.settings !== 'object') {
    return send(res, req, 400, { code: -1, msg: 'Invalid settings payload' });
  }
  const entry = { settings: sanitizeSettings(payload.settings), updatedAt: Number(payload.updatedAt) || Date.now() };
  const disk = profilesReadDisk();
  const cur = disk.settings && disk.settings[urlName];
  if (cur && cur.updatedAt > entry.updatedAt) {
    return send(res, req, 200, { ok: true, source: 'render', kept: 'server-newer', settings: sanitizeSettings(cur.settings), updatedAt: cur.updatedAt });
  }
  disk.settings = disk.settings || {};
  disk.settings[urlName] = entry;
  try { profilesWriteDisk(disk); }
  catch (e) { return send(res, req, 500, { code: -9, msg: 'Could not save settings on server' }); }
  let github = 'skipped';
  if (GH_TOKEN && GH_REPO) {
    try {
      const cur2 = await githubFile('GET');
      const storeObj = Profiles.mergeStores({ profiles: {}, settings: {} }, cur2 ? cur2.store : { profiles: {}, settings: {} });
      storeObj.settings = storeObj.settings || {};
      storeObj.settings[urlName] = entry;
      if (cur2 && cur2.sha) storeObj.__sha = cur2.sha;
      const sha = await githubFile('PUT', storeObj);
      github = sha ? 'ok' : 'error';
    } catch (e) { github = 'error'; }
  }
  return send(res, req, 200, { ok: true, source: 'render', github, updatedAt: entry.updatedAt });
}

/* ── App install device registry (v1.5.143) ────────────────────────
 * The owner sees which devices installed the app, caps the count, can
 * require approval for new devices, and blocks unknown ones. Register +
 * check are open (rate-limited); list/set/config need profile=praythein
 * (same casual name-only trust as the named login). */
async function handleDeviceRegister(req, res) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let p;
  try { p = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  const store = Devices.readStore();
  const status = Devices.registerDevice(store, p);
  if (!status) return send(res, req, 400, { code: -1, msg: 'deviceId is required' });
  try { Devices.writeStore(store); }
  catch (e) { return send(res, req, 500, { code: -9, msg: 'Could not save device registry' }); }
  return send(res, req, 200, { ok: true, status });
}
function handleDeviceCheck(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  const id = String(u.searchParams.get('deviceId') || '').slice(0, 128);
  const store = Devices.readStore();
  const d = store.devices[id];
  return send(res, req, 200, { ok: true, status: d ? (d.status || 'allowed') : 'unknown' });
}
function deviceAdmin(u, payload) {
  const prof = Devices.normName((payload && payload.profile) || u.searchParams.get('profile'));
  return prof === Devices.ADMIN_PROFILE;
}
function handleDeviceList(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  if (!deviceAdmin(u)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const store = Devices.readStore();
  const devices = Object.values(store.devices).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  return send(res, req, 200, { ok: true, devices, config: store.config });
}
async function handleDeviceSet(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let p;
  try { p = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (!deviceAdmin(u, p)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const id = String(p.deviceId || '').slice(0, 128);
  const status = String(p.status || '');
  if (!['allowed', 'pending', 'blocked'].includes(status)) {
    return send(res, req, 400, { code: -1, msg: 'status must be allowed|pending|blocked' });
  }
  const store = Devices.readStore();
  const d = store.devices[id];
  if (!d) return send(res, req, 404, { code: -7, msg: 'Device not found' });
  // Safety: never block the device you're managing from.
  const by = String(p.by || '').slice(0, 128);
  if (status === 'blocked' && by && by === id) {
    return send(res, req, 400, { code: -1, msg: 'Cannot block the device you are managing from' });
  }
  d.status = status;
  d.lastSeen = Date.now();
  try { Devices.writeStore(store); }
  catch (e) { return send(res, req, 500, { code: -9, msg: 'Could not save device registry' }); }
  return send(res, req, 200, { ok: true, status });
}
async function handleDeviceConfig(req, res, u) {
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let p;
  try { p = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  if (!deviceAdmin(u, p)) return send(res, req, 403, { code: -6, msg: 'Forbidden' });
  const store = Devices.readStore();
  const m = Number(p.maxDevices);
  if (Number.isFinite(m)) store.config.maxDevices = Math.min(100, Math.max(1, Math.round(m)));
  if (typeof p.requireApproval === 'boolean') store.config.requireApproval = p.requireApproval;
  try { Devices.writeStore(store); }
  catch (e) { return send(res, req, 500, { code: -9, msg: 'Could not save device registry' }); }
  return send(res, req, 200, { ok: true, config: store.config });
}

function corsHeaders(req) {  const origin = req.headers.origin || '';
  const allow = ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS.includes(origin) ? origin : '');
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (allow) h['Access-Control-Allow-Origin'] = allow;
  return h;
}

function send(res, req, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { ...corsHeaders(req), 'Content-Type': 'application/json' });
  res.end(body);
}

function checkRate(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let e = rateMap.get(ip);
  if (!e || now - e.windowStart > 60000) { e = { count: 0, windowStart: now }; rateMap.set(ip, e); }
  e.count += 1;
  return e.count <= RATE_PER_MIN;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// low-level https/json helper (follows no redirects; Ruijie API doesn't redirect)
function httpsJson(urlStr, method, bodyObj, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const opts = {
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method, timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const req = https.request(opts, resp => {
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: resp.statusCode, json: JSON.parse(text) }); }
        catch (e) { resolve({ status: resp.statusCode, json: { code: -999, msg: 'Non-JSON response from Ruijie', _raw: text.slice(0, 300) } }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('upstream timeout')); });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function fetchAccessToken(cloud, appid, secret) {
  const url = `${cloud}/service/api/oauth20/client/access_token?token=${FIXED_TOKEN_PARAM}`;
  const { json } = await httpsJson(url, 'POST', { appid, secret });
  if (json && json.code === 0 && json.accessToken) return json.accessToken;
  throw new Error('Ruijie token request failed: ' + JSON.stringify(json).slice(0, 300));
}

async function getToken(cloud, appid, secret, forceRefresh = false) {
  const key = cloud + '|' + appid;
  const cached = tokenCache.get(key);
  if (!forceRefresh && cached && (Date.now() - cached.fetchedAt) < TOKEN_TTL_MS) return cached.token;
  // try refresh endpoint first if we have an old token
  if (cached && cached.token) {
    try {
      const rurl = `${cloud}/service/api/token/refresh?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(cached.token)}`;
      const { json } = await httpsJson(rurl, 'GET', null);
      const nt = json && (json.accessToken || json.access_token);
      if (json && json.code === 0 && nt) {
        tokenCache.set(key, { token: nt, fetchedAt: Date.now() });
        return nt;
      }
    } catch (e) { /* fall through to full login */ }
  }
  const token = await fetchAccessToken(cloud, appid, secret);
  tokenCache.set(key, { token, fetchedAt: Date.now() });
  return token;
}

async function handleRuijie(req, res) {
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }

  const cloud = (payload.cloud || 'https://cloud-as.ruijienetworks.com').replace(/\/+$/, '');
  const { appid, secret, method, path, query, body } = payload;
  if (!appid || !secret) return send(res, req, 400, { code: -1, msg: 'appid and secret are required' });
  if (!path || !/^[A-Za-z0-9_\-\/.]+$/.test(path)) return send(res, req, 400, { code: -1, msg: 'invalid path' });
  const m = (method || 'GET').toUpperCase();
  if (m !== 'GET' && m !== 'POST') return send(res, req, 400, { code: -1, msg: 'only GET/POST supported' });

  let token;
  try { token = await getToken(cloud, appid, secret); }
  catch (e) { return send(res, req, 502, { code: -2, msg: String(e.message || e) }); }

  const attempt = async (tok) => {
    const qs = new URLSearchParams({ ...(query || {}), access_token: tok }).toString();
    // v1.5.23: a leading "/" means absolute path on the cloud host (e.g. logbiz
    // APIs live at /logbizagent/..., NOT under /service/api/).
    const apiPath = path.startsWith('/') ? path.slice(1) : `service/api/${path}`;
    const url = `${cloud}/${apiPath}?${qs}`;
    return httpsJson(url, m, m === 'POST' ? (body || {}) : null);
  };

  try {
    let r = await attempt(token);
    // code 4 (per Ruijie docs) ~ token invalid/expired -> refresh once and retry.
    // "Login timeout" is Ruijie's answer when a cached token died server-side
    // (secret rotated / token expired early) — same recovery.
    const loginTimeout = r.json && typeof r.json.msg === 'string' && r.json.msg.toLowerCase() === 'login timeout';
    if ((r.json && r.json.code === 4) || loginTimeout) {
      token = await getToken(cloud, appid, secret, true);
      r = await attempt(token);
    }
    return send(res, req, 200, r.json);
  } catch (e) {
    return send(res, req, 502, { code: -3, msg: 'Upstream error: ' + String(e.message || e) });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders(req));
      return res.end();
    }
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/health' && req.method === 'GET') {
      return send(res, req, 200, { ok: true, service: 'ruijie-proxy', time: new Date().toISOString() });
    }
    if (u.pathname === '/api/ruijie' && req.method === 'POST') {
      if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
      return handleRuijie(req, res);
    }
    if (u.pathname === '/telemetry' && req.method === 'POST') return handleTelemetryPost(req, res);
    if (u.pathname === '/telemetry' && req.method === 'GET') return handleTelemetryGet(req, res, u);
    if (u.pathname === '/api/pc/queue' && req.method === 'POST') return handlePcQueuePost(req, res, u);
    if (u.pathname === '/api/pc/queue' && req.method === 'GET') return handlePcQueueGet(req, res, u);
    if (u.pathname === '/api/pc/result' && req.method === 'POST') return handlePcResultPost(req, res, u);
    if (u.pathname.startsWith('/api/pc/result/') && req.method === 'GET') return handlePcResultGet(req, res, u);
    if (u.pathname === '/api/agents/chat' && req.method === 'POST') return handleAgentChatPost(req, res, u);
    if (u.pathname === '/api/agents/chat' && req.method === 'GET') return handleAgentChatGet(req, res, u);
    if (u.pathname.startsWith('/api/profiles/') && req.method === 'GET') return handleProfileGet(req, res, u);
    if (u.pathname.startsWith('/api/profiles/') && req.method === 'PUT') return handleProfilePut(req, res, u);
    if (u.pathname.startsWith('/api/settings/') && req.method === 'GET') return handleSettingsGet(req, res, u);
    if (u.pathname.startsWith('/api/settings/') && req.method === 'PUT') return handleSettingsPut(req, res, u);
    // v1.5.143: app install device registry
    if (u.pathname === '/api/devices/register' && req.method === 'POST') return handleDeviceRegister(req, res);
    if (u.pathname === '/api/devices/check' && req.method === 'GET') return handleDeviceCheck(req, res, u);
    if (u.pathname === '/api/devices/list' && req.method === 'GET') return handleDeviceList(req, res, u);
    if (u.pathname === '/api/devices/set' && req.method === 'POST') return handleDeviceSet(req, res, u);
    if (u.pathname === '/api/devices/config' && req.method === 'POST') return handleDeviceConfig(req, res, u);
    // AMH customer self-service WiFi password (v1.5.89): capability-URL page,
    // server-side portal CAS login, only the VLAN-30 SSID can be changed.
    if (u.pathname.startsWith('/amh-wifi/')) return AmhWifi.handle(req, res, u);
    // Team chat UI (A-B-C-D + User group chat)
    if (u.pathname === '/team-chat' && req.method === 'GET') {
      try {
        let html = fs.readFileSync(path.join(__dirname, 'team-chat.html'), 'utf8');
        html = html.replace(/__CHAT_KEY__/g, process.env.TELEMETRY_KEY || '');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      } catch (e) { return send(res, req, 500, { code: -9, msg: 'chat page missing' }); }
    }
    return send(res, req, 404, { code: -5, msg: 'Not found' });
  } catch (e) {
    return send(res, req, 500, { code: -9, msg: 'Proxy error: ' + String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`ruijie-proxy listening on :${PORT}`);
});

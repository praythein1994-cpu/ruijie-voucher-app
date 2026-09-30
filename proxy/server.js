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
 *  GET  /api/profiles/:name — named login profile (tier 2: render disk, tier 3: github)
 *  PUT  /api/profiles/:name { profile, key } — save profile (disk + github write-through)
 *  GET  /amt-wifi/<token> — AMH customer self-service page (capability URL, no login form)
 *  GET  /amt-wifi/<token>/info — the VLAN-30 SSID name
 *  POST /amt-wifi/<token>/set-password { newPassword } — change ONLY that SSID's password
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
const AmtWifi = require('./amt-wifi');

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
    if (u.pathname.startsWith('/api/profiles/') && req.method === 'GET') return handleProfileGet(req, res, u);
    if (u.pathname.startsWith('/api/profiles/') && req.method === 'PUT') return handleProfilePut(req, res, u);
    // AMH customer self-service WiFi password (v1.5.89): capability-URL page,
    // server-side portal CAS login, only the VLAN-30 SSID can be changed.
    if (u.pathname.startsWith('/amt-wifi/')) return AmtWifi.handle(req, res, u);
    return send(res, req, 404, { code: -5, msg: 'Not found' });
  } catch (e) {
    return send(res, req, 500, { code: -9, msg: 'Proxy error: ' + String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`ruijie-proxy listening on :${PORT}`);
});

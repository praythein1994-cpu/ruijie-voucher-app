/**
 * Ruijie Cloud API Proxy
 * ----------------------
 * The Ruijie Cloud open API does not send CORS headers, so a browser-based
 * web app cannot call it directly. This tiny proxy forwards requests
 * server-side and adds CORS headers.
 *
 *  POST /api/ruijie   { cloud, appid, secret, method, path, query, body }
 *  GET  /health
 *
 * - Tokens are cached in memory per (cloud, appid) and auto-refreshed.
 * - App secrets are NEVER written to disk or logs; tokens live only in RAM.
 * - Zero npm dependencies: runs with plain `node server.js`.
 *
 * Env:
 *   PORT            default 3001
 *   ALLOWED_ORIGINS comma-separated list, default "*"
 *   RATE_PER_MIN    simple per-IP rate limit, default 120
 */

'use strict';
const http = require('http');
const https = require('https');
const { URL } = require('url');

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

function corsHeaders(req) {
  const origin = req.headers.origin || '';
  const allow = ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS.includes(origin) ? origin : '');
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
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
    return send(res, req, 404, { code: -5, msg: 'Not found' });
  } catch (e) {
    return send(res, req, 500, { code: -9, msg: 'Proxy error: ' + String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`ruijie-proxy listening on :${PORT}`);
});

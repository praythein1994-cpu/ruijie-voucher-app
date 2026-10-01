/**
 * v1.5.79 named-profile tests — real code from js/api.js, stubbed browser env.
 * Covers: name normalization (4 variants + separate user), validation,
 * 3-tier lookup (phone -> github -> render), and the all-3-confirmed push.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; /* console.log('  ok  ' + name); */ }
  else { failed++; console.log('  FAIL ' + name); }
}

/* ── stubbed browser env ─────────────────────────────── */
const lsStore = {};
global.window = {};
global.localStorage = {
  getItem: k => (Object.prototype.hasOwnProperty.call(lsStore, k) ? lsStore[k] : null),
  setItem: (k, v) => { lsStore[k] = String(v); },
  removeItem: k => { delete lsStore[k]; },
  clear: () => { for (const k of Object.keys(lsStore)) delete lsStore[k]; },
};

/* scripted fetch: each test sets global.__fetchScript = async (url, opts) => response */
global.__fetchScript = null;
global.fetch = async (url, opts) => {
  if (!global.__fetchScript) throw new Error('fetch not scripted for ' + url);
  return global.__fetchScript(url, opts || {});
};
function jsonResp(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

/* ── load the REAL api.js ────────────────────────────── */
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const factory = new Function('module', 'exports', 'require', src + '\n;module.exports = { Profiles, GITHUB_PROFILES };');
const mod = { exports: {} };
factory(mod, mod.exports, require);
const { Profiles, GITHUB_PROFILES } = mod.exports;

const VALID = {
  name: 'praythein', display: 'Pray Thein',
  cloud: 'https://cloud-as.ruijienetworks.com',
  appid: 'APPID123', secret: 'SECRET123',
  proxy: 'https://ruijie-voucher-proxy.onrender.com',
  email: 'user@example.com', password: 'pw123',
};
function ghFileBody(profiles) {
  const b64 = Buffer.from(JSON.stringify({ profiles }), 'utf8').toString('base64');
  return { content: b64, sha: 'abc123' };
}

/* ── 1. name normalization ───────────────────────────── */
ok(Profiles.normName('PrayThein') === 'praythein', 'norm: PrayThein');
ok(Profiles.normName('praythein') === 'praythein', 'norm: praythein');
ok(Profiles.normName('Pray Thein') === 'praythein', 'norm: Pray Thein');
ok(Profiles.normName('pray Thein') === 'praythein', 'norm: pray Thein');
ok(Profiles.normName('  PRAY   thein  ') === 'praythein', 'norm: messy spaces/case');
ok(Profiles.normName('Htun Naing') === 'htunnaing', 'norm: Htun Naing');
ok(Profiles.normName('htunnaing') === 'htunnaing', 'norm: htunnaing');
ok(Profiles.normName('htunnaing') !== Profiles.normName('PrayThein'), 'norm: separate users');
ok(Profiles.normName('') === '', 'norm: empty');
ok(Profiles.normName('a') === '', 'norm: too short');
ok(Profiles.normName('x'.repeat(33)) === '', 'norm: too long');
ok(Profiles.normName('a b!c') === '', 'norm: bad chars');
ok(Profiles.normName('-abc') === '', 'norm: leading dash');
ok(Profiles.normName(null) === '', 'norm: null');

/* ── 2. validation ───────────────────────────────────── */
ok(Profiles.validate(VALID) === null, 'validate: ok');
ok(Profiles.validate({ ...VALID, name: 'a' }) === 'name', 'validate: bad name');
ok(Profiles.validate({ ...VALID, appid: '' }) === 'appid', 'validate: bad appid');
ok(Profiles.validate({ ...VALID, secret: '' }) === 'secret', 'validate: bad secret');
ok(Profiles.validate({ ...VALID, email: 'not-an-email' }) === 'email', 'validate: bad email');
ok(Profiles.validate({ ...VALID, password: '' }) === 'password', 'validate: bad password');
ok(Profiles.validate(null) === 'profile', 'validate: null');

/* ── 3. local store roundtrip ────────────────────────── */
localStorage.clear();
Profiles.put(VALID);
ok(Profiles.get('Pray Thein').appid === 'APPID123', 'store: get via variant');
ok(Profiles.get('praythein').email === 'user@example.com', 'store: get exact');
Profiles.forget('PRAYTHEIN');
ok(Profiles.get('praythein') === null, 'store: forget');

/* ── 4. lookup: phone hit → no network ───────────────── */
(async () => {
  localStorage.clear();
  Profiles.put(VALID);
  let fetchCalls = 0;
  global.__fetchScript = async () => { fetchCalls++; throw new Error('should not fetch'); };
  const r = await Profiles.lookup('Pray Thein', 'https://proxy.example');
  ok(r.status === 'found' && r.source === 'phone' && r.profile.appid === 'APPID123', 'lookup: phone hit');
  ok(fetchCalls === 0, 'lookup: phone hit makes no network call');

  /* ── 5. lookup: github hit → found + cached to phone ── */
  localStorage.clear();
  let authHeader = '';
  global.__fetchScript = async (url, opts) => {
    authHeader = (opts.headers || {}).Authorization || '';
    ok(url.startsWith('https://api.github.com/repos/' + GITHUB_PROFILES.repo + '/contents/'), 'fetchGithub: correct URL');
    ok(url.includes('ref=' + GITHUB_PROFILES.branch), 'fetchGithub: branch ref');
    return jsonResp(200, ghFileBody({ praythein: VALID }));
  };
  const g = await Profiles.lookup('praythein', 'https://proxy.example');
  ok(g.status === 'found' && g.source === 'github', 'lookup: github hit');
  ok(authHeader === 'Bearer ' + GITHUB_PROFILES.token, 'fetchGithub: bearer token sent');
  ok(Profiles.get('praythein') !== null, 'lookup: github hit cached to phone');

  /* ── 6. lookup: github miss → proxy hit ─────────────── */
  localStorage.clear();
  global.__fetchScript = async (url) => {
    if (url.startsWith('https://api.github.com/')) return jsonResp(200, ghFileBody({ someoneelse: VALID }));
    if (url.includes('/api/profiles/')) return jsonResp(200, { ok: true, source: 'render', profile: VALID });
    throw new Error('unexpected ' + url);
  };
  const px = await Profiles.lookup('praythein', 'https://proxy.example');
  ok(px.status === 'found' && px.source === 'render', 'lookup: proxy hit after github miss');
  ok(Profiles.get('praythein') !== null, 'lookup: proxy hit cached to phone');

  /* ── 7. lookup: all miss → notfound ─────────────────── */
  localStorage.clear();
  global.__fetchScript = async (url) => {
    if (url.startsWith('https://api.github.com/')) return jsonResp(200, ghFileBody({}));
    return jsonResp(404, { ok: false });
  };
  const nf = await Profiles.lookup('nosuchuser', 'https://proxy.example');
  ok(nf.status === 'notfound', 'lookup: all miss → notfound');

  /* ── 8. lookup: remote error → error (not notfound) ─── */
  localStorage.clear();
  global.__fetchScript = async (url) => {
    if (url.startsWith('https://api.github.com/')) throw new Error('network down');
    return jsonResp(404, { ok: false });
  };
  const er = await Profiles.lookup('praythein', 'https://proxy.example');
  ok(er.status === 'error', 'lookup: github down → error (caller shows try-again)');

  /* ── 9. lookup: bad name ────────────────────────────── */
  const bn = await Profiles.lookup('a', 'https://proxy.example');
  ok(bn.status === 'badname', 'lookup: bad name');

  /* ── 10. fetchGithub edge cases ─────────────────────── */
  global.__fetchScript = async () => jsonResp(404, { message: 'Not Found' });
  ok((await Profiles.fetchGithub('praythein')).status === 'notfound', 'fetchGithub: 404 → notfound');
  global.__fetchScript = async () => jsonResp(401, { message: 'Bad credentials' });
  ok((await Profiles.fetchGithub('praythein')).status === 'error', 'fetchGithub: 401 → error');
  global.__fetchScript = async () => jsonResp(200, { content: '' });
  ok((await Profiles.fetchGithub('praythein')).status === 'error', 'fetchGithub: empty → error');

  /* ── 11. pushRemote ─────────────────────────────────── */
  let putBody = null;
  global.__fetchScript = async (url, opts) => {
    putBody = JSON.parse(opts.body);
    return jsonResp(200, { ok: true, source: 'render', github: 'ok', profile: VALID });
  };
  const pr1 = await Profiles.pushRemote('praythein', VALID, '', 'https://proxy.example');
  ok(pr1.proxy === 'ok' && pr1.github === 'ok', 'pushRemote: all ok');
  ok(putBody.profile.name === 'praythein' && putBody.key === '', 'pushRemote: body shape');

  global.__fetchScript = async () => jsonResp(403, { ok: false, code: -6, msg: 'Forbidden: bad sync key' });
  const pr2 = await Profiles.pushRemote('praythein', VALID, 'wrong', 'https://proxy.example');
  ok(pr2.proxy === 'key', 'pushRemote: 403/-6 → key demanded');

  global.__fetchScript = async () => jsonResp(500, { ok: false });
  const pr3 = await Profiles.pushRemote('praythein', VALID, '', 'https://proxy.example');
  ok(pr3.proxy === 'error', 'pushRemote: 500 → error');

  global.__fetchScript = async () => jsonResp(200, { ok: true, github: 'error' });
  const pr4 = await Profiles.pushRemote('praythein', VALID, '', 'https://proxy.example');
  ok(pr4.proxy === 'ok' && pr4.github === 'error', 'pushRemote: github write failed → error');

  global.__fetchScript = async () => jsonResp(200, { ok: true, github: 'skipped' });
  const pr5 = await Profiles.pushRemote('praythein', VALID, '', 'https://proxy.example');
  ok(pr5.proxy === 'ok' && pr5.github === 'skipped', 'pushRemote: github skipped (server not configured)');

  global.__fetchScript = async () => { throw new Error('timeout'); };
  const pr6 = await Profiles.pushRemote('praythein', VALID, '', 'https://proxy.example');
  ok(pr6.proxy === 'error' && pr6.github === 'skipped', 'pushRemote: network fail');

  /* ── 12. BUILTIN_SYNC_KEY (APK build injection) ───────── */
  // Simulate exactly what android/build-apk.sh does to the copied assets.
  const injectedSrc = src.replace(
    "const BUILTIN_SYNC_KEY = '';",
    "const BUILTIN_SYNC_KEY = 'TESTBUILTINK3Y';"
  );
  ok(injectedSrc !== src, 'builtin: injection point found in real api.js');
  const factory2 = new Function('module', 'exports', 'require', injectedSrc + '\n;module.exports = { Profiles };');
  const mod2 = { exports: {} };
  factory2(mod2, mod2.exports, require);
  const Profiles2 = mod2.exports.Profiles;
  let putBody2 = null;
  global.__fetchScript = async (url, opts) => {
    putBody2 = JSON.parse(opts.body);
    return jsonResp(200, { ok: true, source: 'render', github: 'ok', profile: VALID });
  };
  const prb1 = await Profiles2.pushRemote('praythein', VALID, '', 'https://proxy.example');
  ok(prb1.proxy === 'ok', 'builtin: empty key arg → builtin key sent, push ok');
  ok(putBody2 && putBody2.key === 'TESTBUILTINK3Y', 'builtin: PUT body carries injected key');
  // Typed/remembered key still wins over the builtin one (rotation fallback).
  let putBody3 = null;
  global.__fetchScript = async (url, opts) => {
    putBody3 = JSON.parse(opts.body);
    return jsonResp(200, { ok: true, source: 'render', github: 'ok', profile: VALID });
  };
  await Profiles2.pushRemote('praythein', VALID, 'typedkey', 'https://proxy.example');
  ok(putBody3 && putBody3.key === 'typedkey', 'builtin: typed key overrides builtin');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });

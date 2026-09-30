/**
 * AMH customer self-service WiFi password changer (v1.5.89).
 * -----------------------------------------------------------
 * A standalone capability-URL web app that lets the VLAN-30 customer change
 * their OWN SSID password without any login form and without the admin app.
 *
 *   GET  /amt-wifi/<token>               -> the customer page (token-gated)
 *   GET  /amt-wifi/<token>/info          -> { ok, ssidName }
 *   POST /amt-wifi/<token>/set-password  -> { newPassword } -> { ok }
 *
 * Server side only:
 *  - Logs into the Ruijie Cloud portal via CAS (same flow as the Android
 *    WebView: GET login page -> RSA-encrypt password with the page's
 *    JSEncrypt public key -> POST form -> follow ticket -> portal cookies).
 *  - Uses the portal webproxy API with the exact headers the native app uses.
 *  - Resolves the ONE SSID whose vlanId == AMT_VLAN and refuses to touch
 *    anything else. No create / no delete / no other SSID, ever.
 *
 * Env:
 *   AMT_PORTAL_USER   Ruijie portal email (admin account that owns the SSIDs)
 *   AMT_PORTAL_PASS   Ruijie portal password  (NEVER logged, NEVER sent to client)
 *   AMT_LINK_TOKEN    long random secret; the customer URL contains it
 *   AMT_GROUP_ID      Ruijie project group id (numeric)
 *   AMT_VLAN          default "30"
 *   AMT_SSID          optional: pin by exact SSID name instead of vlanId match
 *
 * Zero npm dependencies. Passwords are never written to disk or logs.
 */
'use strict';
const https = require('https');
const crypto = require('crypto');

const PORTAL_USER = process.env.AMT_PORTAL_USER || '';
const PORTAL_PASS = process.env.AMT_PORTAL_PASS || '';
const LINK_TOKEN = process.env.AMT_LINK_TOKEN || '';
const GROUP_ID = process.env.AMT_GROUP_ID || '';
const AMT_VLAN = process.env.AMT_VLAN || '30';
const AMT_SSID_PIN = process.env.AMT_SSID || '';

const CLOUD = 'https://cloud-as.ruijienetworks.com';
const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';
// Production JSEncrypt RSA public key, taken from the portal login page's
// init.intl.js (getRsaEncryptedVal). PKCS#1 v1.5, same as the page's JSEncrypt.
const RSA_PUBKEY_B64 = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKjeUvf/EGSrhYUApZlJRYYsYIkWQu5tcPc8bkWVqnlAFrJlVWmvgD5zd9Sevi7qNIl9+1NvNlFcqiUGgsevCNMCAwEAAQ==';

const PW_RE = /^[a-zA-Z0-9@<=>\[\]!#$*().]+$/;

/* ── path-aware cookie jar ─────────────────────────────────────────── */
function makeJar() {
  const list = []; // { name, value, path }
  return {
    store(headers) {
      const set = headers['set-cookie'];
      if (!set) return;
      for (const c of (Array.isArray(set) ? set : [set])) {
        const m = /^([^=;]+)=([^;]*)/.exec(c);
        if (!m) continue;
        const name = m[1].trim(), value = m[2].trim();
        const pm = /;\s*[Pp]ath=([^;]*)/.exec(c);
        const path = (pm ? pm[1].trim() : '/') || '/';
        const i = list.findIndex(e => e.name === name && e.path === path);
        if (i >= 0) list[i].value = value; else list.push({ name, value, path });
      }
    },
    header(urlStr) {
      const u = new URL(urlStr);
      const p = u.pathname || '/';
      const best = new Map(); // name -> { value, pathLen }
      for (const e of list) {
        if (!p.startsWith(e.path)) continue;
        const cur = best.get(e.name);
        if (!cur || e.path.length > cur.pathLen) best.set(e.name, { value: e.value, pathLen: e.path.length });
      }
      return [...best.entries()].map(([k, v]) => k + '=' + v.value).join('; ');
    },
    names() { return [...new Set(list.map(e => e.name))].join(','); },
  };
}

/* ── low-level https with redirect following ───────────────────────── */
function httpReq(method, urlStr, jar, { headers = {}, body = null, maxRedirects = 10, timeoutMs = 25000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method, timeout: timeoutMs,
      headers: { 'User-Agent': UA, ...headers },
    };
    const ch = jar.header(urlStr);
    if (ch) opts.headers['Cookie'] = ch;
    if (body != null) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const r = https.request(opts, resp => {
      jar.store(resp.headers);
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', async () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if ([301, 302, 303, 307, 308].includes(resp.statusCode) && resp.headers.location && maxRedirects > 0) {
          const next = new URL(resp.headers.location, urlStr).toString();
          let m2 = method, b2 = body;
          if (resp.statusCode === 303 || ((resp.statusCode === 301 || resp.statusCode === 302) && method === 'POST')) { m2 = 'GET'; b2 = null; }
          try { resolve(await httpReq(m2, next, jar, { headers, body: b2, maxRedirects: maxRedirects - 1, timeoutMs })); }
          catch (e) { reject(e); }
          return;
        }
        resolve({ status: resp.statusCode, url: urlStr, text, headers: resp.headers });
      });
    });
    r.on('timeout', () => { r.destroy(); reject(new Error('upstream timeout')); });
    r.on('error', reject);
    if (body != null) r.write(body);
    r.end();
  });
}

function rsaEncryptPassword(pw) {
  const pem = '-----BEGIN PUBLIC KEY-----\n' + RSA_PUBKEY_B64 + '\n-----END PUBLIC KEY-----';
  return crypto.publicEncrypt(
    { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(String(pw), 'utf8')
  ).toString('base64');
}

function formField(html, name) {
  const m = html.match(new RegExp('name="' + name + '"[^>]*value="([^"]*)"'));
  return m ? m[1] : null;
}

/* ── portal session (cached; re-login on 401/403-not-login) ────────── */
let session = null;          // { jar, at }
let loginInflight = null;
const SESSION_MAX_AGE_MS = 4 * 3600 * 1000;

async function portalLogin() {
  if (loginInflight) return loginInflight;
  loginInflight = (async () => {
    if (!PORTAL_USER || !PORTAL_PASS) throw new Error('Portal credentials not configured (AMT_PORTAL_USER/AMT_PORTAL_PASS)');
    const jar = makeJar();
    // 1. land on the CAS login page
    const login = await httpReq('GET', CLOUD + '/webproxy/sso/back', jar);
    const lt = formField(login.text, 'lt');
    const execution = formField(login.text, 'execution');
    const sign = formField(login.text, 'sign') || '';
    const action = (login.text.match(/<form[^>]*action="([^"]*)"/) || [])[1];
    if (!lt || !execution || !action) throw new Error('Could not parse CAS login form');
    // 2. submit encrypted credentials
    const params = new URLSearchParams({
      username: PORTAL_USER,
      password: rsaEncryptPassword(PORTAL_PASS),
      lt, execution, sign,
      _eventId: 'submit', timeZone: '', selectedCloud: '',
      googleTotpCode: '', disposableCode: '',
    });
    const postUrl = new URL(action, login.url).toString();
    const res = await httpReq('POST', postUrl, jar, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': login.url,
        'Origin': CLOUD,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      body: params.toString(),
    });
    if (!res.url.includes('/webproxy/') && !res.text.includes('sso/back')) {
      // stayed on the login page -> diagnose WHY so the cause is actionable.
      const t = res.text;
      const m = t.match(/id="credential\.errors"[^>]*>([^<]{2,200})/);
      const credErr = m ? m[1].trim().replace(/\s+/g, ' ') : '';
      const signals = [];
      if (credErr) signals.push('portal says: ' + credErr);
      if (/captcha/i.test(t) && /<img[^>]*captcha|<input[^>]*captcha/i.test(t)) signals.push('captcha challenge shown');
      if (/googleTotpCode/i.test(t) && /totp[^<]{0,80}(display:\s*block|show)/i.test(t)) signals.push('2FA totp challenge shown');
      if (/locked|frozen/i.test(t)) signals.push('account locked/frozen mentioned');
      const visible = t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
      if (visible) signals.push('page says: "' + visible + '"');
      signals.push('http ' + res.status + ', body ' + t.length + ' chars');
      if (/<title>[^<]*(attention required|just a moment)/i.test(t)) signals.push('bot-protection challenge page');
      if (/too many|rate.?limit|try again later/i.test(t)) signals.push('rate-limit suspected');
      throw new Error('Portal login rejected' + (signals.length ? ' (' + signals.join('; ') + ')' : ' (no detail extracted)') +
        ' — check AMT_PORTAL_USER/AMT_PORTAL_PASS (2FA accounts are not supported)');
    }
    // 3. verify the session with a cheap webproxy call
    const probe = await webProxyRaw(jar, '/conf/group/' + GROUP_ID + '/templates', {
      api: '/conf/group/' + GROUP_ID + '/templates',
      authParams: { api: '/conf/group/' + GROUP_ID + '/templates', method: 'GET' },
      method: 'GET', module: 'default', params: {}, querys: { lang: 'en' },
    });
    if (probe.status === 401 || (probe.status === 403 && /not login|ssojump/i.test(probe.text))) {
      throw new Error('Portal session not established after login');
    }
    session = { jar, at: Date.now() };
    console.log('[amt-wifi] portal login ok');
    return session;
  })();
  try { return await loginInflight; }
  finally { loginInflight = null; }
}

async function getSession() {
  if (session && (Date.now() - session.at) < SESSION_MAX_AGE_MS) return session;
  return portalLogin();
}

/** Raw webproxy POST. Mirrors SsoSession.webProxyRaw headers exactly. */
async function webProxyRaw(jar, apiPath, envelope) {
  const clean = apiPath.startsWith('/') ? apiPath : '/' + apiPath;
  const url = CLOUD + '/webproxy/common/api?' + clean; // query keeps the leading slash
  const body = JSON.stringify(envelope);
  return httpReq('POST', url, jar, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': CLOUD,
      'Referer': CLOUD + '/',
    },
    body,
  });
}

async function webProxy(apiPath, envelope) {
  let s = await getSession();
  let r = await webProxyRaw(s.jar, apiPath, envelope);
  if (r.status === 401 || (r.status === 403 && /not login|ssojump/i.test(r.text))) {
    session = null; // dead session -> fresh login once
    s = await portalLogin();
    r = await webProxyRaw(s.jar, apiPath, envelope);
  }
  let j = null;
  try { j = JSON.parse(r.text); } catch (e) { /* keep null */ }
  return { status: r.status, json: j, raw: r.text.slice(0, 300) };
}

/* ── SSID resolve: the ONE SSID on AMT_VLAN ─────────────────────────── */
async function resolveTargetSsid() {
  if (!GROUP_ID) throw new Error('AMT_GROUP_ID not configured');
  const tApi = '/conf/group/' + GROUP_ID + '/templates';
  const t = await webProxy(tApi, {
    api: tApi, authParams: { api: tApi, method: 'GET' },
    method: 'GET', module: 'default', params: {}, querys: { lang: 'en' },
  });
  const tj = t.json || {};
  const tempList = tj.tempList || tj.data || [];
  const tempId = tempList.length ? (tempList[0].id || tempList[0].templateId) : null;
  if (!tempId) throw new Error('No WiFi template found');
  const wApi = '/conf/wifi_grp/wifi';
  const w = await webProxy(wApi, {
    api: wApi, authParams: { api: wApi, method: 'GET' },
    method: 'GET', module: 'default', params: {},
    querys: { group_id: GROUP_ID, conf_template_id: tempId, lang: 'en' },
  });
  const wj = w.json || {};
  const list = (wj.data && wj.data.ssidList) || wj.ssidList || [];
  let target = null;
  if (AMT_SSID_PIN) {
    target = list.find(s => String(s.ssidName || '').toLowerCase() === AMT_SSID_PIN.toLowerCase()) || null;
    if (!target) throw new Error('Pinned SSID not found: ' + AMT_SSID_PIN);
  } else {
    const matches = list.filter(s => String(s.vlanId) === String(AMT_VLAN));
    if (!matches.length) throw new Error('VLAN ' + AMT_VLAN + ' SSID not found');
    if (matches.length > 1) {
      throw new Error('Multiple SSIDs on VLAN ' + AMT_VLAN + ' (' +
        matches.map(s => s.ssidName).join(', ') + ') — set AMT_SSID to pin one');
    }
    target = matches[0];
  }
  const ssidId = target.id || target.ssidId;
  if (!ssidId) throw new Error('SSID id missing');
  return { tempId, ssid: target, ssidId, ssidName: String(target.ssidName || '') };
}

function validatePassword(pw) {
  const p = String(pw || '');
  if (p.length < 8) return 'Password အနည်းဆုံး ၈ လုံး ရှိရမယ်';
  if (!PW_RE.test(p)) return 'ခွင့်ပြုထားတဲ့ စာလုံး/ဂဏန်း/သင်္ကေတတွေပဲ သုံးပါ';
  return null;
}

async function setTargetPassword(newPassword) {
  const err = validatePassword(newPassword);
  if (err) throw new Error(err);
  const { tempId, ssid, ssidId, ssidName } = await resolveTargetSsid();
  // PUT the FULL object back, only the password changed (portal sends full config).
  const obj = Object.assign({}, ssid);
  obj.password = String(newPassword);
  if (Array.isArray(obj.relatedRadio)) obj.relatedRadio = obj.relatedRadio.join(',');
  if (!obj.authEntity) obj.authEntity = {};
  const api = '/conf/template/' + tempId + '/ssid/' + ssidId;
  const r = await webProxy(api, {
    api, authParams: { api, method: 'PUT' },
    method: 'PUT', module: 'default',
    params: { wirelessConfEntity: obj },
    querys: { lang: 'en' },
  });
  const j = r.json || {};
  const code = typeof j.code !== 'undefined' ? j.code : -1;
  if (code !== 0 && code !== 200) {
    throw new Error(j.msg || j.message || ('Password ချိန်းမရပါ (code ' + code + ')'));
  }
  console.log('[amt-wifi] password changed for SSID "' + ssidName + '"');
  return { ssidName };
}

/* ── strict per-IP rate limits for these endpoints ──────────────────── */
const rlMap = new Map(); // ip -> { info: {count,win}, setpw: {count,win} }
function checkAmtRate(ip, kind) {
  const now = Date.now();
  const lim = kind === 'setpw' ? { n: 3, ms: 10 * 60 * 1000 } : { n: 20, ms: 60 * 1000 };
  let e = rlMap.get(ip);
  if (!e) { e = {}; rlMap.set(ip, e); }
  let b = e[kind];
  if (!b || now - b.win > lim.ms) { b = { count: 0, win: now }; e[kind] = b; }
  b.count += 1;
  return b.count <= lim.n;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 64 * 1024) { reject(new Error('too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function tokenFromPath(pathname) {
  // /amt-wifi/<token>[/info|/set-password]
  const segs = pathname.split('/').filter(Boolean);
  return segs.length >= 2 ? decodeURIComponent(segs[1]) : '';
}

/* ── the customer page (self-contained, Burmese/English, mobile-first) ── */
function customerPage() {
  return `<!doctype html>
<html lang="my"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WiFi Password ချိန်းမယ်</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,'Noto Sans Myanmar',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1e293b;border-radius:20px;padding:28px 24px;max-width:400px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.45);position:relative}
.lang{position:absolute;top:12px;right:12px;display:flex;gap:6px}
.lang button{width:auto;margin:0;padding:6px 10px;font-size:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#94a3b8;cursor:pointer}
.lang button.on{background:#0284c7;color:#fff;border-color:#0284c7}
h1{font-size:20px;margin:8px 0 6px;text-align:center}
.sub{text-align:center;color:#94a3b8;font-size:13px;margin:0 0 18px}
.ssid{background:#0f172a;border:1px solid #334155;border-radius:12px;padding:12px;text-align:center;margin-bottom:18px}
.ssid small{color:#94a3b8;display:block;font-size:12px;margin-bottom:4px}
.ssid b{font-size:18px;color:#7dd3fc}
label{display:block;font-size:13px;color:#94a3b8;margin:12px 0 6px}
input{width:100%;padding:12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:16px}
input:focus{outline:none;border-color:#38bdf8}
button.go{width:100%;margin-top:20px;padding:14px;border:0;border-radius:12px;background:#0284c7;color:#fff;font-size:16px;font-weight:700;cursor:pointer}
button.go:disabled{opacity:.5;cursor:default}
#msg{margin-top:14px;text-align:center;font-size:14px;min-height:20px}
.ok{color:#4ade80}.err{color:#f87171}
.hint{font-size:11px;color:#64748b;text-align:center;margin-top:10px}
</style></head><body>
<div class="card">
<div class="lang"><button id="lmy" class="on">မြန်မာ</button><button id="len">English</button></div>
<h1 id="t1">🔒 WiFi Password ချိန်းမယ်</h1>
<p class="sub" id="t2">ကိုယ့် WiFi password ကို ဒီကနေ ချိန်းလို့ရပါတယ်</p>
<div class="ssid"><small id="t3">Network</small><b id="ssid">…</b></div>
<label id="t4">Password အသစ်</label>
<input type="password" id="pw1" autocomplete="new-password" placeholder="…">
<label id="t5">Password အသစ် (ထပ်ရိုက်ပါ)</label>
<input type="password" id="pw2" autocomplete="new-password" placeholder="…">
<button class="go" id="go">ချိန်းမယ်</button>
<p id="msg"></p>
<p class="hint" id="t6">Password ချိန်းပြီးရင် WiFi ပြန်ချိတ်ဖို့ password အသစ်ထည့်ပေးပါ</p>
</div>
<script>
(function(){
var STR = {
my: { t1:'🔒 WiFi Password ချိန်းမယ်', t2:'ကိုယ့် WiFi password ကို ဒီကနေ ချိန်းလို့ရပါတယ်', t3:'Network',
t4:'Password အသစ်', t5:'Password အသစ် (ထပ်ရိုက်ပါ)', t6:'Password ချိန်းပြီးရင် WiFi ပြန်ချိတ်ဖို့ password အသစ်ထည့်ပေးပါ',
go:'ချိန်းမယ်', ph1:'အနည်းဆုံး ၈ လုံး', ph2:'ထပ်ရိုက်ပါ',
mismatch:'Password ၂ ခု တူညီမှု မရှိပါ', confirm:'Password အသစ်ကို သေချာပြီလား?',
working:'ချိန်းနေပါတယ်…', done:'✅ Password ချိန်းပြီးပါပြီ', noconnect:'ဆာဗာနဲ့ ချိတ်မရပါ', noresp:'အချက်အလက် ရမရပါ' },
en: { t1:'🔒 Change WiFi Password', t2:'Change your WiFi password here', t3:'Network',
t4:'New password', t5:'New password (retype)', t6:'After changing, reconnect WiFi with the new password',
go:'Change', ph1:'At least 8 characters', ph2:'Retype it',
mismatch:'Passwords do not match', confirm:'Are you sure about the new password?',
working:'Changing…', done:'✅ Password changed', noconnect:'Cannot reach server', noresp:'Could not load info' }
};
var lang = localStorage.getItem('amt-lang') || 'my';
function applyLang(){
  var S = STR[lang];
  ['t1','t2','t3','t4','t5','t6'].forEach(function(id){ document.getElementById(id).textContent = S[id]; });
  document.getElementById('go').textContent = S.go;
  document.getElementById('pw1').placeholder = S.ph1; document.getElementById('pw2').placeholder = S.ph2;
  document.getElementById('lmy').className = lang==='my'?'on':''; document.getElementById('len').className = lang==='en'?'on':'';
  document.documentElement.lang = lang;
}
document.getElementById('lmy').addEventListener('click', function(){ lang='my'; localStorage.setItem('amt-lang','my'); applyLang(); });
document.getElementById('len').addEventListener('click', function(){ lang='en'; localStorage.setItem('amt-lang','en'); applyLang(); });
applyLang();
var base = location.pathname.replace(/\\/$/,'');
var msg = document.getElementById('msg');
function say(t, ok){ msg.textContent = t; msg.className = ok ? 'ok' : 'err'; }
fetch(base + '/info').then(function(r){ return r.json(); }).then(function(j){
  document.getElementById('ssid').textContent = j.ok ? j.ssidName : '—';
  if(!j.ok) say(j.msg || STR[lang].noresp, false);
}).catch(function(){ say(STR[lang].noconnect, false); });
document.getElementById('go').addEventListener('click', function(){
  var S = STR[lang];
  var p1 = document.getElementById('pw1').value, p2 = document.getElementById('pw2').value;
  if(p1 !== p2){ say(S.mismatch, false); return; }
  if(!confirm(S.confirm)) return;
  var btn = document.getElementById('go'); btn.disabled = true; say(S.working, true);
  fetch(base + '/set-password', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ newPassword: p1 }) }).then(function(r){ return r.json(); }).then(function(j){
    btn.disabled = false;
    if(j.ok){ say(S.done, true); document.getElementById('pw1').value=''; document.getElementById('pw2').value=''; }
    else say(j.msg || 'Error', false);
  }).catch(function(){ btn.disabled = false; say(S.noconnect, false); });
});
})();
<\/script></body></html>`;
}

/* ── router (called from server.js) ────────────────────────────────── */
async function handle(req, res, u) {
  const ip = req.socket.remoteAddress || 'unknown';
  const token = tokenFromPath(u.pathname);
  if (!LINK_TOKEN || token !== LINK_TOKEN) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ code: -5, msg: 'Not found' }));
  }
  const segs = u.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && segs.length === 2) {
    // the page itself
    const html = customerPage();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  if (req.method === 'GET' && segs[2] === 'info') {
    if (!checkAmtRate(ip, 'info')) return sendJson(res, 429, { ok: false, msg: 'ခဏစောင့်ပြီး ပြန်နှိပ်ပါ' });
    try {
      const { ssidName } = await resolveTargetSsid();
      return sendJson(res, 200, { ok: true, ssidName });
    } catch (e) {
      return sendJson(res, 502, { ok: false, msg: String(e.message || e) });
    }
  }
  if (req.method === 'POST' && segs[2] === 'set-password') {
    if (!checkAmtRate(ip, 'setpw')) return sendJson(res, 429, { ok: false, msg: 'အကြိမ်ရေ များနေပါတယ် — ၁၀ မိနစ်စောင့်ပြီး ပြန်လုပ်ပါ' });
    let payload;
    try { payload = JSON.parse(await readBody(req)); }
    catch (e) { return sendJson(res, 400, { ok: false, msg: 'Invalid request' }); }
    try {
      const { ssidName } = await setTargetPassword(payload.newPassword);
      return sendJson(res, 200, { ok: true, ssidName });
    } catch (e) {
      return sendJson(res, 502, { ok: false, msg: String(e.message || e) });
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ code: -5, msg: 'Not found' }));
}

module.exports = { handle };

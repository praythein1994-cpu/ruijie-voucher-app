/**
 * AMH customer self-service WiFi password changer (v1.5.90).
 * -----------------------------------------------------------
 * A standalone capability-URL web app that lets the VLAN-30 customer change
 * their OWN SSID password without any login form and without the admin app.
 *
 *   GET  /amh-wifi/<token>               -> the customer page (token-gated)
 *   GET  /amh-wifi/<token>/info          -> { ok, ssidName }
 *   POST /amh-wifi/<token>/set-password  -> { newPassword } -> { ok }
 *
 * Server side only (uses the Ruijie Cloud OPEN API, not portal CAS):
 *  - App ID/Secret -> access_token (cached in memory, refreshed on expiry).
 *  - POST {cloud}/service/api/open/v1/wifi with { groupId, ssidId,
 *    wirelessConfEntity: <FULL pinned config, password replaced> } to change
 *    ONLY the pinned SSID's password. The full object is resent (verified
 *    2026-09-30: password-only partial updates are not the safe path).
 *    No create / no delete / no other SSID, ever.
 *  - The target SSID is pinned by its numeric ssidId (AMH_SSID_ID = 16325319
 *    for AMH/VLAN 30), verified from the portal /conf/wifi_grp/wifi snapshot.
 *    The open API has no SSID-list endpoint.
 *
 * Env:
 *   AMH_APP_ID        Ruijie open-platform App ID
 *   AMH_APP_SECRET    Ruijie open-platform App Secret (NEVER logged, NEVER sent to client)
 *   AMH_LINK_TOKEN    long random secret; the customer URL contains it
 *   AMH_GROUP_ID      Ruijie project group id (numeric)
 *   AMH_SSID_ID       numeric ssidId of the customer's SSID (pinned)
 *   AMH_SSID_NAME     display name of the customer's SSID (for /info + page)
 *   AMH_CLOUD         optional, default https://cloud-as.ruijienetworks.com
 *
 * Zero npm dependencies. Secrets are never written to disk or logs.
 */
'use strict';
const https = require('https');
const crypto = require('crypto');

const APP_ID = process.env.AMH_APP_ID || '';
const APP_SECRET = process.env.AMH_APP_SECRET || '';
const LINK_TOKEN = process.env.AMH_LINK_TOKEN || '';
const GROUP_ID = process.env.AMH_GROUP_ID || '';
const SSID_ID = process.env.AMH_SSID_ID || '';
const SSID_NAME = process.env.AMH_SSID_NAME || '';
const CLOUD = (process.env.AMH_CLOUD || 'https://cloud-as.ruijienetworks.com').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';
const FIXED_TOKEN_PARAM = 'd63dss0a81e4415a889ac5b78fsc904a'; // per Ruijie doc: fixed value

const PW_RE = /^[a-zA-Z0-9@<=>\[\]!#$*().]+$/;
const PW_MIN = 8, PW_MAX = 32;

/* ── low-level https JSON ──────────────────────────────────────────── */
function httpsJson(urlStr, method, body, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = body != null ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method, timeout: timeoutMs,
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, resp => {
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* non-JSON */ }
        resolve({ status: resp.statusCode, json, text: text.slice(0, 300) });
      });
    });
    r.on('timeout', () => { r.destroy(); reject(new Error('upstream timeout')); });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

/* ── open API access token (cached; refreshed on expiry) ───────────── */
let tokenCache = null; // { token, at }
let tokenInflight = null;
const TOKEN_TTL_MS = 90 * 60 * 1000; // refresh proactively well before expiry

async function fetchAccessToken() {
  if (!APP_ID || !APP_SECRET) throw new Error('API credentials not configured (AMH_APP_ID/AMH_APP_SECRET)');
  const url = `${CLOUD}/service/api/oauth20/client/access_token?token=${FIXED_TOKEN_PARAM}`;
  const { json } = await httpsJson(url, 'POST', { appid: APP_ID, secret: APP_SECRET });
  if (json && json.code === 0 && json.accessToken) return json.accessToken;
  throw new Error('Ruijie token request failed: ' + JSON.stringify(json).slice(0, 200));
}

async function getToken(forceRefresh = false) {
  if (tokenInflight) return tokenInflight;
  tokenInflight = (async () => {
    if (!forceRefresh && tokenCache && (Date.now() - tokenCache.at) < TOKEN_TTL_MS) return tokenCache.token;
    const t = await fetchAccessToken();
    tokenCache = { token: t, at: Date.now() };
    return t;
  })();
  try { return await tokenInflight; }
  finally { tokenInflight = null; }
}

async function openApi(path, body, retry = true) {
  const tok = await getToken();
  const url = `${CLOUD}${path}?access_token=${encodeURIComponent(tok)}`;
  const { status, json } = await httpsJson(url, 'POST', body);
  if (json && json.code === 0) return json;
  // token expired/invalid -> refresh once and retry
  const msg = (json && json.msg) || '';
  if (retry && /token|expire|invalid|login/i.test(msg)) {
    const tok2 = await getToken(true);
    const url2 = `${CLOUD}${path}?access_token=${encodeURIComponent(tok2)}`;
    const r2 = await httpsJson(url2, 'POST', body);
    if (r2.json && r2.json.code === 0) return r2.json;
    throw new Error('Ruijie API error: ' + JSON.stringify(r2.json).slice(0, 300));
  }
  throw new Error('Ruijie API error ' + status + ': ' + JSON.stringify(json).slice(0, 300));
}

/* ── password change (pinned SSID only) ────────────────────────────── */
/* Verified pattern (2026-09-30): open API wifi EDIT requires the FULL
 * wirelessConfEntity. A password-only object is rejected by the proven
 * safe-path, so we resend the complete pinned config with ONLY the
 * password replaced. The config below is the verified portal snapshot of
 * the AMH (VLAN 30) SSID; the live password is never stored here. */
const AMH_FULL_CONF = {
  ssidName: 'AMH',
  ssidEncode: 'utf-8',
  relatedRadio: '1,2',
  enable: 'true',
  ishidden: 'false',
  fowardType: 'bridge',
  vlanId: 30,
  encryptionMode: 'wpa_wpa2-psk',
  encryptionModeDesc: 'WPA/WPA2-PSK',
  upRate: 0, downRate: 0, wlanUpRate: 0, wlanDownRate: 0,
  qosEnable: 'false',
  wlanQosEnable: 'false',
  authEnable: 'false',
  bandSelectEnable: 'false',
  ppskEnable: 'false',
  usersLimit: 0,
  xpressEnable: 'false',
  ftEnable: 0,
  okcEnable: 0,
  axMode: 'true',
  isApartment: 'false',
};

async function setSsidPassword(newPassword) {
  if (!SSID_ID) throw new Error('Target SSID not configured (AMH_SSID_ID)');
  return openApi('/service/api/open/v1/wifi', {
    groupId: Number(GROUP_ID),
    wifiGrpSsid: false,
    ssidId: Number(SSID_ID),
    wirelessConfEntity: { ...AMH_FULL_CONF, password: newPassword },
  });
}

/* ── tiny HTML page (MY/EN toggle) ─────────────────────────────────── */
function pageHtml() {
  const T = {
    my: {
      title: 'WiFi စကားဝှက် ချိန်းမယ်', sub: 'သင့်ရဲ့ WiFi စကားဝှက်ကို ဒီမှာ ချိန်းနိုင်ပါတယ်',
      cur: 'လက်ရှိ WiFi နာမည်', npw: 'စကားဝှက် အသစ်', cpw: 'စကားဝှက် အသစ် (အတည်ပြု)',
      btn: 'ချိန်းမယ်', hint: 'အနည်းဆုံး ၈ လုံး။ ခွင့်ပြုသော စာလုံးများ: A-Z a-z 0-9 @<=>[]!#$*().',
      ok: 'စကားဝှက် ချိန်းပြီးပါပြီ ✅', mismatch: 'စကားဝှက် နှစ်ခု မတူပါ', bad: 'စကားဝှက် ပုံစံ မမှန်ပါ',
      err: 'ချိန်းမရပါ။ ထပ်ကြိုးစားကြည့်ပါ', wait: 'ချိန်းနေသည်…',
    },
    en: {
      title: 'Change WiFi Password', sub: 'Change your WiFi password right here',
      cur: 'Current WiFi name', npw: 'New password', cpw: 'New password (confirm)',
      btn: 'Change', hint: 'Minimum 8 characters. Allowed: A-Z a-z 0-9 @<=>[]!#$*().',
      ok: 'Password changed ✅', mismatch: 'Passwords do not match', bad: 'Invalid password format',
      err: 'Change failed. Please try again', wait: 'Changing…',
    },
  };
  return `<!DOCTYPE html><html lang="my"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${T.my.title}</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1e293b;border-radius:16px;padding:28px;width:100%;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,.4)}
h1{font-size:20px;margin:0 0 4px}.sub{color:#94a3b8;font-size:13px;margin:0 0 20px}
.ssid{background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:18px}
.ssid .lbl{font-size:11px;color:#94a3b8;margin-bottom:4px}.ssid .val{font-size:17px;font-weight:600}
label{display:block;font-size:13px;color:#cbd5e1;margin:12px 0 6px}
input{width:100%;padding:12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:16px}
.hint{font-size:11px;color:#64748b;margin-top:6px}
button{width:100%;margin-top:20px;padding:14px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
button:disabled{background:#475569;cursor:default}
.msg{margin-top:14px;font-size:14px;min-height:20px;text-align:center}
.msg.ok{color:#4ade80}.msg.err{color:#f87171}
.lang{position:absolute;top:14px;right:14px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:20px;padding:6px 12px;font-size:13px;cursor:pointer}
</style></head><body>
<button class="lang" id="langBtn">English</button>
<div class="card">
<h1 id="t_title"></h1><p class="sub" id="t_sub"></p>
<div class="ssid"><div class="lbl" id="t_cur"></div><div class="val" id="ssidName">…</div></div>
<label id="t_npw"></label><input type="password" id="npw" autocomplete="new-password">
<label id="t_cpw"></label><input type="password" id="cpw" autocomplete="new-password">
<div class="hint" id="t_hint"></div>
<button id="btn"></button>
<div class="msg" id="msg"></div>
</div>
<script>
const T=${JSON.stringify(T)};
let lang=localStorage.getItem('amh-lang')||'my';
function apply(){
  const t=T[lang];
  document.getElementById('t_title').textContent=t.title;
  document.getElementById('t_sub').textContent=t.sub;
  document.getElementById('t_cur').textContent=t.cur;
  document.getElementById('t_npw').textContent=t.npw;
  document.getElementById('t_cpw').textContent=t.cpw;
  document.getElementById('t_hint').textContent=t.hint;
  document.getElementById('btn').textContent=t.btn;
  document.getElementById('langBtn').textContent=lang==='my'?'English':'မြန်မာ';
  document.documentElement.lang=lang==='my'?'my':'en';
}
document.getElementById('langBtn').onclick=()=>{lang=lang==='my'?'en':'my';localStorage.setItem('amh-lang',lang);apply();};
apply();
fetch(location.pathname+'/info').then(r=>r.json()).then(d=>{
  document.getElementById('ssidName').textContent=d.ok&&d.ssidName?d.ssidName:'—';
}).catch(()=>{document.getElementById('ssidName').textContent='—';});
const msg=document.getElementById('msg'),btn=document.getElementById('btn');
btn.onclick=async()=>{
  const t=T[lang],a=document.getElementById('npw').value,b=document.getElementById('cpw').value;
  msg.className='msg';msg.textContent='';
  if(a!==b){msg.classList.add('err');msg.textContent=t.mismatch;return;}
  if(!/^[a-zA-Z0-9@<=>[\\]!#$*().]{8,32}$/.test(a)){msg.classList.add('err');msg.textContent=t.bad;return;}
  btn.disabled=true;msg.textContent=t.wait;
  try{
    const r=await fetch(location.pathname+'/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newPassword:a})});
    const d=await r.json();
    if(d.ok){msg.classList.add('ok');msg.textContent=t.ok;document.getElementById('npw').value='';document.getElementById('cpw').value='';}
    else{msg.classList.add('err');msg.textContent=t.err+(d.msg?' ('+d.msg+')':'');}
  }catch(e){msg.classList.add('err');msg.textContent=t.err;}
  btn.disabled=false;
};
<\/script></body></html>`;
}

/* ── rate limiting ─────────────────────────────────────────────────── */
const rl = new Map(); // ip -> { count, resetAt, changes, changeResetAt }
function checkRate(ip, isWrite) {
  const now = Date.now();
  let e = rl.get(ip);
  if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + 60000, changes: 0, changeResetAt: now + 3600000 }; rl.set(ip, e); }
  if (now > e.changeResetAt) { e.changes = 0; e.changeResetAt = now + 3600000; }
  e.count++;
  if (e.count > 60) return false;                    // 60 req/min per IP
  if (isWrite) { e.changes++; if (e.changes > 5) return false; } // 5 password changes/hour per IP
  return true;
}

/* ── router (called from server.js) ────────────────────────────────── */
function tokenFromPath(p) {
  const m = /^\/amh-wifi\/([^\/]+)/.exec(p || '');
  return m ? m[1] : '';
}

async function handle(req, res, u) {
  const ip = (req.socket && req.socket.remoteAddress) || 'unknown';
  const token = tokenFromPath(u.pathname);
  if (!LINK_TOKEN || token !== LINK_TOKEN) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ code: -5, msg: 'Not found' }));
  }
  const segs = u.pathname.split('/').filter(Boolean);

  // GET /amh-wifi/<token> -> page
  if (req.method === 'GET' && segs.length === 2) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(pageHtml());
  }
  // GET /amh-wifi/<token>/info -> SSID name (pinned; no portal login needed)
  if (req.method === 'GET' && segs.length === 3 && segs[2] === 'info') {
    if (!checkRate(ip, false)) { res.writeHead(429, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, msg: 'rate limited' })); }
    // verify API credentials work (cheap auth check), but don't touch the SSID
    try {
      await getToken();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, ssidName: SSID_NAME || null }));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, msg: String(e.message || e).slice(0, 200) }));
    }
  }
  // POST /amh-wifi/<token>/set-password { newPassword }
  if (req.method === 'POST' && segs.length === 3 && segs[2] === 'set-password') {
    if (!checkRate(ip, true)) { res.writeHead(429, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, msg: 'rate limited' })); }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', async () => {
      try {
        const d = JSON.parse(body || '{}');
        const pw = String(d.newPassword || '');
        if (!PW_RE.test(pw) || pw.length < PW_MIN || pw.length > PW_MAX) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, msg: 'invalid password format' }));
        }
        await setSsidPassword(pw);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, msg: String(e.message || e).slice(0, 200) }));
      }
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ code: -5, msg: 'Not found' }));
}

module.exports = { handle };

/* local self-test */
if (require.main === module) {
  const html = pageHtml();
  const checks = [
    ['has MY/EN toggle', html.includes('amh-lang')],
    ['has password form', html.includes('set-password')],
    ['no portal refs', !/portal|cas|sso/i.test(html)],
  ];
  let fail = 0;
  for (const [n, ok] of checks) { console.log((ok ? 'PASS' : 'FAIL') + ' ' + n); if (!ok) fail++; }
  process.exit(fail ? 1 : 0);
}

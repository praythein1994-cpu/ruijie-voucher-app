/**
 * fix12b test — gateway Authentication -> Online Clients (app_auth) as the
 * voucher source (v1.5.96).
 * Verified 2026-10-01 from the user's DevTools capture of
 * /admin/alone/authentication/web_online:
 *   POST /cgi-bin/luci/api/cmd?auth=<sid>
 *   {method:"devSta.get", params:{module:"app_auth", noParse:false,
 *    async:null, remoteIp:false, data:{func:"app_auth_get_user_online"},
 *    device:"pc"}}
 * -> {code:0, data:{user:[{mac:"fa17.5101.04e3", ip:"192.168.20.141",
 *      userName:"33637503", auth_type:"wifidog", time:"2026-10-1 6:49:46",
 *      timeUsed:"10930", timeLimit:"0", status:"On"}, ... x10]}}
 * userName IS the voucher code. NOTE: app_auth holds only the
 * voucher-authenticated users (10 in the capture) — it is a
 * voucher-attribution source joined by MAC, NOT the client enumeration
 * (user_list stays the enumeration so the other ~33 clients are not lost).
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

const apiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

/* Extract an arrow-function const (`const name = params => {`) as a callable */
function extractArrow(src, name) {
  const re = new RegExp('const ' + name + '\\s*=\\s*([^=]*?)=>\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, i = m.index + m[0].length - 1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return new Function(m[1].trim(), src.slice(m.index + m[0].length, i));
}

/* The WebView shares one scope: api.js uses app.js's normMac. Mirror it here. */
const normMac = s => String(s || '').toUpperCase().replace(/[^0-9A-F]/g, '');

/* ── normGwAuthUser (api.js) ── */
const rawAuth = extractArrow(apiSrc, 'normGwAuthUser');
ok(typeof rawAuth === 'function', 'normGwAuthUser exists');
/* Rebind the free `normMac` reference to the shared-scope implementation. */
const normAuth = new Function('normMac', 'return (' + rawAuth.toString() + ')')(normMac);

// Real record from the user's 2-5.txt capture
const u1 = normAuth({ mac: 'fa17.5101.04e3', time: '2026-10-1 6:49:46',
  timeUsed: '10930', timeLimit: '0', status: 'On',
  userName: '33637503', auth_type: 'wifidog', ip: '192.168.20.141' });
ok(u1 && u1.mac === 'FA17510104E3', 'dotted MAC normalized to FA17510104E3');
ok(u1 && u1.voucher === '33637503', 'userName extracted as voucher');
ok(u1 && u1.ip === '192.168.20.141', 'ip kept');
ok(u1 && u1.authType === 'wifidog', 'auth_type kept');
ok(u1 && u1.timeUsedSec === 10930, 'timeUsed parsed to seconds');
ok(u1 && u1.loginTime === '2026-10-1 6:49:46', 'login time kept');
ok(u1 && u1.status === 'On', 'status kept');

// Rejections — never invent a voucher
ok(normAuth(null) === null, 'null rejected');
ok(normAuth({}) === null, 'empty object rejected');
ok(normAuth({ mac: 'fa17.5101.04e3' }) === null, 'missing userName rejected');
ok(normAuth({ userName: '33637503' }) === null, 'missing mac rejected');
ok(normAuth({ mac: 'xyz-xyz', userName: '33637503' }) === null, 'hex-less mac rejected');
ok(normAuth([]) === null, 'array rejected');

/* ── key-format consistency: api.js keys must match app.js lookups ── */
ok(normMac('52:EE:0B:75:BD:9C') === '52EE0B75BD9C', 'app.js normMac strips to uppercase');
ok(normAuth({ mac: '52:ee:0b:75:bd:9c', userName: 'x', ip: '1.2.3.4' }).mac === normMac('52:EE:0B:75:BD:9C'),
   'auth key format matches staList lookup format');

/* ── authOnlineUsers probe (api.js) ── */
ok(/async authOnlineUsers\(\)/.test(apiSrc), 'GwApi.authOnlineUsers exists');
ok(/module:\s*['"]app_auth['"]/.test(apiSrc), 'probes module app_auth');
ok(/func:\s*['"]app_auth_get_user_online['"]/.test(apiSrc), 'func app_auth_get_user_online');
ok(/method:\s*['"]devSta\.get['"]/.test(apiSrc), 'uses devSta.get');
ok(/normGwAuthUser\(r\)/.test(apiSrc), 'authOnlineUsers normalizes with normGwAuthUser');

/* ── wiring (app.js) ── */
ok(/GwApi\.authOnlineUsers\(\)/.test(appSrc), 'Online Clients merge fetches app_auth');
ok(/gwAuthByMac\.get\(mac\)/.test(appSrc), 'merge joins app_auth by MAC');
ok(/au\.voucher/.test(appSrc), 'merge prefers gateway auth voucher over cache');
ok(/gwAuthByMac\.get\(normMac\(c\.mac\)\)/.test(appSrc), 'per-AP view joins app_auth by normalized MAC');

/* ── real capture: 2-5.txt parses 10/10 with vouchers ── */
const capPath = path.join(__dirname, '..', '..', 'user', 'files', '2-5.txt');
if (fs.existsSync(capPath)) {
  const cap = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  const users = cap && cap.data && cap.data.user;
  ok(Array.isArray(users) && users.length === 10, 'capture holds 10 auth users');
  const parsed = users.map(normAuth).filter(Boolean);
  ok(parsed.length === 10, '10/10 capture records parsed');
  ok(parsed.every(u => u.voucher && u.voucher.length > 0), 'every record carries a voucher (userName)');
  ok(parsed.every(u => /^[0-9A-F]{12}$/.test(u.mac)), 'every MAC normalizes to 12 hex chars');
  ok(parsed.every(u => u.ip && u.ip.length > 0), 'every record carries an ip');
  const macs = parsed.map(u => u.mac);
  ok(new Set(macs).size === macs.length, 'no duplicate MACs in capture');
} else {
  console.log('  (capture 2-5.txt not present — skipping real-data checks)');
}

console.log(`fix12b: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

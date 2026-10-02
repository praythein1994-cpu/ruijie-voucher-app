/**
 * fix13 test — gateway Web Authentication editor (More -> Web Auth, v1.5.96).
 *
 * READ verified 2026-10-01 from the user's DevTools capture of
 * /admin/alone/authentication/web_authentication (workspace/user/files/2-6.txt):
 *   POST /cgi-bin/luci/api/cmd?auth=<sid>
 *   {method:"cmdArr", params:{device:"pc", params:[
 *     {method:"devSta.get", params:{module:"app_auth", noParse:false,
 *       async:null, remoteIp:false, data:{func:"app_auth_get_macc"},
 *       device:"pc"}},
 *     {method:"acConfig.get", params:{module:"apPortalMacc", noParse:false,
 *       async:null, remoteIp:false}},
 *     {method:"devConfig.get", params:{module:"appAuthParamFmt",
 *       noParse:false, async:null, remoteIp:false}}]}}
 *   -> {code:0, data:[ {enable:"1", ad_url, authType:"wifidog",
 *        proxy_https:"1", flowDetectEn:"1", flowDetectTime:"15",
 *        setSsidIpList:[{ssidName:"VLAN20", ip:["192.168.20.1-192.168.21.254"]}],
 *        authIpList, macByPass:"1", ...}, {...}, {...} ]}
 *
 * WRITE verified 2026-10-01 from the user's DevTools Save capture
 * (workspace/user/files/2-7.txt, screenshot shows "success_set"):
 *   {method:"devConfig.set", params:{module:"app_auth_macc", noParse:false,
 *    async:true, remoteIp:false, device:"pc", data:{<FULL read object>}}}
 *   -> {code:0, data:{rcode:"00000000", message:"success_set"}}
 *
 * Rule: the Save sends back the FULL object that was read — never built
 * from scratch, so untouched fields (paramFmt, wxRedirect, authIpList, …)
 * survive the round-trip.
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
const htmlSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* Extract a GwApi object-literal method as a callable */
function extractMethod(src, name) {
  const re = new RegExp(name + '\\s*\\(([^)]*)\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, i = m.index + m[0].length - 1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return new Function(m[1].trim(), src.slice(m.index + m[0].length, i));
}

/* ── webAuthWriteBody (api.js) — must match the verified 2-7.txt envelope ── */
const writeBody = extractMethod(apiSrc, 'webAuthWriteBody');
ok(typeof writeBody === 'function', 'GwApi.webAuthWriteBody exists');

const realCfg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'user', 'files', '2-6.txt'), 'utf8')
).data[0];
ok(realCfg && realCfg.enable === '1', 'real 2-6.txt element[0] loaded (enable=1)');

// Simulate an edit: disable auth, change idle timeout — as the app would.
const edited = JSON.parse(JSON.stringify(realCfg));
edited.enable = '0';
edited.flowDetectTime = '30';
const body = writeBody(edited);

ok(body.method === 'devConfig.set', 'write method is devConfig.set');
ok(body.method !== 'cmdArr', 'write is NOT cmdArr-wrapped (direct, per capture)');
ok(body.params.module === 'app_auth_macc', 'write module is app_auth_macc (read func was app_auth_get_macc)');
ok(body.params.noParse === false, 'write noParse=false');
ok(body.params.async === true, 'write async=true (capture shows async:true)');
ok(body.params.remoteIp === false, 'write remoteIp=false');
ok(body.params.device === 'pc', 'write device=pc');
ok(body.params.data === edited, 'write data is the SAME object that was read+edited (full round-trip)');
ok(body.params.data.enable === '0', 'edited enable carried through');
ok(body.params.data.flowDetectTime === '30', 'edited idle timeout carried through');
// Untouched fields must survive — never constructed from scratch.
ok(body.params.data.ad_url === 'https://portal-as.ruijienetworks.com', 'untouched ad_url preserved');
ok(body.params.data.paramFmt && body.params.data.paramFmt.request.paramFmtType === 'Ruijie', 'untouched paramFmt preserved');
ok(body.params.data.wxRedirect === '118.31.178.137', 'untouched wxRedirect preserved');
ok(Array.isArray(body.params.data.setSsidIpList) &&
   body.params.data.setSsidIpList[0].ssidName === 'VLAN20', 'untouched Wi-Fi list preserved');
ok(JSON.stringify(Object.keys(body.params.data).sort()) === JSON.stringify(Object.keys(realCfg).sort()),
   'write data key set identical to read object (nothing dropped, nothing invented)');

/* ── webAuthGet (api.js) — probe shape per the verified 2-6.txt capture ── */
ok(/async webAuthGet\(\)/.test(apiSrc), 'GwApi.webAuthGet exists');
ok(/func:\s*['"]app_auth_get_macc['"]/.test(apiSrc), 'webAuthGet probes func app_auth_get_macc');
ok(/module:\s*['"]apPortalMacc['"]/.test(apiSrc), 'webAuthGet batch includes apPortalMacc');
ok(/module:\s*['"]appAuthParamFmt['"]/.test(apiSrc), 'webAuthGet batch includes appAuthParamFmt');
ok(/data\[0\]/.test(apiSrc), 'webAuthGet returns element [0] (the editable config)');

/* ── webAuthSet (api.js) — success detection per the verified reply ── */
ok(/async webAuthSet\(cfg\)/.test(apiSrc), 'GwApi.webAuthSet exists');
ok(/00000000/.test(apiSrc), 'webAuthSet accepts rcode 00000000');
ok(/success_set/.test(apiSrc) || /success/i.test(apiSrc), 'webAuthSet accepts the success_set reply');

/* ── app.js: More -> Web Auth page ── */
ok(/async function moreWebAuth\(\)/.test(appSrc), 'moreWebAuth page exists');
ok(/S\.moreFn = moreWebAuth/.test(appSrc), 'moreWebAuth registers S.moreFn');
ok(/GwApi\.webAuthGet\(\)/.test(appSrc), 'page reads via GwApi.webAuthGet');
ok(/GwApi\.webAuthSet\(c\)/.test(appSrc), 'page saves via GwApi.webAuthSet');
ok(/await iosConfirm\(t\('wa\.confirm'\)/.test(appSrc), 'save asks for confirmation first (iOS dialog)');
ok(/data-wai/.test(appSrc), 'Wi-Fi list rows are editable');
ok(/wa-add/.test(appSrc) && /wa-del/.test(appSrc), 'Wi-Fi list add/delete wired');
// Untouched-field safety: the page must mutate the read object, not rebuild it.
ok(/S\._waCfg = cfg/.test(appSrc), 'page keeps the read object for the round-trip');
ok(!/webAuthSet\(\{/.test(appSrc), 'page never builds the save payload from scratch');

/* ── menu + wiring + i18n ── */
ok(/data-more="webauth"/.test(htmlSrc), 'More menu has the Web Auth item');
ok(/k === 'webauth'/.test(appSrc), 'menu dispatch routes to moreWebAuth');
for (const k of ['m.webauth', 'm.webauthSub', 'wa.title', 'wa.needGw', 'wa.enable',
                 'wa.adUrl', 'wa.https', 'wa.idle', 'wa.min', 'wa.wifiList',
                 'wa.vlan', 'wa.ipRange', 'wa.add', 'wa.del', 'wa.save',
                 'wa.saved', 'wa.confirm', 'wa.loading', 'wa.loadFail']) {
  ok(appSrc.includes("'" + k + "'"), 'i18n key ' + k + ' exists');
}

console.log(`fix13: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

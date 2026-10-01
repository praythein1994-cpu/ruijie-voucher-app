/**
 * fix14 test — gateway Web Authentication Global Config section (v1.5.96).
 *
 * READ verified 2026-10-01 from the user's DevTools capture of
 * /admin/alone/authentication/web_authentication?tab=7:
 *   {method:"cmdArr", params:{device:"pc", params:[
 *     {method:"devConfig.get", params:{module:"globalAuthConf",
 *       noParse:false, async:null, remoteIp:false}},
 *     {method:"devConfig.get", params:{module:"authCertUpload",
 *       noParse:false, async:null, remoteIp:false}}]}}
 *   -> {code:0, data:[
 *        {proto:"http", remind_days:"1", remind_interval:"1",
 *         remind_content:"", user_state_url:"lan.auth.reyee.com",
 *         charge_url:"", remind_url:"", flow_detect_time:"15",
 *         http_host_check:"1", version:"1.0.0",
 *         configTime:"1786695411", currentTime:"1786695411",
 *         configId:"1786695411"},
 *        {cert list}]}
 *
 * WRITE verified 2026-10-01 from the user's DevTools Save capture on ?tab=7:
 *   {method:"devConfig.set", params:{module:"globalAuthConf",
 *    noParse:false, async:null, remoteIp:false, device:"pc",
 *    data:{proto:"http", remind_days:"1", remind_interval:"1",
 *      remind_content:"", charge_url:"", flow_detect_time:"15",
 *      http_host_check:"1", remind_url:"",
 *      user_state_url:"lan.auth.reyee.com", version:"1.0.0"}}}
 *   -> {code:0, data:{rcode:"00000000", msg:"success"}}
 *
 * Rule: the write carries exactly the 10 verified keys — the read's
 * metadata keys (configTime/currentTime/configId) are NOT sent.
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
const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

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

/* ── globalAuthWriteBody (api.js) — must match the verified save envelope ── */
const writeBody = extractMethod(apiSrc, 'globalAuthWriteBody');
ok(typeof writeBody === 'function', 'GwApi.globalAuthWriteBody exists');

if (writeBody) {
  const readCfg = {
    proto: 'http', remind_days: '1', remind_interval: '1', remind_content: '',
    user_state_url: 'lan.auth.reyee.com', charge_url: '', remind_url: '',
    flow_detect_time: '15', http_host_check: '1', version: '1.0.0',
    configTime: '1786695411', currentTime: '1786695411', configId: '1786695411',
  };
  const body = writeBody(readCfg);
  ok(body.method === 'devConfig.set', 'write method is devConfig.set');
  ok(body.params.module === 'globalAuthConf', 'write module is globalAuthConf');
  ok(body.params.noParse === false && body.params.async === null &&
    body.params.remoteIp === false && body.params.device === 'pc',
    'write envelope flags (noParse:false, async:null, remoteIp:false, device:pc)');
  const keys = Object.keys(body.params.data).sort();
  ok(JSON.stringify(keys) === JSON.stringify(
    ['charge_url', 'flow_detect_time', 'http_host_check', 'proto',
     'remind_content', 'remind_days', 'remind_interval', 'remind_url',
     'user_state_url', 'version'].sort()),
    'write data has exactly the 10 verified keys, no metadata');
  ok(body.params.data.proto === 'http' &&
    body.params.data.user_state_url === 'lan.auth.reyee.com' &&
    body.params.data.flow_detect_time === '15' &&
    body.params.data.http_host_check === '1',
    'write data carries the read values');
  // an edit flows through
  const edited = Object.assign({}, readCfg, { proto: 'https', remind_days: '2' });
  const body2 = writeBody(edited);
  ok(body2.params.data.proto === 'https' && body2.params.data.remind_days === '2',
    'edits are applied to the write body');
}

/* ── globalAuthGet (api.js) — probes the verified read modules ── */
ok(/globalAuthConf/.test(apiSrc) && /authCertUpload/.test(apiSrc),
  'globalAuthGet probes globalAuthConf + authCertUpload');
ok(/async\s+globalAuthGet/.test(apiSrc), 'GwApi.globalAuthGet exists');
ok(/async\s+globalAuthSet/.test(apiSrc), 'GwApi.globalAuthSet exists');
ok(/00000000/.test(apiSrc) && /globalAuthSet/.test(apiSrc),
  'globalAuthSet checks the rcode success reply');

/* ── UI (app.js) — Global Config section under More -> Web Auth ── */
for (const key of ['wg.title', 'wg.proto', 'wg.stateUrl', 'wg.remindDays',
    'wg.days', 'wg.remindInterval', 'wg.hours', 'wg.idle', 'wg.httpCheck', 'wg.confirm']) {
  ok(appSrc.includes("'" + key + "'"), 'i18n key ' + key + ' exists');
}
ok(appSrc.includes('wg-body'), 'wg-body section container exists');
ok(appSrc.includes('GwApi.globalAuthGet()'), 'page loads GwApi.globalAuthGet');
ok(appSrc.includes('GwApi.globalAuthSet(g)'), 'page saves via GwApi.globalAuthSet');
ok(appSrc.includes('wg-proto'), 'protocol segmented control exists');
ok(appSrc.includes('wg-save'), 'Global Config save button exists');
ok(appSrc.includes('wg.confirm'), 'save asks confirmation before writing');

/* ── CSS ── */
ok(cssSrc.includes('.ug-inline'), '.ug-inline CSS exists');
ok(cssSrc.includes('.ug-unit'), '.ug-unit CSS exists');

console.log(`fix14: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

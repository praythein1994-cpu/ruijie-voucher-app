/**
 * fix15 test — gateway Web Authentication Allowlist section (v1.5.96).
 *
 * READ verified 2026-10-01 from the user's DevTools capture of
 * /admin/alone/authentication/web_authentication?tab=4 (page load):
 *   {method:"devSta.get", params:{module:"app_auth", noParse:false,
 *    async:null, remoteIp:false, device:"pc",
 *    data:{func:"app_auth_get_whitelist"}}}
 *   -> {code:0, data:{deny_mac:[], mac:["C4:B2:5B:26:45:26", …11],
 *        srcip:[], url:["portal-as.ruijienetwork.com",
 *        "ruijiecloud.com", "ruijienetwork.com"], dstip:[]}}
 * Direct devSta.get (NOT cmdArr-wrapped).
 *
 * WRITE verified 2026-10-01 from the user's DevTools Save capture on ?tab=4
 * (user added a MAC ending 45:2B and pressed OK — the Add dialog itself
 * sends nothing; only Save writes):
 *   {method:"devConfig.set", params:{module:"app_auth_direct_mac",
 *    noParse:false, async:null, remoteIp:false, device:"pc",
 *    data:{type:"mac", data:["C4:B2:5B:26:45:26", …11]}}}
 *   -> {code:0, data:{code:0, id:null, data:"", error:null}}
 * MACs colon-UPPERCASE. The write sends the FULL list.
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

/* ── allowlistMacWriteBody (api.js) — must match the verified save envelope ── */
const writeBody = extractMethod(apiSrc, 'allowlistMacWriteBody');
ok(typeof writeBody === 'function', 'GwApi.allowlistMacWriteBody exists');

if (writeBody) {
  const macs = ['C4:B2:5B:26:45:26', 'E0:D4:62:5B:CB:4F', 'F6:94:F1:5D:45:2B'];
  const body = writeBody(macs);
  ok(body.method === 'devConfig.set', 'write method is devConfig.set');
  ok(body.params.module === 'app_auth_direct_mac', 'write module is app_auth_direct_mac');
  ok(body.params.noParse === false && body.params.async === null &&
    body.params.remoteIp === false && body.params.device === 'pc',
    'write envelope flags (noParse:false, async:null, remoteIp:false, device:pc)');
  ok(body.params.data.type === 'mac', 'write data type is "mac"');
  ok(Array.isArray(body.params.data.data) && body.params.data.data.length === 3,
    'write data carries the full MAC list');
  ok(body.params.data.data[0] === 'C4:B2:5B:26:45:26' &&
    body.params.data.data[1] === 'E0:D4:62:5B:CB:4F' &&
    body.params.data.data[2] === 'F6:94:F1:5D:45:2B',
    'MACs normalized to colon-UPPERCASE');
  // empty list must still send the full (empty) list
  const empty = writeBody([]);
  ok(Array.isArray(empty.params.data.data) && empty.params.data.data.length === 0,
    'empty list sends an empty array (full-list semantics)');
}

/* ── allowlistGet / allowlistMacSet (api.js) ── */
ok(/async\s+allowlistGet/.test(apiSrc), 'GwApi.allowlistGet exists');
ok(/app_auth_get_whitelist/.test(apiSrc), 'allowlistGet probes app_auth_get_whitelist');
ok(/async\s+allowlistMacSet/.test(apiSrc), 'GwApi.allowlistMacSet exists');
ok(/Number\(j\.data\.code\) === 0/.test(apiSrc), 'allowlistMacSet checks inner data.code 0');

/* ── UI (app.js) — Allowlist section under More -> Web Auth ── */
for (const key of ['al.title', 'al.mac', 'al.domain', 'al.add', 'al.macPh',
    'al.badMac', 'al.dupMac', 'al.empty', 'al.readonly', 'al.confirm']) {
  ok(appSrc.includes("'" + key + "'"), 'i18n key ' + key + ' exists');
}
ok(appSrc.includes('al-body'), 'al-body section container exists');
ok(appSrc.includes('GwApi.allowlistGet()'), 'page loads GwApi.allowlistGet');
ok(appSrc.includes('GwApi.allowlistMacSet(macs)'), 'page saves via GwApi.allowlistMacSet');
ok(appSrc.includes('al-newmac'), 'MAC add input exists');
ok(appSrc.includes('al-save'), 'Allowlist save button exists');
ok(appSrc.includes('al.confirm'), 'save asks confirmation before writing');
ok(appSrc.includes('data-del'), 'per-row MAC delete exists');

/* ── CSS ── */
ok(cssSrc.includes('.mono'), '.mono CSS exists');

console.log(`fix15: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

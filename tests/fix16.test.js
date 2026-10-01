/**
 * fix16 test — portal User Group DELETE, 2-step (v1.5.96).
 *
 * Step 1 VERIFIED 2026-10-01 from the user's DevTools capture of a real
 * portal group delete (Delete button -> portal confirm OK):
 *   outer  POST .../webproxy/common/api?/intl/usergroup/group/6752877
 *   inner  {"api":"/intl/usergroup/group/6752877","method":"DELETE",
 *           "authParams":{"api":"/intl/usergroup/group/6752877","method":"DELETE"},
 *           "params":{"list":[699225]},"module":"default",
 *           "querys":{"lang":"en","cloudType":"smb"}}
 *
 * Step 2 VERIFIED 2026-10-01 from the same capture
 * (request api?/intlSamProfile/delete/16384157693025024909983414791988,
 * Payload tab):
 *   inner  {"api":"/intlSamProfile/delete/16384157693025024909983414791988",
 *           "method":"DELETE",
 *           "authParams":{"api":"/intlSamProfile/delete/16384157693025024909983414791988",
 *                         "method":"DELETE"},
 *           "module":"default",
 *           "querys":{"tenantId":341634,"group_id":6752877,
 *                     "lang":"en","cloudType":"smb"}}
 * (step 2 carries NO params field).
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

/* Extract a GwApi/Api object-literal method as a callable */
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

/* ── Step 1 envelope — must match the verified portal delete ── */
const step1 = extractMethod(apiSrc, 'ssoUserGroupDeleteStep1Envelope');
ok(typeof step1 === 'function', 'ssoUserGroupDeleteStep1Envelope exists');
if (step1) {
  const e = step1(6752877, 699225);
  ok(e.api === '/intl/usergroup/group/6752877', 'step1 api path');
  ok(e.method === 'DELETE', 'step1 inner method DELETE');
  ok(e.authParams && e.authParams.api === e.api && e.authParams.method === 'DELETE',
    'step1 authParams mirrors api+method');
  ok(e.module === 'default', 'step1 module default');
  ok(e.params && Array.isArray(e.params.list) && e.params.list.length === 1 && e.params.list[0] === 699225,
    'step1 params.list carries the user group id');
  ok(e.querys && e.querys.lang === 'en' && e.querys.cloudType === 'smb',
    'step1 querys {lang:en, cloudType:smb}');
}

/* ── Step 2 envelope — must match the verified portal delete ── */
const step2 = extractMethod(apiSrc, 'ssoUserGroupDeleteStep2Envelope');
ok(typeof step2 === 'function', 'ssoUserGroupDeleteStep2Envelope exists');
if (step2) {
  const e = step2(6752877, 341634, '16384157693025024909983414791988');
  ok(e.api === '/intlSamProfile/delete/16384157693025024909983414791988', 'step2 api path with authProfileId');
  ok(e.method === 'DELETE', 'step2 inner method DELETE');
  ok(e.authParams && e.authParams.api === e.api && e.authParams.method === 'DELETE',
    'step2 authParams mirrors api+method');
  ok(e.module === 'default', 'step2 module default');
  ok(!('params' in e), 'step2 carries NO params field (verified)');
  ok(e.querys && e.querys.tenantId === 341634 && e.querys.group_id === 6752877 &&
    e.querys.lang === 'en' && e.querys.cloudType === 'smb',
    'step2 querys {tenantId, group_id, lang:en, cloudType:smb}');
  // tenantId omitted when unavailable (same conditional pattern as add flow)
  const e2 = step2(6752877, '', '16384157693025024909983414791988');
  ok(!('tenantId' in e2.querys), 'step2 omits tenantId when unavailable');
}

/* ── userGroupDeleteSso orchestration ── */
ok(/async\s+userGroupDeleteSso/.test(apiSrc), 'userGroupDeleteSso exists');
ok(/ssoUserGroupDeleteStep1Envelope\(groupId, userGroupId\)/.test(apiSrc), 'delete calls step-1 envelope');
ok(/ssoUserGroupDeleteStep2Envelope\(groupId, tenantId, authProfileId\)/.test(apiSrc), 'delete calls step-2 envelope');

/* ── UI (app.js) ── */
for (const key of ['mg.del', 'mg.confirmDel', 'mg.deleted', 'mg.needIds']) {
  ok(appSrc.includes("'" + key + "'"), 'i18n key ' + key + ' exists');
}
ok(appSrc.includes('data-mgdel'), 'per-row delete button exists');
ok(appSrc.includes('deleteUserGroup('), 'deleteUserGroup handler exists');
ok(/confirm\(t\('mg\.confirmDel'\)/.test(appSrc), 'delete asks confirmation naming the group');
ok(appSrc.includes('pkgGroupId(p)') && appSrc.includes('pkgProfileId(p)'),
  'delete resolves ids via pkgGroupId/pkgProfileId');
ok(appSrc.includes('userGroupDeleteSso(S.projectId, tenantId, ugId, profId)'),
  'delete calls userGroupDeleteSso with project, tenant, group, profile ids');
ok(/await Api\.userGroupDeleteSso[\s\S]{0,120}moreUserGroups\(\)/.test(appSrc),
  'list refreshes after successful delete');

console.log(`fix16: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

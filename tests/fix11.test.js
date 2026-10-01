/**
 * fix11 test — user group add (portal, 2-step).
 * Verified 2026-10-01 from the user's DevTools captures on
 * #/config_group_userManagement_menu:
 * 1. POST /intlSamProfile/create/{email}/{email}/{groupId} → authProfileId
 * 2. POST /intl/usergroup/group/{groupId} with params.list[0] incl. authProfileId
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

function extractFn(src, name) {
  const re = new RegExp(name + '\\(([^)]*)\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, i = m.index + m[0].length - 1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  const body = src.slice(m.index + m[0].length, i);
  return new Function(m[1], body);
}

/* ── Step 1 envelope ── */
const profEnv = extractFn(apiSrc, 'ssoUserGroupProfileEnvelope');
ok(typeof profEnv === 'function', 'ssoUserGroupProfileEnvelope exists');
if (profEnv) {
  const e = profEnv('cupidleo8387@gmail.com', 6752877, { name: 'test' }, 341634);
  ok(e.api === '/intlSamProfile/create/cupidleo8387%40gmail.com/cupidleo8387%40gmail.com/6752877',
     'profile api path (email x2, encoded, groupId)');
  ok(e.method === 'POST', 'profile inner method POST');
  ok(e.authParams && e.authParams.method === 'POST', 'profile authParams POST');
  ok(e.module === 'default', 'profile module default');
  ok(e.params && e.params.name === 'test', 'profile params passed through');
  ok(e.querys && e.querys.tenantId === 341634, 'profile querys.tenantId');
  ok(e.querys.lang === 'en' && e.querys.cloudType === 'smb', 'profile querys lang/cloudType');
  const e2 = profEnv('a@b.com', 1, {}, '');
  ok(!('tenantId' in e2.querys), 'profile querys omits tenantId when empty');
}

/* ── Step 2 envelope ── */
const grpEnv = extractFn(apiSrc, 'ssoUserGroupEnvelope');
ok(typeof grpEnv === 'function', 'ssoUserGroupEnvelope exists');
if (grpEnv) {
  const e = grpEnv(6752877, { name: 'test', authProfileId: '123' });
  ok(e.api === '/intl/usergroup/group/6752877', 'group api path');
  ok(e.method === 'POST', 'group inner method POST');
  ok(e.authParams && e.authParams.method === 'POST', 'group authParams POST');
  ok(e.module === 'default', 'group module default');
  ok(Array.isArray(e.params.list) && e.params.list[0].authProfileId === '123', 'group params.list[0]');
  ok(e.querys.lang === 'en' && e.querys.cloudType === 'smb', 'group querys lang/cloudType');
}

/* ── buildUserGroupParams ── */
const buildP = extractFn(apiSrc, 'buildUserGroupParams');
ok(typeof buildP === 'function', 'buildUserGroupParams exists');
if (buildP) {
  const p = buildP({
    name: 'test', price: '8000', quota: '100', noOfDevice: '3',
    timePeriod: '30', timePeriodTotal: '30', timePeriodDaily: '60', timePeriodDailyCustom: '60',
    uploadRateLimit: '256', downloadRateLimit: '256', packageType: 'COMMON',
    bindSsid: 'VLAN20', ip: '192.168.20.1-192.168.21.254',
    kickOffType: '1', durationCtrlType: '0', limitedTimes: '0',
    lowQuota: '0', lowUploadRateLimit: '0', lowDownloadRateLimit: '0', lowProfileStatus: '0',
    isBindSsid: true, bindMac: true,
  }, 6752877);
  ok(p.name === 'test' && p.userGroupName === 'test', 'name + userGroupName');
  ok(p.price === '8000', 'price kept as string');
  ok(p.quota === 100 && p.timePeriod === 30, 'numeric fields');
  ok(p.noOfDevice === '3', 'noOfDevice string');
  ok(p.isBindSsid === 1 && p.bindMac === 1, 'toggles -> 1');
  ok(p.ip === '192.168.20.1-192.168.21.254', 'ip range');
  ok(Array.isArray(p.bindIpList) && p.bindIpList[0] === p.ip, 'bindIpList wraps ip');
  ok(p.groupId === 6752877, 'groupId numeric');
  const p2 = buildP({ name: 'x', isBindSsid: false, bindMac: false, ip: '' }, 1);
  ok(p2.isBindSsid === 0 && p2.bindMac === 0, 'toggles off -> 0');
  ok(p2.bindIpList.length === 0 && p2.ip === '', 'empty ip -> empty list');
  ok(p2.packageType === 'COMMON', 'packageType default COMMON');
}

/* ── extractAuthProfileId ── */
const extId = extractFn(apiSrc, 'extractAuthProfileId');
ok(typeof extId === 'function', 'extractAuthProfileId exists');
if (extId) {
  ok(extId({ code: 0, data: { authProfileId: '97465697732031806520703902338672' } }) === '97465697732031806520703902338672', 'from data.authProfileId');
  ok(extId({ authProfileId: 'abc' }) === 'abc', 'from top-level authProfileId');
  ok(extId({ data: { id: '777' } }) === '777', 'from data.id');
  ok(extId({ code: 0 }) === '', 'missing -> empty');
  ok(extId(null) === '', 'null -> empty');
}

/* ── userGroupAddSso exists ── */
ok(/async userGroupAddSso\(groupId, email, tenantId, fields\)/.test(apiSrc), 'userGroupAddSso exists');

/* ── Form: official-app style, 8 fields (iOS pickers + toggle + segmented) ── */
for (const id of ['devices', 'duration', 'quota', 'upspeed', 'downspeed']) {
  ok(appSrc.includes("pick('" + id + "'"), 'picker ' + id);
}
ok(appSrc.includes('ug-bindmac'), 'bindMac iOS toggle');
ok(appSrc.includes('ug-pseg'), 'period segmented control');
ok(appSrc.includes('ug-card'), 'ug-card layout');
ok(appSrc.includes('enhanceIosPicker(s)'), 'iOS bottom-sheet pickers');
ok(appSrc.includes("id=\"ug-do\"") || appSrc.includes('ug-do'), 'save button');
ok(/function renderUserGroupForm/.test(appSrc), 'renderUserGroupForm exists');
ok(appSrc.includes('userGroupAddSso'), 'form calls userGroupAddSso');

/* ── Verified value mappings (portal capture 2026-10-01) ── */
ok(appSrc.includes("['30', '30 '"), 'duration minutes option');
ok(appSrc.includes("['1024', '1 GB']"), 'quota 1 GB -> 1024 MB');
ok(appSrc.includes("['2048', '2 GB']"), 'quota 2 GB -> 2048 MB');
ok(appSrc.includes("['256', '256 Kbps']"), 'speed 256 Kbps option');
ok(appSrc.includes("['10240', '10 Mbps']"), 'speed 10 Mbps -> 10240 Kbps');
ok(appSrc.includes('timePeriod: isDaily ? 0 : durMin'), 'total duration -> timePeriod');
ok(appSrc.includes('timePeriodDaily: isDaily ? durMin : 0'), 'daily duration -> timePeriodDaily');
ok(appSrc.includes('durationCtrlType: isDaily ? 1 : 0'), 'durationCtrlType by period');
ok(appSrc.includes('String(devSel.value)'), 'noOfDevice kept as string');

/* ── i18n ── */
for (const k of ['mg.add','ug.name','ug.price','ug.devices','ug.bindMacFirst','ug.period','ug.totalDur',
  'ug.dailyDur','ug.duration','ug.dataQuota','ug.upSpeed','ug.downSpeed','ug.unlimited','ug.custom',
  'ug.customVal','ug.save','ug.namePh','ug.pricePh','ug.done','ug.needName','ug.needLogin','ug.cancel',
  'ug.min','ug.hr','ug.day','ug.wk','ug.bindMacTip','ug.quotaTip']) {
  ok(appSrc.includes("'" + k + "'"), 'i18n ' + k);
}

/* ── CSS ── */
for (const c of ['.ug-card', '.ug-row', '.ug-lab', '.ug-input', '.ug-sect', '.ug-seg', '.ug-custom', '.ug-save', '.ug-cancel', '.ug-q']) {
  ok(cssSrc.includes(c), c + ' CSS');
}

console.log(`\nfix11: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

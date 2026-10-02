/* v1.5.131: firmware upgrade envelopes — verified against the portal's
 * own upgradeDeviceModal bundle (2026-10-02).
 * trigger: POST /upgrade/device {snList, jobUniqueId, targetVersion,
 * schedule, retryTimes, firmwareId, groupId}
 * check: POST /upgrade/condition/check {groupId} -> checkInofs[] */
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// Envelope builders exist with the verified API paths
ok('upgradeCheckEnvelope posts /upgrade/condition/check',
  /upgradeCheckEnvelope[\s\S]*?api:\s*'\/upgrade\/condition\/check\?cloudType=smb'/.test(src));
ok('upgradeDeviceEnvelope posts /upgrade/device',
  /upgradeDeviceEnvelope[\s\S]*?api:\s*'\/upgrade\/device\?cloudType=smb'/.test(src));

// Trigger envelope shape: snList, jobUniqueId, targetVersion, schedule, retryTimes, firmwareId, groupId
ok('trigger envelope has snList', /upgradeDeviceEnvelope[\s\S]*?snList/.test(src));
ok('trigger envelope has jobUniqueId', /upgradeDeviceEnvelope[\s\S]*?jobUniqueId/.test(src));
ok('trigger envelope has targetVersion', /upgradeDeviceEnvelope[\s\S]*?targetVersion/.test(src));
ok('trigger envelope has schedule{startInterval,endInterval,beginDate}',
  /upgradeDeviceEnvelope[\s\S]*?schedule:\s*\{\s*startInterval/.test(src));
ok('trigger envelope has retryTimes', /upgradeDeviceEnvelope[\s\S]*?retryTimes/.test(src));
ok('trigger envelope has firmwareId', /upgradeDeviceEnvelope[\s\S]*?firmwareId/.test(src));
ok('trigger envelope has groupId', /upgradeDeviceEnvelope[\s\S]*?groupId/.test(src));

// Check envelope carries groupId
ok('check envelope carries groupId', /upgradeCheckEnvelope[\s\S]*?params:\s*\{\s*groupId/.test(src));

// SSO gating: entry points require ssoLoggedIn, throw SSO_REQUIRED otherwise
ok('upgradeConditionCheck requires SSO',
  /async upgradeConditionCheck\(groupId\)\s*\{[\s\S]*?ssoLoggedIn\(\)[\s\S]*?SSO_REQUIRED/.test(src));
ok('upgradeDevice requires SSO',
  /async upgradeDevice\(opts\)\s*\{[\s\S]*?ssoLoggedIn\(\)[\s\S]*?SSO_REQUIRED/.test(src));

// UI side: app.js has the flow + picker + i18n
const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
ok('app has upgradeDeviceFlow', /function upgradeDeviceFlow\(/.test(app));
ok('app has pickUpgradeVersion', /function pickUpgradeVersion\(/.test(app));
ok('device row has data-upgrade button', /data-upgrade=/.test(app));
ok('i18n md.upgrade defined', /'md\.upgrade':/.test(app));
ok('i18n md.upConfirm defined', /'md\.upConfirm':/.test(app));

const failed = results.filter(r => !r[1]);
failed.forEach(([n]) => console.log('FAIL:', n));
console.log(`v15131.test.js: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);

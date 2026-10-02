/* v1.5.143 (proxy): device install registry logic — register/check/set/
 * config, device cap, approval mode, admin gating, self-block safety. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'devreg-')), 'devices.json');
process.env.DEVICES_FILE = tmpFile;
const Devices = require('../proxy/devices');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── Fresh store defaults ──
let s = Devices.readStore();
ok('defaults: empty devices', Object.keys(s.devices).length === 0);
ok('defaults: maxDevices 10', s.config.maxDevices === 10);
ok('defaults: approval off', s.config.requireApproval === false);

// ── Register: first device allowed ──
let st = Devices.registerDevice(s, { deviceId: 'dev1', model: 'Redmi K40S', manufacturer: 'Xiaomi', android: '14', appVersion: '1.5.143', profile: 'Pray Thein', src: 'native' });
ok('first device allowed', st === 'allowed');
ok('profile normalized', s.devices.dev1.profile === 'praythein');
ok('firstSeen set', typeof s.devices.dev1.firstSeen === 'number');

// ── Re-register updates, keeps status ──
st = Devices.registerDevice(s, { deviceId: 'dev1', model: 'Redmi K40S', appVersion: '1.5.144' });
ok('re-register keeps allowed', st === 'allowed');
ok('appVersion updated', s.devices.dev1.appVersion === '1.5.144');

// ── Cap: maxDevices reached → pending ──
s.config.maxDevices = 2;
Devices.registerDevice(s, { deviceId: 'dev2', model: 'Galaxy A72' });
st = Devices.registerDevice(s, { deviceId: 'dev3', model: 'Unknown Phone' });
ok('over-cap device pending', st === 'pending');
ok('activeCount excludes blocked-pending correctly', Devices.activeCount(s.devices) === 3);

// ── Blocked devices don't count against the cap ──
s.devices.dev2.status = 'blocked';
ok('blocked not counted', Devices.activeCount(s.devices) === 2); // dev1 + dev3(pending)
st = Devices.registerDevice(s, { deviceId: 'dev4', model: 'New Phone' });
ok('still at cap → pending', st === 'pending');
s.devices.dev3.status = 'blocked';
s.devices.dev4.status = 'blocked';
st = Devices.registerDevice(s, { deviceId: 'dev5b', model: 'New Phone 2' });
ok('slot freed by block → allowed', st === 'allowed');

// ── requireApproval mode ──
s.config.requireApproval = true;
s.config.maxDevices = 100;
st = Devices.registerDevice(s, { deviceId: 'dev5', model: 'Stranger Phone' });
ok('approval mode → pending', st === 'pending');
s.config.requireApproval = false;

// ── Blocked stays blocked on re-register ──
st = Devices.registerDevice(s, { deviceId: 'dev3', model: 'Unknown Phone' });
ok('blocked persists across re-register', st === 'blocked');

// ── Missing id rejected ──
ok('empty id → null', Devices.registerDevice(s, { deviceId: '' }) === null);

// ── Persistence round-trip ──
Devices.writeStore(s);
const s2 = Devices.readStore();
ok('disk round-trip keeps devices', Object.keys(s2.devices).length === Object.keys(s.devices).length);
ok('disk round-trip keeps config', s2.config.maxDevices === 100);

// ── Corrupt file → clean defaults (never crash) ──
fs.writeFileSync(tmpFile, 'not json{{{', 'utf8');
const s3 = Devices.readStore();
ok('corrupt file → defaults', Object.keys(s3.devices).length === 0 && s3.config.maxDevices === 10);

// ── Config normalization ──
const s4 = Devices.normalize({ devices: { a: 1 }, config: { maxDevices: 500, requireApproval: 1 } });
ok('maxDevices clamped to 100', s4.config.maxDevices === 100);
const s5 = Devices.normalize({ config: { maxDevices: 0 } });
ok('maxDevices floored to 1', s5.config.maxDevices === 1);

// ── Admin name ──
ok('admin profile is praythein', Devices.ADMIN_PROFILE === 'praythein');
ok('normName lowercases+despaces', Devices.normName('Pray Thein') === 'praythein');

// ── server.js wires the routes ──
const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'proxy', 'server.js'), 'utf8');
for (const r of ['/api/devices/register', '/api/devices/check', '/api/devices/list', '/api/devices/set', '/api/devices/config']) {
  ok('route ' + r + ' wired', serverSrc.includes("'" + r + "'"));
}
ok('self-block safety in set handler', /Cannot block the device you are managing from/.test(serverSrc));
ok('admin gate checks praythein', /prof === Devices\.ADMIN_PROFILE/.test(serverSrc));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15143-proxy: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

/**
 * v1.5.78 tests — run the REAL extracted functions from js/api.js
 * against the user's VERIFIED DevTools captures.
 *
 *  T1  deviceListBody()        == verified /admin/device cmdArr capture
 *  T2  parseDevices(real JSON) == 8 devices (7 ap_list + 1 switch), local:true
 *  T3  deviceRebootBody(sn)    == verified devSta.set devReboot capture
 *  T4a deviceReboot() success  (outer 0 + inner data.code 0) resolves
 *  T4b deviceReboot() outer!=0 throws
 *  T4c deviceReboot() inner!=0 throws
 *  T5  flowTableBody()         == verified content_audit capture
 *  T6  parseFlowTable()        extracts count + array (verified shape)
 *  T7  aggFlowsByClient()      per-client sums, DNS extraction, filtering, order
 *  T8  flowRates()             two-snapshot per-client rates, ignores new/vanished
 *
 * usage: node tests/v1578.test.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js', 'api.js'), 'utf8');

// Load the real api.js in a sandbox; stub only the network edge (gwCall).
const sandbox = {
  window: {},
  console,
  module: { exports: {} },
  // api.js may reference these; give harmless dummies
  localStorage: { getItem: () => null, setItem: () => {} },
  fetch: () => Promise.reject(new Error('no fetch in tests')),
};
vm.createContext(sandbox);
const harness = `
;(function () {
  let capturedGwBody = null;
  // stub the network edge AFTER real defs load
  gwCall = async function (kind, ip, sid, body) {
    capturedGwBody = JSON.parse(body);
    if (typeof __gwReply === 'function') return __gwReply(kind, ip, sid, body);
    throw new Error('__gwReply not set');
  };
  module.exports = { GwApi, aggFlowsByClient, flowRates, flowKey,
                     getCaptured: () => capturedGwBody,
                     setReply: fn => { __gwReply = fn; } };
  var __gwReply;
})();
`;
vm.runInContext(src + harness, sandbox, { filename: 'api.js' });
const { GwApi, aggFlowsByClient, flowRates, flowKey, getCaptured, setReply } = sandbox.module.exports;

// The gateway session the app persists (IP + sid); tests fake it.
GwApi.session = { ip: '100.88.200.103', sid: 'TESTSID' };

let pass = 0, fail = 0;
// deepStrictEqual across the vm boundary fails on prototypes even when the
// structure is identical — compare key-sorted JSON instead.
function norm(v) {
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).sort().forEach(k => { o[k] = norm(v[k]); });
    return o;
  }
  return v;
}
function eqJson(got, want, label) {
  assert.strictEqual(JSON.stringify(norm(got)), JSON.stringify(norm(want)), label || 'JSON mismatch');
}
function ok(name, fn) {
  try { fn(); pass++; console.log('  PASS', name); }
  catch (e) { fail++; console.log('  FAIL', name, '—', e.message); }
}
async function okAsync(name, fn) {
  try { await fn(); pass++; console.log('  PASS', name); }
  catch (e) { fail++; console.log('  FAIL', name, '—', e.message); }
}

/* ── T1: device list request body == verified capture ── */
ok('T1 deviceListBody matches verified /admin/device capture', () => {
  const got = GwApi.deviceListBody();
  const want = {
    method: 'cmdArr',
    params: {
      device: 'pc',
      params: [
        { method: 'acConfig.get', params: { module: 'network_group', noParse: true, async: null, remoteIp: false } },
        { method: 'devSta.get', params: { module: 'ap_list', noParse: true, async: null, remoteIp: false } },
        { method: 'devSta.get', params: { module: 'esw_neighbor', noParse: true, async: null, remoteIp: false } },
        { method: 'devSta.get', params: { module: 'neighbor', data: { product: 'GW_RGOS|FW_NTOS|NBR_NTOS' }, noParse: true, async: null, remoteIp: false } },
        { method: 'devSta.get', params: { module: 'all_ap_list', noParse: true, async: null, remoteIp: false } },
      ],
    },
  };
  eqJson(got, want);
});

/* ── T2: parseDevices on the user's REAL capture ── */
ok('T2 parseDevices(real JSON) → 8 local devices', () => {
  const raw = fs.readFileSync('/home/hatch/workspace/user/files/New_Text_Document.txt', 'utf8');
  const j = JSON.parse(raw);
  const list = GwApi.parseDevices(j);
  assert.strictEqual(list.length, 8, 'expected 8, got ' + list.length);
  assert.ok(list.every(d => d.local === true), 'all must be local:true');
  const sns = list.map(d => d.serialNumber).filter(Boolean);
  assert.ok(sns.includes('G1U030X003979'), 'RAP6202-G SN present');
  const sw = list.find(d => d.deviceType === 'RG-ES209GC-P' || /SWITCH/i.test(d.deviceType || ''));
  assert.ok(sw, 'switch row present');
  assert.ok(sw.mac && sw.mac.length > 0, 'switch mac picked up via devMac, got: ' + sw.mac);
  const gw = list.find(d => d.ip === '192.168.110.1');
  assert.ok(gw, 'gateway row present');
});

/* ── T3: reboot request body == verified capture ── */
ok('T3 deviceRebootBody matches verified devSta.set capture', () => {
  const got = GwApi.deviceRebootBody('G1U030X003979');
  const want = {
    method: 'devSta.set',
    params: {
      module: 'devReboot',
      noParse: false,
      async: null,
      remoteIp: false,
      device: 'pc',
      data: { sn: ['G1U030X003979'], reboot: 'true' },
    },
  };
  eqJson(got, want);
});

/* ── T4: reboot response handling ── */
const REBOOT_OK = { code: 0, id: null, error: null, data: { code: 0, id: null, data: '', error: null } };
(async () => {
  await okAsync('T4a deviceReboot resolves on outer 0 + inner 0', async () => {
    setReply(async () => REBOOT_OK);
    await GwApi.deviceReboot('G1U030X003979');
    const sent = getCaptured();
    assert.strictEqual(sent.method, 'devSta.set');
    eqJson(sent.params.data.sn, ["G1U030X003979"]);
  });
  await okAsync('T4b deviceReboot throws when outer code != 0', async () => {
    setReply(async () => ({ code: 1, data: { code: 0 } }));
    await assert.rejects(() => GwApi.deviceReboot('G1U030X003979'));
  });
  await okAsync('T4c deviceReboot throws when inner data.code != 0', async () => {
    setReply(async () => ({ code: 0, data: { code: 5 } }));
    await assert.rejects(() => GwApi.deviceReboot('G1U030X003979'));
  });

  /* ── T5: flow table request body == verified capture ── */
  ok('T5 flowTableBody matches verified content_audit capture', () => {
    const got = GwApi.flowTableBody();
    const want = {
      method: 'devSta.get',
      params: {
        module: 'content_audit',
        noParse: false,
        async: null,
        remoteIp: false,
        device: 'pc',
        data: { func: 'ca_get_nf_conntrace' },
      },
    };
    eqJson(got, want);
  });

  /* ── T6: parseFlowTable shape ── */
  ok('T6 parseFlowTable extracts count + array', () => {
    const j = { code: 0, id: null, error: null, data: { count: '499', array: [{ src: '1.2.3.4' }] } };
    const { count, flows } = GwApi.parseFlowTable(j);
    assert.strictEqual(count, 499);
    assert.strictEqual(flows.length, 1);
  });

  /* ── T7: aggregation ── */
  ok('T7 aggFlowsByClient sums, filters, extracts DNS, orders by total', () => {
    const flows = [
      // client A: https flow, verified field names
      { protocol: '6', src: '192.168.20.17', dst: '163.70.131.15', sport: '51234', dport: '443', bytes: '9424', bytes_down: '373126', packets: '10', packets_down: '200' },
      { protocol: '6', src: '192.168.20.17', dst: '142.250.1.2', sport: '51235', dport: '443', bytes: '1000', bytes_down: '2000', packets: '2', packets_down: '3' },
      // client A DNS: UDP/53 to 8.8.8.8, DoT 853 to 8.8.8.8, UDP/53 to AdGuard
      { protocol: '17', src: '192.168.20.17', dst: '8.8.8.8', sport: '53001', dport: '53', bytes: '60', bytes_down: '120', packets: '1', packets_down: '1' },
      { protocol: '6', src: '192.168.20.17', dst: '8.8.8.8', sport: '53002', dport: '853', bytes: '200', bytes_down: '400', packets: '2', packets_down: '2' },
      { protocol: '17', src: '192.168.20.17', dst: '94.140.14.14', sport: '53003', dport: '53', bytes: '60', bytes_down: '120', packets: '1', packets_down: '1' },
      // client B: smaller
      { protocol: '6', src: '192.168.21.5', dst: '1.1.1.1', sport: '40000', dport: '443', bytes: '500', bytes_down: '600', packets: '1', packets_down: '1' },
      // must be filtered: gateway-originated (src not private)
      { protocol: '6', src: '100.88.200.103', dst: '8.8.8.8', sport: '53', dport: '53', bytes: '99999', bytes_down: '99999', packets: '9', packets_down: '9' },
      // must be filtered: LAN-local dst
      { protocol: '17', src: '192.168.20.17', dst: '224.0.0.251', sport: '5353', dport: '5353', bytes: '777', bytes_down: '0', packets: '7', packets_down: '0' },
      // must be filtered: multicast src
      { protocol: '17', src: '224.0.0.251', dst: '192.168.20.17', sport: '5353', dport: '5353', bytes: '5', bytes_down: '5', packets: '1', packets_down: '1' },
    ];
    const agg = aggFlowsByClient(flows);
    assert.strictEqual(agg.length, 2, 'only 2 clients, got ' + agg.length);
    const a = agg[0], b = agg[1];
    assert.strictEqual(a.ip, '192.168.20.17', 'top talker first');
    // A: internet flows only — DNS flows count (dst public), mDNS excluded
    assert.strictEqual(a.upBytes, 9424 + 1000 + 60 + 200 + 60);
    assert.strictEqual(a.downBytes, 373126 + 2000 + 120 + 400 + 120);
    assert.strictEqual(a.flows, 5);
    eqJson(a.dns.slice().sort(), ["8.8.8.8", "94.140.14.14"]);
    assert.strictEqual(b.upBytes, 500);
    assert.strictEqual(b.downBytes, 600);
    eqJson(b.dns, []);
  });

  /* ── T8: two-snapshot rates ── */
  ok('T8 flowRates matches tuples, ignores new/vanished flows', () => {
    const prev = [
      { protocol: '6', src: '192.168.20.17', dst: '1.2.3.4', sport: '1', dport: '443', bytes: '1000', bytes_down: '5000' },
      { protocol: '6', src: '192.168.20.17', dst: '9.9.9.9', sport: '2', dport: '443', bytes: '100', bytes_down: '100' }, // vanishes
    ];
    const cur = [
      { protocol: '6', src: '192.168.20.17', dst: '1.2.3.4', sport: '1', dport: '443', bytes: '3000', bytes_down: '9000' },
      { protocol: '6', src: '192.168.20.17', dst: '5.6.7.8', sport: '3', dport: '443', bytes: '5000', bytes_down: '5000' }, // new — ignored
    ];
    const rates = flowRates(prev, cur, 2000); // 2 s
    const r = rates.get('192.168.20.17');
    assert.ok(r, 'client rate present');
    assert.strictEqual(r.upRate, 1000);   // (3000-1000)/2
    assert.strictEqual(r.downRate, 2000);  // (9000-5000)/2
    assert.strictEqual(rates.size, 1);
  });
  ok('T8b flowRates with no previous snapshot → empty map', () => {
    const rates = flowRates([], [{ protocol: '6', src: '192.168.20.9', dst: '1.1.1.1', sport: '1', dport: '80', bytes: '10', bytes_down: '20' }], 1000);
    assert.strictEqual(rates.size, 0);
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

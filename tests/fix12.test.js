/**
 * fix12 test — gateway user_list as the Online Clients source (v1.5.96).
 * Verified 2026-10-01 from the user's DevTools capture of the gateway's
 * own Online Clients page (/admin/home_online):
 *   POST /cgi-bin/luci/api/cmd?auth=<sid>
 *   {method:"devSta.get", params:{module:"user_list", noParse:true,
 *    async:null, remoteIp:false, device:"pc",
 *    data:{devType:"all", dataType:"timely"}}}
 * Record fields: mac, userIp, ssid, deviceAliasName, hostName, rssi, sn.
 * Real record (Galaxy-A72): mac 52:ee:0b:75:bd:9c, userIp 192.168.30.2,
 * ssid AMH, deviceAliasName "WI-FI 7 RAP2271(MG)", sn G1TD8WY01875B.
 * VLAN labels derive from the verified gateway DHCP config:
 *   192.168.30.x -> 30 (AMH), 192.168.20.x -> 20, 192.168.110/111.x -> 233.
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
  const re = new RegExp('const ' + name + ' =\\s*([^=]*?)=>\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, i = m.index + m[0].length - 1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return new Function(m[1].trim(), src.slice(m.index + m[0].length, i));
}

/* ── normGwStaRecord (api.js) ── */
const normRec = extractArrow(apiSrc, 'normGwStaRecord');
ok(typeof normRec === 'function', 'normGwStaRecord exists');

// Real A72 record from the user's capture
const a72 = {
  mac: '52:ee:0b:75:bd:9c', userIp: '192.168.30.2', name: '',
  ssid: 'AMH', band: '5G', onlinetime: '2026-10-01 09:21:53',
  rssi: '-85', rxrate: '175M', channel: '36',
  deviceAliasName: 'WI-FI 7 RAP2271(MG)', hostName: 'Galaxy-A72(AMH DAD)',
  sn: 'G1TD8WY01875B', access_vlan: '0', mlo_band: 'NULL',
};
const r = normRec(a72);
ok(r && r.mac === '52:EE:0B:75:BD:9C', 'A72 MAC uppercased');
ok(r && r.ip === '192.168.30.2', 'A72 userIp extracted as ip');
ok(r && r.ssid === 'AMH', 'A72 ssid kept');
ok(r && r.apName === 'WI-FI 7 RAP2271(MG)', 'A72 deviceAliasName -> apName');
ok(r && r.apSn === 'G1TD8WY01875B', 'A72 sn -> apSn');
ok(r && r.host === 'Galaxy-A72(AMH DAD)', 'A72 hostName -> host');
ok(r && r.rssi === '-85', 'A72 rssi kept');

// NULL scrub (gateway uses literal "NULL" for unknown values)
ok(normRec({ mac: 'aa:bb:cc:dd:ee:ff', mlo_band: 'NULL', hostName: 'NULL' }).host === '',
   'literal NULL host scrubbed to empty');
// Non-record objects rejected
ok(normRec(null) === null, 'null rejected');
ok(normRec({}) === null, 'empty object rejected');
ok(normRec({ macaddr: '42:e8:33:4d:ef:40', ipaddr: '192.168.20.5' }) === null,
   'dhcp_static reservation (macaddr) is not a STA record');
// Old firmware field names still work (fallbacks)
const old = normRec({ staMac: 'aa:bb:cc:dd:ee:01', staIp: '192.168.20.9', staName: 'old' });
ok(old && old.ip === '192.168.20.9' && old.host === 'old', 'legacy staMac/staIp/staName fallbacks');

/* ── user_list probe in staList ── */
ok(/module:\s*['"]user_list['"]/.test(apiSrc), 'staList probes module user_list');
ok(/devType:\s*['"]all['"]/.test(apiSrc) && /dataType:\s*['"]timely['"]/.test(apiSrc),
   'user_list uses devType all + dataType timely');
ok(/normGwStaRecord\(o\)/.test(apiSrc), 'staList grab() uses normGwStaRecord');

/* ── vlanFromIp (app.js) ── */
const vlanFromIp = extractArrow(appSrc, 'vlanFromIp');
ok(typeof vlanFromIp === 'function', 'vlanFromIp exists');
ok(vlanFromIp('192.168.30.2') === '30', '192.168.30.2 -> VLAN 30');
ok(vlanFromIp('192.168.30.3') === '30', '192.168.30.3 -> VLAN 30');
ok(vlanFromIp('192.168.20.5') === '20', '192.168.20.5 -> VLAN 20');
ok(vlanFromIp('192.168.21.42') === '20', '192.168.21.42 -> VLAN 20 (Wi-Fi List: VLAN20 = .20.1-.21.254)');
ok(vlanFromIp('192.168.110.21') === '233', '192.168.110.21 -> VLAN 233');
ok(vlanFromIp('192.168.111.7') === '233', '192.168.111.x (/23) -> VLAN 233');
ok(vlanFromIp('10.0.0.5') === '', 'unknown subnet -> empty (never guessed)');
ok(vlanFromIp('') === '', 'empty IP -> empty');
ok(vlanFromIp('—') === '', 'em-dash placeholder -> empty');
ok(vlanFromIp(null) === '', 'null -> empty');

/* ── wiring ── */
ok(/vlan:\s*String\(c\.vlan \|\| vlanFromIp\(c\.userIp \|\| c\.ip/.test(appSrc),
   'mcFields returns vlan derived from IP');
ok(/VLAN ' \+ f\.vlan/.test(appSrc) || /'VLAN ' \+ f\.vlan/.test(appSrc),
   'Online Clients quiet line shows VLAN label');
ok(/s\.apName \|\|/.test(appSrc), 'gateway merge prefers s.apName (deviceAliasName)');
ok(/vlanFromIp\(c\.ip \|\| ''\)/.test(appSrc), 'per-AP view SSID cell shows VLAN');

console.log(`fix12: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

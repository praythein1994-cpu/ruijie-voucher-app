/**
 * fix7 test — "suspicious" (Unattributed, active — review) flag is scoped
 * to the voucher VLAN (the captive-portal LAN from Ruijie Cloud).
 * Clients on other VLANs (Home/AMH — WPA password) are legitimate by
 * definition and must NOT be flagged. No WiFi name needed.
 * Extracts the REAL pure functions from js/app.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

/* ── extract the REAL functions from js/app.js ────────── */
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const startMark = '/* fix7: voucher-VLAN-scoped "suspicious" flag.';
const startIdx = appSrc.indexOf(startMark);
if (startIdx < 0) { console.log('  FAIL fix7 helpers not found in js/app.js'); process.exit(1); }
const endMark = '/* v1.5.67: cells-only render';
const endIdx = appSrc.indexOf(endMark, startIdx);
if (endIdx < 0) { console.log('  FAIL fix7 block end not found'); process.exit(1); }
const blockSrc = appSrc.slice(startIdx, endIdx);
const factory = new Function(blockSrc + '\n;return { voucherVlan, isVoucherVlan, detectVoucherVlan, shouldFlagSuspicious };');
const { voucherVlan, isVoucherVlan, detectVoucherVlan, shouldFlagSuspicious } = factory();

/* ── voucherVlan ── */
ok(voucherVlan({}) === '', 'empty store -> empty');
ok(voucherVlan(null) === '', 'null store -> empty');
ok(voucherVlan({ voucherVlan: '20' }) === '20', 'configured VLAN returned');
ok(voucherVlan({ voucherVlan: '  ' }) === '', 'blank -> empty');

/* ── isVoucherVlan ── */
ok(isVoucherVlan('20', '') === true, 'not configured: any VLAN matches (backwards compat)');
ok(isVoucherVlan('30', null) === true, 'not configured (null): matches');
ok(isVoucherVlan('20', '20') === true, 'exact match');
ok(isVoucherVlan('30', '20') === false, 'non-voucher VLAN rejected');
ok(isVoucherVlan('', '20') === false, 'blank VLAN rejected when configured');
ok(isVoucherVlan('—', '20') === false, 'dash VLAN rejected when configured');

/* ── detectVoucherVlan ── */
ok(detectVoucherVlan([]) === '', 'empty WLAN list -> empty');
ok(detectVoucherVlan(null) === '', 'null -> empty');
ok(detectVoucherVlan([
  { ssidName: 'Nang Oo', vlanId: '20', authEnable: true },
  { ssidName: 'Home', vlanId: '233', authEnable: false },
]) === '20', 'captive-portal (authEnable) VLAN detected');
ok(detectVoucherVlan([
  { ssidName: 'Nang Oo', vlanId: 20, authEnable: 'true' },
]) === '20', 'string "true" authEnable + numeric vlanId');
ok(detectVoucherVlan([
  { ssidName: 'Home', vlanId: '233', authEnable: false },
]) === '', 'no captive portal -> empty');
ok(detectVoucherVlan([
  { ssidName: 'Shop', vlanId: '', authEnable: true },
]) === '', 'captive portal without VLAN id -> empty (never guessed)');

/* ── shouldFlagSuspicious ── */
const heavy = { flowUpDown: 60 * 1024 * 1024, activeSec: 100 };
const longSess = { flowUpDown: 1000, activeSec: 3 * 3600 };
const light = { flowUpDown: 1000, activeSec: 100 };
const cfg = '20';

ok(shouldFlagSuspicious('active', true, '20', heavy, cfg) === false,
  'voucher-authenticated client never flagged');
ok(shouldFlagSuspicious('unknown', true, '20', heavy, cfg) === false,
  'old/unknown-code client never gets suspicious flag');
ok(shouldFlagSuspicious('noauth', false, '20', heavy, cfg) === false,
  'non-portal source never flagged');
ok(shouldFlagSuspicious('noauth', true, '20', heavy, cfg) === true,
  'voucher VLAN + noauth + heavy traffic -> flagged');
ok(shouldFlagSuspicious('noauth', true, '20', longSess, cfg) === true,
  'voucher VLAN + noauth + long session -> flagged');
ok(shouldFlagSuspicious('noauth', true, '20', light, cfg) === false,
  'voucher VLAN + noauth + light usage -> not flagged');
ok(shouldFlagSuspicious('noauth', true, '233', heavy, cfg) === false,
  'fix7: Home VLAN + heavy usage -> NOT flagged (wife phone case)');
ok(shouldFlagSuspicious('noauth', true, '233', longSess, cfg) === false,
  'fix7: Home VLAN + long session -> NOT flagged');
ok(shouldFlagSuspicious('noauth', true, '30', heavy, cfg) === false,
  'fix7: AMH VLAN -> NOT flagged');
ok(shouldFlagSuspicious('noauth', true, '233', heavy, '') === true,
  'not configured: old behaviour preserved (flag everywhere)');

/* ── the two call sites use the scoped helper ── */
const usesHelper = (appSrc.match(/shouldFlagSuspicious\(/g) || []).length;
ok(usesHelper >= 3, 'shouldFlagSuspicious used at definition + 2 call sites, got ' + usesHelper);
ok(!/if \(st === 'noauth' && viaPortal\) \{\s*\n\s*const bytes/.test(appSrc),
  'old unscoped flag condition removed');

console.log(`fix7: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

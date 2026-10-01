/**
 * fix7 test — "suspicious" (Unattributed, active — review) flag is scoped
 * to the voucher SSID. Clients on other SSIDs (Home/AMH — WPA password)
 * are legitimate by definition and must NOT be flagged.
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
const startMark = '/* fix7: voucher-SSID-scoped "suspicious" flag.';
const startIdx = appSrc.indexOf(startMark);
if (startIdx < 0) { console.log('  FAIL fix7 helpers not found in js/app.js'); process.exit(1); }
const endMark = '/* v1.5.67: cells-only render';
const endIdx = appSrc.indexOf(endMark, startIdx);
if (endIdx < 0) { console.log('  FAIL fix7 block end not found'); process.exit(1); }
const blockSrc = appSrc.slice(startIdx, endIdx);
const factory = new Function(blockSrc + '\n;return { voucherSsidList, isVoucherSsid, shouldFlagSuspicious };');
const { voucherSsidList, isVoucherSsid, shouldFlagSuspicious } = factory();

/* ── voucherSsidList ── */
ok(JSON.stringify(voucherSsidList({})) === '[]', 'empty store -> []');
ok(JSON.stringify(voucherSsidList(null)) === '[]', 'null store -> []');
ok(JSON.stringify(voucherSsidList({ voucherSsid: 'ShopWiFi' })) === '["shopwifi"]',
  'single SSID lowercased');
ok(JSON.stringify(voucherSsidList({ voucherSsid: 'ShopWiFi, Home ,AMH' })) === '["shopwifi","home","amh"]',
  'comma-separated, trimmed');
ok(JSON.stringify(voucherSsidList({ voucherSsid: '  ' })) === '[]', 'blank -> []');

/* ── isVoucherSsid ── */
ok(isVoucherSsid('Home', []) === true, 'not configured: any SSID matches (backwards compat)');
ok(isVoucherSsid('Anything', null) === true, 'not configured (null): matches');
ok(isVoucherSsid('ShopWiFi', ['shopwifi']) === true, 'exact match');
ok(isVoucherSsid('shopwifi', ['shopwifi']) === true, 'case-insensitive client SSID');
ok(isVoucherSsid('SHOPWIFI', ['shopwifi']) === true, 'upper-case client SSID matches');
ok(isVoucherSsid('Home', ['shopwifi']) === false, 'non-voucher SSID rejected');
ok(isVoucherSsid('', ['shopwifi']) === false, 'blank SSID rejected when configured');
ok(isVoucherSsid('—', ['shopwifi']) === false, 'dash SSID rejected when configured');

/* ── shouldFlagSuspicious ── */
const heavy = { flowUpDown: 60 * 1024 * 1024, activeSec: 100 };
const longSess = { flowUpDown: 1000, activeSec: 3 * 3600 };
const light = { flowUpDown: 1000, activeSec: 100 };
const cfg = ['shopwifi'];

ok(shouldFlagSuspicious('active', true, 'ShopWiFi', heavy, cfg) === false,
  'voucher-authenticated client never flagged');
ok(shouldFlagSuspicious('unknown', true, 'ShopWiFi', heavy, cfg) === false,
  'old/unknown-code client never gets suspicious flag');
ok(shouldFlagSuspicious('noauth', false, 'ShopWiFi', heavy, cfg) === false,
  'non-portal source never flagged');
ok(shouldFlagSuspicious('noauth', true, 'ShopWiFi', heavy, cfg) === true,
  'voucher SSID + noauth + heavy traffic -> flagged');
ok(shouldFlagSuspicious('noauth', true, 'ShopWiFi', longSess, cfg) === true,
  'voucher SSID + noauth + long session -> flagged');
ok(shouldFlagSuspicious('noauth', true, 'ShopWiFi', light, cfg) === false,
  'voucher SSID + noauth + light usage -> not flagged');
ok(shouldFlagSuspicious('noauth', true, 'Home', heavy, cfg) === false,
  'fix7: Home SSID + heavy usage -> NOT flagged (wife phone case)');
ok(shouldFlagSuspicious('noauth', true, 'Home', longSess, cfg) === false,
  'fix7: Home SSID + long session -> NOT flagged');
ok(shouldFlagSuspicious('noauth', true, 'AMH', heavy, cfg) === false,
  'fix7: AMH SSID -> NOT flagged');
ok(shouldFlagSuspicious('noauth', true, 'Home', heavy, []) === true,
  'not configured: old behaviour preserved (flag everywhere)');

/* ── the two call sites use the scoped helper ── */
const usesHelper = (appSrc.match(/shouldFlagSuspicious\(/g) || []).length;
ok(usesHelper >= 3, 'shouldFlagSuspicious used at definition + 2 call sites, got ' + usesHelper);
ok(!/if \(st === 'noauth' && viaPortal\) \{\s*\n\s*const bytes/.test(appSrc),
  'old unscoped flag condition removed');

console.log(`fix7: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

/* v1.5.135: V1-style default-printer auto-connect — fast, no toggle, no backoff.
 * User correction: Printer V1 auto-reconnects to the default printer whenever
 * (app start / printer powers on), and V1's own test file specifies the design:
 * single attempt, fails silently when offline, event-driven (BT on, discovery,
 * ACL). v1.5.134 removed the SLOW toggle+backoff (3s->30s retry loop); this
 * version re-introduces auto-connect the V1 way: one silent attempt, never
 * retries, never backs off. No toggle — it is simply always on and instant. */
'use strict';
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const bridge = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src',
  'main', 'java', 'com', 'ruijie', 'voucher', 'RuijieBridge.java'), 'utf8');
const mgr = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src',
  'main', 'java', 'com', 'ruijie', 'voucher', 'printer', 'BluetoothPrinterManager.java'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);
const gone = (name, src, re) => ok(name + ' absent', !re.test(src));

// V1-style single-shot auto-connect exists
ok('mgr autoConnectDefault() exists', /public void autoConnectDefault\(\)/.test(mgr));
ok('autoConnectDefault skips when user explicitly disconnected',
  /autoConnectDefault\(\)[\s\S]{0,300}?userInitiatedDisconnect/.test(mgr));
ok('autoConnectDefault skips when already connected/connecting',
  /autoConnectDefault\(\)[\s\S]{0,500}?STATE_CONNECTED[\s\S]{0,80}?STATE_CONNECTING/.test(mgr));
ok('autoConnectDefault prefers explicit default, falls back to last-used',
  /autoConnectDefault\(\)[\s\S]{0,600}?getDefaultPrinterAddress\(\)[\s\S]{0,120}?getLastPrinterAddress\(\)/.test(mgr));
ok('autoConnectDefault is single-shot (quiet connect, no loop)',
  /autoConnectDefault\(\)[\s\S]{0,800}?connectAsync\(addr, true\)/.test(mgr));

// No slowness machinery: no backoff, no retry loop, no toggle
gone('mgr RECONNECT_BACKOFF_MS', mgr, /RECONNECT_BACKOFF_MS/);
gone('mgr maybeScheduleReconnect', mgr, /maybeScheduleReconnect/);
gone('mgr stopReconnect', mgr, /stopReconnect/);
gone('mgr reconnectThread', mgr, /reconnectThread/);
gone('mgr setAutoReconnectEnabled (toggle)', mgr, /setAutoReconnectEnabled/);
gone('mgr KEY_AUTO_RECONNECT', mgr, /KEY_AUTO_RECONNECT/);
gone('mgr old autoConnectAsync', mgr, /public void autoConnectAsync\(\)/);
gone('bridge btSetAutoReconnect', bridge, /btSetAutoReconnect/);
const appNoBridgeCall = app.replace(/B\.btAutoConnect\(\)/g, '');
gone('JS toggle checkbox', appNoBridgeCall, /bt-autoconnect/);
gone('HTML toggle row', html, /id="bt-autoconnect"/);
gone('JS Store btAutoConnect flag', appNoBridgeCall, /btAutoConnect/);
gone('i18n p.btAuto', app, /'p\.btAuto'/);

// Silent failure: background attempt never shows error UI
ok('doConnect takes quiet flag', /private void doConnect\(String address, boolean quiet\)/.test(mgr));
ok('quietFail() exists', /private void quietFail\(\)/.test(mgr));
ok('quiet failure resets to DISCONNECTED, not ERROR',
  /quietFail\(\)[\s\S]{0,200}?STATE_DISCONNECTED/.test(mgr));

// Event-driven: printer available -> try once immediately
ok('discovery of default printer triggers autoConnectDefault',
  /Default printer discovered[\s\S]{0,120}?autoConnectDefault\(\)/.test(mgr));
ok('Bluetooth STATE_ON triggers autoConnectDefault',
  /BluetoothAdapter\.STATE_ON\)[\s\S]{0,300}?autoConnectDefault\(\)/.test(mgr));
ok('ACL_CONNECTED of default printer triggers autoConnectDefault',
  /ACTION_ACL_CONNECTED[\s\S]{0,600}?autoConnectDefault\(\)/.test(mgr));

// Unexpected loss: no retry loop (printer power-on fires ACL -> single attempt)
ok('handleConnectionLost schedules no reconnect', (() => {
  const start = mgr.indexOf('public void handleConnectionLost');
  const body = mgr.slice(start, mgr.indexOf('/** Explicit user disconnect'));
  return !/[Rr]econnect/.test(body);
})());

// Bridge + JS wiring
ok('bridge btAutoConnect() exists (single-shot)', /public String btAutoConnect\(\)/.test(bridge)
  && /btAutoConnect\(\)[\s\S]{0,400}?autoConnectDefault\(\)/.test(bridge));
ok('JS startup calls btAutoConnect once (no toggle)',
  /setTimeout\(\(\) => \{ try \{ btCall\(B => B\.btAutoConnect\(\)\);/.test(app));

// Manual path untouched
ok('bridge btConnect kept', /public String btConnect\(String address\)/.test(bridge));
ok('mgr connectAsync(address) kept', /public void connectAsync\(final String address\)/.test(mgr));
ok('bridge btSetDefault/btClearDefault kept',
  /public String btSetDefault\(String address\)/.test(bridge) && /public String btClearDefault\(\)/.test(bridge));
ok('mgr userDisconnect kept', /public void userDisconnect\(\)/.test(mgr));

const failed = results.filter(r => !r[1]);
failed.forEach(([n]) => console.log('FAIL:', n));
console.log(`v15135.test.js: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);

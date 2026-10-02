/* v1.5.134: printer auto-connect removed — back to V1-style direct connect.
 * The auto-connect toggle + native backoff retry (3s→30s) made connecting
 * SLOWER: if the printer was off at app start, the first attempt failed and
 * retries backed off, so turning the printer on later meant waiting for the
 * next retry. V1 had no auto-connect: tap the printer in the list → direct
 * RFCOMM connect, immediate. This test locks in the removal. */
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
const gone = (name, src, re) => ok(name + ' removed', !re.test(src));

// JS: no auto-connect wiring left
gone('JS btAutoConnect()', app, /function btAutoConnect\(/);
gone('JS bt-autoconnect checkbox ref', app, /bt-autoconnect/);
gone('JS btSetAutoReconnect call', app, /btSetAutoReconnect/);
gone('JS startup auto-connect', app, /btAutoConnect\(true\)/);
gone('JS sync of btAutoConnect', app, /st2\.btAutoConnect/);
gone('JS Store btAutoConnect', app, /Store\.(load|save)\(\).*btAutoConnect|btAutoConnect.*Store/);
gone('i18n p.btAuto', app, /'p\.btAuto'/);
gone('i18n p.btAutoTrying', app, /'p\.btAutoTrying'/);

// HTML: toggle row gone
gone('HTML bt-autoconnect input', html, /id="bt-autoconnect"/);
gone('HTML p.btAuto label', html, /data-i18n="p\.btAuto"/);

// Native bridge: methods gone
gone('bridge btAutoConnect()', bridge, /public String btAutoConnect\(\)/);
gone('bridge btSetAutoReconnect()', bridge, /public String btSetAutoReconnect\(/);

// Native manager: whole auto-reconnect machinery gone
gone('mgr autoConnectAsync', mgr, /autoConnectAsync/);
gone('mgr maybeScheduleReconnect', mgr, /maybeScheduleReconnect/);
gone('mgr stopReconnect', mgr, /stopReconnect/);
gone('mgr onPrinterAvailableHint', mgr, /onPrinterAvailableHint/);
gone('mgr RECONNECT_BACKOFF_MS', mgr, /RECONNECT_BACKOFF_MS/);
gone('mgr reconnectThread', mgr, /reconnectThread/);
gone('mgr reconnectAttempts', mgr, /reconnectAttempts/);
gone('mgr suppressReconnect', mgr, /suppressReconnect/);
gone('mgr autoReconnectEnabled', mgr, /autoReconnectEnabled/);
gone('mgr setAutoReconnectEnabled', mgr, /setAutoReconnectEnabled/);
gone('mgr getAutoConnectAddress', mgr, /getAutoConnectAddress/);
gone('mgr KEY_AUTO_RECONNECT', mgr, /KEY_AUTO_RECONNECT/);

// V1-style direct connect still intact
ok('mgr connectAsync(address) kept', /public void connectAsync\(final String address\)/.test(mgr));
ok('mgr doConnect kept', /private void doConnect\(String address\)/.test(mgr));
ok('mgr userDisconnect kept', /public void userDisconnect\(\)/.test(mgr));
ok('mgr handleConnectionLost kept (no reconnect)', /public void handleConnectionLost\(String reason\)/.test(mgr)
  && !/handleConnectionLost\(String reason\)[\s\S]{0,400}?maybeScheduleReconnect/.test(mgr));
ok('bridge btConnect kept', /public String btConnect\(String address\)/.test(bridge));
ok('bridge btScan kept', /public String btScan\(\)/.test(bridge));
ok('JS tap-to-connect path kept', /\.btConnect\(/.test(app));

// Default printer (star) is a separate feature — must survive
ok('bridge btSetDefault kept', /public String btSetDefault\(String address\)/.test(bridge));
ok('bridge btClearDefault kept', /public String btClearDefault\(\)/.test(bridge));
ok('JS default-star button kept', /btSetDefault/.test(app));
ok('i18n p.btSetDefault kept', /'p\.btSetDefault'/.test(app));

// Last-printer memory still used by status + default fallback (not auto-connect)
ok('mgr getLastPrinterAddress kept', /public String getLastPrinterAddress\(\)/.test(mgr));

const failed = results.filter(r => !r[1]);
failed.forEach(([n]) => console.log('FAIL:', n));
console.log(`v15134.test.js: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);

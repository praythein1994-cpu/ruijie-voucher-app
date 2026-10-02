/* v1.5.143 (app): device install control — native deviceInfo, startup
 * gate, lock screen, 30-min re-check, admin UI (More → App Devices). */
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const java = fs.readFileSync(
  path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'ruijie', 'voucher', 'RuijieBridge.java'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── Native bridge ──
ok('bridge has deviceInfo', /public String deviceInfo\(\)/.test(java));
ok('deviceInfo is a JavascriptInterface', /@JavascriptInterface\s*public String deviceInfo/.test(java));
ok('deviceInfo returns ANDROID_ID', /ANDROID_ID/.test(java));
ok('deviceInfo returns model/manufacturer/android', /Build\.MODEL/.test(java) && /Build\.VERSION\.RELEASE/.test(java));

// ── JS module ──
for (const f of ['devGetInfo', 'devMyId', 'devIsAdmin', 'devRegister', 'devStartupGate',
                 'devShowLock', 'devHideLock', 'devWatchStart', 'moreAppDevices', 'adRender']) {
  ok('function ' + f + ' exists', new RegExp('function ' + f + '\\(').test(js));
}
ok('devGetInfo prefers native bridge', /B\.deviceInfo\(\)/.test(js));
ok('devGetInfo falls back to persisted UUID', /localStorage\.getItem\('devUuid'\)/.test(js));
ok('admin = praythein profile', /=== DEV_ADMIN/.test(js) && /const DEV_ADMIN = 'praythein'/.test(js));
ok('register posts device fields',
  /\/api\/devices\/register[\s\S]{0,400}?deviceId: info\.id/.test(js));
ok('register sends profile + appVersion', /profile: devLastProfile\(\)/.test(js));

// ── Startup gate ──
ok('init is async', /async function init\(\)/.test(js));
ok('gate runs before enterApp/gate', /if \(await devStartupGate\(\)\) \{\s*if \(Api\.cfg && Api\.cfg\.appid\) enterApp\(\);/.test(js));
ok('cached blocked is fail-closed', /if \(cached === 'blocked'\) \{ devShowLock\(info, 'blocked'\); return false;/.test(js));
ok('offline fail-open for unknown', /return true; \/\/ offline \/ proxy down: fail open/.test(js));
ok('cached status persisted', /localStorage\.setItem\('devStatus'/.test(js));
ok('watcher re-checks every 30 min', /setInterval\(async \(\) => \{[\s\S]{0,300}?30 \* 60 \* 1000\)/.test(js));
ok('watcher locks mid-session blocks', /devShowLock\(devGetInfo\(\), st\)/.test(js));

// ── Lock screen ──
ok('lock screen HTML exists', /id="view-devlock" class="screen hidden"/.test(html));
ok('lock has title/msg/id/retry', /id="devlock-title"/.test(html) && /id="devlock-msg"/.test(html) &&
  /id="devlock-id"/.test(html) && /id="devlock-retry"/.test(html));
ok('lock has copy button', /id="devlock-copy"/.test(html));
ok('lock hides app screens', /\['view-connect', 'view-profile', 'view-profile-new', 'app'\]/.test(js));
ok('retry re-runs the gate', /\$\('devlock-retry'\)[\s\S]{0,200}?devStartupGate\(\)/.test(js));
ok('lock screen styled full-screen', /#view-devlock \{[\s\S]{0,200}?min-height: 100dvh;/.test(css));

// ── Admin UI ──
ok('menu item exists (admin-hidden by default)', /id="more-appdevices" hidden/.test(html));
ok('menu item dispatches', /k === 'appdevices'\) moreAppDevices\(\);/.test(js));
ok('enterApp toggles admin visibility', /\$\('more-appdevices'\)\.hidden = !devIsAdmin\(\);/.test(js));
ok('admin list calls list endpoint', /\/api\/devices\/list\?profile=/.test(js));
ok('admin set calls set endpoint', /\/api\/devices\/set/.test(js));
ok('admin config calls config endpoint', /\/api\/devices\/config/.test(js));
ok('set sends by-device (self-block safety)', /by: myId/.test(js));
ok('cannot block own device (button disabled)', /isMe \? ' disabled' : ''/.test(js));
ok('block asks confirm', /ad\.confirmBlock/.test(js));
ok('status chips styled', /\.ad-chip\.blocked/.test(css) && /\.ad-chip\.pending/.test(css) && /\.ad-chip\.allowed/.test(css));
ok('maxDevices stepper', /id="ad-max-dec"/.test(js) && /id="ad-max-inc"/.test(js));
ok('approval toggle', /id="ad-approval"/.test(js));

// ── i18n ──
for (const k of ['m.appdevices', 'm.appdevicesSub', 'dev.lockTitle', 'dev.lockMsg',
                 'dev.pendingTitle', 'dev.pendingMsg', 'dev.retry', 'ad.allow', 'ad.block',
                 'ad.maxDevices', 'ad.requireApproval', 'ad.confirmBlock']) {
  const m = js.match(new RegExp("'" + k.replace(/\./g, '\\.') + "': \\{ my: '([^']*)', en: '([^']*)' \\}"));
  ok('i18n ' + k, !!m && m[1].length > 0 && m[2].length > 0);
}

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15143: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

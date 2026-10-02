/* v1.5.133: updater repair — persistent Install button + real notification.
 * Bug: after an update downloaded, the ONLY install path was a one-time
 * iosConfirm dialog; dismiss it (or miss it) and no install button existed
 * anywhere in the app, and auto mode posted no app notification at all. */
'use strict';
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const bridge = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src',
  'main', 'java', 'com', 'ruijie', 'voucher', 'RuijieBridge.java'), 'utf8');
const manifest = fs.readFileSync(path.join(__dirname, '..', 'android', 'app',
  'src', 'main', 'AndroidManifest.xml'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// Pending-update persistence (device-local localStorage, never Store-synced)
ok('updPendingSave exists', /function updPendingSave\(/.test(app));
ok('updPendingLoad exists', /function updPendingLoad\(/.test(app));
ok('updPendingClear exists', /function updPendingClear\(/.test(app));
ok('pending uses raw localStorage (device-local, not Store)',
  /localStorage\.getItem\('updPending'\)/.test(app) && /localStorage\.setItem\('updPending'/.test(app));
ok('updPendingState classifies ready/waiting/gone/none',
  /function updPendingState\(\)[\s\S]*?'ready'[\s\S]*?'waiting'[\s\S]*?'gone'[\s\S]*?'none'/.test(app));
ok('stale pending cleared when already installed',
  /updPendingState\(\)[\s\S]*?cmpVersions\(p\.tag, cur\.name\) <= 0/.test(app));

// Persistent install UI
ok('updRefreshInstallUI exists', /function updRefreshInstallUI\(/.test(app));
ok('install row shown/hidden via upd-install-row',
  /updRefreshInstallUI\(\)[\s\S]*?\$\('upd-install-row'\)/.test(app));
ok('waiting download resumes polling after restart',
  /updRefreshInstallUI\(\)[\s\S]*?'waiting'[\s\S]*?updPollDownload/.test(app));
ok('html has upd-install-row', /id="upd-install-row"/.test(html));
ok('html has upd-install-btn', /id="upd-install-btn"/.test(html));
ok('html has upd-install-sub', /id="upd-install-sub"/.test(html));
ok('install button wired in initUpdateSettings',
  /initUpdateSettings\(\)[\s\S]*?\$\('upd-install-btn'\)[\s\S]*?addEventListener\('click'/.test(app));
ok('install click falls back gracefully when file is gone',
  /\$\('upd-install-btn'\)[\s\S]*?upd\.gone/.test(app));

// Download completion: persist + notify + install button
ok('updOnDownloadDone exists', /function updOnDownloadDone\(/.test(app));
ok('completion persists pending', /updOnDownloadDone[\s\S]*?updPendingSave/.test(app));
ok('completion refreshes install UI', /updOnDownloadDone[\s\S]*?updRefreshInstallUI\(\)/.test(app));
ok('completion posts system notification',
  /updOnDownloadDone[\s\S]*?updateNotify/.test(app));
ok('updStartDownload delegates to updOnDownloadDone',
  /function updStartDownload[\s\S]*?updOnDownloadDone\(rel, ok, id\)/.test(app));
ok('pending saved early so restart can resume',
  /function updStartDownload[\s\S]*?updPendingSave\(\{ id: r\.id/.test(app));

// checkAppUpdate: never re-download a ready update; auto failures visible
ok('checkAppUpdate refreshes install UI first',
  /async function checkAppUpdate[\s\S]*?updRefreshInstallUI\(\(\)/.test(app) ||
  /async function checkAppUpdate[\s\S]*?updRefreshInstallUI\(\)/.test(app));
ok('checkAppUpdate returns early when pending is ready',
  /async function checkAppUpdate\(manual\)[\s\S]*?updPendingState\(\) === 'ready'/.test(app));
ok('auto-mode failure writes visible status, not silent',
  /else updSetStatus\(t\('upd\.checkFail'\)\)/.test(app));

// Notification permission requested when auto-download is enabled
ok('toggle enable requests notification permission',
  /updateNotifRequest/.test(app));

// i18n strings present (my + en)
for (const k of ['upd.ready', 'upd.readySub', 'upd.gone', 'upd.notiTitle', 'upd.notiText', 'upd.checkFail']) {
  ok('i18n ' + k + ' defined', new RegExp("'" + k.replace('.', '\\.') + "':\\s*\\{\\s*my:").test(app));
}

// Native bridge
ok('bridge has updateNotify', /public String updateNotify\(String title, String text\)/.test(bridge));
ok('bridge has updateNotifRequest', /public String updateNotifRequest\(\)/.test(bridge));
ok('updateNotify creates notification channel', /NotificationChannel/.test(bridge));
ok('updateNotify respects areNotificationsEnabled', /areNotificationsEnabled\(\)/.test(bridge));
ok('updateNotifRequest targets Android 13+', /Build\.VERSION\.SDK_INT >= 33/.test(bridge));
ok('manifest has POST_NOTIFICATIONS', /POST_NOTIFICATIONS/.test(manifest));

const failed = results.filter(r => !r[1]);
failed.forEach(([n]) => console.log('FAIL:', n));
console.log(`v15133.test.js: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);

/* v1.5.140: pre-install guide dialog. Tapping "Update Now" first shows an
 * iOS-style dialog explaining the Play Protect / Xiaomi security screens
 * that follow (they cannot be bypassed by code) — install only proceeds
 * after the user confirms. */
'use strict';
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── Install button flow ──
ok('install handler is async', /addEventListener\('click', async \(\) => \{\s*const p = updPendingLoad\(\);/.test(js));
ok('guide dialog shown before install',
  /upd-install-btn'\)[\s\S]{0,600}?iosConfirm\(t\('upd\.preTitle'\), t\('upd\.preBody'\)/.test(js));
ok('install proceeds only after confirm',
  /const go = await iosConfirm\(t\('upd\.preTitle'\)[\s\S]{0,160}?if \(go\) updInstallApk\(Number\(p\.id\)\)/.test(js));
ok('gone-file path still clears + toasts',
  /if \(!\(p && updPendingState\(\) === 'ready'\)\) \{\s*updPendingClear\(\); updRefreshInstallUI\(\); toast\(t\('upd\.gone'\), true\); return;/.test(js));
ok('uses iosConfirm (iOS style), not native confirm',
  /upd\.preTitle'\), t\('upd\.preBody'\)/.test(js) && !/confirm\(t\('upd\.pre/.test(js));

// ── i18n ──
const title = js.match(/'upd\.preTitle': \{ my: '([^']*)', en: '([^']*)' \}/);
ok('preTitle defined both languages', !!title && title[1].length > 0 && title[2].length > 0);
const bodyMy = js.match(/'upd\.preBody': \{ my: '((?:[^'\\]|\\.|'')*)', en: /);
ok('preBody Burmese defined', !!bodyMy && bodyMy[1].length > 50);
ok('preBody mentions Play Protect step', /Play Protect/.test(js.split("'upd.preBody'")[1].split('},')[0]));
ok('preBody mentions Xiaomi step', /Xiaomi/.test(js.split("'upd.preBody'")[1].split('},')[0]));
ok('preBody has numbered steps', /1\.[^]*?\\n[^]*?2\./.test(js.split("'upd.preBody'")[1].split('},')[0]));
ok('preBody reassures it is normal', /ပုံမှန်ပါ/.test(js) && /normal for apps/.test(js));

// ── CSS: multiline message renders with line breaks ──
ok('ios-alert-msg preserves line breaks', /\.ios-alert-msg \{[^}]*white-space: pre-wrap;/.test(css));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15140: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

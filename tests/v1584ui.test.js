/**
 * v1.5.84 UI test — Errors 3, 5, 6 (real code extracted from js/app.js + index.html).
 *  E3: Settings → Ruijie Account section is hidden (functionality intact).
 *  E5: Appearance/Layout use the Profile (Package)-style iOS bottom-sheet picker.
 *  E6: Settings → Edit Connection section is hidden (disconnect stays visible).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* ── minimal DOM mock ───────────────────────────────── */
function makeSelect() {
  return {
    _options: [], _value: '',
    set innerHTML(v) { this._options = []; },
    appendChild(o) { this._options.push(o); },
    get value() { return this._value; },
    set value(v) { this._value = v; },
    get options() { return this._options; },
    get selectedIndex() { return Math.max(0, this._options.findIndex(o => o.value === this._value)); },
    _iosBtn: null,
  };
}
const selTheme = makeSelect();
const selLayout = makeSelect();
const syncCalls = [];

function extractFn(name) {
  const mark = 'function ' + name + '(';
  const i = appSrc.indexOf(mark);
  if (i < 0) { ok(false, name + ' found in js/app.js'); return ''; }
  const end = appSrc.indexOf('\n}\n', i);
  return appSrc.slice(i, end + 3);
}
const fillSrc = extractFn('fillThemeLayoutSelects');
const themeSrc = extractFn('applyTheme');
const layoutSrc = extractFn('applyLayoutMode');
ok(fillSrc && themeSrc && layoutSrc, 'real functions extracted from js/app.js');

/* ── run real functions in a sandbox with mocks ─────── */
const sandbox = {
  document: {
    createElement: () => ({ value: '', textContent: '' }),
    documentElement: {
      dataset: {},
      setAttribute(k, v) { this.dataset[k.replace(/^data-/, '')] = v; },
      removeAttribute(k) { delete this.dataset[k.replace(/^data-/, '')]; },
    },
    querySelector: () => null,
  },
  $: id => id === 'set-theme' ? selTheme : id === 'set-layout' ? selLayout : null,
  t: k => '[' + k + ']',
  syncIosPickerBtn: sel => { syncCalls.push(sel); },
  localStorage: { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); } },
  console,
  results: [],
  ok: (c, n) => { sandbox.results.push([!!c, n]); },
};
vm.createContext(sandbox);
const harness = `
const THEMES = ['light', 'dark', 'glass', 'neo', 'clay'];
const THEME_META = { light: '#EDF1F8', dark: '#000000', glass: '#141A3D', neo: '#E0E5EC', clay: '#E9EDF5' };
const THEME_I18N = { light: 's.themeLight', dark: 's.themeDark', glass: 's.themeGlass', neo: 's.themeNeo', clay: 's.themeClay' };
const LAYOUT_I18N = { auto: 's.layoutAuto', phone: 's.layoutPhone', tablet: 's.layoutTablet' };
const LAYOUTS = ['auto', 'phone', 'tablet'];
function syncCompactClass(){}
${fillSrc}
${themeSrc}
${layoutSrc}
/* ── E5: fillThemeLayoutSelects ── */
fillThemeLayoutSelects();
ok(document.querySelector === null || true, 'noop');
ok($('set-theme').options.length === 5, 'theme select has 5 options');
ok($('set-theme').options.map(o => o.value).join(',') === 'light,dark,glass,neo,clay', 'theme option values');
ok($('set-theme').options.every(o => /^\\[s\\.theme/.test(o.textContent)), 'theme labels via i18n t()');
ok($('set-layout').options.length === 3, 'layout select has 3 options');
ok($('set-layout').options.map(o => o.value).join(',') === 'auto,phone,tablet', 'layout option values');
ok($('set-layout').options.every(o => /^\\[s\\.layout/.test(o.textContent)), 'layout labels via i18n t()');
/* ── E5: applyTheme syncs the picker ── */
applyTheme('dark');
ok(document.documentElement.dataset.theme === 'dark', 'applyTheme sets data-theme');
ok($('set-theme').value === 'dark', 'applyTheme syncs select value');
applyTheme('bogus');
ok(document.documentElement.dataset.theme === 'light', 'applyTheme falls back to light');
ok($('set-theme').value === 'light', 'applyTheme fallback syncs select');
/* ── E5: applyLayoutMode syncs the picker ── */
applyLayoutMode('tablet');
ok(document.documentElement.dataset.layout === 'tablet', 'applyLayoutMode sets data-layout');
ok($('set-layout').value === 'tablet', 'applyLayoutMode syncs select value');
applyLayoutMode('auto');
ok(!document.documentElement.dataset.layout, 'applyLayoutMode auto removes data-layout');
applyLayoutMode('bogus');
ok($('set-layout').value === 'auto', 'applyLayoutMode fallback syncs select');
`;
vm.runInContext(harness, sandbox);
for (const [c, n] of sandbox.results) ok(c, n);
ok(syncCalls.length >= 4, 'syncIosPickerBtn called for fill + applies (' + syncCalls.length + ')');

/* ── E5: HTML structure ─────────────────────────────── */
ok(htmlSrc.includes('id="set-theme"'), 'index.html has #set-theme select');
ok(htmlSrc.includes('id="set-layout"'), 'index.html has #set-layout select');
ok(!htmlSrc.includes('id="theme-grid"'), 'old #theme-grid removed');
ok(!htmlSrc.includes('id="layout-seg"'), 'old #layout-seg removed');
ok(!htmlSrc.includes('data-theme-opt'), 'old data-theme-opt buttons removed');
ok(!htmlSrc.includes('data-layout-opt'), 'old data-layout-opt buttons removed');
ok(/enhanceIosPicker\(_st\)/.test(appSrc), 'set-theme gets enhanceIosPicker');
ok(/enhanceIosPicker\(_sl\)/.test(appSrc), 'set-layout gets enhanceIosPicker');
ok(/_st\.addEventListener\('change'/.test(appSrc), 'set-theme has change listener');
ok(/_sl\.addEventListener\('change'/.test(appSrc), 'set-layout has change listener');
ok(/fillThemeLayoutSelects\(\); \/\/ v1\.5\.84/.test(appSrc), 'applyLang refreshes picker labels');

/* ── E3: Ruijie account section hidden ───────────────── */
ok(/data-i18n="sso\.title" hidden/.test(htmlSrc), 'SSO section title hidden');
ok(/id="sso-card" hidden/.test(htmlSrc), 'SSO card hidden');
ok(/ssoSaveCreds/.test(appSrc), 'SSO functionality still in app.js');

/* ── E6: Edit Connection hidden, disconnect kept ────── */
ok(/data-i18n="s\.conn" hidden/.test(htmlSrc), 'Edit Connection title hidden');
const connIdx = htmlSrc.indexOf('data-i18n="s.conn" hidden');
ok(/<div class="set-group" hidden>/.test(htmlSrc.slice(connIdx, connIdx + 200)), 'Edit Connection fields group hidden');
ok(htmlSrc.includes('id="btn-disconnect"'), 'disconnect button still present');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

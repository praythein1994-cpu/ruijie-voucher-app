/* v1.5.141: premium bulk delete (video reference) — purple selection,
 * gradient delete bar, staggered row exit, progress + success flash.
 * The safety rails (session-only filter + confirm) are untouched. */
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── HTML: premium bar structure ──
ok('bulk bar has premium class', /id="bulk-bar" class="bulk-bar premium hidden"/.test(html));
ok('delete button is the compact pdel-mini', /id="btn-bulk-delete" class="pdel-mini" disabled/.test(html));
ok('bar has trash icon', /pdel-mini[\s\S]{0,120}?#i-trash/.test(html));
ok('bar has NO title element (v1.5.145 compact)', !/id="bulk-del-title"/.test(html));
ok('bar keeps count badge', /id="bulk-count"/.test(html));
ok('bar has NO go arrow (v1.5.145 compact)', !/pdel-go/.test(html));
ok('print kept, cancel removed (v1.5.145: single cancel in top row)', /id="btn-bulk-print"/.test(html) && !/id="btn-bulk-cancel"/.test(html));

// ── Selection: whole row highlights ──
ok('row tap toggles sel class',
  /cb\.classList\.toggle\('on'\); r\.classList\.toggle\('sel', cb\.classList\.contains\('on'\)\); updateBulkCount\(\);/.test(js));
ok('checkmark click toggles sel class',
  /cb\.closest\('\.voucher-row'\)[\s\S]{0,120}?classList\.toggle\('sel'/.test(js));
ok('exiting bulk mode clears sel',
  /document\.querySelectorAll\('\.voucher-row\.sel'\)\.forEach\(r => r\.classList\.remove\('sel'\)\)/.test(js));
ok('selected row gets purple tint', /\.voucher-row\.sel \{[\s\S]{0,200}?rgba\(124, 92, 255/.test(css));
ok('checkbox pops when selected', /@keyframes tickpop/.test(css));
ok('checked box uses purple gradient',
  /\.bulk-check\.on \{[\s\S]{0,200}?linear-gradient\(135deg, #7C5CFF, #5E5CE6\)/.test(css));

// ── Delete flow: animation + progress + success ──
ok('rows fly out staggered', /setTimeout\(\(\) => row\.classList\.add\('leaving'\), i \* 70\)/.test(js));
ok('leaving rows slide+fade', /\.voucher-row\.leaving \{[^}]*opacity: 0;[^}]*translateX\(60px\)/.test(css));
ok('bar shows delete progress', /delTitle\.textContent = tx\('v\.deleting', \{ i: ok \+ fail \+ 1, n: fresh\.length \}\)/.test(js));
ok('bar flashes green on success', /bar\.classList\.add\('done'\)/.test(js));
ok('done bar is green gradient', /\.pdel-bar\.done \{[^}]*linear-gradient\(135deg, #30D158/.test(css));
ok('bulk mode exits after the flash', /setTimeout\(\(\) => \{ toggleBulkMode\(\); loadVouchers\(\); \}, 900\)/.test(js));
ok('bar title follows selection count', /\$\('bulk-del-title'\)[\s\S]{0,120}?tx\('v\.delN', \{ n \}\)/.test(js));
ok('bar title follows language switch', /if \(S\.bulkMode\) updateBulkCount\(\); \/\/ v1\.5\.141/.test(js));

// ── Safety rails untouched ──
ok('session-only filter intact', /S\.sessionGenCodes\.has\(vCode\(v\)\)/.test(js));
ok('confirm dialog intact', /del\.confirmBulkNew/.test(js));
ok('no-new toast intact', /del\.noNew/.test(js));

// ── i18n ──
for (const k of ['v.delN', 'v.deleting', 'v.deleted']) {
  const m = js.match(new RegExp("'" + k.replace(/\./g, '\\.') + "': \\{ my: '([^']*)', en: '([^']*)' \\}"));
  ok('i18n ' + k + ' both languages', !!m && m[1].length > 0 && m[2].length > 0);
}

// ── CSS: premium bar + explicit tablet separation ──
ok('bar is purple gradient', /\.pdel-bar \{[^}]*linear-gradient\(135deg, #7C5CFF, #5E5CE6\)/.test(css));
ok('disabled bar is grey', /\.pdel-bar:disabled \{[^}]*background: var\(--fill-bg\)/.test(css));
ok('bar has press feedback', /\.pdel-bar:not\(:disabled\):active \{[^}]*scale\(\.98\)/.test(css));
ok('tablet Auto-on-wide override exists',
  /@media \(min-width: 768px\)[\s\S]{0,300}?html:not\(\[data-layout="phone"\]\) \.pdel-bar \{/.test(css));
ok('tablet forced-layout override exists', /html\[data-layout="tablet"\] \.pdel-bar \{/.test(css));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15141: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

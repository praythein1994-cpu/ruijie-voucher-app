/* v1.5.139: premium download ring — circular progress (video reference)
 * shown in Settings → App Update while the APK downloads: ring fills,
 * % pill below, green check on completion. */
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── HTML ──
ok('ring widget exists, hidden by default', /class="upd-dl" id="upd-dl" hidden/.test(html));
ok('widget has ring svg + fg circle id', /id="upd-ring-fg"/.test(html));
ok('widget has icon slot', /id="upd-ring-icon"/.test(html));
ok('widget has % pill', /id="upd-dl-pct"/.test(html));
ok('widget has label', /id="upd-dl-label"/.test(html));
ok('ring uses gradient stroke', /id="updRingGrad"/.test(html));
ok('widget sits inside upd-card', /id="upd-card"[\s\S]{0,2500}?id="upd-dl"/.test(html));

// ── Ring math: 2πr, r = 30 → 188.495… ──
const C = 2 * Math.PI * 30;
ok('circumference constant matches 2πr', Math.abs(C - 188.5) < 0.01);
ok('UPD_RING_C = 188.5 in JS', /const UPD_RING_C = 188\.5;/.test(js));
ok('CSS dasharray = 188.5', /\.upd-ring-fg \{[\s\S]{0,300}?stroke-dasharray: 188\.5;/.test(js) ||
  /\.upd-ring-fg \{[\s\S]{0,300}?stroke-dasharray: 188\.5;/.test(css));

// ── JS functions ──
for (const f of ['updDlShow', 'updDlProgress', 'updDlDone', 'updDlHide']) {
  ok('function ' + f + ' exists', new RegExp('function ' + f + '\\(').test(js));
}
ok('progress clamps to 0..100',
  /Math\.min\(100, Math\.max\(0, p\)\)/.test(js));
ok('done state turns ring green', /upd-ring-fg[\s\S]{0,80}?classList\.add\('done'\)/.test(js));
ok('done state swaps icon to check', /#i-check/.test(js) && /updDlDone\(\)[\s\S]{0,400}?i-check/.test(js));
ok('done state auto-hides after celebration', /updDlDone\(\)[\s\S]{0,600}?setTimeout\(\(\) => updDlHide\(\), 1600\)/.test(js));
ok('done re-shows widget for the celebration', /updDlDone\(\)[\s\S]{0,200}?hidden = false/.test(js));
ok('icon markup is static (no user data in innerHTML)',
  !/upd-ring-icon[\s\S]{0,120}?\+ *(tag|rel|p)\b/.test(js));

// ── Hooks ──
ok('download start shows the ring', /updStartDownload\(rel, silent\)[\s\S]{0,500}?updDlShow\(rel\.tag\)/.test(js));
ok('poll tick drives the ring', /updPollDownload[\s\S]{0,700}?updDlProgress\(p\)/.test(js));
ok('download-done triggers celebration', /updOnDownloadDone\(rel, ok, id\)[\s\S]{0,600}?updDlDone\(\)/.test(js));
ok('download fail hides the ring', /updOnDownloadDone\(rel, ok, id\)[\s\S]{0,900}?else \{[\s\S]{0,200}?updDlHide\(\)/.test(js));
ok('waiting state shows ring on Settings open',
  /'waiting'[\s\S]{0,400}?updDlShow\(/.test(js));
ok('non-waiting state hides ring', /\} else \{\s*updDlHide\(\); \/\/ v1\.5\.139/.test(js));

// ── CSS: phone-first base + explicit tablet separation ──
ok('phone base: widget stacked column', /\.upd-dl \{\s*display: flex;\s*flex-direction: column;/.test(css));
ok('phone base: hidden wins over flex', /\.upd-dl\[hidden\] \{ display: none;/.test(css));
ok('phone base: ring rotated to start at top', /\.upd-ring svg \{[^}]*transform: rotate\(-90deg\);/.test(css));
ok('phone base: smooth ring transition', /transition: stroke-dashoffset \.3s ease;/.test(css));
ok('phone base: % pill style', /\.upd-dl-pct \{[\s\S]{0,200}?border-radius: 999px;/.test(css));
ok('tablet Auto-on-wide override exists',
  /@media \(min-width: 768px\)[\s\S]{0,300}?html:not\(\[data-layout="phone"\]\) \.upd-dl \{/.test(css));
ok('tablet forced-layout override exists',
  /html\[data-layout="tablet"\] \.upd-dl \{/.test(css));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15139: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

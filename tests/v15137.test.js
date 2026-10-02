/* v1.5.137: UPDATE Ready card — auto-downloaded update shows version,
 * an expandable (collapsed-by-default) "what's new" section, and an
 * Update Now button. Notes must never be injected as HTML. */
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── HTML structure ──
ok('ready card keeps upd-install-row id', /id="upd-install-row"/.test(html));
ok('card has UPDATE Ready title', /data-i18n="upd\.readyTitle"/.test(html));
ok('card has version line id', /id="upd-ready-ver"/.test(html));
ok('whats-new is a collapsed details (no open attr)',
  /<details class="upd-ready-details">/.test(html));
ok('details summary has whatsNew i18n', /data-i18n="upd\.whatsNew"/.test(html));
ok('notes container has upd-ready-notes id', /id="upd-ready-notes"/.test(html));
ok('Update Now button keeps upd-install-btn id',
  /id="upd-install-btn"[\s\S]{0,80}?upd\.updateNow/.test(html));
ok('Update Now button is primary big',
  /class="btn primary big" id="upd-install-btn"/.test(html));
ok('old install sub-line removed', !/upd-install-sub/.test(html));

// ── Release notes plumbing ──
ok('updLatestRelease captures release body',
  /notes: String\(j\.body \|\| ''\)\.trim\(\)/.test(js));
ok('download-done persists notes',
  /updPendingSave\(\{ id, tag: rel\.tag, name: rel\.name, notes: rel\.notes \|\| '' \}\)/.test(js));
ok('early persist (restart-resume) keeps notes',
  /updPendingSave\(\{ id: r\.id, tag: rel\.tag, name: rel\.name, notes: rel\.notes \|\| '' \}\)/.test(js));
ok('resume path passes notes through',
  /updOnDownloadDone\(\{ tag: p\.tag, name: p\.name, notes: p\.notes \}/.test(js));

// ── Notes rendered as text, never HTML ──
ok('version set via textContent', /\$\('upd-ready-ver'\)[\s\S]{0,120}?\.textContent/.test(js));
ok('notes set via textContent', /\$\('upd-ready-notes'\)[\s\S]{0,120}?\.textContent/.test(js));
ok('notes never injected as innerHTML', !/upd-ready-notes[\s\S]{0,60}?innerHTML/.test(js));

// ── i18n (both languages) ──
for (const k of ['upd.readyTitle', 'upd.whatsNew', 'upd.updateNow', 'upd.noNotes']) {
  const m = js.match(new RegExp("'" + k.replace(/\./g, '\\.') + "': \\{ my: '([^']*)', en: (?:'([^']*)'|\"([^\"]*)\") \\}"));
  ok('i18n ' + k + ' defined', !!m);
  const myT = m && m[1], enT = m && (m[2] || m[3]);
  ok('i18n ' + k + ' has Burmese/English text', !!m && myT.length > 0 && enT.length > 0);
}

// ── CSS: phone-first base + explicit tablet separation ──
ok('phone base: card style', /\.upd-ready \{\s*background: var\(--fill-bg\);/.test(css));
ok('phone base: notes scrollable with cap', /\.upd-ready-notes \{[\s\S]{0,300}?max-height: 180px;/.test(css));
ok('phone base: notes preserve line breaks', /white-space: pre-wrap;/.test(css));
ok('phone base: Update Now full width', /\.upd-ready \.btn\.big \{ width: 100%;/.test(css));
ok('phone base: chevron rotates on open',
  /\.upd-ready-details\[open\] summary \.ic \{ transform: rotate\(180deg\);/.test(css));
ok('tablet Auto-on-wide override exists',
  /@media \(min-width: 768px\)[\s\S]{0,300}?html:not\(\[data-layout="phone"\]\) \.upd-ready \{ padding: 18px;/.test(css));
ok('tablet forced-layout override exists',
  /html\[data-layout="tablet"\] \.upd-ready \{ padding: 18px;/.test(css));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15137: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

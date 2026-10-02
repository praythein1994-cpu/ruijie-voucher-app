/* v1.5.142: login auto-expand morph — the login card blooms from a small
 * pill (showing the action label) every time a login screen appears. */
'use strict';
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── JS ──
ok('playLoginMorph exists', /function playLoginMorph\(card, pillKey\)/.test(js));
ok('pill label comes from i18n', /card\.dataset\.pill = t\(pillKey\)/.test(js));
ok('collapsed state committed before animating', /void card\.offsetWidth/.test(js));
ok('pill holds ~300ms then blooms', /setTimeout\(\(\) => \{\s*card\.classList\.remove\('morph-collapsed'\);/.test(js));
ok('children stay clipped while blooming',
  /card\.classList\.add\('morph-open'\)/.test(js));
ok('clip released after bloom', /setTimeout\(\(\) => card\.classList\.remove\('morph-open'\), 750\)/.test(js));

// ── Hooks: every login screen shows the morph ──
ok('profile gate morphs', /showProfileGate\(\)[\s\S]{0,500}?playLoginMorph\(document\.querySelector\('#view-profile \.connect-card'\), 'pf\.login'\)/.test(js));
ok('profile form morphs', /playLoginMorph\(document\.querySelector\('#view-profile-new \.connect-card'\), 'pf\.create'\)/.test(js));
ok('manual connect morphs', /playLoginMorph\(document\.querySelector\('#view-connect \.connect-card'\), 'connect\.btn'\)/.test(js));

// ── CSS ──
ok('card has morph transition', /\.connect-card \{[\s\S]{0,600}?transition: max-height \.65s var\(--spring\), border-radius/.test(css));
ok('collapsed = pill shape', /\.connect-card\.morph-collapsed \{[\s\S]{0,200}?border-radius: 999px;/.test(css));
ok('collapsed clips children', /\.connect-card\.morph-collapsed \{[\s\S]{0,200}?overflow: hidden;/.test(css));
ok('collapsed hides children', /\.connect-card\.morph-collapsed > \* \{[^}]*opacity: 0;/.test(css));
ok('pill label via data-pill', /\.connect-card::after \{[\s\S]{0,200}?content: attr\(data-pill\);/.test(css));
ok('pill label only when collapsed', /\.connect-card\.morph-collapsed::after \{[^}]*opacity: 1;/.test(css));
ok('orb fades while pill', /\.connect-card\.morph-collapsed::before \{[^}]*opacity: 0;/.test(css));
ok('old cardin entrance removed', !/animation: cardin/.test(css) && !/@keyframes cardin/.test(css));
ok('orb float kept', /@keyframes orbfloat/.test(css));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15142: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

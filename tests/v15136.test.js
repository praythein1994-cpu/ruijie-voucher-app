/* v1.5.136: APP UPDATE buttons fit the phone layout; phone and tablet
 * layouts are explicitly separated (user rule: every UI change must
 * separate phone vs tablet, otherwise the same fix repeats). */
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// Both action rows carry the phone/tablet hook class
ok('check row has upd-action', /class="set-row upd-action"[\s\S]{0,200}?upd-check-btn/.test(html));
ok('install row has upd-action', /class="set-row upd-action" id="upd-install-row"/.test(html));
// The toggle row must NOT stack — switch stays inline on the same line
ok('auto-download toggle row untouched',
  !/upd-action[\s\S]{0,300}?upd-auto/.test(html.split('upd-card')[1].split('upd-install-row')[0]));

// Phone-first base: stacked, button full-width on its own line, no wrap
ok('phone base wraps the row', /#upd-card \.set-row\.upd-action \{ flex-wrap: wrap; \}/.test(css));
ok('phone base: label full width',
  /#upd-card \.set-row\.upd-action > \.t \{ flex: 1 1 100%;/.test(css));
ok('phone base: button full width, single line',
  /#upd-card \.set-row\.upd-action \.btn\.small \{ flex: 1 1 100%; white-space: nowrap; \}/.test(css));

// Tablet separated explicitly: Auto-on-wide + forced tablet, side-by-side
ok('tablet Auto-on-wide override exists',
  /@media \(min-width: 768px\)[\s\S]{0,400}?html:not\(\[data-layout="phone"\]\) #upd-card \.set-row\.upd-action \{ flex-wrap: nowrap;/.test(css));
ok('tablet forced-layout override exists',
  /html\[data-layout="tablet"\] #upd-card \.set-row\.upd-action \{ flex-wrap: nowrap;/.test(css));
ok('tablet: label flexes, button auto width',
  /html\[data-layout="tablet"\] #upd-card \.set-row\.upd-action > \.t \{ flex: 1 1 auto;/.test(css)
  && /html\[data-layout="tablet"\] #upd-card \.set-row\.upd-action \.btn\.small \{ flex: 0 0 auto;/.test(css));

const failed = results.filter(r => !r[1]);
failed.forEach(([n]) => console.log('FAIL:', n));
console.log(`v15136.test.js: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);

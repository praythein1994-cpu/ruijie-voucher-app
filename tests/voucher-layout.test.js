/* v1.5.102: Voucher page layout (user-marked screenshot 2026-10-01 ~19:15).
 *  1. No gap between stat-grid and the filter chips (they stick together).
 *  2. "1684 total" (voucher-count) and "Updated ..." (voucher-fetched) share
 *     one line, left-right.
 *  3. The "Expiring soon" banner is REMOVED entirely.
 *  4. Select button on the left, "More" text button (was "...") on the right,
 *     one line; the More menu still holds Delete Expired Vouchers + Reset.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

const dom = new JSDOM(html);
const d = dom.window.document;

// 1. stat-grid has no bottom margin; chips toolbar has no top padding (stuck together)
const sg = css.match(/\.stat-grid\s*\{[^}]*\}/)[0];
ok('stat-grid margin-bottom is 0', /margin-bottom:\s*0/.test(sg));
const tb = css.match(/\.toolbar\s*\{[^}]*\}/)[0];
ok('toolbar has no top padding', /padding:\s*0\s+0\s+7px/.test(tb));

// 2. voucher-count + voucher-fetched are siblings in one row
const count = d.getElementById('voucher-count');
const fetched = d.getElementById('voucher-fetched');
ok('voucher-count exists', !!count);
ok('voucher-fetched exists', !!fetched);
ok('count and fetched share one row', count && fetched && count.parentElement === fetched.parentElement);
ok('count is left of fetched', count && fetched &&
  Array.from(count.parentElement.children).indexOf(count) <
  Array.from(count.parentElement.children).indexOf(fetched));

// 3. Expiring-soon banner is gone
ok('no expBanner in renderVouchers', !/expBanner/.test(appJs));
ok('no data-expiring markup in app.js', !/data-expiring/.test(appJs));

// 4. Select left, "More" text button right, one row; menu intact
const sel = d.getElementById('btn-bulk-select');
const more = d.getElementById('btn-voucher-more');
const menu = d.getElementById('voucher-more-menu');
ok('select button exists', !!sel);
ok('more button exists', !!more);
ok('more button says More (not ...)', more && more.textContent.trim() === 'More');
ok('select and more share one row', sel && more && sel.parentElement === more.parentElement);
ok('select is left of more', sel && more &&
  Array.from(sel.parentElement.children).indexOf(sel) <
  Array.from(sel.parentElement.children).indexOf(more));
ok('menu still has Delete Expired Vouchers', !!d.getElementById('btn-del-expired'));
ok('menu still has Reset', !!d.getElementById('btn-reset-selected'));
ok('menu is child of the select/more row', menu && sel && menu.parentElement === sel.parentElement);
ok('action row has voucher-actions class', sel && sel.parentElement.classList.contains('voucher-actions'));
ok('voucher-actions buttons do not stretch', /\.voucher-actions\s+\.btn\s*\{\s*flex:\s*none/.test(css));

const failed = results.filter(r => !r[1]);
for (const [name, passed] of results) if (!passed) console.log('FAIL:', name);
console.log(`voucher-layout: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

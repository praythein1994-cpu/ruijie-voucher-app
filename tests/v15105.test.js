/* v1.5.105: user requests 2026-10-01 ~20:15.
 *  1. Select & More buttons identical size in phone view
 *     (replaces old fix4 that made Select smaller).
 *  2. "1684 total" (voucher-count) + "Updated ..." (voucher-fetched) share
 *     one line with the same baseline (no vertical misalignment).
 *  3. Online Clients: "Blocked" filter chip next to "Other" (unknown),
 *     showing phones whose MAC is in the local blocklist.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// 1. Select & More identical size
ok('voucher-actions .btn has min-height', /\.voucher-actions \.btn\s*\{[^}]*min-height:\s*38px/.test(css));
ok('voucher-actions .btn font-size 14px', /\.voucher-actions \.btn\s*\{[^}]*font-size:\s*14px/.test(css));
ok('voucher-actions .btn inline-flex centered', /\.voucher-actions \.btn\s*\{[^}]*display:\s*inline-flex/.test(css));
ok('#btn-bulk-select matches More size', /#btn-bulk-select\s*\{[^}]*font-size:\s*14px/.test(css));
ok('old fix4 smaller-select rule is gone', !/#btn-bulk-select\s*\{\s*padding:\s*5px 10px;\s*font-size:\s*12px/.test(css));

// 2. count + fetched same baseline
ok('voucher-count/fetch line-height set', /#voucher-count,\s*#voucher-fetched\s*\{[^}]*line-height:\s*1\.5/.test(css));
ok('voucher-count/fetch no margin', /#voucher-count,\s*#voucher-fetched\s*\{[^}]*margin:\s*0/.test(css));

// 3. Blocked chip in Online Clients
ok('mc.fBlocked i18n key exists', /'mc\.fBlocked':\s*\{\s*my:\s*'[^']*',\s*en:\s*'Blocked'\s*\}/.test(appJs));
ok('blocked chip rendered after unknown', /CSTS\.map\(s => seg\(s, t\(CST_META\[s\]\.key\), counts\[s\]\)\)\.join\(''\)\s*\+\s*\n?\s*seg\('blocked',\s*t\('mc\.fBlocked'\),\s*blockedCount\)/.test(appJs));
ok('blockedCount counts the deny-list (local + portal union)', /blockedCount = getBlockedMacList\(\)\.length/.test(appJs));
ok('blocked tab renders the deny-list (not an online-client filter)',
  /getBlockedMacList\(\)\.forEach/.test(appJs)
  && /st\.blockedMacs/.test(appJs) && /S\.portalBlockedMacs/.test(appJs));
ok('blocked chip counts the deny-list',
  /blockedCount = getBlockedMacList\(\)\.length/.test(appJs));

const failed = results.filter(r => !r[1]);
for (const [name, passed] of results) if (!passed) console.log('FAIL:', name);
console.log(`v1.5.105: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

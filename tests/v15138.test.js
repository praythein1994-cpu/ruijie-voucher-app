/* v1.5.138: live update banner + auto-detect. A slim banner appears under
 * the header when a new release is detected (quiet check at startup, every
 * 30 min, and on foreground return); tapping it jumps to Settings →
 * App Update. Auto-download toggle still gates the background download. */
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

// ── HTML ──
ok('banner exists inside main', /<main id="main">[\s\S]{0,400}?id="upd-banner"/.test(html));
ok('banner hidden by default', /id="upd-banner" class="upd-banner" hidden/.test(html));
ok('banner has text span', /id="upd-banner-text"/.test(html));
ok('banner has dismiss button', /id="upd-banner-x"/.test(html));
ok('banner has live dot', /class="upd-banner-dot"/.test(html));
ok('banner has chevron', /upd-banner[\s\S]{0,600}?#i-chev-r/.test(html));

// ── JS functions ──
for (const f of ['updBannerShow', 'updBannerHide', 'updBannerDismiss', 'updBannerGo',
                 'updCheckBanner', 'updWatchTick', 'updWatchStart']) {
  ok('function ' + f + ' exists', new RegExp('function ' + f + '\\(').test(js));
}

// ── Banner behavior ──
ok('banner text uses tx() with {v}', /tx\('upd\.banner(New|Ready)', \{ v: tag \}\)/.test(js));
ok('banner text set via textContent (no HTML)',
  /upd-banner-text'\)[\s\S]{0,200}?\.textContent/.test(js) && !/upd-banner-text[\s\S]{0,80}?innerHTML/.test(js));
ok('dismiss recorded in sessionStorage', /sessionStorage\.setItem\('updBannerOff'/.test(js));
ok('ready banner bypasses dismiss', /if \(!ready && sessionStorage\.getItem\('updBannerOff'\)/.test(js));
ok('tap goes to settings view', /updBannerGo\(\)[\s\S]{0,300}?switchView\('view-settings'\)/.test(js));
ok('tap scrolls to the update card', /updBannerGo\(\)[\s\S]{0,600}?scrollIntoView/.test(js));
ok('tap flashes the update card', /upd-flash/.test(js) && /classList\.add\('upd-flash'\)/.test(js));
ok('banner click wired in init', /\$\('upd-banner'\)[\s\S]{0,120}?addEventListener\('click'/.test(js));
ok('dismiss click stops propagation', /\$\('upd-banner-x'\)[\s\S]{0,160}?stopPropagation/.test(js));

// ── Auto-detect watcher ──
ok('watch interval is 30 minutes', /UPD_WATCH_MS = 30 \* 60 \* 1000/.test(js));
ok('first tick ~8s after start', /setTimeout\(\(\) => \{ try \{ updWatchTick\(\); \} catch \(e\) \{\} \}, 8000\)/.test(js));
ok('tick repeats on the 30-min interval', /setInterval\(\(\) => \{ try \{ updWatchTick\(\);/.test(js));
ok('foreground return re-checks when stale',
  /visibilitychange[\s\S]{0,200}?updLastWatch/.test(js));
ok('watcher starts for every APK build (toggle-independent)',
  /if \(B\) updWatchStart\(\);/.test(js));
ok('auto mode reuses checkAppUpdate(false)', /updateAutoDl[\s\S]{0,80}?checkAppUpdate\(false\)/.test(js));
ok('checkAppUpdate returns state+tag', /return \{ state: 'started', tag: rel\.tag \}/.test(js));
ok('watcher shows banner from returned tag', /r\.tag[\s\S]{0,40}?updBannerShow\(r\.tag, false\)/.test(js));
ok('download-done upgrades banner to UPDATE Ready',
  /updOnDownloadDone[\s\S]{0,500}?updBannerShow\(rel\.tag, true\)/.test(js));

// ── i18n ──
for (const k of ['upd.bannerNew', 'upd.bannerReady']) {
  const m = js.match(new RegExp("'" + k.replace(/\./g, '\\.') + "': \\{ my: '([^']*)', en: '([^']*)' \\}"));
  ok('i18n ' + k + ' defined with {v}', !!m && /\{v\}/.test(m[1]) && /\{v\}/.test(m[2]));
}

// ── CSS: phone-first base + explicit tablet separation ──
ok('phone base: banner style', /\.upd-banner \{\s*display: flex;/.test(css));
ok('phone base: hidden wins over flex', /\.upd-banner\[hidden\] \{ display: none;/.test(css));
ok('phone base: live pulse animation', /@keyframes updPulse/.test(css));
ok('phone base: flash keyframes', /@keyframes updFlash/.test(css));
ok('phone base: text truncates in one line', /\.upd-banner-text \{[\s\S]{0,200}?text-overflow: ellipsis;/.test(css));
ok('tablet Auto-on-wide override exists',
  /@media \(min-width: 768px\)[\s\S]{0,300}?html:not\(\[data-layout="phone"\]\) \.upd-banner \{/.test(css));
ok('tablet forced-layout override exists',
  /html\[data-layout="tablet"\] \.upd-banner \{/.test(css));

// ── Report ──
let fails = 0;
for (const [name, pass] of results) {
  if (!pass) { fails++; console.log('FAIL:', name); }
}
console.log(`v15138: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);

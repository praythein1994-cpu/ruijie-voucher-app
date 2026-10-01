/** Fix1–Fix6 verification (2026-10-01): static checks on real source files. */
const fs = require('fs');
const path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.log('  FAIL:', label); }
}

const html = R('index.html'), css = R('css/styles.css'), app = R('js/app.js'),
      api = R('js/api.js'), cover = R('sso-cover/sso-cover.js'),
      coverAsset = R('android/app/src/main/assets/www/sso-cover/sso-cover.js'),
      sso = R('android/app/src/main/java/com/ruijie/voucher/SsoSession.java'),
      bridge = R('android/app/src/main/java/com/ruijie/voucher/SsoCoverBridge.java'),
      rb = R('android/app/src/main/java/com/ruijie/voucher/RuijieBridge.java');

// ── Fix1: web overlay ──
ok(html.includes('id="ios-loading"'), 'fix1: #ios-loading overlay exists in index.html');
ok(html.includes('class="ios-loading hidden"'), 'fix1: overlay hidden by default');
ok((html.match(/<div id="ios-loading"[\s\S]*?<\/div>\s*<\/div>/) || [''])[0].split('<span>').length === 13,
   'fix1: overlay has 12 spinner bars');
ok(api.includes('function showIosLoading()'), 'fix1: showIosLoading defined in api.js');
ok(api.includes('function hideIosLoading()'), 'fix1: hideIosLoading defined in api.js');
ok(/window\._ssoEvent = \(name\) => \{\s*\n?\s*hideIosLoading\(\)/.test(api), 'fix1: _ssoEvent hides overlay');
ok(css.includes('.ios-loading'), 'fix1: .ios-loading CSS exists');
ok(css.includes('.ios-spinner span:nth-child(12)'), 'fix1: 12 spinner bars styled');
ok(css.includes('@keyframes ios-spin'), 'fix1: ios-spin keyframes exist');
ok(app.includes('ssoLoginSilent'), 'fix1: app.js references ssoLoginSilent');
ok(/ssoLoginWithProfile[\s\S]*?ssoLoginSilent/.test(app), 'fix1: ssoLoginWithProfile uses silent');
ok(/maybeSsoAutoLogin[\s\S]*?ssoLoginSilent/.test(app), 'fix1: maybeSsoAutoLogin uses silent');
ok(/function onSsoButton[\s\S]*?window\.RuijieBridge\.ssoLogin\(\)/.test(app) &&
   /function onSsoSwitch[\s\S]*?window\.RuijieBridge\.ssoLogin\(\)/.test(app),
   'fix1: manual Settings login still uses visible ssoLogin');

// ── Fix1: native ──
ok(sso.includes('showLoginDialog(Activity activity, boolean silent, LoginCallback cb)'),
   'fix1: SsoSession has silent overload');
ok(sso.includes('lp.alpha = 0f'), 'fix1: SsoSession hides window via alpha 0');
ok(sso.includes('final Runnable reveal'), 'fix1: SsoSession has reveal runnable');
ok(sso.includes('prefs.put("silent", silent)'), 'fix1: silent flag passed to cover prefs');
ok(bridge.includes('public void needsAttention()'), 'fix1: SsoCoverBridge.needsAttention exists');
ok(bridge.includes('onReveal.run()'), 'fix1: needsAttention triggers reveal');
ok(rb.includes('public void ssoLoginSilent()'), 'fix1: RuijieBridge.ssoLoginSilent exists');
ok(rb.includes('showLoginDialog(activity, true,'), 'fix1: ssoLoginSilent passes silent=true');

// ── Fix1: cover JS ──
ok(cover.includes('function attention()'), 'fix1: cover attention() helper exists');
ok(cover.includes('b.needsAttention()'), 'fix1: attention() calls needsAttention');
ok(/function showError\(msg\)[\s\S]{0,200}attention\(\)/.test(cover), 'fix1: showError calls attention');
ok(/function showCaptcha[\s\S]{0,700}attention\(\); \/\/ fix1/.test(cover), 'fix1: showCaptcha calls attention');
ok(/function showTwoFa[\s\S]{0,400}attention\(\); \/\/ fix1/.test(cover), 'fix1: showTwoFa calls attention');
ok(cover === coverAsset, 'fix1: android asset copy of sso-cover.js is in sync');

// ── Fix2: generate compact ──
for (const sel of ['#view-generate .fld-label', '#view-generate .section-title',
    '#view-generate .btn { font-size: 13px', '#view-generate .btn .ic',
    '#view-generate .segmented button', '#view-generate .codetype b',
    '#view-generate .qty-grid button', '#view-generate .code-list',
    '#view-generate .api-note', '#view-generate .printer-line .ic']) {
  ok(css.includes(sel), 'fix2: CSS has ' + sel);
}
ok(/#view-generate \.btn \.ic \{[^}]*width: 16px/.test(css), 'fix2: generate button icons 16px');

// ── Fix3: menu items removed ──
ok(!html.includes('data-more="accounts"'), 'fix3: Auth Accounts menu item removed');
ok(!html.includes('data-more="networks"'), 'fix3: Networks menu item removed');
ok(html.includes('data-more="usergroups"') && html.includes('data-more="sales"'),
   'fix3: other menu items intact');

// ── Fix4 (SUPERSEDED v1.5.105): Select & More buttons now IDENTICAL size ──
// v1.5.105 user request: "More နဲ့ Select က icon size မတူဘူး phone view မှာ fix"
// Both buttons share .voucher-actions .btn with identical padding/font-size.
ok(/\.voucher-actions \.btn \{[^}]*font-size: 14px/.test(css), 'v1.5.105: .voucher-actions .btn font-size 14px');
ok(/\.voucher-actions \.btn \{[^}]*min-height: 38px/.test(css), 'v1.5.105: .voucher-actions .btn min-height 38px');
ok(/#btn-bulk-select \{[^}]*font-size: 14px/.test(css), 'v1.5.105: #btn-bulk-select font-size 14px (same as More)');

// ── Fix5: account info spacing + tenant ──
ok(/\.kv \{[^}]*margin: 0/.test(css), 'fix5: .kv margin 0 kills dl gaps');
ok(app.includes("const tenant = info.tenantId || info.defaultTenantId || '';"),
   'fix5: tenant extracted to var');
ok(app.includes('${tenant ?'), 'fix5: tenant row conditional');
ok(!/ai\.tenant.*'—'/.test(app), 'fix5: no tenant dash fallback');

// ── Fix6: big Settings title removed ──
ok(!/id="view-settings"[\s\S]{0,120}large-title/.test(html), 'fix6: no large-title in settings view');
ok(html.includes('id="view-settings"'), 'fix6: settings view still exists');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

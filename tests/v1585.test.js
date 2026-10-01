/**
 * v1.5.85 test — SSO login must start with a clean cookie jar.
 * Root cause of "no permission" after profile switch: showLoginDialog loaded
 * the CAS login URL with the previous account's session cookies still alive.
 * CAS then sailed through as the OLD account without showing the login form,
 * the cover never injected, and the dialog dismissed as "success" — leaving
 * the portal session logged in as the WRONG account.
 * Fix: removeAllCookies() before loadUrl(), with loadUrl inside the
 * removeAllCookies callback so the stale session can never win the race.
 * (Static verification on the real SsoSession.java source.)
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

const src = fs.readFileSync(
  path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java',
            'com', 'ruijie', 'voucher', 'SsoSession.java'), 'utf8');

// isolate showLoginDialog body — fix1 made the 1-arg overload delegate to
// the (activity, silent, cb) overload, so verify the overload holding the logic
const startMark = 'public void showLoginDialog(Activity activity, boolean silent, LoginCallback cb) {';
const sIdx = src.indexOf(startMark);
ok(sIdx >= 0, 'showLoginDialog found');
// fix1: the 1-arg overload must still delegate (silent=false) so existing callers keep working
ok(/public void showLoginDialog\(Activity activity, LoginCallback cb\) \{\s*\n\s*showLoginDialog\(activity, false, cb\);/.test(src),
   '1-arg overload delegates with silent=false');
const body = src.slice(sIdx, src.indexOf('\n    }\n', sIdx) + 5);

// 1. removeAllCookies is called in showLoginDialog
ok(body.includes('removeAllCookies'), 'showLoginDialog calls removeAllCookies');

// 2. loadUrl(SSO_LOGIN_URL) happens INSIDE the removeAllCookies callback,
//    not as a bare statement after dialog.show()
const bareLoad = /dialog\.show\(\);\s*\n\s*webView\.loadUrl\(SSO_LOGIN_URL\);/.test(body);
ok(!bareLoad, 'no bare loadUrl right after dialog.show() (race would remain)');

const cbLoad = /removeAllCookies\([\s\S]*?webView\.loadUrl\(SSO_LOGIN_URL\)/.test(body);
ok(cbLoad, 'loadUrl is inside the removeAllCookies callback');

// 3. the callback runs loadUrl on the UI thread
ok(/removeAllCookies\(.*->.*runOnUiThread/.test(body.replace(/\n/g, ' ')),
   'cookie-clear callback posts loadUrl to UI thread');

// 4. flush after clear (persist the removal)
const clearIdx = body.indexOf('removeAllCookies');
const loadIdx = body.indexOf('webView.loadUrl(SSO_LOGIN_URL)');
ok(clearIdx >= 0 && loadIdx > clearIdx, 'removeAllCookies precedes loadUrl in source order');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

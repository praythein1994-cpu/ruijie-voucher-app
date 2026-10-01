/**
 * v1.5.82 test — ssoLoginWithProfile (real code extracted from js/app.js).
 * After a named-profile login the app must stash the profile's portal creds,
 * enable auto-login, and open the SSO dialog so the injected cover
 * auto-submits — the user never taps Sign In manually.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

/* ── extract the REAL function from js/app.js ────────── */
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const startMark = 'function ssoLoginWithProfile(profile) {';
const startIdx = appSrc.indexOf(startMark);
if (startIdx < 0) { console.log('  FAIL ssoLoginWithProfile not found in js/app.js'); process.exit(1); }
const endIdx = appSrc.indexOf('\n}\n', startIdx);
const fnSrc = appSrc.slice(startIdx, endIdx + 3); // include closing "}\n"

/* mock hasBridge exactly like js/api.js */
function makeBridge(methods) {
  const calls = [];
  const bridge = { apiCall() {} };
  for (const m of methods) bridge[m] = (...a) => { calls.push([m, ...a]); };
  return { bridge, calls };
}
function loadFn(bridge) {
  const hasBridge = () => !!(global.window.RuijieBridge && global.window.RuijieBridge.apiCall);
  global.window = { RuijieBridge: bridge };
  // fix1: ssoLoginWithProfile now calls the api.js iOS-loading helpers —
  // in production index.html loads api.js before app.js, so mirror that here
  const showIosLoading = () => { global.__iosLoadingShown = true; };
  const hideIosLoading = () => { global.__iosLoadingShown = false; };
  const factory = new Function('hasBridge', 'window', 'showIosLoading', 'hideIosLoading',
    fnSrc + '\n;return ssoLoginWithProfile;');
  return { fn: factory(hasBridge, global.window, showIosLoading, hideIosLoading) };
}

/* 1: full bridge — save creds, enable auto-login, open dialog, in order */
{
  const { bridge, calls } = makeBridge(['ssoSaveCreds', 'ssoSetAutoLogin', 'ssoLogin']);
  const { fn } = loadFn(bridge);
  const r = fn({ email: 'myint2moe2025@gmail.com', password: 'secretpw' });
  ok(r === true, 'returns true on full bridge');
  ok(calls.length === 3, 'three bridge calls, got ' + calls.length);
  ok(calls[0][0] === 'ssoSaveCreds' && calls[0][1] === 'myint2moe2025@gmail.com' && calls[0][2] === 'secretpw',
    'ssoSaveCreds(email, password) first');
  ok(calls[1][0] === 'ssoSetAutoLogin' && calls[1][1] === true, 'ssoSetAutoLogin(true) second');
  ok(calls[2][0] === 'ssoLogin', 'ssoLogin() third');
}

/* 2: empty password -> saved as '' */
{
  const { bridge, calls } = makeBridge(['ssoSaveCreds', 'ssoSetAutoLogin', 'ssoLogin']);
  const { fn } = loadFn(bridge);
  fn({ email: 'a@b.com' });
  ok(calls[0][2] === '', 'missing password saved as empty string');
}

/* 3: old bridge (no ssoSaveCreds/ssoSetAutoLogin) — still opens dialog, no throw */
{
  const { bridge, calls } = makeBridge(['ssoLogin']);
  const { fn } = loadFn(bridge);
  let r, threw = false;
  try { r = fn({ email: 'a@b.com', password: 'p' }); } catch (e) { threw = true; }
  ok(!threw && r === true, 'old bridge: no throw, returns true');
  ok(calls.length === 1 && calls[0][0] === 'ssoLogin', 'old bridge: only ssoLogin called');
}

/* 4: no bridge at all */
{
  const { fn } = loadFn(undefined);
  ok(fn({ email: 'a@b.com', password: 'p' }) === false, 'no bridge -> false');
}

/* 5: bridge without apiCall (hasBridge false) */
{
  const { fn } = loadFn({ ssoLogin() {} });
  ok(fn({ email: 'a@b.com', password: 'p' }) === false, 'no apiCall -> false');
}

/* 6: profile without email */
{
  const { bridge, calls } = makeBridge(['ssoSaveCreds', 'ssoSetAutoLogin', 'ssoLogin']);
  const { fn } = loadFn(bridge);
  ok(fn({ password: 'p' }) === false, 'no email -> false');
  ok(fn(null) === false, 'null profile -> false');
  ok(calls.length === 0, 'no bridge calls without email');
}

/* 7: bridge throws mid-way -> false, exception never escapes */
{
  const { fn } = loadFn({
    apiCall() {},
    ssoSaveCreds() { throw new Error('keystore boom'); },
  });
  let r, threw = false;
  try { r = fn({ email: 'a@b.com', password: 'p' }); } catch (e) { threw = true; }
  ok(!threw && r === false, 'throwing bridge -> false, no escape');
  ok(global.__iosLoadingShown === false, 'loading overlay hidden after failure');
}

/* 8: fix1 — bridge with ssoLoginSilent uses the silent path + iOS loading */
{
  global.__iosLoadingShown = undefined;
  const { bridge, calls } = makeBridge(['ssoSaveCreds', 'ssoSetAutoLogin', 'ssoLoginSilent', 'ssoLogin']);
  const { fn } = loadFn(bridge);
  const r = fn({ email: 'a@b.com', password: 'p' });
  ok(r === true, 'silent bridge -> true');
  ok(global.__iosLoadingShown === true, 'iOS loading overlay shown on silent login');
  ok(calls.some(c => c[0] === 'ssoLoginSilent'), 'ssoLoginSilent called');
  ok(!calls.some(c => c[0] === 'ssoLogin'), 'visible ssoLogin NOT called on silent path');
}

console.log(`v1.5.82 ssoLoginWithProfile: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

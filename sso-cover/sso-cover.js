/* ── SSO glass cover logic (v1.5.52) ──────────────────────────
 * Injected into the official Ruijie CAS login page. The official page
 * keeps running underneath; this cover collects the credentials, fills
 * the OFFICIAL fields (#username / #originalPassword) and clicks the
 * OFFICIAL button (#J_userLogin_btn) so Ruijie's own JS encrypts the
 * password into #password. We never touch #password directly.
 *
 * Entry: window.__ssoCoverInit(prefs) where prefs =
 *   {hasCreds, email, autoLogin, rememberWanted} from SsoCover.getPrefs().
 * The native bridge "SsoCover" is available in the dialog WebView.
 */
(function () {
  'use strict';
  if (window.__ssoCoverUI) return; // already injected

  var $ = function (id) { return document.getElementById(id); };
  var root = $('sso-cover-root');
  if (!root) return;

  var OFFICIAL = { user: '#username', pass: '#originalPassword', go: '#J_userLogin_btn' };
  var lastAttempt = { email: '', password: '' };
  var twoFaMode = 'app';
  var pollTimer = null;
  var failTimer = null;

  function bridge() { return window.SsoCover || null; }

  /* ── cover chrome ─────────────────────────────────────────── */
  function showError(msg) {
    var e = $('sso-cover-error');
    if (!e) return;
    e.textContent = msg;
    e.hidden = false;
  }
  function hideError() {
    var e = $('sso-cover-error');
    if (e) { e.hidden = true; e.textContent = ''; }
  }
  function setBusy(on, label) {
    $('sso-cover-form').hidden = on;
    var b = $('sso-cover-busy');
    b.hidden = !on;
    if (on && label) $('sso-cover-busy-t').textContent = label;
    if (!on) { $('sso-cover-captcha').hidden = true; $('sso-cover-2fa').hidden = true; }
  }
  function visible(el) {
    return !!(el && el.offsetParent !== null);
  }

  /* ── official form driving ──────────────────────────────────
   * Set values through the native setter + input/change events so any
   * framework listening on the official page picks them up. */
  function setNativeValue(el, val) {
    if (!el) return;
    try {
      var proto = Object.getPrototypeOf(el);
      var desc = Object.getOwnPropertyDescriptor(proto, 'value')
        || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (desc && desc.set) desc.set.call(el, val);
      else el.value = val;
    } catch (e) { el.value = val; }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function officialElements() {
    var u = document.querySelector(OFFICIAL.user);
    var p = document.querySelector(OFFICIAL.pass);
    var go = document.querySelector(OFFICIAL.go);
    return (u && p && go) ? { u: u, p: p, go: go } : null;
  }

  /** Fill official fields and click the official button. extra.captcha fills the captcha field first. */
  function officialSubmit(email, password, extra) {
    var o = officialElements();
    if (!o) {
      setBusy(false);
      showError('Official login form not found — please use the official page.');
      return false;
    }
    hideError();
    setNativeValue(o.u, email);
    setNativeValue(o.p, password);
    if (extra && extra.captcha != null) {
      var ci = findCaptchaInput();
      if (ci) setNativeValue(ci, extra.captcha);
    }
    // Give the official page a beat, then click its own button so its JS
    // encrypts the password into #password and submits.
    setTimeout(function () {
      try { o.go.click(); }
      catch (e) { setBusy(false); showError('Could not submit: ' + e); }
      watchForFailure();
    }, 350);
    return true;
  }

  /* ── failure / captcha / 2fa detection ──────────────────────
   * The captcha (#kaptchaImage / verifyCodeServlet.jpeg) and #twoFaView
   * only appear on demand, so everything here is defensive: never throw
   * when the official page does not show them. */
  function findCaptchaImg() {
    try {
      var k = document.querySelector('#kaptchaImage');
      if (k && visible(k)) return k;
      var imgs = document.querySelectorAll('img');
      for (var i = 0; i < imgs.length; i++) {
        var s = (imgs[i].src || '') + ' ' + (imgs[i].id || '') + ' ' + (imgs[i].className || '');
        if (/verifyCodeServlet|captcha|kaptcha/i.test(s) && visible(imgs[i])) return imgs[i];
      }
    } catch (e) {}
    return null;
  }

  function findCaptchaInput() {
    var sels = ['#kaptcha', '#verifyCode', 'input[name*="captcha" i]',
      'input[id*="captcha" i]', 'input[id*="kaptcha" i]', 'input[name*="verifyCode" i]'];
    for (var i = 0; i < sels.length; i++) {
      try {
        var el = document.querySelector(sels[i]);
        if (el && visible(el)) return el;
      } catch (e) {}
    }
    var img = findCaptchaImg();
    if (img) {
      var scope = img.closest('form') || document;
      var inputs = scope.querySelectorAll('input[type="text"], input:not([type])');
      for (var j = 0; j < inputs.length; j++) {
        if (visible(inputs[j]) && inputs[j].id !== 'username') return inputs[j];
      }
    }
    return null;
  }

  function twoFaVisible() {
    try {
      var v = document.querySelector('#twoFaView');
      return visible(v) ? v : null;
    } catch (e) { return null; }
  }

  /** Visible official error text, if the page shows one. */
  function findOfficialError() {
    // '#msg' is the official page's own verified error container
    // (<div class="inputItem errors mssage" id="msg">); the rest are fallbacks.
    var sels = ['#msg', '.error-msg', '.err-msg', '.login-error', '#errorMsg',
      '[class*="error" i]', '[id*="error" i]', '.tips-error', '.el-message--error'];
    for (var i = 0; i < sels.length; i++) {
      var els;
      try { els = document.querySelectorAll(sels[i]); } catch (e) { continue; }
      for (var j = 0; j < els.length; j++) {
        if (!visible(els[j])) continue;
        var t = (els[j].textContent || '').trim().replace(/\s+/g, ' ');
        if (t.length > 3 && t.length < 300 && !/sso-cover/.test(els[j].id || '')) return t;
      }
    }
    return null;
  }

  function onStateCheck() {
    // Still on the SSO login page? (Success navigates away; native dismisses.)
    if (!/sso\/login/.test(location.href) && !/sso\/login/.test(location.pathname)) return;
    var cap = findCaptchaImg();
    if (cap) { showCaptcha(cap); return; }
    if (twoFaVisible()) { showTwoFa(); return; }
    var err = findOfficialError();
    if (err) {
      setBusy(false);
      showError(err);
      clearTimeout(failTimer); failTimer = null;
    }
  }

  function showCaptcha(img) {
    clearTimeout(failTimer); failTimer = null;
    $('sso-cover-form').hidden = true;
    $('sso-cover-busy').hidden = true;
    var box = $('sso-cover-captcha');
    box.hidden = false;
    var ci = $('sso-cover-capimg');
    if (ci.getAttribute('src') !== img.src) ci.src = img.src;
    ci.onclick = function () {
      try { img.click(); } catch (e) {}
      setTimeout(function () {
        var nimg = findCaptchaImg();
        if (nimg) ci.src = nimg.src + (nimg.src.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
      }, 600);
    };
    hideError();
  }

  function showTwoFa() {
    clearTimeout(failTimer); failTimer = null;
    $('sso-cover-form').hidden = true;
    $('sso-cover-busy').hidden = true;
    $('sso-cover-captcha').hidden = true;
    $('sso-cover-2fa').hidden = false;
    hideError();
  }

  function submitTwoFa() {
    var code = ($('sso-cover-2facode').value || '').trim();
    if (!code) { showError('Enter the verification code.'); return; }
    var view = twoFaVisible();
    if (!view) { showError('Verification view not found — use the official page.'); return; }
    try {
      // Mirror the mode tabs if the official view has them.
      if (twoFaMode === 'recovery') {
        var tabs = view.querySelectorAll('button, a, [role="tab"]');
        for (var i = 0; i < tabs.length; i++) {
          if (/recovery/i.test(tabs[i].textContent || '')) { tabs[i].click(); break; }
        }
      }
      var inputs = view.querySelectorAll('input');
      var target = null;
      for (var j = 0; j < inputs.length; j++) { if (visible(inputs[j])) { target = inputs[j]; break; } }
      if (!target) throw new Error('code field not found');
      setNativeValue(target, code);
      var go = view.querySelector('#check2fa') || view.querySelector('button');
      setTimeout(function () { try { go.click(); } catch (e) { showError('Could not verify: ' + e); } }, 300);
      setBusy(true, 'Verifying…');
    } catch (e) { showError('Could not verify: ' + e.message); }
  }

  /** After a submit, if nothing happens for a while, say so instead of spinning forever. */
  function watchForFailure() {
    clearTimeout(failTimer);
    failTimer = setTimeout(function () {
      var cap = findCaptchaImg();
      if (cap || twoFaVisible()) { onStateCheck(); return; } // handled above
      var err = findOfficialError();
      setBusy(false);
      showError(err || 'Login did not complete — check your email/password and try again.');
    }, 15000);
  }

  /* ── sign-in ──────────────────────────────────────────────── */
  function doSignIn(email, password) {
    email = (email || '').trim();
    if (!email || !password) { showError('Enter your email and password.'); return; }
    var b = bridge();
    var remember = $('sso-cover-remember').checked;
    var auto = $('sso-cover-auto').checked;
    if (b) {
      try {
        if (remember) {
          var ok = b.saveCreds(email, password, auto);
          if (!ok) { showError('Could not save credentials on this device.'); return; }
        } else {
          b.setRememberWanted(false);
          try { b.clearCreds(); } catch (e) {}
        }
        b.setRememberWanted(remember);
      } catch (e) { showError('Storage error: ' + e); return; }
    }
    lastAttempt = { email: email, password: password };
    // Never keep the password in the cover field longer than needed.
    $('sso-cover-pass').value = '';
    setBusy(true, 'Signing in…');
    officialSubmit(email, password, null);
  }

  function autoLogin(prefs) {
    var b = bridge();
    var creds = null;
    try { creds = b ? JSON.parse(b.getSavedCreds()) : null; } catch (e) {}
    if (!creds || !creds.email) { setBusy(false); return; }
    lastAttempt = { email: creds.email, password: creds.password };
    setBusy(true, 'Signing in as ' + creds.email + '…');
    officialSubmit(creds.email, creds.password, null);
  }

  /* ── wiring ───────────────────────────────────────────────── */
  function init(prefs) {
    prefs = prefs || {};
    if (prefs.email) $('sso-cover-email').value = prefs.email;
    $('sso-cover-remember').checked = !!prefs.hasCreds || !!prefs.rememberWanted;
    $('sso-cover-auto').checked = !!prefs.autoLogin;

    $('sso-cover-go').addEventListener('click', function () {
      doSignIn($('sso-cover-email').value, $('sso-cover-pass').value);
    });
    $('sso-cover-pass').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') doSignIn($('sso-cover-email').value, $('sso-cover-pass').value);
    });
    $('sso-cover-email').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') $('sso-cover-pass').focus();
    });
    var eye = $('sso-cover-eye');
    eye.addEventListener('click', function () {
      var p = $('sso-cover-pass');
      var show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      eye.style.opacity = show ? '1' : '';
    });

    $('sso-cover-capgo').addEventListener('click', function () {
      var code = ($('sso-cover-capcode').value || '').trim();
      if (!code) { showError('Enter the code from the image.'); return; }
      setBusy(true, 'Verifying…');
      officialSubmit(lastAttempt.email, lastAttempt.password, { captcha: code });
    });

    var tabs = $('sso-cover-2fatabs');
    tabs.addEventListener('click', function (ev) {
      var t = ev.target.closest('button');
      if (!t) return;
      twoFaMode = t.getAttribute('data-m');
      var all = tabs.querySelectorAll('button');
      for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i] === t);
    });
    $('sso-cover-2fago').addEventListener('click', submitTwoFa);

    // Escape hatch: reveal the real official page underneath.
    $('sso-cover-official').addEventListener('click', function () {
      root.style.display = 'none';
      $('sso-cover-fab').hidden = false;
    });
    $('sso-cover-fab').addEventListener('click', function () {
      $('sso-cover-fab').hidden = true;
      root.style.display = 'flex';
      onStateCheck();
    });
    $('sso-cover-close').addEventListener('click', function () {
      var b = bridge();
      if (b) { try { b.cancel(); } catch (e) {} }
    });

    // Watch the official page for errors / captcha / 2FA.
    try {
      var mo = new MutationObserver(function () { onStateCheck(); });
      mo.observe(document.body || document.documentElement,
        { childList: true, subtree: true, characterData: true });
    } catch (e) {}
    pollTimer = setInterval(onStateCheck, 1200);

    if (prefs.autoLogin && prefs.hasCreds) autoLogin(prefs);
    else onStateCheck();
  }

  window.__ssoCoverUI = { init: init, _test: {
    setNativeValue: setNativeValue, findCaptchaImg: findCaptchaImg,
    findCaptchaInput: findCaptchaInput, findOfficialError: findOfficialError,
    officialElements: officialElements
  } };
  window.__ssoCoverInit = function (prefs) { init(prefs || {}); };
})();

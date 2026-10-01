/* Startup regression test — v1.5.97 white-screen root cause.
 * Guards against unclosed comments / dead code swallowing top-level
 * functions that init() depends on (initIosPickers was swallowed by an
 * unclosed /* comment, init() threw ReferenceError, white screen).
 * Runs the real index.html + api.js + app.js in jsdom and asserts:
 *  - zero script errors during load
 *  - initIosPickers / closeIosPicker / fmtPeriod / fmtDaysAgo exist
 *  - ssoSilentReauth / ssoDeadSession / ssoQueueRetry exist (top-level scope)
 *  - either #app or #view-profile becomes visible (no white screen)
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const www = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'www');
const srcJs = path.join(__dirname, '..', 'js');

async function main() {
  // the APK asset copy must exist and match source
  const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
  const results = [];
  const ok = (name, cond) => { results.push([name, !!cond]); };

  const errs = [];
  const vc = new VirtualConsole();
  // ignore resource-load noise: we inject the real scripts manually below
  vc.on('jsdomError', e => {
    const m = String((e && e.message) || e);
    if (!m.startsWith('Could not load')) errs.push(m.slice(0, 120));
  });

  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      // stub resource loads to local files
      w.__calls = [];
      w.RuijieBridge = {
        ssoRequest: () => {},
        ssoAccountInfo: () => JSON.stringify({ has: true, autoLogin: true }),
        ssoLoginSilent: () => w.__calls.push('silent'),
        ssoLogin: () => w.__calls.push('visible'),
      };
    },
  });

  // inject the real source scripts as <script> elements (global scope, like the APK)
  const apiJs = fs.readFileSync(path.join(srcJs, 'api.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(srcJs, 'app.js'), 'utf8');
  const w = dom.window;
  let loadErr = null;
  try {
    for (const code of [apiJs, appJs]) {
      const s = w.document.createElement('script');
      s.textContent = code;
      w.document.head.appendChild(s);
    }
  } catch (e) { loadErr = e; }
  ok('scripts evaluate without throwing', !loadErr);

  // fire DOMContentLoaded → init()
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  await new Promise(r => setTimeout(r, 1500));

  ok('zero jsdom errors', errs.length === 0);
  for (const fn of ['initIosPickers', 'closeIosPicker', 'fmtPeriod', 'fmtDaysAgo',
                    'ssoSilentReauth', 'ssoDeadSession', 'ssoQueueRetry',
                    'showIosLoading', 'hasSso']) {
    ok(fn + ' defined', w.eval('typeof ' + fn) === 'function');
  }
  const app = w.document.getElementById('app');
  const gate = w.document.getElementById('view-profile');
  const appVisible = app && !app.classList.contains('hidden');
  const gateVisible = gate && !gate.classList.contains('hidden');
  ok('app or profile gate visible (no white screen)', appVisible || gateVisible);

  // re-auth must stay silent
  w.eval('ssoLastReauth = 0');
  w.eval('ssoSilentReauth()');
  ok('re-auth uses silent login', w.__calls.join(',') === 'silent');

  let pass = 0;
  for (const [name, cond] of results) {
    if (!cond) console.log('FAIL ' + name);
    else pass++;
  }
  console.log(`startup-regression: ${pass}/${results.length} passed`);
  if (errs.length) console.log('jsdom errors:', errs.slice(0, 3));
  process.exit(pass === results.length ? 0 : 1);
}

main();

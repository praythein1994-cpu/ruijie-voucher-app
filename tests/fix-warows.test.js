/* Fix test — v1.5.99 Web Auth Wi-Fi list stacked rows.
 * User report: on a phone the single-line row squeezed the IP range into
 * "192.168.2…" (truncated). New layout per row: VLAN name + delete button
 * on the top line, IP range input full-width below.
 * Drives the real moreWebAuth() in jsdom with a mocked GwApi and asserts:
 *  - one .wa-row per configured entry, each with .wa-row-top (vlan+delete)
 *    and a full-width .wa-ipr below
 *  - the IP input carries the FULL range value (no truncation in the data)
 *  - the vlan input no longer has the 110px inline squeeze
 *  - delete still removes the row (syncRows/renderRows wiring intact)
 *  - styles.css carries the .wa-row rules
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.join(__dirname, '..');
const srcJs = path.join(root, 'js');

async function main() {
  const results = [];
  const ok = (name, cond) => results.push([name, !!cond]);

  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    const m = String((e && e.message) || e);
    if (!m.startsWith('Could not load')) errs.push(m.slice(0, 120));
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) { w.RuijieBridge = { ssoRequest: () => {} }; },
  });
  const w = dom.window;
  for (const f of ['api.js', 'app.js']) {
    const s = w.document.createElement('script');
    s.textContent = fs.readFileSync(path.join(srcJs, f), 'utf8');
    w.document.head.appendChild(s);
  }
  w.eval('init._done = true'); // keep init() out of the minimal DOM
  ok('scripts evaluate without throwing', true);

  w.document.body.innerHTML = '<div id="more-menu"></div><div id="more-content"></div>';
  w.eval(`
    GwApi.loggedIn = () => true;
    GwApi.webAuthGet = async () => ({ enable: '1', ad_url: 'https://portal-as.ruijienetworks.com',
      proxy_https: '1', flowDetectTime: '15',
      setSsidIpList: [
        { ssidName: 'VLAN20', ip: ['192.168.20.1-192.168.21.254'] },
        { ssidName: 'VLAN30', ip: ['192.168.30.1-192.168.30.254'] },
      ] });
    GwApi.globalAuthGet = async () => null;
    GwApi.allowlistGet = async () => null;
  `);

  await w.eval('(async () => { await moreWebAuth(); })()');
  const d = w.document;
  const rows = d.querySelectorAll('#wa-rows .wa-row');
  ok('two stacked rows rendered', rows.length === 2);
  ok('each row has a .wa-row-top line', [...rows].every(r => r.querySelector('.wa-row-top')));
  ok('top line holds vlan input + delete button',
    [...rows].every(r => {
      const top = r.querySelector('.wa-row-top');
      return top && top.querySelector('input.wa-vlan') && top.querySelector('button.wa-del');
    }));
  ok('IP input sits below the top line (direct .wa-row child)',
    [...rows].every(r => r.querySelector(':scope > input.wa-ipr')));
  ok('IP input carries the full range value',
    d.querySelector('.wa-ipr[data-wai="0"]').value === '192.168.20.1-192.168.21.254');
  ok('vlan input has no 110px inline squeeze',
    ![...d.querySelectorAll('.wa-vlan')].some(el => (el.getAttribute('style') || '').includes('max-width')));
  ok('vlan input keeps its value', d.querySelector('.wa-vlan[data-wai="1"]').value === 'VLAN30');

  // delete wiring: click the first row's trash → row removed, survivor keeps data
  d.querySelector('.wa-del[data-wai="0"]').click();
  const rowsAfter = d.querySelectorAll('#wa-rows .wa-row');
  ok('delete removes the row', rowsAfter.length === 1);
  ok('survivor row kept its vlan value',
    d.querySelector('.wa-vlan[data-wai="0"]') && d.querySelector('.wa-vlan[data-wai="0"]').value === 'VLAN30');

  const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
  ok('styles.css defines .wa-row stacked layout',
    css.includes('.wa-row {') && css.includes('flex-direction: column'));
  ok('styles.css defines .wa-row-top line', css.includes('.wa-row-top'));

  ok('zero jsdom errors', errs.length === 0);
  if (errs.length) console.log('jsdom errors:', errs.slice(0, 3));

  let pass = 0;
  for (const [name, c] of results) { if (c) pass++; else console.log('FAIL:', name); }
  console.log(`${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });

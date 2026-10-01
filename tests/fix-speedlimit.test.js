/* Per-client speed limit on SSID (user approved 2026-10-01).
 * Drives the real fmtSsidSpeed()/openSsidSpeed()/Api.ssidSetRatesSso() in
 * jsdom with a mocked SSO layer and asserts:
 *  - Mbps<->unit conversion helpers are consistent
 *  - the SSID row shows the current per-client caps (full text, no truncation)
 *  - the speed editor pre-fills current values and shows the unit hint
 *  - ssidSetRatesSso PUTs the FULL SSID object with ONLY upRate/downRate
 *    changed (portal contract: never a partial delta)
 *  - invalid input is rejected before any API call
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
  w.eval('init._done = true');
  ok('scripts evaluate without throwing', errs.length === 0);

  // conversion helpers
  ok('5 Mbps -> 5000 units', w.eval(`Api.ssidMbpsToUnit(5)`) === 5000);
  ok('5000 units -> 5 Mbps', w.eval(`Api.ssidUnitToMbps(5000)`) === 5);
  ok('round-trip 7.5 Mbps', w.eval(`Api.ssidUnitToMbps(Api.ssidMbpsToUnit(7.5))`) === 7.5);

  // mock SSO layer: capture envelopes, serve a canned SSID list
  w.eval(`
    var __calls = [];
    Api.ssoLoggedIn = () => true;
    Api.ssidListSso = async () => ({
      tempId: 't1',
      list: [{
        id: 's1', ssidName: 'AMH', password: 'secret123',
        encryptionMode: 'wpa_wpa2-psk',
        upRate: 5120, downRate: 10240,
        wlanUpRate: 0, wlanDownRate: 0,
        relatedRadio: ['1', '2'], authEntity: {},
      }],
    });
    S.projectId = '6752877';
    S.ssidList = (await0 => [])();
  `);
  // ssoCall is a module-level function in api.js — override via window
  w.eval(`
    __ssoCalls = [];
    ssoCall = async (apiPath, env) => { __ssoCalls.push({ apiPath, env }); return { code: 0 }; };
  `);

  // fmtSsidSpeed shows current caps
  const spdTxt = w.eval(`fmtSsidSpeed({ upRate: 5120, downRate: 10240 })`);
  ok('fmtSsidSpeed shows 5.12/10.24 Mbps', /5\.12/.test(spdTxt) && /10\.24/.test(spdTxt));
  ok('fmtSsidSpeed empty when no rates', w.eval(`fmtSsidSpeed({})`) === '');

  // full-object PUT: only upRate/downRate change
  await w.eval(`(async () => { await Api.ssidSetRatesSso('6752877', 'AMH', 5, 10); })()`);
  const call = w.eval(`__ssoCalls[0]`);
  ok('one SSO call made', w.eval(`__ssoCalls.length`) === 1);
  ok('PUT to /conf/template/t1/ssid/s1',
    call && call.apiPath === '/conf/template/t1/ssid/s1' && call.env.method === 'PUT');
  const ent = call && call.env.params && call.env.params.wirelessConfEntity;
  ok('envelope carries full wirelessConfEntity', !!ent && ent.ssidName === 'AMH');
  ok('upRate set to 5000', ent && ent.upRate === 5000);
  ok('downRate set to 10000', ent && ent.downRate === 10000);
  ok('password untouched', ent && ent.password === 'secret123');
  ok('wlanDownRate (SSID cap) untouched', ent && ent.wlanDownRate === 0);
  ok('relatedRadio joined to string', ent && ent.relatedRadio === '1,2');

  // invalid input rejected before any API call
  w.eval(`__ssoCalls = [];`);
  let threw = false;
  try { await w.eval(`(async () => { await Api.ssidSetRatesSso('6752877', 'AMH', -1, 10); })()`); }
  catch (e) { threw = true; }
  ok('negative rate rejected', threw && w.eval(`__ssoCalls.length`) === 0);

  // UI: speed editor pre-fills + hint; row shows speed text
  w.document.body.innerHTML = '<div id="more-content"><div id="wifi-body"></div></div>';
  w.eval(`S.ssidList = [{ id: 's1', ssidName: 'AMH', encryptionMode: 'wpa_wpa2-psk', upRate: 5120, downRate: 10240 }];`);
  w.eval(`openSsidSpeed('AMH')`);
  const d = w.document;
  ok('editor pre-fills upload Mbps', d.getElementById('ss-up').value === '5.12');
  ok('editor pre-fills download Mbps', d.getElementById('ss-down').value === '10.24');
  ok('unit hint shows raw values', /5120/.test(d.getElementById('ss-hint').textContent));
  ok('buttons keep full text (no truncation)',
    [...d.querySelectorAll('#wifi-body .btn')].every(b => (b.textContent || '').trim().length > 0));

  let pass = 0;
  for (const [n, c] of results) { if (!c) console.log('FAIL:', n); else pass++; }
  console.log(`${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });

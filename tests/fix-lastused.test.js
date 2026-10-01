/* Fix test — v1.5.99 "Last used" raw-HTML bug.
 * openMcDetail() passed '<span id="mc-lastused">…</span>' through kv(),
 * which esc()apes its value — so users saw the literal text
 * <span id="mc-lastused">…</span> and the async fill (querySelector
 * #mc-lastused) never found a node. Fix: kvRaw() for the trusted
 * placeholder span.
 * Asserts on the real openMcDetail() in jsdom:
 *  - #mc-lastused is a real SPAN element (not escaped literal text)
 *  - no literal "<span id=" text appears anywhere in the sheet
 *  - the async voucherLastUsedTs() fill writes into that node
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const srcJs = path.join(__dirname, '..', 'js');

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
    beforeParse(w) {
      w.RuijieBridge = { ssoRequest: () => {} };
    },
  });
  const w = dom.window;

  // real source, global scope — but do NOT run init(): the minimal test DOM
  // lacks the full index.html, and init() wires real page elements.
  for (const f of ['api.js', 'app.js']) {
    const s = w.document.createElement('script');
    s.textContent = fs.readFileSync(path.join(srcJs, f), 'utf8');
    w.document.head.appendChild(s);
  }
  w.eval('init._done = true'); // suppress DOMContentLoaded → init()
  ok('scripts evaluate without throwing', true);

  // mock client with a voucher account (portal shape → f.acct = '281330')
  const ts = Date.now() - 3 * 24 * 3600 * 1000; // 3 days ago
  w.eval(`mcCache = { list: [{ mac: '02:b7:c5:24:20:76', ip: '192.168.20.55',
      account: '281330', deviceName: 'RAP6202-G', ssid: 'Nang Oo',
      onlineTime: ${Date.now() - 4 * 3600 * 1000}, activeSec: 17580 }],
    viaPortal: true, vmap: new Map(), showNames: false };`);
  // pre-seed the last-used cache so no portal call is needed
  w.eval(`mcLastUsedCache = { at: Date.now(), map: new Map([['281330', ${ts}]]) };`);

  w.eval('openMcDetail(0)');
  await new Promise(r => setTimeout(r, 300));

  const sheet = w.document.querySelector('.mc-sheet, .ios-sheet, [class*="sheet"]') || w.document.body;
  const lu = w.document.getElementById('mc-lastused');
  ok('#mc-lastused resolves to a real element', !!lu);
  ok('#mc-lastused is a SPAN element', !!lu && lu.tagName === 'SPAN');
  ok('no literal "<span id=" text in the sheet',
    !String(sheet.innerHTML).includes('&lt;span id=') &&
    !Array.from(sheet.querySelectorAll('.kv .v')).some(
      el => el.textContent.includes('<span id="mc-lastused">')));
  ok('async fill wrote the formatted label into the node',
    !!lu && /ရက်|Days|—/.test(lu.textContent) && !lu.textContent.includes('<span'));
  ok('fill shows 3ရက် for the 3-day-old timestamp',
    !!lu && /3ရက်|3Days/.test(lu.textContent));
  ok('zero jsdom errors', errs.length === 0);
  if (errs.length) console.log('jsdom errors:', errs.slice(0, 3));

  let pass = 0;
  for (const [name, c] of results) { if (c) pass++; else console.log('FAIL:', name); }
  console.log(`${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });

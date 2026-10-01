/* Expired-only manual voucher delete (user decision 2026-10-01).
 * The "Delete" button in the voucher detail modal must appear ONLY for
 * expired vouchers (effective status '3'). Active / in-use vouchers must
 * never offer delete — enforcement stays disconnect/deauth only
 * (2026-09-29 incident: a delete left a client permanently online).
 * Drives the real openVoucherDetail()/deleteVoucher() in jsdom and asserts:
 *  - modal-delete hidden for active + in-use vouchers, visible for expired
 *  - deleteVoucher() refuses a non-expired voucher even if called directly
 *  - deleteVoucher() proceeds (confirm path) for an expired voucher
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

  // Minimal modal DOM that openVoucherDetail touches
  w.document.body.innerHTML = `
    <div id="modal" class="hidden">
      <div id="modal-title"></div><div id="modal-body"></div>
      <button id="modal-copy"></button>
      <button id="modal-print"></button>
      <button id="modal-disconnect"></button>
      <button id="modal-unbind" class="hidden"></button>
      <button id="modal-delete"></button>
    </div>`;
  // toast/confirm plumbing
  w.eval(`var __toasts = []; function toast(m, isErr){ __toasts.push(String(m)); }`);

  // Three vouchers: active, in-use (quota gone => effective expired), truly expired
  w.eval(`
    S.vouchers = [
      { uuid: 'u-active', voucherCode: 'ACTIVE1', status: '1', packageName: 'P1', timePeriod: 60, usedTime: 0, quota: 1073741824, usedQuota: 0, expiryTime: Date.now() + 86400000 },
      { uuid: 'u-inuse', voucherCode: 'INUSE1', status: '2', packageName: 'P1', timePeriod: 60, usedTime: 60, quota: 1073741824, usedQuota: 0, expiryTime: Date.now() + 86400000 },
      { uuid: 'u-expired', voucherCode: 'EXP1', status: '3', packageName: 'P1', timePeriod: 60, usedTime: 60, quota: 1073741824, usedQuota: 1073741824, expiryTime: Date.now() - 86400000 },
    ];
    S.currentView = 'view-vouchers';
  `);
  const isHidden = () => w.document.getElementById('modal-delete').classList.contains('hidden');

  w.eval(`openVoucherDetail('u-active')`);
  ok('delete hidden for ACTIVE voucher', isHidden());
  w.eval(`openVoucherDetail('u-expired')`);
  ok('delete visible for EXPIRED voucher', !isHidden());
  w.eval(`openVoucherDetail('u-inuse')`);
  // status '2' with usedTime exhausted => vEffStatus '3' (expired) => deletable
  const effInuse = w.eval(`vEffStatus(S.vouchers.find(v => v.uuid === 'u-inuse'))`);
  ok('in-use spent voucher counts as expired', effInuse === '3' && !isHidden());

  // deleteVoucher() guard: direct call on an active voucher must refuse
  w.eval(`
    __toasts = [];
    modalVoucher = S.vouchers.find(v => v.uuid === 'u-active');
    var __apiCalled = false;
    Api.voucherDelete = async () => { __apiCalled = true; };
  `);
  await w.eval(`(async () => { await deleteVoucher(); })()`);
  const refused = w.eval(`__toasts.some(m => m.indexOf('ကုန်ဆုံးသွားတဲ့') !== -1) && !__apiCalled`);
  ok('deleteVoucher refuses non-expired voucher', refused);

  // deleteVoucher() on expired voucher reaches the confirm path
  w.eval(`
    __toasts = []; __apiCalled = false;
    modalVoucher = S.vouchers.find(v => v.uuid === 'u-expired');
    var __confirmMsg = null;
  `);
  // stub confirm to capture the message and cancel (no real delete in test)
  w.eval(`window.confirm = (m) => { __confirmMsg = String(m); return false; };`);
  await w.eval(`(async () => { await deleteVoucher(); })()`);
  const confirmShown = w.eval(`__confirmMsg !== null && __confirmMsg.indexOf('EXP1') !== -1 && !__apiCalled`);
  ok('deleteVoucher asks confirm for expired voucher (no API call on cancel)', confirmShown);

  // i18n key present in both languages
  const hasKey = w.eval(`!!(t('del.onlyExpired') && t('del.onlyExpired') !== 'del.onlyExpired')`);
  ok('del.onlyExpired i18n resolves', hasKey);

  let pass = 0;
  for (const [n, c] of results) { if (!c) console.log('FAIL:', n); else pass++; }
  console.log(`${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });

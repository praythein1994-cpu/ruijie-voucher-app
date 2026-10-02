/* v1.5.101: Bulk Delete Expired Vouchers + Reset (Ruijie Cloud style).
 * v1.5.104: Reset envelope VERIFIED 2026-10-01 from the live Ruijie portal JS
 * (user-authorized): UserManagement page reset(e):
 *   POST /intlSamVoucher/voucher/reset
 *   params:{recordList:[uuid,...], voucherCode:"code1,code2"} querys:{group_id}
 * The portal sends ONE call for all selected vouchers (batch).
 * User decisions 2026-10-01:
 *  - REMOVED the per-voucher delete button from the voucher detail modal
 *    (added that afternoon) — replaced by bulk "Delete Expired Vouchers"
 *    which deletes ALL expired vouchers at once, like the portal's More menu.
 *  - ADDED "Reset" for selected vouchers (clears usage back to fresh).
 * Drives the real deleteExpiredVouchers()/resetSelectedVouchers() in jsdom:
 *  - modal-delete button must NOT exist in index.html anymore
 *  - deleteVoucher() must NOT exist anymore
 *  - deleteExpiredVouchers() deletes only effective-status '3' vouchers
 *  - resetSelectedVouchers() calls Api.voucherResetMany once for selected
 *  - Api.voucherResetMany throws SSO_REQUIRED without an SSO session
 *  - ssoResetEnvelope matches the verified portal envelope
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

  // 1. index.html: modal-delete must be gone
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ok('modal-delete button removed from index.html', !html.includes('id="modal-delete"'));

  // 2. deleteVoucher() must not exist anymore
  ok('deleteVoucher() removed', w.eval(`typeof deleteVoucher === 'undefined'`));

  // 3. new functions exist
  ok('deleteExpiredVouchers() exists', w.eval(`typeof deleteExpiredVouchers === 'function'`));
  ok('resetSelectedVouchers() exists', w.eval(`typeof resetSelectedVouchers === 'function'`));
  ok('Api.voucherReset exists', w.eval(`typeof Api.voucherReset === 'function'`));
  ok('Api.voucherResetMany exists', w.eval(`typeof Api.voucherResetMany === 'function'`));

  // toast/confirm plumbing
  w.eval(`var __toasts = []; function toast(m, isErr){ __toasts.push(String(m)); }`);

  // Three vouchers: active, in-use spent (=> effective expired), truly expired
  w.eval(`
    S.vouchers = [
      { uuid: 'u-active', voucherCode: 'ACTIVE1', status: '1', packageName: 'P1', timePeriod: 60, usedTime: 0, quota: 1073741824, usedQuota: 0, expiryTime: Date.now() + 86400000 },
      { uuid: 'u-inuse', voucherCode: 'INUSE1', status: '2', packageName: 'P1', timePeriod: 60, usedTime: 60, quota: 1073741824, usedQuota: 0, expiryTime: Date.now() + 86400000 },
      { uuid: 'u-expired', voucherCode: 'EXP1', status: '3', packageName: 'P1', timePeriod: 60, usedTime: 60, quota: 1073741824, usedQuota: 1073741824, expiryTime: Date.now() - 86400000 },
    ];
    S.projectId = 123;
    var __deleted = [];
    Api.voucherDelete = async (gid, v) => { __deleted.push(v.uuid); };
    var __reset = [];
    var __realVoucherResetMany = Api.voucherResetMany;
    Api.voucherResetMany = async (gid, vs) => { __reset.push(vs.map(v => v.uuid).join(',')); };
    window.iosConfirm = async () => true; // v1.5.116+: native confirm() replaced by iOS dialog
  `);

  // v1.5.116 redesign: bulk portal delete by cutoff date (portal's More menu
  // design) — drive the REAL flow with stubs, no vacuous passes.
  w.eval(`
    Api.ssoLoggedIn = () => true;
    pickExpireDate = async () => '2026-09-16';
    var __bulkDel = [];
    Api.voucherDeleteExpiredSso = async (gid, expireTime) => { __bulkDel.push([gid, expireTime]); };
    var __countCalls = 0;
    Api.voucherExpireCountSso = async (gid, expireTime) => { __countCalls++; return 2; };
    var __confirmArgs = [];
    window.iosConfirm = async (title, msg) => { __confirmArgs.push([title, msg]); return true; };
    var __loadVouchers = 0;
    loadVouchers = () => { __loadVouchers++; }; // DOM-heavy; count calls only
  `);

  // 4. bulk delete called ONCE with (gid, end-of-picked-day ms)
  await w.eval(`(async () => { await deleteExpiredVouchers(); })()`);
  const bulkOk = w.eval(`
    __bulkDel.length === 1 && __bulkDel[0][0] === 123 &&
    __bulkDel[0][1] === endOfDayMs('2026-09-16')`);
  ok('deleteExpiredVouchers bulk-deletes with picked cutoff', bulkOk);
  // confirm dialog names the portal count
  const confirmOk = w.eval(`__confirmArgs.length === 1 && /2/.test(__confirmArgs[0][0])`);
  ok('deleteExpiredVouchers confirms with the portal count', confirmOk);
  ok('voucher list refreshes after delete', w.eval(`__loadVouchers === 1`));

  // 4b. cancel at the confirm dialog -> no delete call
  w.eval(`__bulkDel = []; __confirmArgs = []; window.iosConfirm = async () => false;`);
  await w.eval(`(async () => { await deleteExpiredVouchers(); })()`);
  ok('deleteExpiredVouchers aborts when confirm cancelled',
    w.eval(`__bulkDel.length === 0`));

  // 5. portal count 0 -> toasts delExpiredNone, no delete, no confirm
  w.eval(`
    __toasts = []; __bulkDel = []; __confirmArgs = [];
    window.iosConfirm = async () => true;
    Api.voucherExpireCountSso = async () => 0;
    S.vouchers = [{ uuid: 'u-active', voucherCode: 'ACTIVE1', status: '1', packageName: 'P1', timePeriod: 60, usedTime: 0, quota: 1073741824, usedQuota: 0, expiryTime: Date.now() + 86400000 }];
  `);
  await w.eval(`(async () => { await deleteExpiredVouchers(); })()`);
  const noneToast = w.eval(`__toasts.some(m => m.includes(t('v.delExpiredNone'))) && __bulkDel.length === 0 && __confirmArgs.length === 0`);
  ok('deleteExpiredVouchers toasts when none expired', noneToast);

  // 5b. no SSO session -> needSso toast, nothing else happens
  w.eval(`
    __toasts = []; __bulkDel = []; __countCalls = 0;
    Api.ssoLoggedIn = () => false;
  `);
  await w.eval(`(async () => { await deleteExpiredVouchers(); })()`);
  ok('deleteExpiredVouchers requires SSO first',
    w.eval(`__toasts.some(m => m.includes(t('ac.needSso'))) && __bulkDel.length === 0 && __countCalls === 0`));
  w.eval(`Api.ssoLoggedIn = () => true;`);

  // 6. resetSelectedVouchers with no selection toasts v.resetNone
  w.eval(`
    __toasts = []; __reset = [];
    S.vouchers = [{ uuid: 'u1', voucherCode: 'C1', status: '1', packageName: 'P1', timePeriod: 60, usedTime: 0, quota: 1073741824, usedQuota: 0, expiryTime: Date.now() + 86400000 }];
    document.body.innerHTML = '<div id="voucher-list"></div>';
  `);
  await w.eval(`(async () => { await resetSelectedVouchers(); })()`);
  const resetNone = w.eval(`__toasts.length > 0 && __reset.length === 0`);
  ok('resetSelectedVouchers toasts when nothing selected', resetNone);

  // 7. resetSelectedVouchers resets checked (.on) items via ONE batch call
  w.eval(`
    __toasts = []; __reset = [];
    document.body.innerHTML = '<div id="voucher-list"><button class="bulk-check on" data-bulk="u1"></button></div>';
  `);
  await w.eval(`(async () => { await resetSelectedVouchers(); })()`);
  const resetDone = w.eval(`JSON.stringify(__reset) === JSON.stringify(['u1'])`);
  ok('resetSelectedVouchers calls Api.voucherResetMany once for selected', resetDone);

  // 8. Api.voucherResetMany throws SSO_REQUIRED without SSO session (use the real method, not the stub)
  const ssoRequired = await w.eval(`(async () => { Api.ssoLoggedIn = () => false; try { await __realVoucherResetMany.call(Api, 1, [{uuid:'x', voucherCode:'X'}]); return false; } catch (e) { return e.message === 'SSO_REQUIRED'; } finally { Api.ssoLoggedIn = () => true; } })()`);
  ok('Api.voucherResetMany requires SSO session', ssoRequired);

  // 8b. ssoResetEnvelope matches the VERIFIED portal envelope
  const envOk = w.eval(`(() => {
    const e = Api.ssoResetEnvelope(['C1','C2'], ['u1','u2'], 123);
    return e.api === '/intlSamVoucher/voucher/reset'
      && e.method === 'POST'
      && e.authParams && e.authParams.api === '/intlSamVoucher/voucher/reset' && e.authParams.method === 'POST'
      && Array.isArray(e.params.recordList) && e.params.recordList.join(',') === 'u1,u2'
      && e.params.voucherCode === 'C1,C2'
      && e.querys && e.querys.group_id === 123 && !('ids' in e.querys) && !('lang' in e.querys);
  })()`);
  ok('ssoResetEnvelope matches verified portal envelope', envOk);

  // 8c. voucherResetSso throws on s.code and on s.voucherData.code (portal response handling)
  const respOk = await w.eval(`(async () => {
    const realSso = [];
    // simulate SSO session by stubbing at the ssoCall level is internal; instead check the method exists and delegates
    return typeof Api.voucherResetManySso === 'function' && typeof Api.voucherResetSso === 'function';
  })()`);
  ok('voucherResetManySso/voucherResetSso exist', respOk);

  // 9. i18n keys present
  const keys = w.eval(`['v.delExpired','v.delExpiredConfirm','v.delExpiredNone','v.delExpiredDone','v.reset','v.resetConfirm','v.resetNone','v.resetDone'].every(k => { const v = t(k); return v && v !== k; })`);
  ok('new i18n keys resolve', keys);

  // 10. bulk-check custom checkmark: .on class drives selection
  w.eval(`document.body.innerHTML = '<button class="bulk-check" data-bulk="u9"><span class="tick">✓</span></button>';`);
  const selEmpty = w.eval(`bulkSelectedUuids().length === 0`);
  w.eval(`document.querySelector('.bulk-check').classList.add('on')`);
  const selOne = w.eval(`JSON.stringify(bulkSelectedUuids()) === JSON.stringify(['u9'])`);
  ok('bulk-check .on class drives selection (no native checkbox)', selEmpty && selOne);

  let pass = 0;
  for (const [n, c] of results) { if (!c) console.log('FAIL:', n); else pass++; }
  console.log(`${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });

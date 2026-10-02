/* v1.5.145: phone-compact UI (User Groups cards, SSID icon buttons, compact
 * bulk bar), Client History grouped by voucher with sharing flags + Burmese
 * logout-reason map, dedicated More → Firmware update screen (Upgrade removed
 * from device rows). */
'use strict';
const fs = require('fs');
const path = require('path');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

/* ── Extract pure functions and run them in node ── */
function extractFn(src, sig) {
  const start = src.indexOf(sig);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (!depth) break; }
  }
  return src.slice(start, i + 1);
}
function extractConst(src, sig) {
  const start = src.indexOf(sig);
  if (start < 0) return null;
  const semi = src.indexOf(';', start);
  return src.slice(start, semi + 1);
}
const normMacSrc = extractConst(js, 'const normMac =');
const flagSrc = extractFn(js, 'function historyShareFlag(sessions)');
const groupSrc = extractFn(js, 'function groupHistoryByVoucher(records)');
const reasonSrc = extractFn(js, 'function mapLogoutReason(raw)');
ok('normMac extractable', !!normMacSrc);
ok('historyShareFlag extractable', !!flagSrc);
ok('groupHistoryByVoucher extractable', !!groupSrc);
ok('mapLogoutReason extractable', !!reasonSrc);

let normMac, historyShareFlag, groupHistoryByVoucher, mapLogoutReason;
globalThis.LANG = 'my';
try {
  const factory = new Function(
    normMacSrc + '\n' + flagSrc + '\n' + groupSrc + '\n' + reasonSrc +
    '\nreturn { normMac, historyShareFlag, groupHistoryByVoucher, mapLogoutReason };');
  ({ normMac, historyShareFlag, groupHistoryByVoucher, mapLogoutReason } = factory());
  ok('eval of history fns', typeof groupHistoryByVoucher === 'function');
} catch (e) { ok('eval of history fns: ' + e.message, false); }

(async () => {
  /* ── historyShareFlag ── */
  const S = (mac, login, logout, ip) => ({ userMac: mac, loginTimes: login, logoutTimes: logout, userIp: ip });
  if (historyShareFlag) {
    ok('single MAC → none',
      historyShareFlag([S('aa:bb:cc:dd:ee:ff', 1000, 2000, '192.168.20.5')]) === 'none');
    ok('2 MACs overlapping + different IP → shared',
      historyShareFlag([
        S('aa:bb:cc:dd:ee:ff', 1000, 5000, '192.168.20.5'),
        S('11:22:33:44:55:66', 2000, 3000, '192.168.20.6'),
      ]) === 'shared');
    ok('2 MACs sequential + different IP → suspicious',
      historyShareFlag([
        S('aa:bb:cc:dd:ee:ff', 1000, 2000, '192.168.20.5'),
        S('11:22:33:44:55:66', 3000, 4000, '192.168.20.6'),
      ]) === 'suspicious');
    ok('2 MACs sequential + SAME IP → rotation',
      historyShareFlag([
        S('aa:bb:cc:dd:ee:ff', 1000, 2000, '192.168.20.5'),
        S('11:22:33:44:55:66', 3000, 4000, '192.168.20.5'),
      ]) === 'rotation');
    ok('MAC formats normalized (dotted vs colon)',
      historyShareFlag([
        S('aa:bb:cc:dd:ee:ff', 1000, 2000, '192.168.20.5'),
        S('aabb.ccdd.eeff', 3000, 4000, '192.168.20.5'),
      ]) === 'none');
    ok('open session (no logout) overlaps → shared',
      historyShareFlag([
        S('aa:bb:cc:dd:ee:ff', 1000, 0, '192.168.20.5'),
        S('11:22:33:44:55:66', 2000, 3000, '192.168.20.6'),
      ]) === 'shared');
  }

  /* ── groupHistoryByVoucher ── */
  if (groupHistoryByVoucher) {
    const recs = [
      { account: '111', userMac: 'aa', loginTimes: 3000, logoutTimes: 4000, userIp: '1.1.1.1' },
      { account: '222', userMac: 'bb', loginTimes: 1000, logoutTimes: 2000, userIp: '1.1.1.2' },
      { account: '111', userMac: 'aa', loginTimes: 1000, logoutTimes: 2000, userIp: '1.1.1.1' },
    ];
    const g = groupHistoryByVoucher(recs);
    ok('groups by account (2 groups)', g.length === 2);
    ok('group 111 has 2 sessions', g.find(x => x.account === '111').sessions.length === 2);
    ok('sessions sorted newest-first', g.find(x => x.account === '111').sessions[0].loginTimes === 3000);
    ok('groups sorted by lastSeen desc', g[0].account === '111');
    ok('each group carries a flag', g.every(x => typeof x.flag === 'string'));
    ok('empty input → empty', groupHistoryByVoucher([]).length === 0);
    ok('null input → empty', groupHistoryByVoucher(null).length === 0);
  }

  /* ── mapLogoutReason (Burmese) ── */
  if (mapLogoutReason) {
    globalThis.LANG = 'my';
    ok('kick → Burmese', mapLogoutReason('Kicked by admin').includes('ဖြုတ်ချ'));
    ok('idle → Burmese', mapLogoutReason('Idle Timeout').includes('မသုံးပဲ'));
    ok('timeout → Burmese', mapLogoutReason('Session Timeout').includes('အချိန်ကုန်'));
    ok('quota → Burmese', mapLogoutReason('Quota exceeded').includes('Data'));
    ok('unknown raw passes through', mapLogoutReason('WeirdReason42') === 'WeirdReason42');
    ok('empty → —', mapLogoutReason('') === '—' && mapLogoutReason(null) === '—');
    ok('case-insensitive', mapLogoutReason('ADMIN KICK').includes('ဖြုတ်ချ'));
    globalThis.LANG = 'en';
    ok('English mode → English', mapLogoutReason('Idle Timeout') === 'Idle timeout');
    globalThis.LANG = 'my';
  }

  /* ── HTML: bulk bar ── */
  ok('bulk-cancel button removed', !html.includes('btn-bulk-cancel'));
  ok('bulk delete uses pdel-mini', html.includes('id="btn-bulk-delete" class="pdel-mini"'));
  ok('bulk count badge exists', html.includes('id="bulk-count"'));
  ok('bulk print icon-only (no text span)',
    (() => { const m = html.match(/<button id="btn-bulk-print"[\s\S]*?<\/button>/); return m && !m[0].includes('<span'); })());
  ok('pencil icon symbol added', html.includes('id="i-pencil"'));
  ok('firmware menu item added', html.includes('data-more="firmware"'));

  /* ── CSS: phone-compact rules ── */
  ok('mg-list phone card rules', css.includes('html.ph-compact #mg-list table.data tr'));
  ok('mg-list headers hidden on phone', /html\.ph-compact #mg-list table\.data tr:first-child\s*\{\s*display:\s*none/.test(css));
  ok('mg delete icon-only on phone', css.includes('html.ph-compact #mg-list .mg-delbtn .btn-t'));
  ok('ssid actions icon-only on phone', css.includes('html.ph-compact .ssid-actions .btn-t'));
  ok('ssid actions overflow guard', css.includes('html.ph-compact .ssid-row .ssid-actions'));
  ok('pdel-mini styles', css.includes('.pdel-mini'));
  ok('mh-flag styles', css.includes('.mh-flag'));
  ok('fw indeterminate animation', css.includes('@keyframes fwslide'));

  /* ── JS: wiring ── */
  ok('no data-upgrade in device rows', !/data-upgrade=/.test(js.split('renderDeviceRows')[1].split('/* ── Device reboot')[0]));
  ok('firmware dispatch wired', js.includes("else if (k === 'firmware') moreFirmware()"));
  ok('moreFirmware defined', js.includes('async function moreFirmware()'));
  ok('renderFwRows defined', js.includes('function renderFwRows()'));
  ok('fwStartUpgrade defined', js.includes('async function fwStartUpgrade(idx)'));
  ok('no fake percent in fw polling', !/fw.*percent|percent.*fw/i.test(js));
  ok('bulk-cancel listener removed', !js.includes("btn-bulk-cancel')"));
  ok('openHistoryDetail defined', js.includes('function openHistoryDetail(idx)'));
  ok('mg delete button has aria-label', js.includes('mg-delbtn') && js.includes('aria-label'));

  /* ── i18n keys ── */
  const jsLines = js.split('\n');
  for (const k of ['mh.shared', 'mh.susp', 'mh.rotation', 'mh.reason', 'mh.online', 'mh.grpSub',
                   'm.firmware', 'm.firmwareSub', 'fw.title', 'fw.update', 'fw.done']) {
    const line = jsLines.find(l => l.includes(`'${k}':`));
    ok(`i18n key ${k} with my+en`, !!line && line.includes('my:') && line.includes('en:'));
  }

  const fails = results.filter(r => !r[1]);
  console.log(`v15145: ${results.length - fails.length}/${results.length} passed`);
  for (const [n] of fails) console.log('  FAIL:', n);
  process.exit(fails.length ? 1 : 0);
})();

/**
 * fix17 test — v1.5.97: full unit words + voucher "last used" (2026-10-01).
 *
 * User request (Burmese): package picker showed "3d", "1mo", "1h" —
 * Day/Month/Hours must be written in FULL English words with correct
 * singular/plural ("1 Day", "3 Days", "1 Month", "2 Months", "1 Hour",
 * "3 Hours"); plus a "Last used" row in the client detail sheet showing
 * the voucher's newest loginTimes from the portal auth history against
 * today ("0Days" / "1Days" / "11Days" — compact, no Today/Yesterday words
 * per user), '—' when unknown.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

/* Minimal i18n stub — mirrors the real en values under test */
const I18N_STUB = {
  'fmt.month': ' Month', 'fmt.months': ' Months',
  'fmt.day': ' Day', 'fmt.days': ' Days',
  'fmt.hour': ' Hour', 'fmt.hours': ' Hours',
  'fmt.min': ' Minute', 'fmt.mins': ' Minutes',
  'fmt.sec': ' Second', 'fmt.secs': ' Seconds',
  'mc.dDaysAgo': '{n}Days',
};
const t = k => I18N_STUB[k] || k;
const tx = (k, vars) => {
  let s = t(k);
  if (vars) for (const key of Object.keys(vars)) s = s.replace('{' + key + '}', String(vars[key]));
  return s;
};

/* Extract `const NAME = ...;` source and eval it in this stub context */
function extractConst(src, name) {
  const re = new RegExp('const\\s+' + name + '\\s*=\\s*');
  const m = re.exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 0, inStr = false, q = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === q && src[i - 1] !== '\\') inStr = false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; q = c; continue; }
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    else if (c === ';' && depth === 0) break;
  }
  const stmt = src.slice(m.index, i + 1).replace(/;\s*$/, '');
  return eval('(' + stmt.replace(/^const\s+\w+\s*=\s*/, '') + ')');
}

const fmtUnit = extractConst(appSrc, 'fmtUnit');
const fmtPeriod = extractConst(appSrc, 'fmtPeriod');
const fmtRemain = extractConst(appSrc, 'fmtRemain');
const fmtRemainSecs = extractConst(appSrc, 'fmtRemainSecs');
const fmtDaysAgo = extractConst(appSrc, 'fmtDaysAgo');
const lastUsedMap = extractConst(appSrc, 'lastUsedMap');
for (const [fn, n] of [[fmtUnit, 'fmtUnit'], [fmtPeriod, 'fmtPeriod'], [fmtRemain, 'fmtRemain'],
    [fmtRemainSecs, 'fmtRemainSecs'], [fmtDaysAgo, 'fmtDaysAgo'], [lastUsedMap, 'lastUsedMap']])
  ok(typeof fn === 'function', n + ' extracts');

/* ── fmtPeriod: full words, singular/plural ── */
ok(fmtPeriod(43200) === '1 Month', 'fmtPeriod 43200 -> "1 Month"');
ok(fmtPeriod(86400) === '2 Months', 'fmtPeriod 86400 -> "2 Months"');
ok(fmtPeriod(1440) === '1 Day', 'fmtPeriod 1440 -> "1 Day"');
ok(fmtPeriod(4320) === '3 Days', 'fmtPeriod 4320 -> "3 Days"');
ok(fmtPeriod(60) === '1 Hour', 'fmtPeriod 60 -> "1 Hour"');
ok(fmtPeriod(180) === '3 Hours', 'fmtPeriod 180 -> "3 Hours"');
ok(fmtPeriod(1) === '1 Minute', 'fmtPeriod 1 -> "1 Minute"');
ok(fmtPeriod(15) === '15 Minutes', 'fmtPeriod 15 -> "15 Minutes"');
ok(fmtPeriod(0) === '—' && fmtPeriod('') === '—' && fmtPeriod(null) === '—',
  'fmtPeriod falsy -> em dash');
ok(!/[0-9](d|h|m|s|mo)\b/.test(fmtPeriod(4320) + fmtPeriod(86400) + fmtPeriod(180)),
  'fmtPeriod carries no abbreviations');

/* ── fmtRemain: compound durations ── */
ok(fmtRemain(1500) === '1 Day 1 Hour', 'fmtRemain 1500 -> "1 Day 1 Hour"');
ok(fmtRemain(2970) === '2 Days 1 Hour 30 Minutes', 'fmtRemain 2970 -> "2 Days 1 Hour 30 Minutes"');
ok(fmtRemain(0) === '0 Minutes', 'fmtRemain 0 -> "0 Minutes"');
ok(fmtRemain(61) === '1 Hour 1 Minute', 'fmtRemain 61 -> "1 Hour 1 Minute"');
ok(fmtRemain(null) === '—' && fmtRemain('') === '—', 'fmtRemain empty -> em dash');

/* ── fmtRemainSecs: live ticking variant ── */
ok(fmtRemainSecs(90061) === '1 Day 1 Hour 1 Minute 1 Second',
  'fmtRemainSecs singular chain');
ok(fmtRemainSecs(180122) === '2 Days 2 Hours 2 Minutes 2 Seconds',
  'fmtRemainSecs plural chain');
ok(fmtRemainSecs(45) === '0 Minutes 45 Seconds', 'fmtRemainSecs sub-minute');

/* ── fmtDaysAgo: compact day label ── */
const DAY = 86400000, now = Date.now();
ok(fmtDaysAgo(now - 3600000) === '0Days', 'fmtDaysAgo 1h ago -> 0Days');
ok(fmtDaysAgo(now - DAY) === '1Days', 'fmtDaysAgo 24h ago -> 1Days');
ok(fmtDaysAgo(now - 2 * DAY) === '2Days', 'fmtDaysAgo 2d -> "2Days"');
ok(fmtDaysAgo(now - 11 * DAY) === '11Days', 'fmtDaysAgo 11d -> "11Days"');
ok(fmtDaysAgo(0) === '—' && fmtDaysAgo(null) === '—' && fmtDaysAgo('') === '—',
  'fmtDaysAgo missing -> em dash');
ok(fmtDaysAgo(now + DAY) === '—', 'fmtDaysAgo future timestamp -> em dash (never guess)');
ok(fmtDaysAgo('not-a-date') === '—', 'fmtDaysAgo invalid -> em dash');

/* ── lastUsedMap: newest loginTimes wins per account ── */
const logs = [
  { account: ' 33637503 ', loginTimes: 1000 },
  { account: '33637503', loginTimes: 5000 },   // newer duplicate wins
  { account: '33637503', loginTimes: 2000 },   // older duplicate ignored
  { account: 'du3jbbgn', loginTimes: 3000 },
  { account: '', loginTimes: 9999 },            // blank account ignored
  { account: 'norts', loginTimes: 0 },          // zero timestamp ignored
  { account: null, loginTimes: 7777 },          // null account ignored
];
const map = lastUsedMap(logs);
ok(map.get('33637503') === 5000, 'lastUsedMap keeps newest loginTimes (whitespace-trimmed key)');
ok(map.get('du3jbbgn') === 3000, 'lastUsedMap second account');
ok(!map.has('') && !map.has('norts'), 'lastUsedMap skips blank/zero records');
ok(map.size === 2, 'lastUsedMap has exactly 2 accounts');

/* ── UI wiring (source checks) ── */
for (const key of ['mc.dLastUsed', 'mc.dDaysAgo'])
  ok(appSrc.includes("'" + key + "'"), 'i18n key ' + key + ' exists');
ok(!appSrc.includes("'mc.dToday'") && !appSrc.includes("'mc.dYesterday'"),
  'wordy Today/Yesterday keys removed (user wants compact)');
ok(appSrc.includes('mc-lastused'), 'Last-used placeholder row in detail sheet');
ok(/voucherLastUsedTs\(f\.acct\)/.test(appSrc), 'detail sheet looks up voucherLastUsedTs(f.acct)');
ok(/\.catch\(\(\) =>/.test(appSrc) || /\.catch\(/.test(appSrc), 'lookup failure renders em dash');
ok(/Api\.portalAuthLogs\(Number\(S\.projectId\)\)/.test(appSrc),
  'lookup reads the portal auth history (groupId-scoped)');
ok(/15 \* 60 \* 1000/.test(appSrc), 'last-used map cached 15 min');

console.log(`fix17: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

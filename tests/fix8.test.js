/**
 * fix8 test — flag labels renamed to plain terms:
 *   Top talker  -> Over Data
 *   Unattributed (suspicious) -> Suspend
 * Verifies the i18n table entries in js/app.js (both languages, and the
 * Traffic page's top-talker title which shares the term).
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
const entry = key => {
  const m = appSrc.match(new RegExp(`'${key}':\\s*\\{[^}]*\\}`));
  return m ? m[0] : null;
};

/* suspicious flag -> Suspend */
{
  const e = entry('mc.flag.suspicious');
  ok(!!e, 'mc.flag.suspicious entry exists');
  ok(/en:\s*'Suspend'/.test(e), "suspicious en = 'Suspend'");
  ok(!/Unattributed/.test(e), 'old "Unattributed" wording gone from suspicious entry');
}

/* top-talker flag -> Over Data */
{
  const e = entry('mc.flag.toptalker');
  ok(!!e, 'mc.flag.toptalker entry exists');
  ok(/en:\s*'Over Data'/.test(e), "toptalker en = 'Over Data'");
  ok(!/Top talker/.test(e), 'old "Top talker" wording gone from flag entry');
}

/* Traffic page title shares the term -> Over Data */
{
  const e = entry('mt.topTalker');
  ok(!!e, 'mt.topTalker entry exists');
  ok(/en:\s*'Over Data'/.test(e), "Traffic page title en = 'Over Data'");
}

/* no stale English labels anywhere in source */
ok(!/en:\s*'Top talker'/.test(appSrc), 'no stale "Top talker" en label left');
ok(!/en:\s*'Unattributed, active/.test(appSrc), 'no stale "Unattributed" en label left');

/* Burmese labels present (non-empty) */
for (const k of ['mc.flag.suspicious', 'mc.flag.toptalker', 'mt.topTalker']) {
  const e = entry(k);
  ok(/my:\s*'[^']+'/.test(e), k + ' has Burmese label');
}

console.log(`fix8: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

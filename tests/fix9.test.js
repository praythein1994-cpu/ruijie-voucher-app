/**
 * fix9 test — Online Clients detail sheet is fullscreen.
 * - openMcDetail() applies the ios-sheet-full modifier class.
 * - the generic ios-sheet picker (theme/layout pickers) keeps bottom-sheet style.
 * - CSS: fullscreen = 100dvh, no rounding, handle hidden, body fills + scrolls.
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
const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

/* openMcDetail applies the fullscreen modifier (exactly one such sheet) */
{
  const hits = appSrc.match(/sheet\.className = 'ios-sheet ios-sheet-full'/g) || [];
  ok(hits.length === 1, 'exactly one ios-sheet-full sheet (client detail), got ' + hits.length);
  const idx = appSrc.indexOf("sheet.className = 'ios-sheet ios-sheet-full'");
  const fnStart = appSrc.lastIndexOf('function openMcDetail', idx);
  ok(fnStart !== -1 && idx - fnStart < 9000, 'ios-sheet-full is inside openMcDetail()');
}

/* generic picker keeps plain bottom-sheet class */
{
  const plain = appSrc.match(/sheet\.className = 'ios-sheet';/g) || [];
  ok(plain.length >= 1, 'generic ios-sheet picker keeps plain class (' + plain.length + ' found)');
}

/* CSS fullscreen rules */
ok(/\.ios-sheet\.ios-sheet-full\s*\{[^}]*height:\s*100dvh/.test(cssSrc), 'fullscreen height 100dvh');
ok(/\.ios-sheet\.ios-sheet-full\s*\{[^}]*border-radius:\s*0/.test(cssSrc), 'fullscreen no rounding');
ok(/\.ios-sheet-full\s+\.sheet-handle\s*\{\s*display:\s*none/.test(cssSrc), 'handle hidden in fullscreen');
ok(/\.ios-sheet-full\s+\.ios-sheet-body\s*\{\s*flex:\s*1/.test(cssSrc), 'body fills remaining space');
ok(/\.ios-sheet\s*\{[^}]*max-height:\s*72dvh/.test(cssSrc), 'plain ios-sheet still bottom-sheet (72dvh)');

console.log(`fix9: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

/**
 * v1.5.117 test — Blocked tab renders the DENY-LIST itself.
 * Root cause of "Blocked (0)" forever: the tab filtered ONLINE clients by
 * blocked state, but a blocked MAC is denied by the portal MAC filter so it
 * never appears in the online list. Now the tab renders
 * getBlockedMacList() (local UNION portal) with an Unblock action per MAC.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL ' + name); }
}

const apiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

/* Extract a top-level function and eval it standalone.
 * Skips braces inside string literals and comments so a literal like
 * '{' does not corrupt the brace matching. */
function extractFn(src, name) {
  const re = new RegExp('function ' + name + '\\(([^)]*)\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, i = m.index + m[0].length - 1;
  let q = null, esc = false, lc = false, bc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (lc) { if (c === '\n') lc = false; continue; }
    if (bc) { if (c === '*' && n === '/') { bc = false; i++; } continue; }
    if (q) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '/' && n === '/') { lc = true; i++; continue; }
    if (c === '/' && n === '*') { bc = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) break; }
  }
  const body = src.slice(m.index + m[0].length, i);
  return new Function(m[1], body);
}

/* ── extractMacList: unknown response shapes ── */
const extractMacList = extractFn(apiSrc, 'extractMacList');
ok(typeof extractMacList === 'function', 'extractMacList exists');

if (extractMacList) {
  // colon form nested under unpredictable keys
  let r = extractMacList({ code: 0, data: { result: { entries: [{ clientMac: '62:22:3f:a9:9f:14' }] } } });
  ok(r.length === 1 && r[0] === '62:22:3f:a9:9f:14', 'finds colon MAC under unknown nesting');

  // dotted form
  r = extractMacList({ data: { mac: '32ed.db9f.6a8e' } });
  ok(r.length === 1 && r[0] === '32ed.db9f.6a8e', 'finds dotted MAC');

  // bare 12-hex
  r = extractMacList({ x: ['AABBCCDDEEFF'] });
  ok(r.length === 1 && r[0] === 'AABBCCDDEEFF', 'finds bare 12-hex MAC');

  // stringified JSON payload
  r = extractMacList({ data: '{"list":[{"mac":"62:22:3f:a9:9f:14"}]}' });
  ok(r.length === 1 && r[0] === '62:22:3f:a9:9f:14', 'unwraps stringified JSON');

  // dedupe across formats
  r = extractMacList({ a: '62:22:3f:a9:9f:14', b: '62:22:3F:A9:9F:14' });
  ok(r.length === 1, 'dedupes same MAC in different case');

  // no false positive: 12 hex chars inside a longer token
  r = extractMacList({ token: 'aabbccddeeff11223344556677889900' });
  ok(r.length === 0, 'no match inside longer hex token');

  // junk in, empty out
  ok(extractMacList(null).length === 0, 'null -> []');
  ok(extractMacList({ code: 0, msg: 'ok', data: {} }).length === 0, 'empty data -> []');

  // cyclic safety
  const cyc = { data: {} }; cyc.data.self = cyc;
  r = extractMacList(cyc);
  ok(Array.isArray(r), 'cyclic object does not hang');
}

/* ── Blocked tab = deny-list ── */
ok(/function getBlockedMacList/.test(appSrc), 'getBlockedMacList exists');
ok(/blockedMacs/.test(appSrc) && /portalBlockedMacs/.test(appSrc), 'union covers local + portal');
ok(/const blockedCount = getBlockedMacList\(\)\.length/.test(appSrc), 'chip counts the deny-list');
ok(!/const blockedCount = list\.filter\(c => isMacBlocked/.test(appSrc), 'old online-filter count removed');
ok(/if \(filter === 'blocked'\) return renderBlockedCells\(q\)/.test(appSrc), "renderMcCells routes 'blocked' to renderBlockedCells");
ok(/function renderBlockedCells/.test(appSrc), 'renderBlockedCells exists');
ok(/data-unblock=/.test(appSrc), 'blocked rows carry an Unblock action');
ok(/t\('mc\.blockEmpty'\)/.test(appSrc), 'blocked empty state has its own message');
ok(!/No online clients/.test(appSrc) || /mc\.blockEmpty/.test(appSrc), 'blocked tab no longer says "No online clients"');
ok(/async function unblockMac\(mac\)/.test(appSrc), 'unblockMac exists');
ok(/unblockMac[\s\S]{0,400}clientUnblockSso/.test(appSrc), 'unblockMac calls the SSO unblock');
ok(/unblockMac[\s\S]{0,400}dottedMac/.test(appSrc), 'unblockMac sends dotted MAC');
ok(/'mc\.blockEmpty'/.test(appSrc) && /'mc\.blockLocal'/.test(appSrc) && /'mc\.blockPortal'/.test(appSrc), 'i18n keys present');
ok(/\.mc-ico\.cst-blocked/.test(cssSrc), 'cst-blocked tile style exists');
ok(/onProjectChange[\s\S]{0,200}portalBlockedMacs = null/.test(appSrc), 'project switch clears stale portal list');

console.log(`\nv15117: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

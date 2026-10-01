/**
 * fix10 test — manual MAC block / unblock (portal mac_filter).
 * Verified 2026-10-01 from the user's DevTools captures:
 * - Block:   POST /enet/conf/group/{gid}/mac_filter, params {type:'deny', macList:[{mac: colon-lowercase}]}
 * - Unblock: DELETE (inner method) same path, querys {group_id, mac: dotted-lowercase, type:'global'}
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

/* Extract a method body from the Api object and eval it as a standalone function */
function extractFn(src, name) {
  const re = new RegExp(name + '\\(([^)]*)\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0, i = m.index + m[0].length - 1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  const body = src.slice(m.index + m[0].length, i);
  return new Function(m[1], body);
}

/* ── Block envelope ── */
const blockEnv = extractFn(apiSrc, 'ssoBlockEnvelope');
ok(typeof blockEnv === 'function', 'ssoBlockEnvelope exists');
if (blockEnv) {
  const e = blockEnv(6752877, '62:22:3f:a9:9f:14');
  ok(e.api === '/enet/conf/group/6752877/mac_filter', 'block api path has groupId');
  ok(e.method === 'POST', 'block inner method is POST');
  ok(e.authParams && e.authParams.method === 'POST', 'block authParams method POST');
  ok(e.module === 'default', 'block module default');
  ok(e.params && e.params.type === 'deny', 'block params.type deny');
  ok(e.params && Array.isArray(e.params.macList) && e.params.macList[0].mac === '62:22:3f:a9:9f:14',
     'block macList has the colon MAC');
  ok(e.querys && e.querys.lang === 'en' && e.querys.cloudType === 'smb', 'block querys lang/cloudType');
  // MAC lowercased by the envelope
  const e2 = blockEnv(6752877, '62:22:3F:A9:9F:14');
  ok(e2.params.macList[0].mac === '62:22:3f:a9:9f:14', 'block MAC lowercased');
}

/* ── Unblock envelope ── */
const unblockEnv = extractFn(apiSrc, 'ssoUnblockEnvelope');
ok(typeof unblockEnv === 'function', 'ssoUnblockEnvelope exists');
if (unblockEnv) {
  const e = unblockEnv(6752877, '6222.3fa9.9f14');
  ok(e.api === '/enet/conf/group/6752877/mac_filter', 'unblock api path has groupId');
  ok(e.method === 'DELETE', 'unblock inner method is DELETE');
  ok(e.authParams && e.authParams.method === 'DELETE', 'unblock authParams method DELETE');
  ok(e.module === 'default', 'unblock module default');
  ok(e.querys && e.querys.group_id === 6752877, 'unblock querys.group_id');
  ok(e.querys && e.querys.mac === '6222.3fa9.9f14', 'unblock querys.mac dotted');
  ok(e.querys && e.querys.type === 'global', 'unblock querys.type global');
  ok(e.querys && e.querys.lang === 'en' && e.querys.cloudType === 'smb', 'unblock querys lang/cloudType');
  const e2 = unblockEnv(6752877, '6222.3FA9.9F14');
  ok(e2.querys.mac === '6222.3fa9.9f14', 'unblock MAC lowercased');
}

/* ── colonMac helper ── */
ok(/const colonMac = s =>/.test(appSrc), 'colonMac helper exists');
{
  // normMac replicated (same one-liner as app.js) to test colonMac logic
  const normMac = s => String(s || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  const colonMac = s => {
    const h = normMac(s);
    return h.length === 12 ? (h.match(/../g) || []).join(':').toLowerCase() : '';
  };
  ok(colonMac('62:22:3F:A9:9F:14') === '62:22:3f:a9:9f:14', 'colonMac from colon input');
  ok(colonMac('6222.3fa9.9f14') === '62:22:3f:a9:9f:14', 'colonMac from dotted input');
  ok(colonMac('62-22-3f-a9-9f-14') === '62:22:3f:a9:9f:14', 'colonMac from dash input');
  ok(colonMac('abc') === '', 'colonMac invalid -> empty');
  ok(colonMac('') === '', 'colonMac empty -> empty');
}

/* ── Client detail buttons ── */
ok(appSrc.includes('mc-sheet-block'), 'detail sheet has Block button');
ok(appSrc.includes('mc-sheet-unblock'), 'detail sheet has Unblock button');
ok(appSrc.includes("querySelector('#mc-sheet-block')"), 'Block button wired');
ok(appSrc.includes("querySelector('#mc-sheet-unblock')"), 'Unblock button wired');
ok(/async function blockClient/.test(appSrc), 'blockClient exists');
ok(/async function unblockClient/.test(appSrc), 'unblockClient exists');
ok(/function isMacBlocked/.test(appSrc), 'isMacBlocked exists');
ok(/function setMacBlocked/.test(appSrc), 'setMacBlocked exists');

/* ── i18n ── */
for (const k of ['block.btn', 'block.confirm', 'block.done', 'unblock.btn', 'unblock.confirm', 'unblock.done']) {
  ok(appSrc.includes("'" + k + "'"), 'i18n ' + k + ' exists');
}

/* ── CSS ── */
ok(cssSrc.includes('.ios-sheet-btn'), 'ios-sheet-btn CSS class exists');

console.log(`\nfix10: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

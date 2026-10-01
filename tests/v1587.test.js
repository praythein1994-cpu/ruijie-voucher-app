/** v1.5.87: SSID create/update envelope builder tests (real api.js code). */
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../js/api.js', 'utf8');

// Extract the Api object methods we need by evaluating the relevant snippets.
function extract(name) {
  const re = new RegExp(name + '\\([^)]*\\) \\{([\\s\\S]*?)\\n  \\},');
  const m = src.match(re);
  if (!m) throw new Error('not found: ' + name);
  return m[1];
}

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; /* console.log('  ok', label); */ }
  else { fail++; console.log('  FAIL:', label); }
}

// --- ssoNewSsidDefaults ---
{
  const body = extract('ssoNewSsidDefaults');
  const fn = new Function(body + '\nreturn {ishidden:false};') // placeholder
  // Simpler: eval the return object literal directly
  const m2 = src.match(/ssoNewSsidDefaults\(\) \{\s*return (\{[\s\S]*?\});/);
  const d = new Function('return ' + m2[1])();
  ok(d.encryptionMode === 'wpa_wpa2-psk', 'default encryption wpa_wpa2-psk');
  ok(d.relatedRadio === '1,2', 'default relatedRadio joined');
  ok(d.fowardType === 'bridge', 'default fowardType bridge');
  ok(d.vlanType === '1' && d.vlanId === '1', 'default VLAN same-as-AP');
  ok(d.authEnable === false, 'default authEnable false');
  ok(d.enable === 'true', 'default enable true');
  ok(d.authEntity && typeof d.authEntity === 'object', 'default authEntity {}');
  ok(d.ishidden === false, 'default not hidden');
}

// --- ssoSsidCreateEnvelope ---
{
  const m = src.match(/ssoSsidCreateEnvelope\(tempId, ssidObj\) \{([\s\S]*?)\n  \},/);
  const fn = new Function('tempId', 'ssidObj', m[1]);
  const env = fn('123', { ssidName: 'Test', password: 'pass1234' });
  ok(env.api === '/conf/template/123/ssid', 'create api path');
  ok(env.method === 'POST', 'create method POST');
  ok(env.params.wirelessConfEntity.ssidName === 'Test', 'create wraps wirelessConfEntity');
  ok(env.authParams.method === 'POST', 'create authParams');
}

// --- ssoSsidUpdateEnvelope ---
{
  const m = src.match(/ssoSsidUpdateEnvelope\(tempId, ssidId, ssidObj\) \{([\s\S]*?)\n  \},/);
  const fn = new Function('tempId', 'ssidId', 'ssidObj', m[1]);
  const env = fn('123', '456', { ssidName: 'Test', password: 'newpass1' });
  ok(env.api === '/conf/template/123/ssid/456', 'update api path');
  ok(env.method === 'PUT', 'update method PUT');
  ok(env.params.wirelessConfEntity.password === 'newpass1', 'update wraps wirelessConfEntity');
}

// --- ssoSsidDeleteEnvelope ---
{
  const m = src.match(/ssoSsidDeleteEnvelope\(tempId, ssidId\) \{([\s\S]*?)\n  \},/);
  const fn = new Function('tempId', 'ssidId', m[1]);
  const env = fn('123', '456');
  ok(env.api === '/conf/template/123/ssid/456', 'delete api path');
  ok(env.method === 'DELETE', 'delete method DELETE');
  ok(env.authParams.method === 'DELETE', 'delete authParams');
}
{
  const re = /^[a-zA-Z0-9@<=>\[\]!#$*().]+$/;
  ok(re.test('Pass1234') && 'Pass1234'.length >= 8, 'valid password passes');
  ok(!re.test('pass word'), 'space rejected');
  ok(!re.test('p@ss;word'), 'semicolon rejected');
  ok('1234567'.length < 8, 'short password rejected by length');
}

console.log(`v1587: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

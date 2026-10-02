/* v1.5.144 (app): owner login PIN — praythein profile PIN-gated at the login
 * gate and the profile form; 6-digit PIN stored as SHA-256 hex (pinHash) on
 * all 3 tiers; setup is strict (server must echo the hash on every tier).
 * v1.5.144 (proxy): pinHash accepted/validated/stored in profiles. */
'use strict';
const fs = require('fs');
const path = require('path');

const results = [];
const ok = (name, cond) => results.push([name, !!cond]);

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const api = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');

/* ── Extract real functions from app.js and run them in node ── */
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
const shaSrc = extractFn(js, 'function sha256hex(str)');
const pinHashSrc = extractFn(js, 'async function pinHash(pin)');
ok('sha256hex extractable', !!shaSrc);
ok('pinHash extractable', !!pinHashSrc);
let sha256hex = null, pinHash = null;
try {
  eval(shaSrc + '\n' + pinHashSrc + '\nsha256hex = sha256hex; pinHash = pinHash;');
} catch (e) { ok('eval of hash fns: ' + e.message, false); }

(async () => {
  // ── SHA-256 correctness (known vector: sha256("123456")) ──
  const VEC = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  if (sha256hex) ok('sha256hex("123456") matches known vector', sha256hex('123456') === VEC);
  if (pinHash) ok('pinHash falls back to pure JS in node, same vector', (await pinHash('123456')) === VEC);
  if (pinHash) ok('pinHash rejects nothing: 6-digit ok', /^[0-9a-f]{64}$/.test(await pinHash('000000')));

  // ── Proxy: profiles.js behavior ──
  const Profiles = require('../proxy/profiles');
  ok('PROFILE_FIELDS includes pinHash', Profiles.PROFILE_FIELDS.includes('pinHash'));
  const base = { name: 'praythein', appid: 'a1', secret: 's1', email: 'a@b.c', password: 'p' };
  ok('validate: missing pinHash ok', Profiles.validateProfile(base) === null);
  ok('validate: empty pinHash ok', Profiles.validateProfile({ ...base, pinHash: '' }) === null);
  ok('validate: 64-hex pinHash ok', Profiles.validateProfile({ ...base, pinHash: VEC }) === null);
  ok('validate: short pinHash rejected', Profiles.validateProfile({ ...base, pinHash: '123' }) === 'pinHash');
  ok('validate: non-hex rejected', Profiles.validateProfile({ ...base, pinHash: 'z'.repeat(64) }) === 'pinHash');
  ok('validate: plaintext PIN rejected', Profiles.validateProfile({ ...base, pinHash: '123456' }) === 'pinHash');
  const built = Profiles.buildProfile({ ...base, pinHash: VEC.toUpperCase() });
  ok('buildProfile keeps valid hash, lowercased', built.pinHash === VEC);
  ok('buildProfile blanks garbage hash', Profiles.buildProfile({ ...base, pinHash: 'nope' }).pinHash === '');
  ok('sanitizeProfile passes pinHash through', Profiles.sanitizeProfile({ ...base, pinHash: VEC }).pinHash === VEC);
  const store = Profiles.normalizeStore({ profiles: { praythein: { ...base, pinHash: VEC } } });
  ok('normalizeStore round-trips pinHash', store.profiles.praythein.pinHash === VEC);

  // ── Client api.js ──
  ok('pushRemote returns pinHash echo field', /const out = \{ proxy: 'error', github: 'skipped', pinHash: '' \}/.test(api));
  ok('pushRemote populates pinHash from server profile', /j\.profile\.pinHash/.test(api));
  ok('Profiles.validate requires pinHash for praythein', /normName\(p\.name\) === 'praythein'[\s\S]{0,120}?return 'pinHash'/.test(api));
  ok('Profiles.validate allows others without pinHash', /else if \(h && !\/\^/.test(api));

  // ── Login gate ──
  ok('doProfileLogin branches praythein to PIN', /normName\(res\.profile\.name\) === 'praythein'/.test(js));
  ok('unlock vs setup by pinHash presence', /pinShow\(hasPin \? 'unlock' : 'setup'/.test(js));
  ok('other profiles bypass PIN', /await applyProfile\(res\.profile\); return;/.test(js));
  ok('pinShow hides gate views', /'view-connect', 'view-profile', 'view-profile-new'/.test(js));
  ok('showProfileGate hides view-pin', /pinHide\(\); \/\/ v1\.5\.144/.test(js));

  // ── Strict server confirm (roaming PIN) ──
  ok('setup verifies server echo of pinHash', /String\(res\.pinHash \|\| ''\)\.toLowerCase\(\) === hash/.test(js));
  ok('setup requires render+github ok', /res\.proxy === 'ok' && res\.github === 'ok'/.test(js));
  ok('setup rolls phone back on server failure', /Profiles\.put\(st\.profile\)/.test(js));
  ok('setup shows sending state', /pin\.sending/.test(js));
  ok('setup fails with pin.serverFail', /pin\.serverFail/.test(js));
  ok('create/update verifies pinHash echo (pinOk)', /const pinOk = !wantPin/.test(js));
  ok('stale proxy gets pin.serverOld message', /pin\.serverOld/.test(js));

  // ── Unlock / setup logic ──
  ok('unlock compares hashes', /got && got === want/.test(js));
  ok('wrong PIN shakes + pin.wrong', /pinFail\('pin\.wrong'\)/.test(js));
  ok('setup confirms twice, mismatch resets', /pinFail\('pin\.mismatch'\)/.test(js));
  ok('digits-only, auto-submit at 6', /replace\(\/\\D\/g, ''\)\.slice\(0, 6\)/.test(js));
  ok('pin back returns to gate', /btn-pin-back/.test(js) && /showProfileGate\(\)/.test(js));

  // ── Profile form ──
  ok('form: pin fields exist', /id="pfn-pin-wrap"/.test(html) && /id="pfn-curpin"/.test(html) &&
    /id="pfn-pin"/.test(html) && /id="pfn-pin2"/.test(html));
  ok('form: pin wrap toggles on praythein name', /pfn-pin-wrap.*normName\(\$\('pfn-name'\)\.value\) !== 'praythein'/.test(js));
  ok('form: current PIN verified on update', /pin\.curWrong/.test(js));
  ok('form: create requires 6-digit + match', /pin\.need6/.test(js) && /pin\.mismatch/.test(js));
  ok('form: existing hash remembered, never displayed', /pfnExistingPinHash/.test(js) && !/pfn-pin"\)\.value = p\.pinHash/.test(js));
  ok('update form gated by PIN for praythein', /pinShow\('unlock', prof, \(\) => openProfileForm\('update', name\)\)/.test(js));

  // ── i18n ──
  for (const k of ['pin.unlockTitle', 'pin.unlockSub', 'pin.setupTitle', 'pin.setupSub',
                   'pin.setupConfirm', 'pin.wrong', 'pin.mismatch', 'pin.need6',
                   'pin.curPin', 'pin.newPin', 'pin.confirmPin', 'pin.curWrong',
                   'pin.sending', 'pin.serverFail', 'pin.serverOld']) {
    ok('i18n ' + k, js.includes("'" + k + "'"));
  }

  // ── HTML: PIN screen ──
  ok('view-pin screen exists', /id="view-pin" class="screen hidden"/.test(html));
  ok('view-pin has 6 dots', (html.match(/class="pin-dot"/g) || []).length === 6);
  ok('view-pin has numeric input', /id="pin-input"[^>]*inputmode="numeric"[^>]*maxlength="6"/.test(html));
  ok('view-pin has back link', /id="btn-pin-back"/.test(html));

  // ── CSS: phone-first + tablet separated (user rule) ──
  ok('phone-first pin styles', /\.pin-dots \{[^}]*display: flex/.test(css));
  ok('shake keyframes', /@keyframes pinshake/.test(css));
  ok('tablet via media query (auto)', /@media \(min-width: 768px\)[\s\S]{0,400}?html:not\(\[data-layout="phone"\]\) \.pin-dot/.test(css));
  ok('tablet via data-layout duplicate (forced)', /html\[data-layout="tablet"\] \.pin-dot/.test(css));

  // ── Report ──
  const fails = results.filter(r => !r[1]);
  console.log(`v15144: ${results.length - fails.length}/${results.length} passed` + (fails.length ? ' FAIL: ' + fails.map(f => f[0]).join(' | ') : ''));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(1); });

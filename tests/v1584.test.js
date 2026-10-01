// v1.5.84 AdBlock DNS VLAN tests — real extracted functions, mocked Store
const _store = {};
const Store = { load: () => _store, save: (o) => Object.assign(_store, o) };
const t = k => k, tx = (k, v) => k + JSON.stringify(v);
const AD_DNS_KEYS = { on: 'adDnsOn', backups: 'adDnsBackups', vlan: 'adDnsVlan', legacyBackup: 'adDnsBackup' };

const AD_DNS_DEFAULT_VLAN = '20';

function getAdDnsVlan() {
  let s = null;
  try { s = Store.load(); } catch (_) { s = null; }
  const v = s && s[AD_DNS_KEYS.vlan] != null ? String(s[AD_DNS_KEYS.vlan]).trim() : '';
  return /^\d+$/.test(v) ? v : AD_DNS_DEFAULT_VLAN;
}

function adDnsVlanTag(vlan) { return 'lan_' + String(vlan || '').trim(); }

function getAdDnsBackups() {
  let s = null;
  try { s = Store.load(); } catch (_) { s = null; }
  let b = s && s[AD_DNS_KEYS.backups];
  if (!b || typeof b !== 'object' || Array.isArray(b)) b = {};
  if (s && s[AD_DNS_KEYS.legacyBackup] != null && b['lan_20'] == null) {
    b = Object.assign({}, b, { 'lan_20': String(s[AD_DNS_KEYS.legacyBackup]) });
  }
  return b;
}

function adDnsNeedsBackup(cur, adDns) { return String(cur || '').trim() !== String(adDns); }

function getAdDns() {
  let s = null;
  try { s = Store.load(); } catch (_) { s = null; }
  const vlan = getAdDnsVlan();
  const tag = adDnsVlanTag(vlan);
  const backups = getAdDnsBackups();
  return {
    on: !!(s && s[AD_DNS_KEYS.on]),
    backup: backups[tag] != null ? String(backups[tag]) : '',
    vlan,
    tag,
  };
}
let pass = 0, fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + ' got ' + a + ' want ' + e); }
}
// default VLAN
for (const k of Object.keys(_store)) delete _store[k];
check('default-vlan', getAdDnsVlan(), '20');
check('default-tag', adDnsVlanTag(getAdDnsVlan()), 'lan_20');
check('tag-30', adDnsVlanTag('30'), 'lan_30');
// invalid stored values fall back to 20
_store[AD_DNS_KEYS.vlan] = 'abc'; check('bad-vlan-fallback', getAdDnsVlan(), '20');
_store[AD_DNS_KEYS.vlan] = ''; check('empty-vlan-fallback', getAdDnsVlan(), '20');
_store[AD_DNS_KEYS.vlan] = '30'; check('custom-vlan', getAdDnsVlan(), '30');
check('custom-tag', adDnsVlanTag(getAdDnsVlan()), 'lan_30');
// per-VLAN backups
for (const k of Object.keys(_store)) delete _store[k];
_store[AD_DNS_KEYS.backups] = { 'lan_20': '8.8.8.8', 'lan_30': '1.1.1.1' };
check('backup-lan20', getAdDns().backup, '8.8.8.8');
_store[AD_DNS_KEYS.vlan] = '30';
check('backup-lan30', getAdDns().backup, '1.1.1.1');
check('backup-tag', getAdDns().tag, 'lan_30');
// legacy single-backup migration (was always VLAN 20)
for (const k of Object.keys(_store)) delete _store[k];
_store[AD_DNS_KEYS.legacyBackup] = '9.9.9.9';
check('legacy-migrate', getAdDns().backup, '9.9.9.9');
check('legacy-tag', getAdDns().tag, 'lan_20');
// needsBackup logic unchanged
check('needs-backup', adDnsNeedsBackup('8.8.8.8', '94.140.14.14'), true);
check('no-backup-when-adguard', adDnsNeedsBackup('94.140.14.14', '94.140.14.14'), false);
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

// v1.5.115: portal blocklist read (shared across phones).
// The block/unblock WRITE envelopes are verified; the READ (GET on the
// same /mac_filter path) is the natural REST counterpart, NOT yet
// portal-verified — so clientBlocklistSso must never throw.
const fs = require('fs');
const path = require('path');
const apiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

function getFnBody(src, name) {
  const i = src.indexOf(name + '(');
  if (i < 0) throw new Error('missing ' + name);
  return src.slice(i, i + 1500);
}

describe('v1.5.115 portal blocklist read', () => {
  test('ssoBlocklistEnvelope is GET on the verified homescene path', () => {
    const b = getFnBody(apiSrc, 'ssoBlocklistEnvelope');
    expect(b).toMatch(/\/homescene\/mac_filter\//);
    expect(b).toMatch(/method: 'GET'/);
  });

  test('clientBlocklistSso never throws — returns null on failure', () => {
    const b = getFnBody(apiSrc, 'clientBlocklistSso');
    expect(b).toMatch(/ssoBlocklistEnvelope/);
    expect(b).toMatch(/catch/);
    expect(b).toMatch(/return null/);
    expect(b).toMatch(/extractMacList/);
  });

  test('extractMacList helper exists and matches MAC formats', () => {
    expect(apiSrc).toMatch(/function extractMacList/);
    const b = getFnBody(apiSrc, 'extractMacList');
    // v1.5.117: recurses through ALL keys (unknown nesting), not a fixed list
    expect(b).toMatch(/Object\.keys/);
    expect(b).toMatch(/depth/);
  });

  test('isMacBlocked checks portal list too', () => {
    const b = getFnBody(appSrc, 'isMacBlocked');
    expect(b).toMatch(/portalBlockedMacs/);
    expect(b).toMatch(/blockedMacs/);
  });

  test('refreshPortalBlocklist exists and re-renders', () => {
    expect(appSrc).toMatch(/async function refreshPortalBlocklist/);
    const b = getFnBody(appSrc, 'refreshPortalBlocklist');
    expect(b).toMatch(/clientBlocklistSso/);
    expect(b).toMatch(/renderMcList/);
  });

  test('portal blocklist refreshes on client load and after block/unblock', () => {
    const hits = (appSrc.match(/refreshPortalBlocklist\(\)/g) || []).length;
    expect(hits).toBeGreaterThan(2); // load + block + unblock
  });
});

describe('v1.5.116 expired-delete date picker', () => {
  test('pickExpireDate and endOfDayMs exist', () => {
    const appSrc = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'js', 'app.js'), 'utf8');
    expect(appSrc).toMatch(/function pickExpireDate/);
    expect(appSrc).toMatch(/function endOfDayMs/);
    expect(appSrc).toMatch(/delExpiredPickDate/);
  });
  test('deleteExpiredVouchers uses the picked date', () => {
    const appSrc = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'js', 'app.js'), 'utf8');
    const i = appSrc.indexOf('async function deleteExpiredVouchers()');
    const body = appSrc.slice(i, i + 1200);
    expect(body).toMatch(/pickExpireDate/);
    expect(body).toMatch(/endOfDayMs/);
    expect(body).not.toMatch(/Date\.now\(\)/);
  });
});

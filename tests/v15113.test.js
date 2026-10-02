// v1.5.113: Delete Expired Vouchers — portal-verified bulk envelope.
// Source: user's Recorder capture 2026-10-01 23:14 +0630 (240 requests)
// of the live Cloud portal voucher page.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');

function getFnBody(name) {
  const i = src.indexOf(name + '(');
  if (i < 0) throw new Error('missing ' + name);
  return src.slice(i, i + 1200);
}

describe('v1.5.113 delete-expired envelopes', () => {
  test('ssoExpireCountEnvelope matches portal capture', () => {
    const b = getFnBody('ssoExpireCountEnvelope');
    // webproxy agent read path with group id
    expect(b).toMatch(/\/authconfig\/group\/.*\/api\/agent\/read/);
    // macc3 count suffix + POST
    expect(b).toMatch(/\/macc3\/getExpireVoucherCount\//);
    expect(b).toMatch(/httpMethod.*POST/);
    // expireTime in bodyParam
    expect(b).toMatch(/bodyParam.*expireTime/);
    expect(b).toMatch(/querys.*lang.*cloudType/s);
  });

  test('ssoDeleteExpiredEnvelope matches portal capture', () => {
    const b = getFnBody('ssoDeleteExpiredEnvelope');
    // webproxy agent write path with group id
    expect(b).toMatch(/\/authconfig\/group\/.*\/api\/agent\/write/);
    // macc3 batch delete suffix + DELETE
    expect(b).toMatch(/\/macc3\/batchDelete\/voucher\//);
    expect(b).toMatch(/httpMethod.*DELETE/);
    expect(b).toMatch(/bodyParam.*expireTime/);
  });

  test('voucherDeleteExpiredSso throws on non-zero portal code', () => {
    const b = getFnBody('voucherDeleteExpiredSso');
    expect(b).toMatch(/ssoDeleteExpiredEnvelope/);
    expect(b).toMatch(/throw new Error/);
  });

  test('voucherExpireCountSso throws on non-zero portal code', () => {
    const b = getFnBody('voucherExpireCountSso');
    expect(b).toMatch(/ssoExpireCountEnvelope/);
    expect(b).toMatch(/throw new Error/);
  });
});

describe('v1.5.113 extractExpireCount (app.js)', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  test('extractExpireCount helper exists and handles wrappings', () => {
    expect(appSrc).toMatch(/function extractExpireCount/);
    // accepts plain number, data.number, data.count etc.
    expect(appSrc).toMatch(/typeof d === 'number'/);
    expect(appSrc).toMatch(/expireCount/);
  });
  test('deleteExpiredVouchers uses bulk SSO call, no per-voucher loop', () => {
    const i = appSrc.indexOf('async function deleteExpiredVouchers()');
    expect(i).toBeGreaterThan(-1);
    const body = appSrc.slice(i, i + 1500);
    expect(body).toMatch(/voucherDeleteExpiredSso/);
    expect(body).toMatch(/voucherExpireCountSso/);
    expect(body).not.toMatch(/for \(const v of expired\)/);
    expect(body).not.toMatch(/Api\.voucherDelete\(/);
  });
});

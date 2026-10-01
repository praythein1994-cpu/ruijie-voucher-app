/**
 * v1.5.107: Portal recorder 403 fix.
 *
 * The recorder loaded https://cloud-as.ruijienetworks.com/macc5/ directly,
 * which returns 403 (nginx) without a portal session. It must go through
 * the SSO entry point (SsoSession.SSO_LOGIN_URL) like the SSO login does.
 * Also verifies the capture log survives the SSO redirect chain via
 * sessionStorage (CAS login -> ticket -> portal are full page loads).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const rec = fs.readFileSync(path.join(ROOT,
  'android/app/src/main/java/com/ruijie/voucher/PortalRecorder.java'), 'utf8');

describe('v1.5.107 recorder 403 fix', () => {
  test('does NOT load /macc5/ directly', () => {
    expect(rec).not.toMatch(/cloud-as\.ruijienetworks\.com\/macc5/);
  });

  test('uses the SSO entry point', () => {
    expect(rec).toMatch(/SsoSession\.SSO_LOGIN_URL/);
  });

  test('capture log persisted in sessionStorage (survives redirects)', () => {
    expect(rec).toMatch(/sessionStorage/);
    expect(rec).toMatch(/__nrLogs/);
  });

  test('static assets still skipped', () => {
    expect(rec).toMatch(/SKIP=/);
  });
});

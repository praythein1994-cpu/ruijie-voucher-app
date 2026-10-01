/**
 * v1.5.109: recorder opens portal only after SSO login.
 *
 * Root causes found from user's screenshots:
 * - /macc5/ loaded directly  -> 403 (nginx) without a portal session.
 * - /webproxy/sso/back loaded directly -> blank page (it's the ticket
 *   callback; without a fresh ticket it renders nothing).
 * Fix: RuijieBridge.startPortalRecorder() ensures SSO login first
 * (reuses the proven SSO dialog), then PortalRecorder loads /macc5/
 * with the session cookies in place.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const rec = fs.readFileSync(path.join(ROOT,
  'android/app/src/main/java/com/ruijie/voucher/PortalRecorder.java'), 'utf8');
const bridge = fs.readFileSync(path.join(ROOT,
  'android/app/src/main/java/com/ruijie/voucher/RuijieBridge.java'), 'utf8');

describe('v1.5.109 recorder SSO-first flow', () => {
  test('recorder loads the portal home /macc5/', () => {
    expect(rec).toMatch(/cloud-as\.ruijienetworks\.com\/macc5/);
  });

  test('recorder does NOT use the SSO callback URL directly', () => {
    expect(rec).not.toMatch(/SSO_LOGIN_URL/);
    expect(rec).not.toMatch(/webproxy\/sso\/back/);
  });

  test('bridge checks SSO login before opening recorder', () => {
    expect(bridge).toMatch(/SsoSession\.getInstance\(\)\.isLoggedIn\(\)/);
  });

  test('bridge runs SSO login dialog when not logged in', () => {
    expect(bridge).toMatch(/showLoginDialog/);
  });
});

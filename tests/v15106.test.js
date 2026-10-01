/**
 * v1.5.106: Portal network recorder — web-app side wiring.
 *
 * Verifies:
 *  1. The More menu contains a Recorder item (data-more="recorder").
 *  2. startNetworkRecorder() is defined and calls the native bridge.
 *  3. i18n strings for the recorder exist (my + en).
 *  4. window._recEvent toast handler is registered on start.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');

describe('v1.5.106 portal network recorder', () => {
  test('More menu has a Recorder item', () => {
    expect(html).toMatch(/data-more="recorder"/);
  });

  test('Recorder menu item has i18n spans', () => {
    expect(html).toMatch(/data-i18n="m\.recorder"/);
    expect(html).toMatch(/data-i18n="m\.recorderSub"/);
  });

  test('startNetworkRecorder is defined', () => {
    expect(appJs).toMatch(/function startNetworkRecorder\(\)/);
  });

  test('startNetworkRecorder calls the native bridge', () => {
    expect(appJs).toMatch(/RuijieBridge\.startPortalRecorder/);
  });

  test('recorder click handler is wired in the More menu', () => {
    expect(appJs).toMatch(/k === 'recorder'.*startNetworkRecorder/);
  });

  test('i18n strings exist for recorder (my + en)', () => {
    expect(appJs).toMatch(/'m\.recorder':\s*\{\s*my:\s*'[^']+',\s*en:\s*'[^']+'\s*\}/);
    expect(appJs).toMatch(/'m\.recorderSub':\s*\{\s*my:\s*'[^']+',\s*en:\s*'[^']+'\s*\}/);
    expect(appJs).toMatch(/'rec\.done':\s*\{\s*my:\s*'[^']+',\s*en:\s*'[^']+'\s*\}/);
  });

  test('_recEvent handler registered on start', () => {
    expect(appJs).toMatch(/window\._recEvent\s*=\s*function/);
  });

  test('graceful fallback when native bridge is absent (web tool)', () => {
    // must not throw when RuijieBridge is missing — shows a toast instead
    expect(appJs).toMatch(/startPortalRecorder[\s\S]{0,400}native bridge/);
  });
});

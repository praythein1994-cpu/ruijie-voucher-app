/* v1.5.118: Recorder native UI must be iOS Liquid Glass — never square
 * Android-style boxes. Guards the user's standing design rule for the
 * native PortalRecorder (floating ball + control panel + URL field).
 */
const fs = require('fs');
const path = require('path');

const rec = fs.readFileSync(path.join(__dirname,
  '..', 'android/app/src/main/java/com/ruijie/voucher/PortalRecorder.java'),
  'utf8');

const results = [];
const ok = (name, cond) => {
  results.push([name, !!cond]);
  if (!cond) console.log('FAIL:', name);
};

// Floating ball: true circle (OVAL), not a square box
ok('ball is a circle (OVAL drawable)',
  /ballBg\.setShape\(GradientDrawable\.OVAL\)/.test(rec));
ok('ball has fixed circular size',
  /new FrameLayout\.LayoutParams\(\s*ballSize,\s*ballSize\)/.test(rec));
ok('ball is NOT a square black box',
  !/floatBall\.setBackgroundColor\(Color\.parseColor\("#CC000000"\)\)/.test(rec));

// Panel: rounded glass sheet, not full-width square black bar
ok('panel uses rounded glass background',
  /panelBg\.setCornerRadius/.test(rec));
ok('panel is NOT square near-black',
  !/topWrap\.setBackgroundColor\(Color\.parseColor\("#E6000000"\)\)/.test(rec));
ok('panel floats with margins (iOS sheet)',
  /topLp\.leftMargin = sheetM/.test(rec));

// Buttons: circular/pill glass, not default Android Buttons
ok('glassIconBtn exists and makes OVAL buttons',
  /static Button glassIconBtn\(Activity a, String text\)/.test(rec)
  && /d\.setShape\(GradientDrawable\.OVAL\)/.test(rec));
ok('glassPillBtn exists for text buttons',
  /static Button glassPillBtn\(Activity a, String text\)/.test(rec));
ok('smallBtn (Android-style) is gone',
  !/static Button smallBtn\(/.test(rec));
ok('no setBackgroundColor(TRANSPARENT) square buttons remain',
  !/setBackgroundColor\(Color\.TRANSPARENT\)/.test(rec));

// URL field: rounded, not square
ok('URL field uses rounded glass background',
  /urlBg\.setCornerRadius/.test(rec));
ok('URL field is NOT a square box',
  !/urlInput\.setBackgroundColor\(Color\.parseColor\("#44FFFFFF"\)\)/.test(rec));

// Behavior preserved: drag, 1.5s long-press close, tap-to-panel
ok('ball drag handler kept', /ACTION_MOVE/.test(rec));
ok('1.5s long-press to close kept', /postDelayed\(ballLongPress, 1500\)/.test(rec));
ok('tap ball opens panel', /topWrap\.setVisibility\(View\.VISIBLE\)/.test(rec));

const failed = results.filter(r => !r[1]);
console.log(`v15118: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

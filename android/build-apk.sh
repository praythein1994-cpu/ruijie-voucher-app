#!/bin/bash
# Manual APK build without Gradle (zero network for build tools, reproducible).
# Usage: ./build-apk.sh
set -e
cd "$(dirname "$0")"

export JAVA_HOME="$HOME/tooling/jdk-17"
export PATH="$JAVA_HOME/bin:$PATH"
SDK="$HOME/tooling/android-sdk"
BT="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34"
APP=app/src/main
OUT=build/apk
KS="$HOME/.ruijie-voucher.keystore"
VERSION_CODE=84
VERSION_NAME="1.5.73"
OUT_NAME="ruijie-voucher-${VERSION_NAME}.apk"

echo "== 1. sync web app into assets =="
rm -rf "$APP/assets/www"
mkdir -p "$APP/assets/www"
cp ../index.html "$APP/assets/www/"
cp ../icon.svg ../apple-touch-icon.png "$APP/assets/www/"
cp -r ../css ../js "$APP/assets/www/"
cp -r ../sso-cover "$APP/assets/www/sso-cover"

echo "== 2. aapt2 compile res + link =="
rm -rf build && mkdir -p "$OUT" build/gen
"$BT/aapt2" compile --dir "$APP/res" -o build/res.zip
"$BT/aapt2" link -o "$OUT/base.apk" \
  -I "$PLATFORM/android.jar" \
  --manifest "$APP/AndroidManifest.xml" \
  -A "$APP/assets" \
  -R build/res.zip \
  --java build/gen \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME"

echo "== 3. javac =="
mkdir -p build/classes
"$JAVA_HOME/bin/javac" -encoding UTF-8 -source 8 -target 8 -nowarn \
  -classpath "$PLATFORM/android.jar" \
  -d build/classes \
  $(find "$APP/java" -name "*.java") $(find build/gen -name "*.java")

echo "== 4. d8 (dex) =="
mkdir -p build/dex
"$BT/d8" --lib "$PLATFORM/android.jar" --min-api 24 \
  --output build/dex \
  $(find build/classes -name "*.class")

echo "== 5. add classes.dex =="
python3 - "$OUT/base.apk" build/dex/classes.dex <<'EOF'
import sys, zipfile
apk, dex = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(apk, 'a', zipfile.ZIP_DEFLATED) as z:
    z.write(dex, 'classes.dex')
print("classes.dex added")
EOF

echo "== 6. zipalign =="
"$BT/zipalign" -f 4 "$OUT/base.apk" "$OUT/aligned.apk"

echo "== 7. apksigner sign =="
PASS_FILE=$(mktemp)
# apksigner reads one password per line: line1 = keystore pass, line2 = key pass
{ grep -E '^rvkStorePassword=' "$HOME/.gradle/gradle.properties" | cut -d= -f2-;
  grep -E '^rvkKeyPassword=' "$HOME/.gradle/gradle.properties" | cut -d= -f2-; } > "$PASS_FILE"
chmod 600 "$PASS_FILE"
"$BT/apksigner" sign --ks "$KS" --ks-pass "file:$PASS_FILE" \
  --key-pass "file:$PASS_FILE" \
  --out "$OUT/$OUT_NAME" "$OUT/aligned.apk"
rm -f "$PASS_FILE"

echo "== 8. verify =="
"$BT/apksigner" verify --print-certs "$OUT/$OUT_NAME" | head -5
ls -la "$OUT/$OUT_NAME"
echo "BUILD OK"

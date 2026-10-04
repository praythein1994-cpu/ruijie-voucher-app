# P Manager APK Build Script (Windows PowerShell)
# Ported from android/build-apk.sh
#
# PREREQUISITES:
#   1. $env:USERPROFILE/apk-build/ruijie-voucher.keystore  (signing key)
#   2. $env:USERPROFILE/apk-build/keystore-pass.txt        (2 lines: store pass, key pass)
#   3. $env:USERPROFILE/apk-build/profiles_key             (optional: profile sync key)
#   4. Android SDK with build-tools 34.0.0 and android-34 platform
#   5. Java 17
#
# USAGE: .\build-apk.ps1 [-VersionName "1.5.174"] [-VersionCode 175]

param(
    [string]$VersionName = "1.5.174",
    [int]$VersionCode = 175
)

$ErrorActionPreference = "Stop"
$BuildDir = "$env:USERPROFILE/apk-build"
$SrcDir = "$BuildDir/ruijie-voucher-app"
$SdkDir = "$env:LOCALAPPDATA/Android/Sdk"
$BT = "$SdkDir/build-tools/34.0.0"
$Platform = "$SdkDir/platforms/android-34"
$AppDir = "$SrcDir/android/app/src/main"
$OutDir = "$SrcDir/android/build/apk"
$BuildTmp = "$SrcDir/android/build"
$OutName = "ruijie-voucher-$VersionName.apk"

# Verify prerequisites
$Keystore = "$BuildDir/ruijie-voucher.keystore"
$PassFile = "$BuildDir/keystore-pass.txt"
if (-not (Test-Path $Keystore)) { Write-Host "ERROR: Keystore not found at $Keystore" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $PassFile)) { Write-Host "ERROR: Password file not found at $PassFile" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $BT)) { Write-Host "ERROR: Build-tools not found at $BT" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $Platform)) { Write-Host "ERROR: Platform not found at $Platform" -ForegroundColor Red; exit 1 }

# Update source (optional - skip if on a feature branch)
Write-Host "== 0. Update source =="
Push-Location $SrcDir
$currentBranch = & "C:\Program Files\Git\bin\git.exe" rev-parse --abbrev-ref HEAD 2>$null
if ($currentBranch -eq "main") {
    & "C:\Program Files\Git\bin\git.exe" pull origin main 2>&1 | Select-Object -Last 2
} else {
    Write-Host "On branch $currentBranch - skipping auto-pull" -ForegroundColor Yellow
}
Pop-Location

Write-Host "== 1. Sync web app into assets =="
Remove-Item -Recurse -Force "$AppDir/assets/www" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$AppDir/assets/www" | Out-Null
Copy-Item "$SrcDir/index.html" "$AppDir/assets/www/"
if (Test-Path "$SrcDir/icon.svg") { Copy-Item "$SrcDir/icon.svg" "$AppDir/assets/www/" }
if (Test-Path "$SrcDir/apple-touch-icon.png") { Copy-Item "$SrcDir/apple-touch-icon.png" "$AppDir/assets/www/" }
Copy-Item -Recurse "$SrcDir/css" "$AppDir/assets/www/"
Copy-Item -Recurse "$SrcDir/js" "$AppDir/assets/www/"
if (Test-Path "$SrcDir/sso-cover") { Copy-Item -Recurse "$SrcDir/sso-cover" "$AppDir/assets/www/sso-cover" }

Write-Host "== 1b. Inject profile sync key =="
$ProfilesKeyFile = "$BuildDir/profiles_key"
$ApiJs = "$AppDir/assets/www/js/api.js"
# Always restore placeholder first
$content = Get-Content $ApiJs -Raw -Encoding UTF8
$content = $content -replace "const BUILTIN_SYNC_KEY = '[^']*';", "const BUILTIN_SYNC_KEY = '';"
if (Test-Path $ProfilesKeyFile) {
    $key = (Get-Content $ProfilesKeyFile -Raw).Trim()
    $content = $content -replace "const BUILTIN_SYNC_KEY = '';", "const BUILTIN_SYNC_KEY = '$key';"
    Write-Host "Sync key injected"
} else {
    Write-Host "WARN: no profiles_key; APK will prompt for the sync key" -ForegroundColor Yellow
}
Set-Content $ApiJs $content -Encoding UTF8 -NoNewline

Write-Host "== 1c. Stamp APP_VERSION =="
$AppJs = "$AppDir/assets/www/js/app.js"
$content = Get-Content $AppJs -Raw -Encoding UTF8
$content = $content -replace "const APP_VERSION = '[^']*';", "const APP_VERSION = '$VersionName';"
Set-Content $AppJs $content -Encoding UTF8 -NoNewline

Write-Host "== 2. aapt2 compile + link =="
Remove-Item -Recurse -Force $BuildTmp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$BuildTmp/gen" | Out-Null
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
& "$BT/aapt2" compile --dir "$AppDir/res" -o "$BuildTmp/res.zip"
& "$BT/aapt2" link -o "$OutDir/base.apk" `
    -I "$Platform/android.jar" `
    --manifest "$AppDir/AndroidManifest.xml" `
    -A "$AppDir/assets" `
    -R "$BuildTmp/res.zip" `
    --java "$BuildTmp/gen" `
    --min-sdk-version 24 --target-sdk-version 34 `
    --version-code $VersionCode --version-name $VersionName

Write-Host "== 3. javac =="
New-Item -ItemType Directory -Force -Path "$BuildTmp/classes" | Out-Null
$javaFiles = (Get-ChildItem -Recurse "$AppDir/java" -Filter "*.java").FullName + (Get-ChildItem -Recurse "$BuildTmp/gen" -Filter "*.java").FullName
& javac -encoding UTF-8 -source 8 -target 8 -nowarn `
    -classpath "$Platform/android.jar" `
    -d "$BuildTmp/classes" `
    $javaFiles

Write-Host "== 4. d8 (dex) =="
New-Item -ItemType Directory -Force -Path "$BuildTmp/dex" | Out-Null
$classFiles = (Get-ChildItem -Recurse "$BuildTmp/classes" -Filter "*.class").FullName
& "$BT/d8" --lib "$Platform/android.jar" --min-api 24 `
    --output "$BuildTmp/dex" `
    $classFiles

Write-Host "== 5. Add classes.dex =="
Add-Type -AssemblyName System.IO.Compression.FileSystem
$apkPath = "$OutDir/base.apk"
$dexPath = "$BuildTmp/dex/classes.dex"
$zip = [System.IO.Compression.ZipFile]::Open($apkPath, 'Update')
try {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $dexPath, "classes.dex", [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
} finally { $zip.Dispose() }
Write-Host "classes.dex added"

Write-Host "== 6. zipalign =="
& "$BT/zipalign" -f 4 "$OutDir/base.apk" "$OutDir/aligned.apk"

Write-Host "== 7. apksigner sign =="
& "$BT/apksigner" sign --ks $Keystore --ks-pass "file:$PassFile" `
    --key-pass "file:$PassFile" `
    --out "$OutDir/$OutName" "$OutDir/aligned.apk"

Write-Host "== 8. Verify =="
& "$BT/apksigner" verify --print-certs "$OutDir/$OutName" | Select-Object -First 5

# Copy to your_files equivalent (Desktop for easy access)
$DesktopApk = "$env:USERPROFILE/Desktop/$OutName"
Copy-Item "$OutDir/$OutName" $DesktopApk -Force
Write-Host ""
Write-Host "BUILD OK: $OutDir/$OutName" -ForegroundColor Green
Write-Host "Copied to Desktop: $DesktopApk" -ForegroundColor Green

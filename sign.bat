@echo off
set KEYSTORE_PATH=frontend/android/app/tessera-lumen-release.jks
set APK_PATH=frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk
set SIGNED_APK=frontend/android/app/build/outputs/apk/release/app-release-signed.apk

echo [SIGN] Signing APK...
apksigner sign --ks %KEYSTORE_PATH% --out %SIGNED_APK% %APK_PATH%
echo [SIGN] Verifying Signature...
apksigner verify %SIGNED_APK%
pause

@echo off
echo [BUNDLE] Generating Android App Bundle (AAB)...
cd frontend/android
call gradlew bundleRelease
cd ../..
echo [BUNDLE] Done. AAB located in frontend/android/app/build/outputs/bundle/release/
pause

@echo off
echo [BUILD] Building Frontend...
cd frontend
call npm run build
echo [BUILD] Syncing with Capacitor...
call npx cap sync android
echo [BUILD] Building Android APK...
cd android
call gradlew assembleRelease
cd ../..
echo [BUILD] Done. APK located in frontend/android/app/build/outputs/apk/release/
pause

@echo off
setlocal
echo ========================================================
echo   TESSERA LUMEN: ANDROID BUILD SYSTEM (P9 DEBUG)
echo ========================================================

:: 1. ENFORCE JDK 21
set JAVA_HOME=C:\Users\User\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

:: 2. ENVIRONMENT SETUP
set ANDROID_HOME=C:\Users\User\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk

:: Default Build Settings
set BUILD_TYPE=debug
set GRADLE_TASK=assembleDebug
set APK_SUBFOLDER=debug
set APK_NAME=app-debug.apk
set DO_CLEAN=true

echo [TARGET: HUAWEI P9 / ANDROID SDK 22+]
echo [MODE: DEBUG + CLEAN]

:: 3. PHASE 1: FRONTEND BUILD
echo [1/3] Building Web Assets (Development Mode)...
pushd frontend
call npm install --quiet
call npm run build -- --mode development
echo [2/3] Syncing Capacitor Android Layer...
call npx cap sync android
popd

:: 4. PHASE 2: ANDROID COMPILE
echo [3/3] Compiling Debug APK...
pushd frontend\android

if "%DO_CLEAN%"=="true" (
    echo [CLEAN] Removing previous build artifacts...
    call gradlew.bat clean assembleDebug --no-daemon
) else (
    call gradlew.bat assembleDebug --no-daemon
)
popd

echo.
echo ========================================================
echo   BUILD PROCESS COMPLETE
echo ========================================================
set FINAL_APK=frontend\android\app\build\outputs\apk\%APK_SUBFOLDER%\%APK_NAME%
if exist %FINAL_APK% (
    echo SUCCESS: Debug APK for P9 testing ready at:
    echo   %FINAL_APK%
    echo.
    echo Next step: adb install -r %FINAL_APK%
) else (
    echo ERROR: Build failed. Check logs above for Gradle errors.
)
pause
endlocal

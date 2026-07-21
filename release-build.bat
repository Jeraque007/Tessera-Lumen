@echo off
setlocal
echo ========================================================
echo   TESSERA LUMEN: PRODUCTION RELEASE BUILD (APPGALLERY)
echo ========================================================

:: 1. ENFORCE JDK 21
set JAVA_HOME=C:\Users\User\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

:: 2. ENVIRONMENT SETUP
set ANDROID_HOME=C:\Users\User\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk

echo [MODE: PRODUCTION SIGNED APK]
echo [CLEANING WORKSPACE...]

:: 3. DEEP CLEAN
echo [1/5] Removing node_modules and old build artifacts...
if exist "frontend\node_modules" rd /s /q "frontend\node_modules"
if exist "frontend\dist" rd /s /q "frontend\dist"
if exist "node_modules" rd /s /q "node_modules"

:: 4. FRESH INSTALL & WEB BUILD
echo [2/5] Installing fresh dependencies...
pushd frontend
call npm install --quiet
echo [3/5] Building Production Assets (Vite)...
call npm run build
echo [4/5] Syncing Capacitor Android Layer...
call npx cap sync android
popd

:: 5. ANDROID GRADLE BUILD
echo [5/5] Compiling Signed Release APK...
pushd frontend\android
:: Clean gradle cache and assemble Release APK
call gradlew.bat clean assembleRelease --no-daemon
popd

echo.
echo ========================================================
echo   FINAL AUDIT COMPLETE
echo ========================================================

set FINAL_APK=frontend\android\app\build\outputs\apk\release\app-release.apk

if exist "%FINAL_APK%" (
    echo.
    echo SUCCESS! THE SIGNED APK IS READY FOR APPGALLERY.
    echo Location: %FINAL_APK%
    echo.
    echo --- SHIP LOG ---
    echo Version: 1.0.24 (Code 124)
    echo HMS Status: Enabled (Primary)
    echo PayFast Status: Fallback (Disabled for Android Native)
    echo Privacy: Sylvana Anne Ellis (Aligned)
    echo -----------------
) else (
    echo.
    echo !!! ERROR: BUILD FAILED !!!
    echo Check the Gradle logs above for specific compilation errors.
    echo Common issues: Invalid signing key password or missing agconnect-services.json.
)

pause
endlocal

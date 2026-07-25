@echo off
setlocal
echo ========================================================
echo   TESSERA LUMEN: PRO INCREMENTAL BUILD SYSTEM
echo ========================================================

:: 1. SET ENVIRONMENT
set JAVA_HOME=C:\Users\User\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set ANDROID_HOME=C:\Users\User\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%PATH%

:: Determine Build Type (Default to release)
set BUILD_TYPE=release
set GRADLE_TASK=assembleRelease
set APK_SUBFOLDER=release
set APK_NAME=app-release.apk

for %%x in (%*) do (
    if "%%x"=="debug" (
        set BUILD_TYPE=debug
        set GRADLE_TASK=assembleDebug
        set APK_SUBFOLDER=debug
        set APK_NAME=app-debug.apk
    )
)

echo [BUILD MODE: %BUILD_TYPE%]

:: 2. PHASE 1: VERSIONING
echo [1/6] VERSIONING: Incrementing build numbers...
node scripts/increment-version.js

:: 3. PHASE 2: INTEGRITY CHECK
echo [2/6] RESTORING: Ensuring Backend dependencies...
pushd backend
call npm install
popd

echo [3/6] RESTORING: Ensuring Frontend dependencies...
pushd frontend
call npm install
popd

:: 4. PHASE 3: DEPLOY (Build and Generate APK)
pushd frontend
if "%BUILD_TYPE%"=="debug" (
    echo [4/6] DEPLOYING: Building Development Web Assets...
    call npm run build -- --mode development
) else (
    echo [4/6] DEPLOYING: Building Production Web Assets...
    call npm run build
)

echo [5/6] DEPLOYING: Syncing to Native Android Layer...
call npx cap sync android
popd

:: 5. PHASE 4: COMPILE
echo [6/6] DEPLOYING: Compiling Final %BUILD_TYPE% APK...
pushd frontend\android
:: Check for clean argument
set DO_CLEAN=
for %%x in (%*) do (
    if "%%x"=="clean" set DO_CLEAN=clean
)

if defined DO_CLEAN (
    echo Performing Clean Build...
    call gradlew.bat clean %GRADLE_TASK% --no-daemon
) else (
    call gradlew.bat %GRADLE_TASK% --no-daemon
)
popd

echo.
echo ========================================================
echo   BUILD PROCESS COMPLETE
echo ========================================================
:: Check existence relative to the project root
set FINAL_APK=frontend\android\app\build\outputs\apk\%APK_SUBFOLDER%\%APK_NAME%
if exist %FINAL_APK% (
    echo SUCCESS: %BUILD_TYPE% APK ready at:
    echo   %FINAL_APK%
) else (
    echo ERROR: Build failed. Please check the logs above.
)
pause
endlocal

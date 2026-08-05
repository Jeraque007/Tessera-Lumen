@echo off
setlocal
echo ========================================================
echo   SOPHIA TAROT: APPGALLERY STORE PUBLICATION
echo ========================================================

:: 1. ENFORCE JDK 21
set JAVA_HOME=C:\Users\User\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

:: 2. BUILD ASSETS
echo [1/3] BUILDING: Preparing Production Web Assets...
pushd frontend
call npm run build
call npx cap sync android
popd

:: 3. GENERATE BUNDLE (AAB)
echo [2/3] BUNDLING: Generating Android App Bundle (AAB)...
pushd frontend\android
call gradlew.bat bundleRelease --no-daemon
popd

:: 4. FINALIZE
echo.
echo ========================================================
echo   PUBLICATION ASSETS READY
echo ========================================================
set FINAL_AAB=frontend\android\app\build\outputs\bundle\release\app-release.aab
if exist %FINAL_AAB% (
    echo SUCCESS: AAB bundle ready for upload at:
    echo   %FINAL_AAB%
    echo.
    echo [3/3] Please upload this file manually to Huawei AppGallery Connect.
) else (
    echo ERROR: Bundle generation failed.
)
pause
endlocal

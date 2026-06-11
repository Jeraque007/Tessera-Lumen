@echo off
echo === Tessera Lumen APK Build ===
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\User\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%PATH%

cd /d C:\Users\User\.kiro\Sophia-Tarot-App\frontend\android

echo Cleaning...
call gradlew.bat clean 2>nul

echo Building release APK...
call gradlew.bat assembleRelease --no-daemon

echo.
echo === BUILD COMPLETE ===
if exist app\build\outputs\apk\release\app-release.apk (
    echo SUCCESS: APK found at:
    echo   app\build\outputs\apk\release\app-release.apk
    dir app\build\outputs\apk\release\app-release.apk
) else (
    echo Checking for output...
    dir /s /b app\build\outputs\apk\release\*.apk 2>nul
    if errorlevel 1 (
        echo ERROR: No APK found. Check build output above for errors.
    )
)
pause
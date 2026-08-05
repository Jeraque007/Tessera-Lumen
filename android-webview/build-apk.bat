@echo off
echo === Tessera Lumen WebView APK Build ===
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%

echo Building release APK...
call gradlew.bat assembleRelease --no-daemon

echo.
if exist app\build\outputs\apk\release\app-release.apk (
    echo === BUILD SUCCESSFUL ===
    echo APK: app\build\outputs\apk\release\app-release.apk
    dir app\build\outputs\apk\release\app-release.apk
) else (
    echo === BUILD FAILED ===
    echo Check output above for errors.
)
pause
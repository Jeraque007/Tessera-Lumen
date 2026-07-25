@echo off
echo [RELEASE] Starting Release Process...
call build.bat
call sign.bat
echo [RELEASE] Release Ready.
pause

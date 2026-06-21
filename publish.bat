@echo off
echo [PUBLISH] Preparing for AppGallery...
call bundle.bat
echo [PUBLISH] AAB is ready for upload at frontend/android/app/build/outputs/bundle/release/
echo [PUBLISH] Please upload manually to AppGallery Connect.
pause

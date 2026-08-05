@echo off
setlocal
title Tessera Lumen: Deploy

echo ===================================================
echo   TESSERA LUMEN: PRODUCTION DEPLOY
echo ===================================================
echo.
echo   PayFast: payment gateway
echo   Supabase: users, payments, subscriptions
echo   Vercel: web app + privacy page + API functions
echo.
echo ===================================================
echo.

:: Deploy to Vercel (Vercel dashboard Root Directory = "frontend")
echo [1/1] Deploying to Vercel...
call npx -y vercel --prod --force --yes
if errorlevel 1 (
    echo.
    echo [ERROR] Vercel deploy failed.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   DEPLOY COMPLETE
echo.
echo   Web app live at: https://app.963.co.za
echo   Privacy page at: https://app.963.co.za/privacy
echo ===================================================
pause
endlocal
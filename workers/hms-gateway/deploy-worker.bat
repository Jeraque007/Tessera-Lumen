@echo off
echo ===================================================
echo   Deploying Sophia Tarot HMS Worker to Cloudflare
echo   Target: 70027000000111176
echo ===================================================

cd /d "%~dp0"

echo 1. Checking login status...
call npx wrangler whoami || (
    echo [ERROR] You are not logged in to Cloudflare.
    echo Please run 'npx wrangler login' first.
    pause
    exit /b 1
)

echo 2. Deploying bundled worker using hms-wrangler.toml...
call npx wrangler deploy -c hms-wrangler.toml

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   DEPLOYMENT SUCCESSFUL
    echo   The new modular architecture is now live!
    echo ===================================================
) else (
    echo.
    echo [ERROR] Deployment failed. Please check the logs above.
)

pause

@echo off
echo ===================================================
echo   Deploying Sophia Tarot HMS Worker to Cloudflare
echo   Target: 70027000000111176
echo ===================================================

:: Ensure we are in the worker directory
cd /d "%~dp0"
cd workers\hms-gateway

echo [DEBUG] Current Directory: %CD%

echo 1. Attempting Direct Deployment (Skipping login check due to API error)...
:: Using --config with full path to ensure we hit the right target
call npx wrangler deploy --config "%~dp0workers\hms-gateway\hms-wrangler.toml"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   DEPLOYMENT SUCCESSFUL
    echo   HMS Gateway is now live on 70027000000111176
    echo ===================================================
) else (
    echo.
    echo [ERROR] Deployment failed.
    echo If this was a login error, please run 'npx wrangler login' manually in a terminal.
)

pause

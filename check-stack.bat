@echo off
setlocal
title AUDIT

echo 1. CODE INTEGRITY (LINT)
pushd backend
call npm run lint >nul 2>&1
if errorlevel 1 (echo FAIL: Backend has syntax errors/missing imports) else (echo PASS: Backend syntax)
popd
pushd frontend
call npm run lint >nul 2>&1
if errorlevel 1 (echo FAIL: Frontend has linting issues) else (echo PASS: Frontend syntax)
popd

echo.
echo 2. LOCAL CONFIG
if exist "api\index.js" (echo PASS: api index) else (echo FAIL: api index)
if exist "vercel.json" (echo PASS: vercel config) else (echo FAIL: vercel config)

echo.
echo 2. DNS
nslookup verify.963.co.za >nul 2>&1
if errorlevel 1 (echo FAIL: gateway dns) else (echo PASS: gateway dns)
nslookup app.963.co.za >nul 2>&1
if errorlevel 1 (echo FAIL: frontend dns) else (echo PASS: frontend dns)

echo.
echo 3. LIVE PINGS
powershell -Command "$ErrorActionPreference = 'SilentlyContinue'; $res = Invoke-RestMethod -Uri 'https://verify.963.co.za/api/test'; if ($res.status -eq 'Gateway Online') { echo 'PASS: gateway online' } else { echo 'FAIL: gateway offline' }"
powershell -Command "$ErrorActionPreference = 'SilentlyContinue'; $res = Invoke-RestMethod -Uri 'https://verify.963.co.za/api/fx/rate'; if ($res.code) { echo 'PASS: currency active' } else { echo 'FAIL: currency inactive' }"

echo.
echo 4. BACKEND
powershell -Command "$ErrorActionPreference = 'SilentlyContinue'; $res = Invoke-RestMethod -Uri 'https://app.963.co.za/api/health'; if ($res.status -eq 'ok') { echo 'PASS: backend active' } else { echo 'FAIL: backend offline' }"

echo.
echo 5. TOOLS
where git >nul 2>&1
if errorlevel 1 (echo FAIL: git missing) else (echo PASS: git found)

echo.
echo AUDIT COMPLETE
pause
endlocal

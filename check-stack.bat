@echo off
title FULL STACK CONNECTION CHECK (GitHub + Vercel + Supabase)

echo ==========================================
echo        FULL STACK CONNECTION CHECK
echo ==========================================
echo.

echo [1/4] Checking Git installation...
git --version
if %errorlevel% neq 0 (
    echo ❌ Git NOT installed or not in PATH
) else (
    echo ✅ Git is installed
)

echo.
echo [2/4] Checking GitHub remote connection...
git remote -v
if %errorlevel% neq 0 (
    echo ❌ No Git repo found or no remote set
) else (
    echo ✅ Git remote detected
)

echo.
echo [3/4] Checking Vercel CLI login...
vercel whoami
if %errorlevel% neq 0 (
    echo ❌ Not logged into Vercel OR CLI not installed
) else (
    echo ✅ Vercel account connected
)

echo.
echo [4/4] Checking Supabase CLI...
supabase --version
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not installed
) else (
    echo Running Supabase status...
    supabase status
)

echo.
echo ==========================================
echo            NETWORK QUICK TEST
echo ==========================================

echo Testing GitHub reachability...
ping github.com -n 2

echo.
echo Testing Vercel reachability...
ping vercel.com -n 2

echo.
echo Testing Supabase API reachability...
ping supabase.com -n 2

echo.
echo ==========================================
echo DONE - REVIEW RESULTS ABOVE
echo ==========================================
pause
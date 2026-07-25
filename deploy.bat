@echo off
echo [1/2] DEPLOYING TO VERCEL (Frontend & Brain)...
:: Running from root to include the /api folder and use root vercel.json
call npx vercel --prod

echo [2/3] DEPLOYING TO CLOUDFLARE (HMS Gateway)...
pushd workers\hms-gateway
call npx wrangler deploy -c hms-wrangler.toml
popd

echo [3/3] DEPLOYING TO CLOUDFLARE (Privacy Worker)...
pushd workers\privacy
call npx wrangler deploy -c wrangler.jsonc
popd

echo.
echo ===================================================
echo   ALL DEPLOYMENTS COMPLETE
echo   Frontend: https://app.963.co.za
echo   Gateway:  https://verify.963.co.za
echo ===================================================
pause

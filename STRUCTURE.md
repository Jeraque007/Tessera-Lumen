# Sophia Tarot - Architecture Rules

## 1. API Routing Standards
- All backend routes must be mounted in `backend/server.js` AND `api/index.js` (for Vercel).
- **Core Path**: `/api` is the root for all functions.
- **Utility Routes**: `/languages`, `/translate`, `/free-check` must be mounted directly under `/api` to support the Frontend's `apiUrl()` helper.
- **PayFast**: `/api/payfast/...`

## 2. Dependency Management
- **ESM Only**: This project uses `"type": "module"`. Always use `import`/`export`.
- **Express Imports**: Every route file MUST explicitly `import express from "express"`.
- **Supabase**: Use the shared client in `backend/lib/supabase.js`.

## 3. Deployment Flow
1. Run `check-stack.bat` to verify syntax and connectivity.
2. Run `deploy.bat` to push to Vercel/Cloudflare.
3. Run `build-apk.bat` for native testing.

## 4. Environment Variables
- `SUPABASE_URL` & `SUPABASE_SECRET_KEY` are mandatory for both Backend and HMS-Worker.
- `HMS_REGION` must be "SG" for the current production environment.

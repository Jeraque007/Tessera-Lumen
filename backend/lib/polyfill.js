/**
 * SYSTEM ARCHITECTURE PROTECTION - POLYFILL
 * This file MUST be imported before any other dependencies.
 * Also bootstraps dotenv here so env vars are available before
 * any other module reads process.env at load time.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const _require = createRequire(import.meta.url);
const _dir = dirname(fileURLToPath(import.meta.url));
// Load .env from the backend root (one level up from lib/)
try {
  _require("dotenv").config({ path: resolve(_dir, "../.env") });
} catch (e) {
  console.warn("[Polyfill] dotenv load failed:", e.message);
}

import ws from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  console.log("[Polyfill] Injecting WebSocket for Node 20...");
  globalThis.WebSocket = ws;
}

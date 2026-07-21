/**
 * SYSTEM ARCHITECTURE PROTECTION - POLYFILL
 * This file MUST be imported before any other dependencies.
 */
import ws from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  console.log("[Polyfill] Injecting WebSocket for Node 20...");
  globalThis.WebSocket = ws;
}

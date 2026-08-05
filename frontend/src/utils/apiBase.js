import { Capacitor } from "@capacitor/core";

// API Base URLs
const GATEWAY_URL = "https://verify.963.co.za";

export function getApiBase() {
  // HYBRID ARCHITECTURE:
  // Native Android (APK) uses the Cloudflare Gateway to bypass China Firewall.
  // Web platforms use the relative path (Vercel).
  if (Capacitor.isNativePlatform()) {
    return GATEWAY_URL;
  }

  return "";
}

export async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function apiUrl(path) {
  const base = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If base is empty (relative proxy), just return path
  if (!base) return cleanPath;

  // If the base already ends with the start of the path, avoid doubling up
  // e.g. base: ".../api" and path: "/api/payfast" -> ".../api/payfast"
  const url = new URL(base);
  if (url.pathname !== "/" && cleanPath.startsWith(url.pathname)) {
      return url.origin + cleanPath;
  }

  return base + cleanPath;
}

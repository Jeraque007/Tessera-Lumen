// API Base URL - Moved to Cloudflare for global availability (China/UAE/Oman bypass)
const PRODUCTION_API = "https://verify.963.co.za";

export function getApiBase() {
  if (window.Capacitor?.isNativePlatform?.()) {
    return PRODUCTION_API;
  }
  return "";
}

export function apiUrl(path) {
  return getApiBase() + path;
}
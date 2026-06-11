// API Base URL - resolves correctly on both web (Vercel) and native (Capacitor APK)
// Web: relative "/api" works because Vercel routes it to serverless functions
// Native: must use absolute URL because the WebView serves from local assets

const PRODUCTION_API = "https://app.963.co.za";

export function getApiBase() {
  if (window.Capacitor?.isNativePlatform?.()) {
    return PRODUCTION_API;
  }
  // On web (Vercel), relative paths work fine
  return "";
}

export function apiUrl(path) {
  return getApiBase() + path;
}
// API Base URLs
// PRODUCTION: Main gateway for live users
const PRODUCTION_API = "https://verify.963.co.za";

// STAGING: Used for sandbox testing and debug builds
// Update this if you have a separate staging server (e.g., https://staging-verify.963.co.za)
const STAGING_API = "https://verify.963.co.za";

export function getApiBase() {
  // If we are on a native device (APK)
  if (window.Capacitor?.isNativePlatform?.()) {
    // import.meta.env.DEV is true when Vite is built with --mode development
    if (import.meta.env.DEV) {
      console.log("[API] Using STAGING/DEBUG environment");
      return STAGING_API;
    }
    return PRODUCTION_API;
  }

  // On the web (Vercel/Localhost), use empty string for relative proxying
  return "";
}

export function apiUrl(path) {
  const base = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return base + cleanPath;
}

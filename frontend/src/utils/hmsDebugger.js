/**
 * HMS IAP Diagnostic Tool
 * Helps identify why IAP might not be activating on specific devices.
 */
export async function runHmsDiagnostics() {
  const results = {
    platform: window.Capacitor?.getPlatform?.() || "web",
    isNative: window.Capacitor?.isNativePlatform?.() || false,
    hmsReady: window.__HMS_READY,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  if (!results.isNative) return { ...results, error: "Not a native platform" };

  try {
    const { registerPlugin } = await import("@capacitor/core");
    const HuaweiIap = registerPlugin("HuaweiIap");

    if (!HuaweiIap) {
      return { ...results, error: "HuaweiIap plugin not found in Capacitor" };
    }

    const env = await HuaweiIap.isEnvReady();
    return {
      ...results,
      isEnvReadyResult: env,
      status: env.status,
      returnCode: env.returnCode,
      advice: env.returnCode === 1 ? "HMS Core not installed or outdated" : (env.returnCode === 6 ? "User not logged in or account region mismatch" : "Refer to HMS documentation for code " + env.returnCode)
    };
  } catch (e) {
    return { ...results, error: e.message };
  }
}

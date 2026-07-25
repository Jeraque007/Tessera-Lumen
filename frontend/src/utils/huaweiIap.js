import { registerPlugin } from "@capacitor/core";

const HuaweiIap = registerPlugin("HuaweiIap");

export const productIds = {
  consumables: [
    "Quick.Insight",
    "Past.Present.Future",
    "Deep.Dive",
    "Astrological.Chart.Reading"
  ],
  subscriptions: [
    "10.Readings_Month",
    "20.Readings_Month",
    "30.Readings_Month1"
  ]
};

export async function checkIapEnv() {
  if (!window.Capacitor?.isNativePlatform?.()) {
    console.log("[HMS] Not a native platform, skipping HMS check");
    return false;
  }
  if (!HuaweiIap) {
    console.error("[HMS] HuaweiIap plugin NOT registered in Capacitor");
    if (window.__HMS_DEBUG) alert("Error: HuaweiIap plugin not found. Check MainActivity registration.");
    return false;
  }
  try {
    console.log("[HMS] checkIapEnv starting...");
    const res = await HuaweiIap.isEnvReady();
    console.log("[HMS] isEnvReady result:", JSON.stringify(res));
    // 0 means environment is ready and HMS is available
    const isReady = res.status === 0 && res.returnCode === 0;
    if (!isReady) {
      console.warn(`[HMS] Env NOT ready. Status: ${res.status}, Return: ${res.returnCode}`);
    }
    return isReady;
  } catch (e) {
    console.error("[HMS] isEnvReady call failed:", e.message || e);
    return false;
  }
}

export async function buyProduct(productId, type = 0) {
  if (!window.Capacitor?.isNativePlatform?.()) {
    throw new Error("HMS IAP is only available on native devices");
  }
  try {
    console.log(`[HMS] buyProduct starting for ${productId} (type ${type})`);
    const res = await HuaweiIap.buyProduct({ productId, type });
    if (!res) {
      console.error("[HMS] buyProduct: Native returned null response");
      throw new Error("HMS IAP returned null response");
    }
    console.log("[HMS] buyProduct: Success - purchaseData length:", res.purchaseData?.length);
    return res;
  } catch (e) {
    console.error(`[HMS] buyProduct ERROR for ${productId}:`, e.message || e);
    throw e;
  }
}

export async function consumePurchase(purchaseToken) {
  try {
    await HuaweiIap.consumePurchase({ purchaseToken });
    return true;
  } catch (e) {
    console.error("Huawei IAP Consume error:", e);
    return false;
  }
}

export async function restorePurchases(type = 0) {
  try {
    const res = await HuaweiIap.getOwnedPurchases({ type });
    return {
      dataList: res.purchaseDataList || [],
      signatureList: res.signatureList || []
    };
  } catch (e) {
    console.error("Huawei IAP Restore error:", e);
    return { dataList: [], signatureList: [] };
  }
}

/**
 * Debug helper to see raw HMS output in console
 */
export async function debugOwnedPurchases() {
  const res = await HuaweiIap.getOwnedPurchases({ type: 0 });
  console.log("RAW HMS DEBUG:", JSON.stringify(res, null, 2));
  return res;
}

/**
 * Fetch localized product info (prices in user's currency) from Huawei IAP.
 * @param {string[]} productIds - Array of product IDs
 * @param {number} type - 0: consumable, 2: subscription
 * @returns {Promise<Array<{productId, productName, price, currency, microsPrice}>>}
 */
export async function getProductInfo(productIds, type = 0) {
  try {
    const res = await HuaweiIap.getProductInfo({
      productIds: JSON.stringify(productIds),
      type
    });
    return res.products || [];
  } catch (e) {
    console.error("Huawei getProductInfo failed:", e);
    return [];
  }
}

export function isHmsDevice() {
  if (!window.Capacitor?.isNativePlatform?.()) {
    return false;
  }
  // If the async check explicitly failed, do not attempt HMS IAP
  if (window.__HMS_READY === false) {
    return false;
  }
  // If explicitly ready, use it
  if (window.__HMS_READY === true) {
    return true;
  }
  // Fallback: If it's a Huawei/Honor device or has HMS in userAgent, assume yes for initial UI
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("huawei") || ua.includes("honor") || ua.includes("hms") || ua.includes("appgallery");
}

/**
 * Async check if HMS IAP is available. Call once on app startup.
 * Sets window.__HMS_READY for sync access later.
 */
export async function checkHmsReady() {
  if (!window.Capacitor?.isNativePlatform?.()) {
    window.__HMS_READY = false;
    return false;
  }
  try {
    const res = await HuaweiIap.isEnvReady();
    const isReady = res.status === 0 && res.returnCode === 0;
    window.__HMS_READY = isReady;

    // Diagnostic Alert for testing phase
    if (!isReady && window.__HMS_DEBUG) {
      alert(`HMS Check: Status ${res.status}, Return ${res.returnCode}. (0,0 expected)`);
    }

    console.log("[HMS] checkHmsReady: " + isReady + " | Status: " + res.status + " | Return: " + res.returnCode);
    return isReady;
  } catch (e) {
    console.log("[HMS] checkHmsReady: Error - " + (e.message || e));
    window.__HMS_READY = false;
    return false;
  }
}

/**
 * Redeliver strategy: Check for undelivered consumables and active subscriptions.
 * Grant access to the user if any valid purchase is found.
 */
export async function redeliverPurchases() {
  if (!window.Capacitor?.isNativePlatform?.()) return { paid: false, sub: false };
  let hasPaid = false;
  let hasSub = false;

  try {
    // 1. Check Consumables (Type 0)
    const conRes = await HuaweiIap.getOwnedPurchases({ type: 0 });
    const conList = conRes?.purchaseDataList || [];
    const conSigs = conRes?.signatureList || [];

    for (let i = 0; i < conList.length; i++) {
      const dataStr = conList[i];
      const data = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
      if (data.purchaseState === 0) {
        console.log("[HMS] Undelivered consumable found:", data.productId);
        hasPaid = true;
        localStorage.setItem("tl_is_paid", "true");

        // Attempt to verify in background
        try {
          const { verifyWithBackend } = await import("./paymentUtils.js");
          const userStr = localStorage.getItem("tl_user");
          const user = userStr ? JSON.parse(userStr) : null;
          await verifyWithBackend({ purchaseData: dataStr, signature: conSigs[i] }, user);
        } catch (vErr) {
          console.warn("[HMS] Background verification failed during redelivery:", vErr.message);
        }

        await HuaweiIap.consumePurchase({ purchaseToken: data.purchaseToken });
      }
    }

    // 2. Check Subscriptions (Type 2)
    const subRes = await HuaweiIap.getOwnedPurchases({ type: 2 });
    const subList = subRes?.purchaseDataList || [];
    if (subList.length > 0) {
      console.log("[HMS] Active subscription found during redelivery");
      hasSub = true;
      localStorage.setItem("tl_is_paid", "true");
    }
  } catch (e) {
    console.error("[HMS] Redelivery check failed:", e.message);
  }

  return { paid: hasPaid, sub: hasSub };
}

/**
 * Consume any orphaned/unconsumed consumable purchases.
 * HMS blocks new consumable purchases until existing ones are consumed.
 * Call this on app startup to clear stuck purchases from failed transactions.
 */
export async function consumeOrphanedPurchases() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  try {
    const res = await HuaweiIap.getOwnedPurchases({ type: 0 });
    // Support both field names
    const purchases = res?.purchaseDataList || res?.inAppPurchaseDataList || [];
    
    if (purchases.length === 0) {
      console.log("[HMS] No orphaned consumable purchases found");
      return;
    }

    console.log(`[HMS] Found ${purchases.length} unconsumed purchase(s), consuming...`);
    
    for (let i = 0; i < purchases.length; i++) {
      try {
        const data = typeof purchases[i] === "string" ? JSON.parse(purchases[i]) : purchases[i];
        const token = data.purchaseToken;
        if (token) {
          await HuaweiIap.consumePurchase({ purchaseToken: token });
          console.log(`[HMS] Consumed orphaned purchase: ${data.productId || "unknown"}`);
        }
      } catch (e) {
        console.error("[HMS] Failed to consume orphaned purchase:", e);
      }
    }
  } catch (e) {
    console.log("[HMS] Could not check for orphaned purchases:", e.message || e);
  }
}

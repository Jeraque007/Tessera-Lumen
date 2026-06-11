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
  try {
    const res = await HuaweiIap.isEnvReady();
    return res.status === 0;
  } catch (e) {
    console.error("Huawei IAP Env not ready:", e);
    return false;
  }
}

export async function buyProduct(productId, type = 0) {
  try {
    const res = await HuaweiIap.buyProduct({ productId, type });
    return res;
  } catch (e) {
    console.error("Huawei IAP Purchase error:", e);
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
    return res;
  } catch (e) {
    console.error("Huawei IAP Restore error:", e);
    return [];
  }
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

/**
 * Check if we are running on a device with HMS Core (Huawei IAP available).
 * Returns true ONLY if native AND HMS IAP environment is ready.
 * Use checkHmsReady() for async verification before purchase.
 */
export function isHmsDevice() {
  // Must be native platform AND have previously confirmed HMS
  if (!window.Capacitor?.isNativePlatform?.()) return false;
  // Check if HMS was confirmed ready (set by checkHmsReady on app load)
  return window.__HMS_READY === true;
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
    window.__HMS_READY = res.status === 0;
    console.log("[HMS] IAP environment ready:", window.__HMS_READY);
    return window.__HMS_READY;
  } catch (e) {
    console.log("[HMS] IAP not available:", e.message || e);
    window.__HMS_READY = false;
    return false;
  }
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
    const purchases = res?.inAppPurchaseDataList || res?.purchaseDataList || [];
    const sigs = res?.inAppDataSignatureList || res?.signatureList || [];
    
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

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
    "30.Readings_Month"
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

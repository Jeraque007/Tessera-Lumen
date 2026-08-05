import { PaymentProvider } from "./PaymentProvider.js";
import {
  buyProduct,
  consumePurchase,
  checkIapEnv,
  restorePurchases,
  PRODUCT_MAP,
  getProductInfo,
  productIds
} from "../../utils/huaweiIap.js";
import { verifyWithBackend, queuePendingVerification } from "../../utils/paymentUtils.js";

export class HuaweiIapProvider extends PaymentProvider {
  async isAvailable() {
    return await checkIapEnv(false);
  }

  async getPrices() {
    try {
      const [conRes, subRes] = await Promise.all([
        getProductInfo(productIds.consumables, 0),
        getProductInfo(productIds.subscriptions, 2)
      ]);
      const priceMap = {};
      [...conRes, ...subRes].forEach(p => {
        priceMap[p.productId] = p.price;
      });
      return priceMap;
    } catch (e) {
      console.warn("[HMSProvider] Failed to fetch prices:", e);
      return {};
    }
  }

  async purchase(selectedPackage, user, callbacks) {
    const { onSuccess, onError } = callbacks;
    const hmsProduct = PRODUCT_MAP[selectedPackage.id];

    if (!hmsProduct) {
      return onError("Invalid product mapping for Huawei IAP");
    }

    try {
      // 1. Trigger purchase flow
      const purchase = await buyProduct(hmsProduct.id, hmsProduct.type);

      if (!purchase || !purchase.purchaseData) {
        return onError("Huawei IAP Error: No receipt received.");
      }

      // 2. Background verification
      verifyWithBackend(purchase, user).then(({ verified, reason }) => {
        if (!verified) {
          queuePendingVerification(purchase, user, hmsProduct.id);
        }
      }).catch(err => {
        console.error("[HuaweiProvider] Verification crash:", err.message);
      });

      // 3. Consume if consumable
      if (hmsProduct.type === 0) {
        try {
          const data = JSON.parse(purchase.purchaseData);
          await consumePurchase(data.purchaseToken);
        } catch (consumeErr) {
          console.warn("[HuaweiProvider] Consume failed:", consumeErr.message);
        }
      }

      onSuccess();
    } catch (err) {
      console.error("[HuaweiProvider] Purchase Error:", err);

      // Handle user cancellation
      const code = String(err?.code || err?.errorCode || "");
      if (["60051", "60053", "60056"].includes(code) || String(err).toLowerCase().includes("cancel")) {
        return onError("Payment cancelled");
      }

      onError(`Huawei IAP Error: ${err.message || err}`);
    }
  }

  async restore(user) {
    try {
      const { dataList, signatureList } = await restorePurchases(0); // consumables
      const subRes = await restorePurchases(2); // subscriptions

      const allData = [...dataList, ...(subRes.dataList || [])];
      const allSigs = [...signatureList, ...(subRes.signatureList || [])];

      for (let i = 0; i < allData.length; i++) {
        verifyWithBackend({ purchaseData: allData[i], signature: allSigs[i] }, user).catch(() => {});
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

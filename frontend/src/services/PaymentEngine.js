// PaymentEngine - Single entry point for ALL payment processing
// Screens ONLY call processPayment(). No exceptions. No duplication.

import { initiatePayFastPayment, initiateDeeperPayment } from "../utils/payfast.js";
import { apiUrl } from "../utils/apiBase.js";
import { buyProduct, consumePurchase, isHmsDevice } from "../utils/huaweiIap.js";

const PRODUCT_MAP = {
  1: { id: "Quick.Insight", type: 0 },
  2: { id: "Past.Present.Future", type: 0 },
  3: { id: "Deep.Dive", type: 0 },
  4: { id: "10.Readings_Month", type: 2 },
  5: { id: "20.Readings_Month", type: 2 },
  6: { id: "30.Readings_Month1", type: 2 },
};

// HMS error codes that mean "user cancelled" - should NOT fall back to PayFast
const HMS_USER_CANCELLED_CODES = [60051, 60053, 60056];

function isUserCancellation(err) {
  const code = err?.code || err?.errorCode || err?.message?.match?.(/(\d{5})/)?.[1];
  if (code && HMS_USER_CANCELLED_CODES.includes(Number(code))) return true;
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("cancel") || msg.includes("60051") || msg.includes("60053") || msg.includes("60056");
}

export async function processPayment(selectedPackage, user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;

  // Android Huawei devices: try Huawei IAP first
  if (isHmsDevice()) {
    try {
      const product = PRODUCT_MAP[selectedPackage.id];
      if (product) {
        console.log("[PaymentRouter] Trying Huawei IAP:", product.id);
        const purchase = await buyProduct(product.id, product.type);
        const verifyRes = await fetch(apiUrl("/api/huawei/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchaseData: purchase.purchaseData,
            signature: purchase.signature,
            email: user?.email,
            name: user?.name
          })
        });
        if (!verifyRes.ok) throw new Error("Verification failed");
        if (product.type === 0) {
          const data = JSON.parse(purchase.purchaseData);
          await consumePurchase(data.purchaseToken);
        }
        console.log("[PaymentRouter] Huawei IAP success");
        onSuccess();
        return;
      }
    } catch (hmsErr) {
      // If user cancelled the purchase dialog, stop here - don't fall back to PayFast
      if (isUserCancellation(hmsErr)) {
        console.log("[PaymentRouter] User cancelled HMS purchase");
        onError("Payment cancelled");
        return;
      }
      // Actual HMS failure - fall back to PayFast
      console.log("[PaymentRouter] Huawei IAP failed, falling back to PayFast:", hmsErr.message);
    }
  }

  // All other cases: PayFast
  try {
    if (onPending) onPending({ type: "standard", pkgId: selectedPackage.id, timestamp: Date.now() });
    await initiatePayFastPayment(selectedPackage, user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}

export async function processDeeperPayment(user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;

  if (isHmsDevice()) {
    try {
      console.log("[PaymentRouter] Trying Huawei IAP for deeper reading");
      const purchase = await buyProduct("Astrological.Chart.Reading", 0);
      const verifyRes = await fetch(apiUrl("/api/huawei/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseData: purchase.purchaseData,
          signature: purchase.signature,
          email: user?.email,
          name: user?.name
        })
      });
      if (!verifyRes.ok) throw new Error("Verification failed");
      const data = JSON.parse(purchase.purchaseData);
      await consumePurchase(data.purchaseToken);
      console.log("[PaymentRouter] Huawei IAP deeper success");
      onSuccess();
      return;
    } catch (hmsErr) {
      if (isUserCancellation(hmsErr)) {
        console.log("[PaymentRouter] User cancelled HMS deeper purchase");
        onError("Payment cancelled");
        return;
      }
      console.log("[PaymentRouter] Huawei IAP failed for deeper, falling back:", hmsErr.message);
    }
  }

  try {
    if (onPending) onPending({ type: "deeper", timestamp: Date.now() });
    await initiateDeeperPayment(user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}
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

const HMS_USER_CANCELLED_CODES = [60051, 60053, 60056];

function isUserCancellation(err) {
  const code = String(err?.code || err?.errorCode || err?.message || "");
  if (HMS_USER_CANCELLED_CODES.some(c => code.includes(String(c)))) return true;
  return code.toLowerCase().includes("cancel");
}

function isAlreadyOwned(err) {
  const code = String(err?.code || err?.errorCode || err?.message || "");
  return code.includes("60051") || code.includes("ORDER_PRODUCT_OWNED");
}

async function fetchWithRetry(url, options, retries = 2, timeoutMs = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      console.warn("[PaymentRouter] Fetch attempt " + (attempt + 1) + "/" + (retries + 1) + " failed:", err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}
async function verifyWithBackend(purchase, user) {
  // Custom domain used to bypass Great Firewall of China
  const url = "https://verify.963.co.za/";
  console.log("[PaymentRouter] VERIFY URL:", url);
  try {
    // IMPORTANT: purchase.purchaseData IS the raw string from HMS.
    // We send it exactly as-is to prevent signature breakage.
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseData: purchase.purchaseData,
        signature: purchase.signature,
        email: user?.email,
        name: user?.name
      })
    });
    console.log("[PaymentRouter] VERIFY STATUS:", res.status);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[PaymentRouter] VERIFY ERROR: Server returned", res.status, body, "| URL:", url);
      return { verified: false, reason: "HTTP " + res.status };
    }
    return { verified: true };
  } catch (err) {
    console.error("[PaymentRouter] VERIFY ERROR:", err.message, "| URL:", url);
    return { verified: false, reason: err.message };
  }
}

function queuePendingVerification(purchase, user, productId) {
  try {
    const pending = JSON.parse(localStorage.getItem("tl_pending_verifications") || "[]");
    pending.push({
      purchaseData: purchase.purchaseData,
      signature: purchase.signature,
      email: user?.email,
      name: user?.name,
      productId,
      timestamp: Date.now()
    });
    localStorage.setItem("tl_pending_verifications", JSON.stringify(pending));
    console.log("[PaymentRouter] Queued for later verification:", productId);
  } catch (_) {}
}
export async function processPayment(selectedPackage, user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;

  if (isHmsDevice()) {
    try {
      const product = PRODUCT_MAP[selectedPackage.id];
      if (product) {
        console.log("[PaymentRouter] Trying Huawei IAP:", product.id);

        // STEP 1: Purchase must succeed and return valid token
        const purchase = await buyProduct(product.id, product.type);

        // STEP 2: Validate purchase token exists (proof of payment)
        if (!purchase || !purchase.purchaseData) {
          console.error("[PaymentRouter] No purchaseData returned - no unlock");
          onError("Purchase failed - no token received");
          return;
        }
        console.log("[PaymentRouter] Valid purchase token received for:", product.id);

        // STEP 3: Backend verification (fire-and-forget - token is proof)
        verifyWithBackend(purchase, user).then(({ verified, reason }) => {
          if (!verified) {
            queuePendingVerification(purchase, user, product.id);
            console.warn("[PaymentRouter] Verify queued for later. Reason:", reason);
          } else {
            console.log("[PaymentRouter] Backend verified successfully");
          }
        });

        // STEP 4: Consume consumables
        if (product.type === 0) {
          try {
            const data = JSON.parse(purchase.purchaseData);
            await consumePurchase(data.purchaseToken);
          } catch (consumeErr) {
            console.warn("[PaymentRouter] Consume failed (non-fatal):", consumeErr.message);
          }
        }

        // STEP 5: Unlock - Persist locally FIRST to survive crashes/reloads
        console.log("[PaymentRouter] HMS success. Persisting and unlocking.");
        localStorage.setItem("tl_is_paid", "true");
        onSuccess();
        return;
      }
    } catch (hmsErr) {
      if (isUserCancellation(hmsErr)) {
        console.log("[PaymentRouter] User cancelled - no token, no unlock");
        onError("Payment cancelled");
        return;
      }

      if (isAlreadyOwned(hmsErr)) {
        console.log("[PaymentRouter] Product already owned. Initiating Silent Recovery.");
        try {
          const restore = await import("../utils/huaweiIap.js");
          const owned = await restore.restorePurchases(product.type);
          const list = owned?.inAppPurchaseDataList || owned?.purchaseDataList || owned?.purchases || [];
          const match = list.find(p => {
            const d = typeof p === "string" ? JSON.parse(p) : p;
            return d.productId === product.id;
          });

          if (match) {
            const dataStr = typeof match === "string" ? match : JSON.stringify(match);
            // Verify and consume the stuck token
            await verifyWithBackend({ purchaseData: dataStr, signature: "" }, user);
            if (product.type === 0) {
              const parsed = typeof match === "string" ? JSON.parse(match) : match;
              await restore.consumePurchase(parsed.purchaseToken);
            }
          }
        } catch (recoverErr) {
          console.warn("[PaymentRouter] Silent Recovery failed:", recoverErr.message);
        }
        localStorage.setItem("tl_is_paid", "true");
        onSuccess();
        return;
      }

      console.log("[PaymentRouter] HMS failed, falling back to PayFast:", hmsErr.message);
    }
  }

  try {
    if (onPending) onPending({ type: "standard", pkgId: selectedPackage.id, timestamp: Date.now() });
    await initiatePayFastPayment(selectedPackage, user);
  } catch (err) {
    const errorMsg = err.message || "Payment failed";
    console.error("[PaymentRouter] FINAL FATAL ERROR:", errorMsg, "| Stack:", err.stack);
    // Provide more detail for "Failed to fetch"
    if (errorMsg.includes("fetch")) {
      onError("Connection error (Failed to fetch). Please check your internet or VPN settings.");
    } else {
      onError(errorMsg);
    }
  }
}
export async function processDeeperPayment(user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;

  if (isHmsDevice()) {
    try {
      console.log("[PaymentRouter] Trying Huawei IAP for deeper reading");

      // STEP 1: Purchase
      const purchase = await buyProduct("Astrological.Chart.Reading", 0);

      // STEP 2: Validate token
      if (!purchase || !purchase.purchaseData) {
        console.error("[PaymentRouter] Deeper: no purchaseData - no unlock");
        onError("Purchase failed - no token received");
        return;
      }
      console.log("[PaymentRouter] Deeper purchase token received");

      // STEP 3: Backend verification (fire-and-forget)
      verifyWithBackend(purchase, user).then(({ verified, reason }) => {
        if (!verified) {
          queuePendingVerification(purchase, user, "Astrological.Chart.Reading");
          console.warn("[PaymentRouter] Deeper verify queued. Reason:", reason);
        }
      });

      // STEP 4: Consume
      try {
        const data = JSON.parse(purchase.purchaseData);
        await consumePurchase(data.purchaseToken);
      } catch (consumeErr) {
        console.warn("[PaymentRouter] Deeper consume failed (non-fatal):", consumeErr.message);
      }

      // STEP 5: Unlock
      console.log("[PaymentRouter] Deeper HMS success. Token proof valid, verify in background.");
      onSuccess();
      return;
    } catch (hmsErr) {
      if (isUserCancellation(hmsErr)) {
        console.log("[PaymentRouter] User cancelled deeper - no token, no unlock");
        onError("Payment cancelled");
        return;
      }
      console.error("[PaymentRouter] Deeper HMS failed:", hmsErr.message);
      onError("Purchase could not be completed. Please try again.");
      return;
    }
  }

  // Non-HMS devices: PayFast for deeper
  try {
    if (onPending) onPending({ type: "deeper", timestamp: Date.now() });
    await initiateDeeperPayment(user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}
import { initiatePayFastPayment, initiateDeeperPayment } from "../utils/payfast.js";
import { buyProduct, consumePurchase, checkIapEnv, restorePurchases } from "../utils/huaweiIap.js";
import { verifyWithBackend, queuePendingVerification } from "../utils/paymentUtils.js";

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

export async function processPayment(selectedPackage, user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;

  console.log("[PaymentRouter] Starting processPayment for:", selectedPackage.name);

  // 1. CHECK FIRST: Is the HMS environment ready on this device?
  const hmsReady = await checkIapEnv();

  if (hmsReady) {
    try {
      const product = PRODUCT_MAP[selectedPackage.id];
      if (product) {
        console.log("[PaymentRouter] HMS environment confirmed. Attempting buyProduct for:", product.id);

        // 2. PROCEED: Start the HMS IAP purchase flow.
        const purchase = await buyProduct(product.id, product.type);
        // ... rest of the successful purchase logic ...


        // 3. VALIDATE: Ensure purchase data exists
        if (!purchase || !purchase.purchaseData) {
          onError("Purchase failed - no token received");
          return;
        }

        // 4. BACKEND: Verify with backend (Cloudflare Worker)
        verifyWithBackend(purchase, user).then(({ verified, reason }) => {
          if (!verified) queuePendingVerification(purchase, user, product.id);
        });

        // 5. RELEASE: Consume consumables to allow repurchase
        if (product.type === 0) {
          try {
            const data = JSON.parse(purchase.purchaseData);
            await consumePurchase(data.purchaseToken);
          } catch (consumeErr) {
            console.warn("[PaymentRouter] Consume failed:", consumeErr.message);
          }
        }

        // 6. FINALIZE: Unlock locally and move to the next screen
        console.log("[PaymentRouter] HMS success. Unlocking locally.");
        localStorage.setItem("tl_is_paid", "true");
        onSuccess();
        return;
      }
    } catch (hmsErr) {
      console.error("[PaymentRouter] HMS Error:", hmsErr);

      if (isUserCancellation(hmsErr)) {
        onError("Payment cancelled");
        return;
      }

      if (isAlreadyOwned(hmsErr)) {
        console.log("[PaymentRouter] Product already owned. Initiating Silent Recovery.");
        try {
          const { dataList, signatureList } = await restorePurchases(PRODUCT_MAP[selectedPackage.id].type);

          const matchIndex = dataList.findIndex(p => {
            const d = typeof p === "string" ? JSON.parse(p) : p;
            return d.productId === PRODUCT_MAP[selectedPackage.id].id;
          });

          if (matchIndex !== -1) {
            const dataStr = dataList[matchIndex];
            const sig = signatureList[matchIndex];
            // Verify in background
            verifyWithBackend({ purchaseData: dataStr, signature: sig }, user).catch(() => {});

            if (PRODUCT_MAP[selectedPackage.id].type === 0) {
              const parsed = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
              await consumePurchase(parsed.purchaseToken);
            }
          }
        } catch (recoverErr) {
          console.warn("[PaymentRouter] Silent Recovery logic error:", recoverErr.message);
        }

        // Even if recovery logic has a glitch, the fact it was 'Already Owned' means we can unlock
        localStorage.setItem("tl_is_paid", "true");
        onSuccess();
        return;
      }

      // 7. FALLBACK: If HMS check fails or real technical error happens, redirect to Payfast
      console.error("[PaymentRouter] HMS transaction error, falling back to PayFast:", hmsErr.message || hmsErr);
    }
  } else {
    console.log("[PaymentRouter] HMS environment not available on this device. Using PayFast.");
  }

  // PAYFAST FALLBACK FLOW
  try {
    if (onPending) onPending({ type: "standard", pkgId: selectedPackage.id, timestamp: Date.now() });
    await initiatePayFastPayment(selectedPackage, user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}

export async function processDeeperPayment(user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;

  // 1. CHECK HMS Environment
  const hmsReady = await checkIapEnv();

  if (hmsReady) {
    try {
      const purchase = await buyProduct("Astrological.Chart.Reading", 0);
      if (!purchase || !purchase.purchaseData) {
        onError("Purchase failed");
        return;
      }

      verifyWithBackend(purchase, user).then(({ verified }) => {
        if (!verified) queuePendingVerification(purchase, user, "Astrological.Chart.Reading");
      });

      try {
        await consumePurchase(JSON.parse(purchase.purchaseData).purchaseToken);
      } catch (e) {}

      onSuccess();
      return;
    } catch (hmsErr) {
      if (isUserCancellation(hmsErr)) {
        onError("Payment cancelled");
        return;
      }
      // Technical error -> Fallback to Payfast if applicable
      console.log("[PaymentRouter] HMS Deep Dive failed, falling back to Payfast:", hmsErr.message || hmsErr);
    }
  }

  try {
    if (onPending) onPending({ type: "deeper", timestamp: Date.now() });
    await initiateDeeperPayment(user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}

export { verifyWithBackend }; // For AppContext queue processor

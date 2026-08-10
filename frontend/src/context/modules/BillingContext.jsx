import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiUrl } from "../../utils/apiBase.js";
import { checkHmsReady, redeliverPurchases, consumeOrphanedPurchases } from "../../utils/huaweiIap.js";

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [isPaid, setIsPaid] = useState(() => localStorage.getItem("tl_is_paid") === "true");
  const [deeperPaid, setDeeperPaid] = useState(() => localStorage.getItem("tl_deeper_paid") === "true");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currencyData, setCurrencyData] = useState({ symbol: '$', rate: 1, code: 'USD', country: 'US' });

  const [paymentPending, setPaymentPending] = useState(() => {
    try {
      const saved = localStorage.getItem("tl_payment_pending");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [freeReadingUsed, setFreeReadingUsed] = useState(() => {
    try { return localStorage.getItem("tl_free_consumed") === "true"; } catch (e) { return false; }
  });

  const fetchCurrency = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      // USD ONLY - currency conversion disabled
      clearTimeout(timeoutId);
      return;
      // const res = await fetch(apiUrl("/api/fx/rate"), {
        // signal: controller.signal
      // });
      // clearTimeout(timeoutId);

      // if (res.ok) {
      //   const data = await res.json();
      //   setCurrencyData({
      //     symbol: data.symbol || '$',
      //     rate: data.rate || 1,
      //     code: data.code || 'USD',
      //     country: data.country || 'US'
      //   });
      // }
    } catch (_e) {
      // FX fetch disabled
    }
  }, []);

  useEffect(() => {
    // HMS COMPLIANCE (Rule 3.1): Deferred Initialization
    // We wait for the browser to be idle or use a generous timeout to ensure
    // the UI is fully rendered before hitting HMS APIs.
    const initHms = async () => {
      try {
        console.log("[HMS] Starting deferred initialization...");
        const ready = await checkHmsReady(false);
        if (ready) {
          await consumeOrphanedPurchases();
          const { paid, sub } = await redeliverPurchases();
          if (paid || sub) {
            console.log("[HMS] Found valid purchase during startup recovery");
            setIsPaid(true);
          }
        }
      } catch (e) {
        console.warn("[HMS] Deferred recovery failed:", e.message);
      }
    };

    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        setTimeout(initHms, 2000);
        fetchCurrency();
      });
    } else {
      setTimeout(() => {
        initHms();
        fetchCurrency();
      }, 5000);
    }
  }, [fetchCurrency]);

  useEffect(() => {
    localStorage.setItem("tl_is_paid", String(isPaid));
    localStorage.setItem("tl_deeper_paid", String(deeperPaid));
    localStorage.setItem("tl_free_consumed", String(freeReadingUsed));
  }, [isPaid, deeperPaid, freeReadingUsed]);

  const refreshPaymentStatus = useCallback(async (email, silent = false) => {
    if (!email) return;
    if (!silent) setPaymentLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/payment/status?email=${encodeURIComponent(email)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.isPaid) setIsPaid(true);
        if (data.deeperPaid) setDeeperPaid(true);
        return data;
      }
    } catch (e) {
      console.error("[Billing] Status check failed:", e);
    } finally {
      if (!silent) setPaymentLoading(false);
    }
  }, []);

  return (
    <BillingContext.Provider value={{
      isPaid, setIsPaid,
      deeperPaid, setDeeperPaid,
      freeReadingUsed, setFreeReadingUsed,
      paymentLoading, setPaymentLoading,
      paymentPending, setPaymentPending,
      currencyData, refreshPaymentStatus
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export const useBilling = () => useContext(BillingContext);

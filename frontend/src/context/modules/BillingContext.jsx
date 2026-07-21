import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiUrl } from "../../utils/apiBase.js";
import { PaymentFactory } from "../../services/payments/PaymentFactory.js";
import { checkHmsReady, redeliverPurchases, consumeOrphanedPurchases } from "../../utils/huaweiIap.js";

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [isPaid, setIsPaid] = useState(() => localStorage.getItem("tl_is_paid") === "true");
  const [deeperPaid, setDeeperPaid] = useState(() => localStorage.getItem("tl_deeper_paid") === "true");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currencyData, setCurrencyData] = useState({ symbol: '$', rate: 1, code: 'USD', country: 'US' });

  const fetchCurrency = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/fx/rate"));
      if (res.ok) {
        const data = await res.json();
        setCurrencyData({
          symbol: data.symbol || '$',
          rate: data.rate || 1,
          code: data.code || 'USD',
          country: data.country || 'US'
        });
      }
    } catch (e) {
      console.warn("[Billing] FX fetch failed:", e.message);
    }
  }, []);

  useEffect(() => {
    fetchCurrency();

    // HMS Background recovery
    const initHms = async () => {
      try {
        const ready = await checkHmsReady(false);
        if (ready) {
          await consumeOrphanedPurchases();
          const { paid, sub } = await redeliverPurchases();
          if (paid || sub) setIsPaid(true);
        }
      } catch (e) { console.warn("[HMS] Recovery failed:", e); }
    };
    setTimeout(initHms, 2000);
  }, [fetchCurrency]);

  useEffect(() => {
    localStorage.setItem("tl_is_paid", String(isPaid));
    localStorage.setItem("tl_deeper_paid", String(deeperPaid));
  }, [isPaid, deeperPaid]);

  const refreshPaymentStatus = useCallback(async (email) => {
    if (!email) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/payment/status?email=${encodeURIComponent(email)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.isPaid) setIsPaid(true);
        if (data.deeperPaid) setDeeperPaid(true);
        return data;
      }
    } catch (e) { console.error("[Billing] Status check failed:", e); }
    finally { setPaymentLoading(false); }
  }, []);

  return (
    <BillingContext.Provider value={{
      isPaid, setIsPaid,
      deeperPaid, setDeeperPaid,
      paymentLoading, setPaymentLoading,
      currencyData, refreshPaymentStatus
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export const useBilling = () => useContext(BillingContext);

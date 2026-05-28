// frontend/src/utils/payfast.js
// PayFast payment utility  frontend
// Calls /api/payfast/initiate to get signed payment data
// Then launches PayFast in an external browser via a relay page

import { Browser } from "@capacitor/browser";

// ZAR price mapping for each package
export const PACKAGE_PRICES_ZAR = {
  1: "3.99",
  2: "9.99",
  3: "19.99",
  4: "9.99",
  5: "17.99",
  6: "24.99",
};

// Standard package payment (subscriptions + one-time readings)
export async function initiatePayFastPayment(pkg, user) {
  const res = await fetch("/api/payfast/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      package: { ...pkg, priceUSD: PACKAGE_PRICES_ZAR[pkg.id] || "9.99" },
      user,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Payment initiation failed");
  }
  const { paymentUrl, fields } = await res.json();

  // Use relay URL to bridge GET to POST for external browser launch
  // This prevents app crashes caused by internal WebView navigation
  const query = new URLSearchParams({ url: paymentUrl, ...fields }).toString();
  const relayUrl = `${window.location.origin}/api/payfast/relay?${query}`;

  await Browser.open({ url: relayUrl });
}

// Deeper reading one-time $44 payment
export async function initiateDeeperPayment(user) {
  const res = await fetch("/api/payfast/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      package: {
        id: "deeper",
        type: "deeper",
        name: "Advanced Astrology Reading",
        desc: "Personalised advanced astrology reading",
        priceUSD: "44.00",
      },
      user,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Payment initiation failed");
  }
  const { paymentUrl, fields } = await res.json();

  const query = new URLSearchParams({ url: paymentUrl, ...fields }).toString();
  const relayUrl = `${window.location.origin}/api/payfast/relay?${query}`;

  await Browser.open({ url: relayUrl });
}

// Fetch live USD/ZAR rate from our backend
export async function fetchZARRate() {
  try {
    const res = await fetch("/api/fx/rate");
    if (!res.ok) return { rate: 18.80, fallback: true };
    return await res.json();
  } catch (_) {
    return { rate: 18.80, fallback: true };
  }
}

export function convertToZAR(usdAmount, rate) {
  return (parseFloat(usdAmount) * rate).toFixed(2);
}

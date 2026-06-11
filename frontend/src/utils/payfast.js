import { apiUrl } from "./apiBase.js";
// frontend/src/utils/payfast.js
// PayFast payment utility  frontend
// Calls /api/payfast/initiate to get signed payment data
// Then launches PayFast in an external browser via a relay page


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
  const res = await fetch(apiUrl("/api/payfast/initiate"), {
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

  // Build relay URL
  const query = new URLSearchParams({ url: paymentUrl, ...fields }).toString();
  const relayUrl = `${window.Capacitor?.isNativePlatform?.() ? "https://app.963.co.za" : window.location.origin}/api/payfast/relay?${query}`;

  console.log("[Payment] Browser:", navigator.userAgent);
  console.log("[Payment] Initiating redirect to relay:", relayUrl.substring(0, 80) + "...");
  console.log("[Payment] Timestamp:", new Date().toISOString());

  // On native (Capacitor): use Browser plugin to open externally
  // On web: navigate current window directly (avoids popup blockers in DuckDuckGo/Safari)
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: relayUrl });
  } else {
    // Direct navigation - no popup, works in all browsers including DuckDuckGo
    window.location.href = relayUrl;
  }
}

// Deeper reading one-time $44 payment
export async function initiateDeeperPayment(user) {
  const res = await fetch(apiUrl("/api/payfast/initiate"), {
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
  const relayUrl = `${window.Capacitor?.isNativePlatform?.() ? "https://app.963.co.za" : window.location.origin}/api/payfast/relay?${query}`;

  console.log("[Payment:Deeper] Initiating redirect");

  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: relayUrl });
  } else {
    window.location.href = relayUrl;
  }
}

// Fetch live USD/ZAR rate from our backend
export async function fetchZARRate() {
  try {
    const res = await fetch(apiUrl("/api/fx/rate"));
    if (!res.ok) return { rate: 18.80, fallback: true };
    return await res.json();
  } catch (_) {
    return { rate: 18.80, fallback: true };
  }
}

export function convertToZAR(usdAmount, rate) {
  return (parseFloat(usdAmount) * rate).toFixed(2);
}

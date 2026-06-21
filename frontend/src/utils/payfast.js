import { apiUrl } from "./apiBase.js";
// frontend/src/utils/payfast.js
// PayFast payment utility  frontend
// Calls /api/payfast/initiate to get signed payment data
// Then launches PayFast in an external browser via a relay page


// USD price mapping for each package
export const PACKAGE_PRICES_USD = {
  1: "3.99",
  2: "9.99",
  3: "19.99",
  4: "9.99",
  5: "17.99",
  6: "24.99",
};

// Standard package payment (subscriptions + one-time readings)
export async function initiatePayFastPayment(pkg, user) {
  const isNative = window.Capacitor?.isNativePlatform?.();
  const endpoint = apiUrl("/api/payfast/initiate");

  console.log("[PayFast] Initiating from:", endpoint);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package: { ...pkg, price: PACKAGE_PRICES_USD[pkg.id] || "9.99" },
        user,
        native: isNative
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error("[PayFast] Initiation failed:", res.status, errText);
      throw new Error(`Payment initiation failed (${res.status})`);
    }

    const { paymentUrl, fields } = await res.json();
    console.log("[PayFast] Received data, building relay URL...");

    // Build relay URL
    const query = new URLSearchParams({ url: paymentUrl, ...fields }).toString();
    const relayUrl = `${apiUrl("/api/payfast/relay")}?${query}`;

    if (isNative) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: relayUrl });
    } else {
      window.location.href = relayUrl;
    }
  } catch (e) {
    console.error("[PayFast] Error during initiation:", e.message);
    throw e;
  }
}

// Deeper reading one-time $44 payment
export async function initiateDeeperPayment(user) {
  const isNative = window.Capacitor?.isNativePlatform?.();

  const res = await fetch(apiUrl("/api/payfast/initiate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      package: {
        id: "deeper",
        type: "deeper",
        name: "Advanced Astrology Reading",
        desc: "Personalised advanced astrology reading",
        price: "44.00",
      },
      user,
      native: isNative
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Payment initiation failed");
  }
  const { paymentUrl, fields } = await res.json();

  const query = new URLSearchParams({ url: paymentUrl, ...fields }).toString();
  const relayUrl = `${apiUrl("/api/payfast/relay")}?${query}`;

  console.log("[Payment:Deeper] Initiating redirect");

  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: relayUrl });
  } else {
    window.location.href = relayUrl;
  }
}

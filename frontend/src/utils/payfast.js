import { apiUrl } from "./apiBase.js";
// frontend/src/utils/payfast.js
// PayFast payment utility  frontend
// Calls /api/payfast/initiate to get signed payment data
// Then launches PayFast in an external browser via a relay page


// USD price mapping for each package
export const PACKAGE_PRICES_USD = {
  1: "1.99",
  2: "9.99",
  3: "14.99",
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
    console.log("[PayFast] Received data, initiating direct POST...");

    // DIRECT POST FORM (Eliminates the 502/Relay Latency)
    const form = document.createElement("form");
    form.method = "POST";
    form.action = paymentUrl;

    Object.keys(fields).forEach(key => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
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

  console.log("[Payment:Deeper] Initiating direct POST");

  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  Object.keys(fields).forEach(key => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = fields[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

import { apiUrl } from "./apiBase.js";

export async function fetchWithRetry(url, options, retries = 2, timeoutMs = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      console.warn("[PaymentUtils] Fetch attempt " + (attempt + 1) + "/" + (retries + 1) + " failed:", err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export async function verifyWithBackend(purchase, user) {
  const url = apiUrl("/api/payment/huawei/verify");
  try {
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
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { verified: false, reason: errorData.error || "HTTP " + res.status };
    }
    return { verified: true };
  } catch (err) {
    return { verified: false, reason: err.message };
  }
}

export function queuePendingVerification(purchase, user, productId) {
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
    console.log("[PaymentUtils] Queued for later verification:", productId);
  } catch (_) {}
}

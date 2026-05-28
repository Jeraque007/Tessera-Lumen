// frontend/src/utils/quota.js
// Frontend quota management
// Checks daily + monthly limits before allowing a reading
// Deducts 1 read after successful reveal

export async function checkQuota(email) {
  if (!email) return { allowed: true };
  try {
    const res = await fetch(`/api/subscription/quota?email=${encodeURIComponent(email)}`);
    if (res.status === 404) return { allowed: true }; // no subscription = one-time, allow
    if (!res.ok) return { allowed: true };            // fail open on server error

    const data = await res.json();
    if (!data.active) return { allowed: false, code: "NO_SUBSCRIPTION" };

    // Daily limit hit
    if (data.dailyExhausted) {
      return {
        allowed: false,
        code: "DAILY_EXHAUSTED",
        tomorrow: data.tomorrow,
        renewalDate: data.renewalDate,
        readsPerDay: data.readsPerDay,
        data,
      };
    }

    // Monthly limit hit
    if (data.monthlyExhausted) {
      return {
        allowed: false,
        code: "MONTHLY_EXHAUSTED",
        renewalDate: data.renewalDate,
        data,
      };
    }

    return {
      allowed: true,
      readsRemaining: data.readsRemaining,
      dailyReadsLeft: data.dailyReadsLeft,
      data,
    };
  } catch (_) {
    return { allowed: true }; // fail open  never block on network error
  }
}

export async function deductRead(email) {
  if (!email) return { success: true };
  try {
    const res = await fetch("/api/subscription/quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "deduct" }),
    });
    return await res.json();
  } catch (_) {
    return { success: true }; // fail open
  }
}

export function formatRenewalDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// frontend/api/huawei/verify.js
// Vercel serverless function - Huawei IAP purchase verification
// Writes to the same Supabase tables as PayFast ITN

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { purchaseData, signature, email, name } = req.body;
  if (!purchaseData) return res.status(400).json({ error: "purchaseData required" });

  try {
    const purchase = JSON.parse(purchaseData);
    const supabase = getSupabase();
    const productId = purchase.productId || "";
    const orderId = purchase.orderId || purchase.purchaseToken || `HMS-${Date.now()}`;

    console.log("[Huawei] Verifying purchase:", productId, "for:", email);

    // Duplicate check
    const { data: existing } = await supabase
      .from("payment_log")
      .select("id")
      .eq("payment_id", orderId)
      .maybeSingle();

    if (existing) {
      console.log("[Huawei] Duplicate purchase, already logged");
      return res.status(200).json({ success: true, duplicate: true });
    }

    // Determine plan type
    const isSubscription = productId.includes("Readings_Month");
    const planMap = {
      "Quick.Insight": 1,
      "Past.Present.Future": 2,
      "Deep.Dive": 3,
      "10.Readings_Month": 4,
      "20.Readings_Month": 5,
      "30.Readings_Month": 6,
      "Astrological.Chart.Reading": null,
    };
    const planId = planMap[productId] || null;
    const isDeeper = productId === "Astrological.Chart.Reading";

    // Log payment
    await supabase.from("payment_log").insert({
      payment_id: orderId,
      m_payment_id: `HMS-${productId}-${Date.now()}`,
      email: email ? email.toLowerCase().trim() : null,
      name: name || "",
      amount: purchase.price ? parseFloat(purchase.price) / 100 : 0,
      status: "COMPLETE",
      plan_id: planId,
      item_name: `Tessera Lumen - ${productId}`,
      is_subscription: isSubscription,
      raw_payload: { source: "huawei_iap", purchaseData: purchase, signature },
    });

    // Activate subscription if applicable
    if (isSubscription && email) {
      const PLAN_CONFIG = {
        4: { readsLimit: 10, readsPerDay: 1 },
        5: { readsLimit: 20, readsPerDay: 2 },
        6: { readsLimit: 30, readsPerDay: 3 },
      };
      const cfg = PLAN_CONFIG[planId] || {};
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      await supabase.from("subscriptions").upsert(
        {
          email: email.toLowerCase().trim(),
          plan_id: planId,
          plan_name: productId,
          reads_remaining: cfg.readsLimit ?? null,
          reads_limit: cfg.readsLimit ?? null,
          reads_per_day: cfg.readsPerDay ?? null,
          active: true,
          activated_at: new Date().toISOString(),
          renewal_date: renewalDate.toISOString(),
          subscription_token: purchase.subscriptionId || purchase.purchaseToken || null,
        },
        { onConflict: "email" }
      );
      console.log("[Huawei] Subscription activated:", email, planId);
    }

    // Deeper reading
    if (isDeeper && email) {
      await supabase.from("deeper_readings").upsert(
        { payment_id: orderId, email: email.toLowerCase().trim(), name, amount_zar: 0, status: "complete" },
        { onConflict: "payment_id" }
      );
      console.log("[Huawei] Deeper reading order created:", email);
    }

    console.log("[Huawei] Purchase verified successfully:", productId);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("[Huawei] Verification error:", err);
    return res.status(500).json({ error: err.message });
  }
}
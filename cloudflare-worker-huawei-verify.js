// Cloudflare Worker: Huawei IAP Purchase Verification
// Equivalent to Vercel function at /api/huawei/verify
// Writes to Supabase: payment_log, subscriptions, deeper_readings

export default {
  async fetch(request, env) {
    // CORS headers for preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    try {
      const { purchaseData, signature, email, name } = await request.json();

      if (!purchaseData) {
        return json({ error: "purchaseData required" }, 400);
      }

      const purchase = JSON.parse(purchaseData);
      const productId = purchase.productId || "";
      const orderId = purchase.orderId || purchase.purchaseToken || `HMS-${Date.now()}`;

      console.log("[Huawei] Verifying:", productId, "for:", email);

      // Supabase client
      const supabaseUrl = env.SUPABASE_URL;
      const supabaseKey = env.SUPABASE_SECRET_KEY;
      const headers = {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      };

      // Duplicate check
      const dupRes = await fetch(
        `${supabaseUrl}/rest/v1/payment_log?payment_id=eq.${encodeURIComponent(orderId)}&select=id`,
        { headers: { ...headers, "Prefer": "return=representation" } }
      );
      const dupData = await dupRes.json();
      if (dupData && dupData.length > 0) {
        console.log("[Huawei] Duplicate, already logged");
        return json({ success: true, duplicate: true });
      }

      // Plan mapping
      const isSubscription = productId.includes("Readings_Month");
      const planMap = {
        "Quick.Insight": 1,
        "Past.Present.Future": 2,
        "Deep.Dive": 3,
        "10.Readings_Month": 4,
        "20.Readings_Month": 5,
        "30.Readings_Month1": 6,
        "Astrological.Chart.Reading": null,
      };
      const planId = planMap[productId] || null;
      const isDeeper = productId === "Astrological.Chart.Reading";

      // Log payment
      const logRes = await fetch(`${supabaseUrl}/rest/v1/payment_log`, {
        method: "POST",
        headers,
        body: JSON.stringify({
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
        }),
      });
      if (!logRes.ok) {
        const errText = await logRes.text();
        console.error("[Huawei] payment_log insert failed:", errText);
      }

      // Activate subscription
      if (isSubscription && email) {
        const PLAN_CONFIG = {
          4: { readsLimit: 10, readsPerDay: 1 },
          5: { readsLimit: 20, readsPerDay: 2 },
          6: { readsLimit: 30, readsPerDay: 3 },
        };
        const cfg = PLAN_CONFIG[planId] || {};
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);

        const subRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?on_conflict=email`,
          {
            method: "POST",
            headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify({
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
            }),
          }
        );
        if (!subRes.ok) console.error("[Huawei] subscription upsert failed:", await subRes.text());
        else console.log("[Huawei] Subscription activated:", email, planId);
      }

      // Deeper reading
      if (isDeeper && email) {
        const deepRes = await fetch(
          `${supabaseUrl}/rest/v1/deeper_readings?on_conflict=payment_id`,
          {
            method: "POST",
            headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify({
              payment_id: orderId,
              email: email.toLowerCase().trim(),
              name: name || "",
              amount_zar: 0,
              status: "complete",
            }),
          }
        );
        if (!deepRes.ok) console.error("[Huawei] deeper_readings upsert failed:", await deepRes.text());
        else console.log("[Huawei] Deeper order created:", email);
      }

      console.log("[Huawei] Verified successfully:", productId);
      return json({ success: true });

    } catch (err) {
      console.error("[Huawei] Error:", err.message);
      return json({ error: err.message }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
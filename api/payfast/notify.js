import { createClient } from "@supabase/supabase-js";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const IS_SANDBOX = process.env.PAYFAST_SANDBOX === "true";

const PLAN_CONFIG = {
  4: { readsLimit: 10, readsPerDay: 1 },
  5: { readsLimit: 20, readsPerDay: 2 },
  6: { readsLimit: 30, readsPerDay: 3 },
};

function pfEncode(str) {
  return encodeURIComponent(String(str).trim())
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const pfData = req.body;
    const host = IS_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";

    // Validate with PayFast
    const validateBody = Object.keys(pfData)
      .filter(k => k !== "signature")
      .map(key => `${key}=${pfEncode(pfData[key])}`)
      .join("&");

    const valRes = await fetch(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: validateBody,
    });
    const valResult = await valRes.text();

    if (valResult.trim() !== "VALID") {
      console.error("[PayFast] Validation failed");
      return res.status(400).send("Validation failed");
    }

    const supabase = getSupabase();
    const email = (pfData.email_address || "").toLowerCase().trim();
    const status = pfData.payment_status;
    const customStr1 = pfData.custom_str1 || "";
    const isDeeper = customStr1 === "deeper";
    const planId = isDeeper ? null : parseInt(customStr1 || "0");

    // 1. Log Payment
    await supabase.from("payment_log").insert({
      payment_id: pfData.pf_payment_id,
      m_payment_id: pfData.m_payment_id,
      email,
      name: `${pfData.name_first || ""} ${pfData.name_last || ""}`.trim(),
      amount: parseFloat(pfData.amount_gross || "0"),
      status,
      plan_id: planId,
      item_name: pfData.item_name || "",
      is_subscription: pfData.subscription_type === "1",
      raw_payload: pfData,
    });

    if (status === "COMPLETE" && email) {
      if (isDeeper) {
        await supabase.from("deeper_readings").upsert({
          payment_id: pfData.pf_payment_id,
          email,
          name: `${pfData.name_first || ""} ${pfData.name_last || ""}`.trim(),
          amount: parseFloat(pfData.amount_gross || "0"),
          status: "complete"
        }, { onConflict: "payment_id" });
      } else {
        const cfg = PLAN_CONFIG[planId] || {};
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);

        await supabase.from("subscriptions").upsert({
          email,
          plan_id: planId,
          plan_name: pfData.item_name,
          reads_remaining: cfg.readsLimit ?? null,
          reads_limit: cfg.readsLimit ?? null,
          reads_per_day: cfg.readsPerDay ?? null,
          active: true,
          activated_at: new Date().toISOString(),
          renewal_date: renewalDate.toISOString(),
          subscription_token: pfData.token || null,
        }, { onConflict: "email" });
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("[PayFast] Notify error:", error.message);
    res.status(500).send("Server error");
  }
}

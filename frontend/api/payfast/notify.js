// frontend/api/payfast/notify.js
// PayFast ITN (Instant Transaction Notification) handler

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_PASSPHRASE  = process.env.PAYFAST_PASSPHRASE || "";
const IS_SANDBOX          = process.env.PAYFAST_SANDBOX === "true";

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
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function validateWithPayFast(pfData) {
  const host = IS_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
  try {
    // PayFast requires specific encoding for validation
    const body = Object.keys(pfData)
      .filter(k => k !== "signature") // Usually signature is excluded from validation query
      .map(key => `${key}=${pfEncode(pfData[key])}`)
      .join("&");

    console.log("[EVIDENCE] Sending validation query to:", host);

    const res = await fetch(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body,
    });
    const result = await res.text();
    console.log("[EVIDENCE] PayFast Validation Result:", result);
    return result.trim() === "VALID";
  } catch (e) {
    console.error("[PayFast] validation error:", e);
    return false;
  }
}

export default async function handler(req, res) {
  // [EVIDENCE] 2. Callback fired
  console.log("🔥 PAYFAST ITN HIT");
  console.log("Method:", req.method);
  console.log("Callback URL Received:", req.url);
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Payload Received:", JSON.stringify(req.body));

  if (req.method !== "POST") {
    console.log("Rejected: Method not POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pfData = req.body;
    console.log("Raw Payload:", JSON.stringify(pfData));

    const isValid = await validateWithPayFast(pfData);
    console.log("Signature validation result:", isValid);

    if (!isValid) {
      console.error("[EVIDENCE] Server validation failed - likely signature mismatch on PayFast side");
      return res.status(400).send("Validation failed");
    }

    const supabase       = getSupabase();
    const paymentId      = pfData.pf_payment_id;
    const mPaymentId     = pfData.m_payment_id;
    const status         = pfData.payment_status;
    const amount         = parseFloat(pfData.amount_gross || "0");
    const email          = (pfData.email_address || "").toLowerCase().trim();
    const name           = `${pfData.name_first || ""} ${pfData.name_last || ""}`.trim();
    const itemName       = pfData.item_name || "";
    const isSubscription = pfData.subscription_type === "1";
    const customStr1     = pfData.custom_str1 || "";
    const isDeeper       = customStr1 === "deeper";
    const planId         = isDeeper ? null : parseInt(customStr1 || "0");

    console.log("[EVIDENCE] Processing verified payment:", paymentId, "for", email);
    console.log("m_payment_id:", mPaymentId);
    console.log("payment_status:", status);

    // [EVIDENCE] 3. Supabase Before State
    console.log("--- [EVIDENCE] 3. SUPABASE STATE ---");

    let subBefore, deeperBefore;
    if (isDeeper) {
      const { data } = await supabase.from("deeper_readings").select("*").eq("email", email).maybeSingle();
      deeperBefore = data;
      console.log("Deeper Sub Before:", JSON.stringify(deeperBefore));
    } else {
      const { data } = await supabase.from("subscriptions").select("*").eq("email", email).maybeSingle();
      subBefore = data;
      console.log("Sub Before:", JSON.stringify(subBefore));
    }

    const { data: existing } = await supabase.from("payment_log").select("id").eq("payment_id", paymentId).maybeSingle();
    if (existing) {
      console.log("Duplicate payment log entry skipped");
    } else {
      const { error: logErr } = await supabase.from("payment_log").insert({
        payment_id:      paymentId,
        m_payment_id:    mPaymentId,
        email:           email || null,
        name,
        amount,
        status,
        plan_id:         planId,
        item_name:       itemName,
        is_subscription: isSubscription,
        raw_payload:     pfData,
      });
      if (logErr) console.error("Error inserting payment log:", logErr);
    }

    if (status === "COMPLETE" && email) {
      if (isDeeper) {
        console.log("Updating deeper_readings for:", email);
        const { data: updData, error: updErr } = await supabase.from("deeper_readings").upsert(
          { payment_id: paymentId, email, name, amount_zar: amount, status: "complete" },
          { onConflict: "payment_id" }
        ).select();
        console.log("Deeper Update Result:", JSON.stringify(updData), "Error:", updErr);
      } else if (isSubscription) {
        console.log("Updating subscription for:", email);
        const cfg = PLAN_CONFIG[planId] || {};
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);

        const { data: updData, error: updErr } = await supabase.from("subscriptions").upsert(
          {
            email,
            plan_id:            planId,
            plan_name:          itemName,
            reads_remaining:    cfg.readsLimit ?? null,
            reads_limit:        cfg.readsLimit ?? null,
            reads_per_day:      cfg.readsPerDay ?? null,
            active:             true,
            activated_at:       new Date().toISOString(),
            renewal_date:       renewalDate.toISOString(),
            subscription_token: pfData.token || null,
          },
          { onConflict: "email" }
        ).select();
        console.log("Subscription Update Result:", JSON.stringify(updData), "Error:", updErr);
      }
    }

    // [EVIDENCE] 3. Supabase After State
    if (isDeeper) {
      const { data: deeperAfter } = await supabase.from("deeper_readings").select("*").eq("email", email).maybeSingle();
      console.log("Deeper Sub After:", JSON.stringify(deeperAfter));
    } else {
      const { data: subAfter } = await supabase.from("subscriptions").select("*").eq("email", email).maybeSingle();
      console.log("Sub After:", JSON.stringify(subAfter));
    }
    console.log("-------------------------------------");

    return res.status(200).send("OK");

  } catch (err) {
    console.error("[EVIDENCE] Notify Handler Error:", err);
    return res.status(500).send("Server error");
  }
}

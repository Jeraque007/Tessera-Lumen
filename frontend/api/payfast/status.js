// frontend/api/payfast/status.js
// Check payment status for a given email
// Used to verify payment state from Supabase instead of localStorage

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email required" });

  try {
    const supabase = getSupabase();
    const lowerEmail = email.toLowerCase().trim();

    // 1. Check Subscriptions
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("active")
      .eq("email", lowerEmail)
      .maybeSingle();

    // 2. Check Recent One-Time Payment (tarot)
    const { data: oneTime } = await supabase
      .from("payment_log")
      .select("created_at")
      .eq("email", lowerEmail)
      .eq("status", "COMPLETE")
      .eq("is_subscription", false)
      .not("item_name", "ilike", "%Advanced Astrology%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let isPaid = !!sub?.active;
    if (oneTime) {
      const paidAt = new Date(oneTime.created_at);
      const now = new Date();
      // Allow 2 hours for the reading session
      if ((now - paidAt) < 2 * 60 * 60 * 1000) {
        isPaid = true;
      }
    }

    // 3. Check Deeper Reading
    const { data: deeper } = await supabase
      .from("deeper_readings")
      .select("status, delivered")
      .eq("email", lowerEmail)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`[Status Check] ${lowerEmail} -> isPaid: ${isPaid}, deeperPaid: ${!!deeper}`);

    return res.status(200).json({
      isPaid,
      deeperPaid: !!deeper,
      deeperDelivered: deeper?.delivered || false,
      subscriptionActive: sub?.active || false
    });

  } catch (err) {
    console.error("[Status API Error]:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

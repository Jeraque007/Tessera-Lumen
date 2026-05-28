// frontend/api/subscription/quota.js
// Vercel serverless function  runs server-side, uses SECRET key
//
// Daily quota logic:
//   - Each plan has reads_per_day (1/2/3) and reads_limit (10/20/30 per month)
//   - daily_reads_used resets to 0 each new calendar day (UTC)
//   - A read is blocked if EITHER daily OR monthly limit is exhausted
//   - Blocked state = "DAILY_EXHAUSTED" or "MONTHLY_EXHAUSTED"
//
// GET  /api/subscription/quota?email=x   current quota state
// POST /api/subscription/quota           { email, action:"deduct" }

import { createClient } from "@supabase/supabase-js";

// Plan definitions  source of truth for daily limits
const PLAN_CONFIG = {
  4: { readsLimit: 10, readsPerDay: 1 },
  5: { readsLimit: 20, readsPerDay: 2 },
  6: { readsLimit: 30, readsPerDay: 3 },
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Today's date as YYYY-MM-DD in UTC
function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

// Tomorrow's date as a human-readable string
function tomorrowLabel() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// Reset daily counter if it's a new day, return updated sub
async function maybeResetDaily(supabase, sub) {
  const today = todayUTC();
  if (sub.daily_reset_date === today) return sub; // already today  no reset needed

  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update({ daily_reads_used: 0, daily_reset_date: today })
    .eq("email", sub.email)
    .select()
    .single();

  if (error) {
    console.error("[Quota] daily reset error:", error.message);
    return { ...sub, daily_reads_used: 0, daily_reset_date: today };
  }
  return updated;
}

export default async function handler(req, res) {
  const supabase = getSupabase();

  //  GET: return current quota state 
  if (req.method === "GET") {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "email required" });

    let { data: sub, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!sub || !sub.active) return res.status(404).json({ error: "No active subscription" });

    // Reset daily counter if new day
    sub = await maybeResetDaily(supabase, sub);

    const plan       = PLAN_CONFIG[sub.plan_id] || {};
    const perDay     = sub.reads_per_day ?? plan.readsPerDay ?? null;
    const monthLimit = sub.reads_limit;
    const dailyUsed  = sub.daily_reads_used ?? 0;
    const monthLeft  = sub.reads_remaining ?? 0;

    const dailyLeft  = perDay !== null ? Math.max(0, perDay - dailyUsed) : null;
    const dailyExhausted  = perDay !== null && dailyLeft <= 0;
    const monthlyExhausted = monthLimit !== null && monthLeft <= 0;

    return res.status(200).json({
      email,
      planId:           sub.plan_id,
      planName:         sub.plan_name,
      // Monthly
      readsRemaining:   monthLeft,
      readsLimit:       monthLimit,
      // Daily
      readsPerDay:      perDay,
      dailyReadsUsed:   dailyUsed,
      dailyReadsLeft:   dailyLeft,
      dailyExhausted,
      monthlyExhausted,
      // Dates
      renewalDate:      sub.renewal_date,
      tomorrow:         tomorrowLabel(),
      active:           sub.active,
    });
  }

  //  POST: deduct 1 read 
  if (req.method === "POST") {
    const { email, action } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    if (action !== "deduct") return res.status(400).json({ error: "Unknown action" });

    let { data: sub, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!sub || !sub.active) {
      return res.status(403).json({ error: "No active subscription", code: "NO_SUBSCRIPTION" });
    }

    // Reset daily counter if new day
    sub = await maybeResetDaily(supabase, sub);

    const plan       = PLAN_CONFIG[sub.plan_id] || {};
    const perDay     = sub.reads_per_day ?? plan.readsPerDay ?? null;
    const monthLimit = sub.reads_limit;
    const dailyUsed  = sub.daily_reads_used ?? 0;
    const monthLeft  = sub.reads_remaining ?? 0;

    // Check monthly limit
    if (monthLimit !== null && monthLeft <= 0) {
      return res.status(403).json({
        error: "Monthly reading quota exhausted",
        code: "MONTHLY_EXHAUSTED",
        readsRemaining: 0,
        renewalDate: sub.renewal_date,
      });
    }

    // Check daily limit
    if (perDay !== null && dailyUsed >= perDay) {
      return res.status(403).json({
        error: "Daily reading limit reached",
        code: "DAILY_EXHAUSTED",
        dailyReadsLeft: 0,
        tomorrow: tomorrowLabel(),
        renewalDate: sub.renewal_date,
      });
    }

    // Deduct: increment daily_reads_used, decrement reads_remaining
    const newDailyUsed = dailyUsed + 1;
    const newMonthLeft = monthLimit !== null ? Math.max(0, monthLeft - 1) : null;

    const updatePayload = { daily_reads_used: newDailyUsed };
    if (newMonthLeft !== null) updatePayload.reads_remaining = newMonthLeft;

    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("email", email.toLowerCase().trim());

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.status(200).json({
      success: true,
      readsRemaining:  newMonthLeft,
      dailyReadsLeft:  perDay !== null ? Math.max(0, perDay - newDailyUsed) : null,
      dailyReadsUsed:  newDailyUsed,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

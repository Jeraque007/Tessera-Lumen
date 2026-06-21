import { createClient } from "@supabase/supabase-js";

const PLAN_CONFIG = {
  4: { readsLimit: 10, readsPerDay: 1 },
  5: { readsLimit: 20, readsPerDay: 2 },
  6: { readsLimit: 30, readsPerDay: 3 },
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

function tomorrowLabel() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function maybeResetDaily(supabase, sub) {
  const today = todayUTC();
  if (sub.daily_reset_date === today) return sub;

  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update({ daily_reads_used: 0, daily_reset_date: today })
    .eq("email", sub.email)
    .select()
    .maybeSingle();

  if (error) return { ...sub, daily_reads_used: 0, daily_reset_date: today };
  return updated;
}

export default async function handler(req, res) {
  const supabase = getSupabase();

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

    sub = await maybeResetDaily(supabase, sub);

    const plan = PLAN_CONFIG[sub.plan_id] || {};
    const perDay = sub.reads_per_day ?? plan.readsPerDay ?? null;
    const dailyUsed = sub.daily_reads_used ?? 0;
    const dailyLeft = perDay !== null ? Math.max(0, perDay - dailyUsed) : null;

    return res.status(200).json({
      email,
      planId: sub.plan_id,
      planName: sub.plan_name,
      readsRemaining: sub.reads_remaining,
      readsLimit: sub.reads_limit,
      readsPerDay: perDay,
      dailyReadsUsed: dailyUsed,
      dailyReadsLeft: dailyLeft,
      dailyExhausted: perDay !== null && dailyLeft <= 0,
      monthlyExhausted: sub.reads_limit !== null && sub.reads_remaining <= 0,
      renewalDate: sub.renewal_date,
      tomorrow: tomorrowLabel(),
      active: sub.active,
    });
  }

  if (req.method === "POST") {
    const { email, action } = req.body;
    if (!email || action !== "deduct") return res.status(400).json({ error: "Invalid request" });

    let { data: sub, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (fetchErr || !sub || !sub.active) return res.status(403).json({ error: "Unauthorized" });

    sub = await maybeResetDaily(supabase, sub);

    const plan = PLAN_CONFIG[sub.plan_id] || {};
    const perDay = sub.reads_per_day ?? plan.readsPerDay ?? null;
    const dailyUsed = sub.daily_reads_used ?? 0;

    if (sub.reads_limit !== null && sub.reads_remaining <= 0) return res.status(403).json({ error: "Monthly limit reached" });
    if (perDay !== null && dailyUsed >= perDay) return res.status(403).json({ error: "Daily limit reached" });

    const newDailyUsed = dailyUsed + 1;
    const newMonthLeft = sub.reads_limit !== null ? Math.max(0, sub.reads_remaining - 1) : null;

    const { error: updErr } = await supabase
      .from("subscriptions")
      .update({ daily_reads_used: newDailyUsed, reads_remaining: newMonthLeft })
      .eq("email", email.toLowerCase().trim());

    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ success: true, readsRemaining: newMonthLeft, dailyReadsUsed: newDailyUsed });
  }

  return res.status(405).send("Method not allowed");
}

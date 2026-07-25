import { supabase } from "../lib/supabase.js";

const PLAN_CONFIG = {
  4: { readsLimit: 10, readsPerDay: 1 },
  5: { readsLimit: 20, readsPerDay: 2 },
  6: { readsLimit: 30, readsPerDay: 3 },
};

function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

function tomorrowLabel() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function maybeResetDaily(sub) {
  const today = todayUTC();
  if (sub.daily_reset_date === today) return sub;

  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update({ daily_reads_used: 0, daily_reset_date: today })
    .eq("email", sub.email)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Quota] daily reset error:", error.message);
    return { ...sub, daily_reads_used: 0, daily_reset_date: today };
  }
  return updated;
}

export const getStatus = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;
    res.json({ isPaid: data?.active || false, plan: data?.plan_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuota = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email required" });

  try {
    let { data: sub, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!sub || !sub.active) return res.status(404).json({ error: "No active subscription" });

    sub = await maybeResetDaily(sub);

    const plan = PLAN_CONFIG[sub.plan_id] || {};
    const perDay = sub.reads_per_day ?? plan.readsPerDay ?? null;
    const monthLimit = sub.reads_limit;
    const dailyUsed = sub.daily_reads_used ?? 0;
    const monthLeft = sub.reads_remaining ?? 0;

    const dailyLeft = perDay !== null ? Math.max(0, perDay - dailyUsed) : null;

    res.json({
      email,
      planId: sub.plan_id,
      planName: sub.plan_name,
      readsRemaining: monthLeft,
      readsLimit: monthLimit,
      readsPerDay: perDay,
      dailyReadsUsed: dailyUsed,
      dailyReadsLeft: dailyLeft,
      dailyExhausted: perDay !== null && dailyLeft <= 0,
      monthlyExhausted: monthLimit !== null && monthLeft <= 0,
      renewalDate: sub.renewal_date,
      tomorrow: tomorrowLabel(),
      active: sub.active,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deductQuota = async (req, res) => {
  const { email, action } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  if (action !== "deduct") return res.status(400).json({ error: "Unknown action" });

  try {
    let { data: sub, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!sub || !sub.active) {
      return res.status(403).json({ error: "No active subscription", code: "NO_SUBSCRIPTION" });
    }

    sub = await maybeResetDaily(sub);

    const plan = PLAN_CONFIG[sub.plan_id] || {};
    const perDay = sub.reads_per_day ?? plan.readsPerDay ?? null;
    const monthLimit = sub.reads_limit;
    const dailyUsed = sub.daily_reads_used ?? 0;
    const monthLeft = sub.reads_remaining ?? 0;

    if (monthLimit !== null && monthLeft <= 0) {
      return res.status(403).json({ error: "Monthly reading quota exhausted", code: "MONTHLY_EXHAUSTED" });
    }

    if (perDay !== null && dailyUsed >= perDay) {
      return res.status(403).json({ error: "Daily reading limit reached", code: "DAILY_EXHAUSTED" });
    }

    const newDailyUsed = dailyUsed + 1;
    const newMonthLeft = monthLimit !== null ? Math.max(0, monthLeft - 1) : null;

    const updatePayload = { daily_reads_used: newDailyUsed };
    if (newMonthLeft !== null) updatePayload.reads_remaining = newMonthLeft;

    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("email", email.toLowerCase().trim());

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    res.json({
      success: true,
      readsRemaining: newMonthLeft,
      dailyReadsLeft: perDay !== null ? Math.max(0, perDay - newDailyUsed) : null,
      dailyReadsUsed: newDailyUsed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

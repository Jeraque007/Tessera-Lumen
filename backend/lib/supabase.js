// backend/lib/supabase.js
// Server-side Supabase client  uses the SECRET key.
// NEVER import this file from frontend/browser code.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.warn("[Supabase] WARNING: SUPABASE_URL or SUPABASE_SECRET_KEY not set.");
}

// service_role client  bypasses RLS, full DB access, backend only
export const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_SECRET_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

//  User Profiles 

/**
 * Upsert a user profile. Safe to call on every form submission.
 */
export async function upsertUserProfile({ name, email, dob }) {
  if (!email) return { error: "email required" };
  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      { email: email.toLowerCase().trim(), name, dob },
      { onConflict: "email" }
    );
  if (error) console.error("[Supabase] upsertUserProfile:", error.message);
  return { error };
}

//  Subscriptions 

/**
 * Get a subscription row by email.
 */
export async function getSubscription(email) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) console.error("[Supabase] getSubscription:", error.message);
  return { data, error };
}

/**
 * Activate or renew a subscription after a successful payment.
 */
export async function activateSubscription({ email, planId, planName, readsLimit, readsPerDay, subscriptionToken }) {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        plan_id: planId,
        plan_name: planName,
        reads_remaining: readsLimit,   // null = unlimited for consumables or legacy
        reads_limit: readsLimit,
        reads_per_day: readsPerDay || null,
        active: true,
        activated_at: new Date().toISOString(),
        renewal_date: renewalDate.toISOString(),
        subscription_token: subscriptionToken || null,
      },
      { onConflict: "email" }
    );
  if (error) console.error("[Supabase] activateSubscription:", error.message);
  return { error };
}

/**
 * Deduct one read from a subscription. Returns updated reads_remaining.
 */
export async function deductRead(email) {
  const { data: sub, error: fetchErr } = await getSubscription(email);
  if (fetchErr || !sub) return { readsRemaining: null, error: fetchErr || new Error("No subscription") };
  if (sub.reads_limit === null) return { readsRemaining: null, error: null }; // unlimited

  const next = Math.max(0, (sub.reads_remaining ?? 0) - 1);
  const { error } = await supabase
    .from("subscriptions")
    .update({ reads_remaining: next })
    .eq("email", email.toLowerCase().trim());
  if (error) console.error("[Supabase] deductRead:", error.message);
  return { readsRemaining: next, error };
}

//  Payment Log 

/**
 * Log a payment ITN event (immutable record).
 */
export async function logPayment({ paymentId, mPaymentId, email, name, amount, status, planId, itemName, isSubscription, rawPayload }) {
  const { error } = await supabase.from("payment_log").insert({
    payment_id:      paymentId,
    m_payment_id:    mPaymentId,
    email:           email ? email.toLowerCase().trim() : null,
    name,
    amount,
    status,
    plan_id:         planId,
    item_name:       itemName,
    is_subscription: isSubscription,
    raw_payload:     rawPayload,
  });
  if (error) console.error("[Supabase] logPayment:", error.message);
  return { error };
}

//  Reading Log 

/**
 * Log a reading event for analytics and quota audit.
 */
export async function logReading({ email, cardNumbers, intention, planId, language }) {
  const { error } = await supabase.from("reading_log").insert({
    email:        email ? email.toLowerCase().trim() : null,
    card_numbers: cardNumbers,
    intention,
    plan_id:      planId,
    language:     language || "en",
  });
  if (error) console.error("[Supabase] logReading:", error.message);
  return { error };
}

//  Translation Cache 

/**
 * Get a cached translation batch. Returns array of strings or null.
 */
export async function getCachedTranslation(cacheKey) {
  const { data, error } = await supabase
    .from("translation_cache")
    .select("translations")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  if (error) console.error("[Supabase] getCachedTranslation:", error.message);
  return data?.translations ?? null;
}

/**
 * Store a translation batch in the cache.
 */
export async function setCachedTranslation(cacheKey, lang, translations) {
  const { error } = await supabase
    .from("translation_cache")
    .upsert({ cache_key: cacheKey, lang, translations }, { onConflict: "cache_key" });
  if (error) console.error("[Supabase] setCachedTranslation:", error.message);
}

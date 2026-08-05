// backend/lib/supabase.js
import "./polyfill.js"; // MUST BE FIRST - Polyfills WebSocket for Node 20/Vercel
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL        = process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "";

// Fail-safe initialization
const isConfigured = SUPABASE_URL.startsWith("http") && SUPABASE_SECRET_KEY.length > 0;

if (!isConfigured) {
  console.warn("[Supabase] Configuration missing. Falling back to dummy client.");
}

// Dummy client to prevent crashes in controllers if environment variables are missing
const dummyResult = (val = null) => Promise.resolve({ data: val, error: { message: "Supabase not configured" } });
const dummyChain = {
  select: () => dummyChain,
  eq: () => dummyChain,
  limit: () => dummyChain,
  order: () => dummyChain,
  maybeSingle: () => dummyResult(),
  insert: () => dummyResult(),
  upsert: () => dummyResult(),
  update: () => dummyChain,
  delete: () => dummyChain,
  then: (resolve) => resolve({ data: null, error: { message: "Supabase not configured" } }),
  catch: (reject) => Promise.reject(new Error("Supabase not configured")).catch(reject)
};

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (...args) => fetch(...args),
      }
    })
  : {
      from: () => dummyChain,
      auth: {
        getUser: () => dummyResult(),
        signInWithPassword: () => dummyResult(),
      }
    };

//  User Profiles 
export async function upsertUserProfile({ name, email, dob }) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !normalizedName) {
    return { error: { message: "name and email required" } };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { error: { message: "invalid email" } };
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert({ email: normalizedEmail, name: normalizedName, dob }, { onConflict: "email" });
  return { error };
}

//  Subscriptions 
export async function getSubscription(email) {
  if (!email) return { data: null, error: { message: "email required" } };
  return await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
}

export async function activateSubscription({ email, planId, planName, readsLimit, readsPerDay, subscriptionToken }) {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  return await supabase
    .from("subscriptions")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        plan_id: planId,
        plan_name: planName,
        reads_remaining: readsLimit,
        reads_limit: readsLimit,
        reads_per_day: readsPerDay || null,
        active: true,
        activated_at: new Date().toISOString(),
        renewal_date: renewalDate.toISOString(),
        subscription_token: subscriptionToken || null,
      },
      { onConflict: "email" }
    );
}

export async function deductRead(email) {
  const { data: sub, error: fetchErr } = await getSubscription(email);
  if (fetchErr || !sub) return { readsRemaining: null, error: fetchErr };
  if (sub.reads_limit === null) return { readsRemaining: null, error: null };

  const next = Math.max(0, (sub.reads_remaining ?? 0) - 1);
  const { error } = await supabase
    .from("subscriptions")
    .update({ reads_remaining: next })
    .eq("email", email.toLowerCase().trim());
  return { readsRemaining: next, error };
}

//  Payment Log 
export async function logPayment({ paymentId, mPaymentId, email, name, amount, status, planId, itemName, isSubscription, rawPayload }) {
  return await supabase.from("payment_log").insert({
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
}

//  Reading Log 
export async function logReading({ email, cardNumbers, intention, planId, language }) {
  return await supabase.from("reading_log").insert({
    email:        email ? email.toLowerCase().trim() : null,
    card_numbers: cardNumbers,
    intention,
    plan_id:      planId,
    language:     language || "en",
  });
}

//  Translation Cache 
export async function getCachedTranslation(cacheKey) {
  const { data } = await supabase
    .from("translation_cache")
    .select("translations")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  return data?.translations ?? null;
}

export async function setCachedTranslation(cacheKey, lang, translations) {
  await supabase
    .from("translation_cache")
    .upsert({ cache_key: cacheKey, lang, translations }, { onConflict: "cache_key" });
}

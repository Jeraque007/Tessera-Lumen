import express from "express";
import cors from "cors";
import crypto from "crypto";
import fetch from "node-fetch";
import { createRequire } from "module";

// Load .env
const require = createRequire(import.meta.url);
try { require("dotenv").config(); } catch (_) {}

import {
  supabase,
  upsertUserProfile,
  getCachedTranslation,
  setCachedTranslation,
  activateSubscription,
  logPayment,
} from "./lib/supabase.js";

const app      = express();
const PORT     = process.env.PORT || 4000;
const DEEPL_KEY = process.env.DEEPL_API_KEY || "";

const HUAWEI_PUBLIC_KEY = process.env.HUAWEI_PUBLIC_KEY;

function verifyHuaweiSignature(data, signature) {
  if (!HUAWEI_PUBLIC_KEY) {
    console.warn("[HMS] HUAWEI_PUBLIC_KEY not set. Skipping verification (DEV ONLY).");
    return true;
  }
  try {
    const formattedKey = `-----BEGIN PUBLIC KEY-----\n${HUAWEI_PUBLIC_KEY.match(/.{1,64}/g).join("\n")}\n-----END PUBLIC KEY-----`;
    const verifier = crypto.createVerify("SHA256");
    verifier.update(data);
    return verifier.verify(formattedKey, signature, "base64");
  } catch (err) {
    console.error("[HMS] Verification error:", err.message);
    return false;
  }
}

//  Zoho OAuth Management
let zohoAccessToken = process.env.ZOHO_ACCESS_TOKEN;

async function refreshZohoToken() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch(`https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.access_token) {
      zohoAccessToken = data.access_token;
      console.log("[Zoho] Token refreshed successfully");
      return zohoAccessToken;
    }
    console.error("[Zoho] Refresh failed:", data);
  } catch (err) {
    console.error("[Zoho] Refresh error:", err);
  }
  return null;
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));

//  Health check 
app.get("/api/health", async (_req, res) => {
  // Ping Supabase to confirm connectivity
  const { error } = await supabase.from("user_profiles").select("id").limit(1);
  res.json({
    status: "ok",
    supabase: error ? "error: " + error.message : "connected",
    deepl: !!DEEPL_KEY,
  });
});

//  CRM / User Profile 
// POST /api/crm
// Body: { name, email, dob }
// Upserts user_profiles in Supabase; optionally syncs to Zoho CRM
app.post("/api/crm", async (req, res) => {
  const { name, email, dob, birthDate } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const { error } = await upsertUserProfile({
    name,
    email,
    dob: dob || birthDate || null,
  });

  if (error) {
    console.error("[CRM] upsert failed:", error.message);
  }

  // Zoho CRM sync
  if (zohoAccessToken) {
    const sendToZoho = async (token) => {
      const response = await fetch("https://www.zohoapis.com/crm/v2/Leads", {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [{ Last_Name: name || "Unknown", Email: email }] }),
      });
      return response;
    };

    let response = await sendToZoho(zohoAccessToken);

    // If unauthorized, attempt one refresh
    if (response.status === 401) {
      console.log("[Zoho] Access token expired, refreshing...");
      const newToken = await refreshZohoToken();
      if (newToken) {
        response = await sendToZoho(newToken);
      }
    }
  }

  res.json({ ok: true });
});

//  Huawei IAP Verification
app.post("/api/huawei/verify", async (req, res) => {
  const { purchaseData, signature, email, name } = req.body;

  if (!purchaseData || !signature || !email) {
    return res.status(400).json({ error: "purchaseData, signature and email required" });
  }

  // Verify signature
  const isValid = verifyHuaweiSignature(purchaseData, signature);
  if (!isValid) {
    console.error("[Huawei Verify] Invalid signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    const data = JSON.parse(purchaseData);
    const productId = data.productId;

    // In a real production environment, you should verify the signature with Huawei public key.
    // For this implementation, we will trust the client-side signature for now as per "minimal safe fixes"
    // and focus on updating the Supabase state correctly.

    let planName = productId;
    let readsLimit = null;
    let readsPerDay = null;
    let isSubscription = false;

    if (productId === "Quick.Insight") {
      readsLimit = 1;
    } else if (productId === "Past.Present.Future") {
      readsLimit = 3;
    } else if (productId === "Deep.Dive") {
      readsLimit = 5;
    } else if (productId === "Astrological.Chart.Reading") {
      readsLimit = 1;
      planName = "Advanced Reading";
    } else if (productId === "10.Readings_Month") {
      readsPerDay = 1;
      isSubscription = true;
    } else if (productId === "20.Readings_Month") {
      readsPerDay = 2;
      isSubscription = true;
    } else if (productId === "30.Readings_Month1") {
      readsPerDay = 3;
      isSubscription = true;
    }

    // Log the payment
    await logPayment({
      paymentId: data.orderId,
      mPaymentId: data.developerPayload,
      email,
      name,
      amount: data.price / 100, // Assuming price is in cents
      status: "COMPLETE",
      planId: productId,
      itemName: planName,
      isSubscription,
      rawPayload: purchaseData
    });

    // Activate subscription
    const { error } = await activateSubscription({
      email,
      planId: productId,
      planName,
      readsLimit,
      readsPerDay,
      subscriptionToken: data.purchaseToken
    });

    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    console.error("[Huawei Verify] error:", err);
    res.status(500).json({ error: err.message });
  }
});

//  Translation 
// POST /api/translate
// Body: { texts: string[], targetLang: string, cacheKey: string }
// Returns: { translations: string[], cached: boolean }
app.post("/api/translate", async (req, res) => {
  const { texts, targetLang, cacheKey } = req.body;
  if (!texts || !targetLang) {
    return res.status(400).json({ error: "texts and targetLang required" });
  }

  const key = `${targetLang.toUpperCase()}:${cacheKey || texts.join("|").slice(0, 80)}`;

  // Check Supabase cache first
  const cached = await getCachedTranslation(key);
  if (cached) {
    return res.json({ translations: cached, cached: true });
  }

  if (!DEEPL_KEY) {
    return res.status(503).json({ error: "Translation service not configured" });
  }

  try {
    const body = new URLSearchParams();
    texts.forEach(t => body.append("text", t));
    body.append("target_lang", targetLang.toUpperCase());
    body.append("source_lang", "EN");
    body.append("preserve_formatting", "1");

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[DeepL] error:", response.status, err);
      return res.status(502).json({ error: "Translation API error", detail: err });
    }

    const data = await response.json();
    const translations = data.translations.map(t => t.text);

    // Persist to Supabase cache (fire-and-forget)
    setCachedTranslation(key, targetLang.toUpperCase(), translations).catch(() => {});

    res.json({ translations, cached: false });
  } catch (err) {
    console.error("[Translate] error:", err);
    res.status(500).json({ error: err.message });
  }
});

//  Supported languages 
app.get("/api/languages", async (_req, res) => {
  if (!DEEPL_KEY) return res.json({ languages: [] });
  try {
    const response = await fetch("https://api-free.deepl.com/v2/languages?type=target", {
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
    });
    const data = await response.json();
    res.json({ languages: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  DeepL usage 
app.get("/api/translate/usage", async (_req, res) => {
  if (!DEEPL_KEY) return res.json({ character_count: 0, character_limit: 0 });
  try {
    const response = await fetch("https://api-free.deepl.com/v2/usage", {
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Subscription Quota

app.get("/api/subscription/quota", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email required" });

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!sub) return res.status(404).json({ active: false });

  // Handle daily reset
  const today = new Date().toISOString().split("T")[0];
  if (sub.daily_reset_date !== today) {
    await supabase
      .from("subscriptions")
      .update({ daily_reads_used: 0, daily_reset_date: today })
      .eq("email", email.toLowerCase().trim());
    sub.daily_reads_used = 0;
  }

  const dailyExhausted = sub.reads_per_day !== null && sub.daily_reads_used >= sub.reads_per_day;
  const monthlyExhausted = sub.reads_limit !== null && sub.reads_remaining <= 0;

  res.json({
    active: sub.active,
    readsPerDay: sub.reads_per_day,
    dailyReadsUsed: sub.daily_reads_used,
    dailyReadsLeft: sub.reads_per_day ? Math.max(0, sub.reads_per_day - sub.daily_reads_used) : null,
    readsRemaining: sub.reads_remaining,
    dailyExhausted,
    monthlyExhausted,
    renewalDate: sub.renewal_date,
    tomorrow: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
});

app.post("/api/subscription/quota", async (req, res) => {
  const { email, action } = req.body;
  if (!email || action !== "deduct") return res.status(400).json({ error: "invalid request" });

  const { data: sub, error: fetchErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (fetchErr || !sub) return res.status(404).json({ error: "subscription not found" });

  const updates = {};
  if (sub.reads_limit !== null) {
    updates.reads_remaining = Math.max(0, (sub.reads_remaining ?? 0) - 1);
  }
  if (sub.reads_per_day !== null) {
    updates.daily_reads_used = (sub.daily_reads_used ?? 0) + 1;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("email", email.toLowerCase().trim());

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, ...updates });
});

app.listen(PORT, () =>
  console.log(`Tessera Lumen backend running on http://localhost:${PORT}`)
);

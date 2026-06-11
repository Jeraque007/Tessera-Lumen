// frontend/api/crm.js
// Vercel serverless function - CRM / User Profile
// Upserts user_profiles in Supabase + syncs to Zoho CRM

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function refreshZohoToken() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
      { method: "POST" }
    );
    const data = await res.json();
    if (data.access_token) {
      console.log("[Zoho] Token refreshed");
      return data.access_token;
    }
    console.error("[Zoho] Refresh failed:", data);
  } catch (err) {
    console.error("[Zoho] Refresh error:", err.message);
  }
  return null;
}

async function sendToZoho(token, name, email) {
  // Use Zoho upsert to avoid duplicate leads - matches on Email field
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
  const response = await fetch("https://www.zohoapis.com/crm/v2/Leads/upsert", {
    signal: controller.signal,
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Last_Name: name || "Unknown",
        Email: email,
      }],
      duplicate_check_fields: ["Email"],
    }),
  });
  clearTimeout(timeout);
  return response;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, dob, birthDate } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const supabase = getSupabase();

  // 1. Upsert to Supabase user_profiles
  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      { email: email.toLowerCase().trim(), name, dob: dob || birthDate || null },
      { onConflict: "email" }
    );

  if (error) {
    console.error("[CRM] Supabase upsert failed:", error.message);
  }

  // 2. Zoho CRM sync (if credentials are configured)
  const zohoToken = process.env.ZOHO_ACCESS_TOKEN;
  if (zohoToken) {
    try {
      let response = await sendToZoho(zohoToken, name, email);

      // If token expired, refresh and retry once
      if (response.status === 401) {
        console.log("[Zoho] Token expired, refreshing...");
        const newToken = await refreshZohoToken();
        if (newToken) {
          response = await sendToZoho(newToken, name, email);
        }
      }

      if (response.ok) {
        console.log("[Zoho] Lead created/updated for:", email);
      } else {
        const errBody = await response.text();
        console.error("[Zoho] API error:", response.status, errBody);
      }
    } catch (err) {
      console.error("[Zoho] Sync error:", err.message);
    }
  }

  res.json({ ok: true });
}
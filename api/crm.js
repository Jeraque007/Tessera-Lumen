import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  // Check all possible naming variations from Vercel/Supabase integration
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration environment variables.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
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
    return data.access_token || null;
  } catch (err) {
    return null;
  }
}

async function sendToZoho(token, name, email) {
  return fetch("https://www.zohoapis.com/crm/v2/Leads/upsert", {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{ Last_Name: name || "Unknown", Email: email }],
      duplicate_check_fields: ["Email"],
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, dob, birthDate } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  try {
    const supabase = getSupabase();
    // 1. Supabase
    await supabase.from("user_profiles").upsert(
      { email: email.toLowerCase().trim(), name, dob: dob || birthDate },
      { onConflict: "email" }
    );

    // 2. Zoho CRM
    const zohoToken = process.env.ZOHO_ACCESS_TOKEN;
    if (zohoToken) {
      let response = await sendToZoho(zohoToken, name, email);
      if (response.status === 401) {
        const newToken = await refreshZohoToken();
        if (newToken) await sendToZoho(newToken, name, email);
      }
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

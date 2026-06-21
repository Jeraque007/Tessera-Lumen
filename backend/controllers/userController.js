import { upsertUserProfile } from "../lib/supabase.js";
import nodeFetch from "node-fetch";

async function refreshZohoToken() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await nodeFetch(
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
  return nodeFetch("https://www.zohoapis.com/crm/v2/Leads/upsert", {
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

export const syncCRM = async (req, res) => {
  const { name, email, dob, birthDate } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  try {
    // 1. Supabase
    await upsertUserProfile({ name, email, dob: dob || birthDate });

    // 2. Zoho CRM
    const zohoToken = process.env.ZOHO_ACCESS_TOKEN;
    if (zohoToken) {
      let response = await sendToZoho(zohoToken, name, email);
      if (response.status === 401) {
        const newToken = await refreshZohoToken();
        if (newToken) await sendToZoho(newToken, name, email);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import { upsertUserProfile } from "../lib/supabase.js";

async function refreshZohoToken() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
      { method: "POST", signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.warn("[Zoho] Token refresh aborted or failed:", err.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendToZoho(token, name, email) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://www.zohoapis.com/crm/v2/Leads/upsert", {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [{ Last_Name: name || "Unknown", Email: email }],
        duplicate_check_fields: ["Email"],
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    console.warn("[Zoho] Lead upsert aborted or failed:", err.message);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const syncCRM = async (req, res) => {
  const { name, email, dob, birthDate } = req.body;
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !normalizedName) {
    return res.status(400).json({ error: "name and email required" });
  }

  try {
    // 1. Supabase
    const profileResult = await upsertUserProfile({ name: normalizedName, email: normalizedEmail, dob: dob || birthDate });
    if (profileResult?.error) {
      return res.status(400).json({ error: profileResult.error.message });
    }

    // 2. Zoho CRM
    const zohoToken = process.env.ZOHO_ACCESS_TOKEN;
    if (zohoToken) {
      let response = await sendToZoho(zohoToken, normalizedName, normalizedEmail);
      if (response.status === 401) {
        const newToken = await refreshZohoToken();
        if (newToken) await sendToZoho(newToken, normalizedName, normalizedEmail);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

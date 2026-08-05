import crypto from "crypto";
import { supabase, logPayment, activateSubscription } from "../lib/supabase.js";

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const IS_SANDBOX = process.env.PAYFAST_SANDBOX === "true";

const PLAN_CONFIG = {
  4: { readsLimit: 10, readsPerDay: 1 },
  5: { readsLimit: 20, readsPerDay: 2 },
  6: { readsLimit: 30, readsPerDay: 3 },
};

function pfEncode(str) {
  return encodeURIComponent(String(str).trim())
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

const PF_FIELD_ORDER = [
  "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
  "name_first", "name_last", "email_address", "m_payment_id", "amount",
  "item_name", "item_description", "custom_str1", "custom_str2",
  "subscription_type", "billing_date", "recurring_amount", "frequency", "cycles"
];

function generateSignature(data, passphrase = "") {
  const pfParamString = PF_FIELD_ORDER
    .filter(key => data[key] !== undefined && data[key] !== null && data[key] !== "")
    .map(key => `${key}=${pfEncode(data[key])}`)
    .join("&");

  const stringToHash = passphrase
    ? `${pfParamString}&passphrase=${pfEncode(passphrase)}`
    : pfParamString;

  return crypto.createHash("md5").update(stringToHash).digest("hex");
}

export const initiate = async (req, res) => {
  try {
    const { package: pkg, user, native } = req.body;
    if (!pkg || !user) return res.status(400).json({ error: "Missing package or user data" });

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["host"];
    const SITE_URL = `${protocol}://${host}`;

    // If it's a native app, we return through the Cloudflare Gateway to handle the
    // Zero-Touch Intent redirect (bypassing the "Open in app?" prompt).
    const GATEWAY_URL = "https://verify.963.co.za";
    const RETURN_BASE = native ? GATEWAY_URL : SITE_URL;

    const isSubscription = pkg.type === "sub";
    const isDeeper = pkg.type === "deeper";

    // BREAK THE LOOP: Use local logic instead of fetching /api/fx/rate from itself
    let exchangeRate = 19.10;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const fxRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const fxData = await fxRes.json();
      exchangeRate = fxData.rates['ZAR'] || 19.10;
    } catch (_) {
      console.warn("[PayFast] FX fetch aborted or failed, using fallback exchange rate");
    } finally {
      clearTimeout(timeoutId);
    }

    const usdAmount = parseFloat(pkg.priceUSD || pkg.price || "9.99");
    const localAmount = (usdAmount * exchangeRate).toFixed(2);

    const pfData = {};
    pfData.merchant_id = (MERCHANT_ID || "").trim();
    pfData.merchant_key = (MERCHANT_KEY || "").trim();

    if (!pfData.merchant_id || !pfData.merchant_key) {
      console.error("[PayFast] Missing Merchant Credentials");
      return res.status(500).json({ error: "Server configuration error (Credentials)" });
    }

    pfData.return_url = isDeeper ? `${RETURN_BASE}/?deeper_paid=1` : `${RETURN_BASE}/?paid=1`;
    pfData.cancel_url = isDeeper ? `${RETURN_BASE}/?deeper_cancelled=1` : `${RETURN_BASE}/?cancelled=1`;
    pfData.notify_url = `${SITE_URL}/api/payfast/notify`;

    const nameParts = (user.name || "Seeker").trim().split(" ");
    pfData.name_first = nameParts[0] || "Seeker";
    if (nameParts.length > 1) pfData.name_last = nameParts.slice(1).join(" ");
    if (user.email) pfData.email_address = user.email.trim();

    pfData.m_payment_id = `TL-${isDeeper ? "D" : "R"}-${Date.now()}`;
    pfData.amount = localAmount;
    pfData.item_name = isDeeper ? "Tessera Lumen - Advanced Astrology Reading" : `Tessera Lumen - ${pkg.name}`;
    pfData.item_description = pkg.desc || "Oracle Reading";

    if (isSubscription) {
      pfData.subscription_type = "1";
      pfData.billing_date = new Date().toISOString().split("T")[0];
      pfData.recurring_amount = localAmount;
      pfData.frequency = "3";
      pfData.cycles = "0";
    }

    pfData.custom_str1 = isDeeper ? "deeper" : String(pkg.id || "");
    pfData.custom_str2 = user.email || "";

    pfData.signature = generateSignature(pfData, PASSPHRASE.trim());

    const pfHost = IS_SANDBOX ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";

    res.json({ paymentUrl: pfHost, fields: pfData, isSandbox: IS_SANDBOX });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const notify = async (req, res) => {
  console.log("🔥 PAYFAST ITN HIT");
  try {
    const pfData = req.body;
    const host = IS_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";

    // Validate with PayFast
    const validateBody = Object.keys(pfData)
      .filter(k => k !== "signature")
      .map(key => `${key}=${pfEncode(pfData[key])}`)
      .join("&");

    const valRes = await fetch(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: validateBody,
    });
    const valResult = await valRes.text();

    if (valResult.trim() !== "VALID") {
      console.error("[PayFast] Validation failed");
      return res.status(400).send("Validation failed");
    }

    const email = (pfData.email_address || "").toLowerCase().trim();
    const status = pfData.payment_status;
    const customStr1 = pfData.custom_str1 || "";
    const isDeeper = customStr1 === "deeper";
    const planId = isDeeper ? null : parseInt(customStr1 || "0");

    // Log the payment
    await logPayment({
      paymentId: pfData.pf_payment_id,
      mPaymentId: pfData.m_payment_id,
      email,
      name: `${pfData.name_first || ""} ${pfData.name_last || ""}`.trim(),
      amount: parseFloat(pfData.amount_gross || "0"),
      status,
      planId,
      itemName: pfData.item_name || "",
      isSubscription: pfData.subscription_type === "1",
      rawPayload: pfData,
    });

    if (status === "COMPLETE" && email) {
      if (isDeeper) {
        await supabase.from("deeper_readings").upsert({
          payment_id: pfData.pf_payment_id,
          email,
          name: `${pfData.name_first || ""} ${pfData.name_last || ""}`.trim(),
          amount: parseFloat(pfData.amount_gross || "0"),
          status: "complete"
        }, { onConflict: "payment_id" });
      } else {
        const cfg = PLAN_CONFIG[planId] || {};
        await activateSubscription({
          email,
          planId,
          planName: pfData.item_name,
          readsLimit: cfg.readsLimit,
          readsPerDay: cfg.readsPerDay,
          subscriptionToken: pfData.token || null
        });
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("[PayFast] Notify error:", error.message);
    res.status(500).send("Server error");
  }
};

export const getStatus = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data: sub } = await supabase.from("subscriptions").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();
    const { data: deeper } = await supabase.from("deeper_readings").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();

    res.json({
      isPaid: sub?.active || false,
      planId: sub?.plan_id,
      deeperPaid: deeper?.status === "complete" || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const relay = (req, res) => {
  const { url, ...fields } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  // SECURITY: Only allow PayFast domains
  const ALLOWED_RELAY_HOSTS = ["www.payfast.co.za", "sandbox.payfast.co.za"];
  try {
    const parsed = new URL(url);
    if (!ALLOWED_RELAY_HOSTS.includes(parsed.hostname)) {
      return res.status(403).send("Forbidden: Invalid relay target");
    }
  } catch {
    return res.status(400).send("Invalid URL");
  }

  // SECURITY: HTML-escape all values to prevent XSS
  const escapeHtml = (str) => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  const formFields = Object.keys(fields)
    .map(key => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(fields[key])}">`)
    .join("\n");

  const html = `
    <html>
      <head><title>Redirecting...</title></head>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${escapeHtml(url)}">
          ${formFields}
          <button type="submit">Click here if not redirected</button>
        </form>
      </body>
    </html>
  `;
  res.send(html);
};

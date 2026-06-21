import crypto from "crypto";

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const IS_SANDBOX = process.env.PAYFAST_SANDBOX === "true";

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

export default async function handler(req, res) {
  console.log("[API] PayFast Initiate called. Method:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const { package: pkg, user, native } = body;

    if (!pkg || !user) {
      console.error("[API] Missing data:", { hasPkg: !!pkg, hasUser: !!user });
      return res.status(400).json({ error: "Missing package or user data" });
    }

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["host"];
    const SITE_URL = `${protocol}://${host}`;

    // If it's a native app, we return through the Cloudflare Gateway to handle the
    // Zero-Touch Intent redirect (bypassing the "Open in app?" prompt).
    const GATEWAY_URL = "https://verify.963.co.za";
    const RETURN_BASE = native ? GATEWAY_URL : SITE_URL;

    const isSubscription = pkg.type === "sub";
    const isDeeper = pkg.type === "deeper";

    // Use current ZAR rate
    let exchangeRate = 19.10;
    try {
      const rateRes = await fetch(`${SITE_URL}/api/rate`);
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        // ALWAYS use zarRate for PayFast transactions, regardless of user display
        exchangeRate = rateData.zarRate || rateData.rate || 19.10;
      }
    } catch (_) {}

    const usdAmount = parseFloat(pkg.priceUSD || pkg.price || "9.99");
    const localAmount = (usdAmount * exchangeRate).toFixed(2);

    const pfData = {};
    pfData.merchant_id = (MERCHANT_ID || "").trim();
    pfData.merchant_key = (MERCHANT_KEY || "").trim();

    if (!pfData.merchant_id || !pfData.merchant_key) {
      console.error("[PayFast] Missing Merchant Credentials in Environment Variables");
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

    res.status(200).json({ paymentUrl: pfHost, fields: pfData, isSandbox: IS_SANDBOX });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

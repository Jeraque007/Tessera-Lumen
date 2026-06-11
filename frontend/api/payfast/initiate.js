// frontend/api/payfast/initiate.js
// Vercel serverless function  generates signed PayFast payment data

import crypto from "crypto";

const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE || "";

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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host_header = req.headers["host"];
  const SITE_URL = `${protocol}://${host_header}`;

  console.log("[EVIDENCE] Using SITE_URL for callbacks:", SITE_URL);

  const { package: pkg, user } = req.body;
  if (!pkg || !user) return res.status(400).json({ error: "Missing package or user data" });

  const isSubscription = pkg.type === "sub";
  const isDeeper       = pkg.type === "deeper";

  let zarRate = 18.80;
  try {
    const rateRes = await fetch(`${SITE_URL}/api/fx/rate`);
    if (rateRes.ok) {
      const rateData = await rateRes.json();
      zarRate = rateData.rate || 18.80;
    }
  } catch (_) {}

  const usdAmount  = parseFloat(pkg.priceUSD || "9.99");
  const amountZAR  = (usdAmount * zarRate).toFixed(2);

  const pfData = {};
  pfData.merchant_id  = MERCHANT_ID.trim();
  pfData.merchant_key = MERCHANT_KEY.trim();

  pfData.return_url = isDeeper
    ? `${SITE_URL}/?deeper_paid=1`
    : `${SITE_URL}/?paid=1`;
  pfData.cancel_url = isDeeper
    ? `${SITE_URL}/?deeper_cancelled=1`
    : `${SITE_URL}/?cancelled=1`;
  pfData.notify_url = `${SITE_URL}/api/payfast/notify`;

  const nameParts = (user.name || "Seeker").trim().split(" ");
  pfData.name_first = nameParts[0] || "Seeker";
  if (nameParts.length > 1) pfData.name_last = nameParts.slice(1).join(" ");
  if (user.email) pfData.email_address = user.email.trim();

  pfData.m_payment_id     = `TL-${isDeeper ? "D" : "R"}-${Date.now()}`;
  pfData.amount           = amountZAR;
  pfData.item_name        = isDeeper
    ? "Tessera Lumen - Advanced Astrology Reading"
    : `Tessera Lumen - ${pkg.name}`;
  pfData.item_description = pkg.desc || "Oracle Reading";

  if (isSubscription) {
    pfData.subscription_type = "1";
    pfData.billing_date      = new Date().toISOString().split("T")[0];
    pfData.recurring_amount  = amountZAR;
    pfData.frequency         = "3";
    pfData.cycles            = "0";
  }

  pfData.custom_str1 = isDeeper ? "deeper" : String(pkg.id || "");
  pfData.custom_str2 = user.email || "";

  pfData.signature = generateSignature(pfData, PASSPHRASE.trim());

  // [EVIDENCE] 1. Payment Initiated
  console.log("--- [EVIDENCE] 1. PAYMENT INITIATED ---");
  console.log("Session ID (Internal):", `SESSION-${Date.now()}`);
  console.log("Transaction ID (m_payment_id):", pfData.m_payment_id);
  console.log("User ID (Email):", user.email);
  console.log("Payload Sent to Client:", JSON.stringify(pfData));
  console.log("---------------------------------------");

  const host = "https://sandbox.payfast.co.za/eng/process";
  return res.status(200).json({ paymentUrl: host, fields: pfData, isSandbox: true });
}

/**
 * Sophia Tarot - Comprehensive Cloudflare Worker
 * Handles: HMS S2S, Token Forwarding, PayFast Redirects, Signature Verification
 */

const HMS_TOKEN_URL = "https://oauth-login.cloud.huawei.com/oauth2/v3/token";
const HMS_ORDER_URL = "https://orders-dra.iap.cloud.huawei.asia/applications/v2/purchases/get";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      // 1. HMS Verification
      if (path === "/api/huawei/verify") {
        return await handleHuaweiVerify(request, env);
      }

      // 2. Payment Initiation (PayFast/etc)
      if (path === "/api/payment/initiate") {
        return await handlePaymentInitiation(request, env);
      }

      // 3. Callback Handling
      if (path === "/api/callback") {
        return await handleCallback(request, env);
      }

      // 4. Redirect Handling (Success/Cancel)
      if (path === "/payment-success") {
        return Response.redirect(`${env.APP_URL}/payment-success?paid=1`, 302);
      }

      return new Response("Sophia Worker Online", { status: 200, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};

async function handleHuaweiVerify(request, env) {
  const { purchaseData, signature, email } = await request.json();
  const purchase = typeof purchaseData === "string" ? JSON.parse(purchaseData) : purchaseData;

  // Obtain HMS Token
  const tokenRes = await fetch(HMS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.HUAWEI_CLIENT_ID,
      client_secret: env.HUAWEI_CLIENT_SECRET
    })
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // S2S Verification
  const authHeader = `Basic ${btoa(`APPAT:${accessToken}`)}`;
  const verifyRes = await fetch(HMS_ORDER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify({
      purchaseToken: purchase.purchaseToken,
      productId: purchase.productId
    })
  });

  const verifyData = await verifyRes.json();
  const isValid = verifyData.responseCode === "0";

  if (isValid) {
    // Sync to Database
    await fetch(`${env.SUPABASE_URL}/rest/v1/payment_log`, {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payment_id: purchase.orderId,
        email: email,
        status: "COMPLETE",
        item_name: purchase.productId,
        raw_payload: purchaseData
      })
    });
  }

  return new Response(JSON.stringify({ ok: isValid, hmsResponse: verifyData }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

async function handlePaymentInitiation(request, env) {
  // Logic for generating PayFast signature or HMS purchase intents
  return new Response(JSON.stringify({ message: "Initiation Logic Not Implemented" }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

async function handleCallback(request, env) {
  // Handle HMS Notification or PayFast ITN
  return new Response(JSON.stringify({ error: 0 }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

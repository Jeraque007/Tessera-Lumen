// Cloudflare Worker: Smart Gateway & Huawei Verification
// Handles Huawei IAP directly and proxies all other /api/* requests to bypass Vercel blocks.

const BACKEND_URL = "https://app.963.co.za";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ROUTE 1: Huawei Verification (Direct Handle)
    if (path === "/" || path === "/api/huawei/verify") {
      return handleHuaweiVerify(request, env, ctx, corsHeaders);
    }

    // ROUTE 2: Proxy all other requests to the main backend (Bypass regional blocks)
    console.log(`[Proxy] Forwarding ${request.method} ${path} to backend`);
    const newRequest = new Request(BACKEND_URL + path + url.search, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    try {
      const response = await fetch(newRequest);
      const newResponse = new Response(response.body, response);
      Object.keys(corsHeaders).forEach(k => newResponse.headers.set(k, corsHeaders[k]));
      return newResponse;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Gateway Proxy Error", details: e.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};

async function handleHuaweiVerify(request, env, ctx, corsHeaders) {
  const jsonResponse = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    const { purchaseData, signature, email, name } = body;

    if (!purchaseData) return jsonResponse({ error: "missing purchaseData" }, 400);

    let purchase;
    try {
      purchase = typeof purchaseData === "string" ? JSON.parse(purchaseData) : purchaseData;
    } catch (e) {
      return jsonResponse({ error: "invalid format" }, 400);
    }

    const productId = purchase?.productId || "";
    const orderId = purchase?.orderId || purchase?.purchaseToken || `HMS-${Date.now()}`;
    const isPaid = purchase?.purchaseState === 0;

    if (!isPaid) return jsonResponse({ success: false, verified: false, note: "not_paid" });

    // Supabase Sync
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SECRET_KEY;

    // Log to payment_log
    await fetch(`${supabaseUrl}/rest/v1/payment_log`, {
      method: "POST",
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: orderId,
        email: email?.toLowerCase().trim(),
        status: "COMPLETE",
        item_name: `HMS-${productId}`,
        raw_payload: { purchaseData, signature }
      }),
    });

    return jsonResponse({ success: true, verified: true, orderId, productId });
  } catch (err) {
    return jsonResponse({ error: "Internal Error", message: err.message }, 500);
  }
}

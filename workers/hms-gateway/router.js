import { corsHeaders, getHmsEndpoints } from './constants';
import { jsonResponse } from './utils/response';
import { handleHuaweiVerify } from './huawei/verify';
import { logger } from './utils/logger';
import { getConfig } from './config';

/**
 * Handles incoming requests and routes them to the appropriate handler
 */
export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const config = getConfig(env);
  const endpoints = getHmsEndpoints(config.huawei.region);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Routing
  if (path === "/api/test" || path === "/test") {
    return jsonResponse({
      status: "Gateway Online",
      environment: {
        hasClientId: !!config.huawei.clientId,
        hasClientSecret: !!config.huawei.clientSecret,
        hasPublicKey: !!config.huawei.publicKey,
        publicKeyLength: config.huawei.publicKey?.length || 0,
        hasSupabaseUrl: !!config.supabase.url,
        hasSupabaseKey: !!config.supabase.key,
        region: config.huawei.region,
        backendUrl: config.backendUrl
      },
      headers: Object.fromEntries(request.headers.entries())
    });
  }

  if (path === "/" || path === "/api/huawei/verify") {
    // Check for PayFast return parameters (paid=1, cancelled=1, etc.)
    const hasPayFastParams = url.searchParams.has("paid") ||
                             url.searchParams.has("cancelled") ||
                             url.searchParams.has("deeper_paid") ||
                             url.searchParams.has("deeper_cancelled");

    if (hasPayFastParams) {
      // ZERO-TOUCH REDIRECT: Use Android Intent string to bypass "Open in app?" prompt
      // This forces the browser to jump directly into the package without user intervention.
      const query = url.search;
      const intentUrl = `intent://app/${query}#Intent;scheme=tessera;package=com.godcode963.app;end`;

      return new Response(`
        <html>
          <head>
            <title>Returning to App...</title>
            <meta http-equiv="refresh" content="0;url=${intentUrl}">
          </head>
          <script>
            // Attempt multiple jump methods for maximum compatibility
            window.location.replace("${intentUrl}");
            setTimeout(() => { window.location.href = "tessera://app/${query}"; }, 500);
          </script>
          <body style="background:#0a0c1a; color:#D4AF37; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
            <div style="text-align:center;">
              <div style="border:3px solid #D4AF37; border-top:3px solid transparent; border-radius:50%; width:30px; height:30px; animation:spin 1s linear infinite; margin:0 auto 20px;"></div>
              <p style="letter-spacing:0.1em; font-size:14px;">SECURE RETURN IN PROGRESS...</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }
      });
    }

    if (request.method === "GET") {
      return jsonResponse({
        status: "online",
        gateway: "Cloudflare",
        region: config.huawei.region,
        endpoints: {
          order: endpoints.ORDER,
          consume: endpoints.CONSUME,
          token: endpoints.TOKEN,
        },
        note: "Use POST to verify purchases"
      });
    }
    return handleHuaweiVerify(request, env, ctx);
  }

  // Proxy logic for all other traffic
  const proxyOptions = {
    method: request.method,
    headers: new Headers(request.headers),
  };

  // 1. Remove Host header to avoid mismatch errors at destination
  proxyOptions.headers.delete("host");

  // 2. Body only allowed for non-GET/HEAD methods
  if (request.method !== "GET" && request.method !== "HEAD") {
    // Clone the request to read the body safely
    const clonedRequest = request.clone();
    proxyOptions.body = clonedRequest.body;
  }

  const newRequest = new Request(config.backendUrl + path + url.search, proxyOptions);

  try {
    const response = await fetch(newRequest);
    const newResponse = new Response(response.body, response);

    // Ensure CORS headers are present on the proxied response
    Object.keys(corsHeaders).forEach(k => newResponse.headers.set(k, corsHeaders[k]));

    return newResponse;
  } catch (e) {
    logger.error(`[Proxy] Error: ${e.message}`);
    return new Response(JSON.stringify({ error: "Gateway Error", details: e.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

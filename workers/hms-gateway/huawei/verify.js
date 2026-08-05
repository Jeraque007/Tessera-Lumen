import { jsonResponse } from '../utils/response';
import { verifyHmsSignature } from './signature';
import { getHmsEndpoints, HMS_CODES, TIMEOUTS } from '../constants';
import { logToSupabase, logError } from '../database/supabase';
import { fetchWithRetry } from '../utils/retry';
import { logger } from '../utils/logger';
import { getConfig } from '../config';
import { getHuaweiToken } from './auth';
import { consumeIfNeeded } from './consume';

/**
 * MAIN VERIFICATION HANDLER
 * Orhcestrates the 7-step HMS verification flow
 */
export async function handleHuaweiVerify(request, env, ctx) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const config = getConfig(env);
  const endpoints = getHmsEndpoints(config.huawei.region);

  logger.info(`[${requestId}] Starting HMS verification flow`);

  try {
    // 1. Validate Request
    const { body, error: valError, status: valStatus } = await validateRequest(request, requestId);
    if (valError) return jsonResponse({ error: valError }, valStatus);

    const { purchaseData, signature, email, name, priceType } = body;
    const purchase = parsePurchaseData(purchaseData, requestId);
    const { productId, purchaseToken, orderId, kind, purchaseType } = purchase;

    // Determine product type
    const productType = priceType !== undefined ? priceType : (kind !== undefined ? kind : purchaseType);
    const isConsumable = productType === 0 || productType === '0';
    const isSubscription = productType === 2 || productType === '2';

    // 2. Verify Signature
    const sigValid = await verifySignature(purchaseData, signature, env, requestId, { orderId, purchaseToken, email, name, productId });
    if (!sigValid) {
      return jsonResponse({
        success: false,
        verified: false,
        note: "Invalid purchase signature",
        error_code: "SIGNATURE_INVALID"
      }, 403);
    }

    // 3. Get Huawei Token
    const accessToken = await getHuaweiToken(config.huawei, requestId, endpoints.TOKEN);

    // 4. Verify Purchase with HMS S2S API
    const verifyResult = await verifyPurchaseS2S(purchaseToken, productId, accessToken, requestId, endpoints.ORDER);

    // 5. Evaluate Purchase Results
    const evaluation = evaluatePurchase(verifyResult, isConsumable, isSubscription, requestId);
    if (!evaluation.success) {
      return jsonResponse(evaluation.response, evaluation.status);
    }

    // 6. RELAY: Send the verified result to the main backend
    // The main backend will handle DB logging and business logic.
    // This allows the Worker to act as a China-friendly connectivity bridge.
    const relayResponse = await relayToBackend(config.backendUrl, {
      orderId, purchaseToken, email, name, productId,
      purchaseData, signature, verifyResult, requestId,
      hmsVerified: evaluation.hmsVerified,
      alreadyConsumed: evaluation.alreadyConsumed,
      isSubscription,
      isDeeper
    });

    if (!relayResponse.ok) {
       logger.warn(`[${requestId}] Backend relay failed: ${relayResponse.status}`);
       // Fallback: We still want to let the user through if HMS said it's OK,
       // but we should warn that backend sync might be delayed.
    }

    // 7. Consume Purchase (if applicable)
    const consumption = await consumeIfNeeded(
      evaluation.shouldConsume,
      evaluation.alreadyConsumed,
      purchaseToken, productId,
      accessToken, requestId,
      endpoints.CONSUME,
      isSubscription, isConsumable,
      env
    );

    // 8. Build & Return Response
    return buildResponse(startTime, requestId, {
      orderId, purchaseToken, productId,
      evaluation, consumption, isConsumable, isSubscription
    });

  } catch (err) {
    return handleFatalError(err, startTime, requestId, env, ctx);
  }
}

// --- Internal Helpers ---

async function validateRequest(request, requestId) {
  if (request.method !== "POST") return { error: "Method not allowed", status: 405 };

  try {
    const body = await request.json();
    if (!body.purchaseData) return { error: "missing purchaseData", status: 400 };
    if (!body.signature) return { error: "missing signature", status: 400 };
    return { body };
  } catch (e) {
    return { error: "Invalid JSON body", status: 400 };
  }
}

async function relayToBackend(backendUrl, data) {
  const url = `${backendUrl}/api/payment/huawei/verify`;
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (e) {
    logger.error(`[Relay] Failed to reach backend: ${e.message}`);
    return { ok: false, status: 500 };
  }
}

function parsePurchaseData(purchaseData, requestId) {
  try {
    const purchase = typeof purchaseData === "string" ? JSON.parse(purchaseData) : purchaseData;
    if (!purchase.purchaseToken || !purchase.productId) {
      throw new Error("Missing essential fields in purchaseData");
    }
    return purchase;
  } catch (e) {
    logger.warn(`[${requestId}] Purchase data parsing failed: ${e.message}`);
    throw e;
  }
}

async function verifySignature(purchaseData, signature, env, requestId, context) {
  const publicKey = env.HUAWEI_IAP_PUBLIC_KEY;
  if (!publicKey) {
    logger.error(`[${requestId}] Missing HUAWEI_IAP_PUBLIC_KEY`);
    throw new Error("Server configuration error: missing public key");
  }

  const isValid = await verifyHmsSignature(purchaseData, signature, publicKey);
  if (!isValid) {
    logger.warn(`[${requestId}] Signature verification failed`);
    await logToSupabase(env, {
      payment_id: context.orderId || context.purchaseToken,
      email: context.email?.toLowerCase().trim(),
      name: context.name || "",
      status: "FRAUD_ATTEMPT",
      item_name: `HMS-${context.productId}`,
      raw_payload: { source: "huawei_iap", purchaseData, signature, reason: "Invalid signature" }
    });
  }
  return isValid;
}

async function verifyPurchaseS2S(purchaseToken, productId, accessToken, requestId, url) {
  const authHeader = `Basic ${btoa(`APPAT:${accessToken}`)}`;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
      "X-Request-ID": requestId,
    },
    body: JSON.stringify({ purchaseToken, productId })
  }, { timeout: TIMEOUTS.VERIFY });

  return await res.json();
}

function evaluatePurchase(verifyResult, isConsumable, isSubscription, requestId) {
  const responseCode = String(verifyResult.responseCode ?? verifyResult.code ?? '');
  const purchaseState = verifyResult.purchaseState;

  let result = {
    success: false,
    hmsVerified: false,
    alreadyConsumed: false,
    shouldConsume: false,
    note: '',
    status: 400
  };

  switch (responseCode) {
    case HMS_CODES.SUCCESS:
      result.hmsVerified = true;
      if (purchaseState === 0) {
        result.success = true;
        result.shouldConsume = isConsumable;
        result.note = 'Purchase confirmed';
      } else if (purchaseState === 1) {
        result.note = 'Purchase cancelled';
        result.response = { success: false, note: result.note, error_code: 'PURCHASE_CANCELLED' };
      } else if (purchaseState === 2) {
        result.note = 'Purchase refunded';
        result.response = { success: false, note: result.note, error_code: 'PURCHASE_REFUNDED' };
      } else {
        result.success = true; // Pending confirmation
        result.note = 'Purchase pending';
      }
      break;

    case HMS_CODES.ORDER_CONSUMED:
      result.success = true;
      result.hmsVerified = true;
      result.alreadyConsumed = true;
      result.note = 'Already consumed';
      break;

    default:
      result.note = `HMS Error: ${responseCode}`;
      result.response = { success: false, note: result.note, error_code: 'HMS_ERROR' };
      result.status = responseCode === HMS_CODES.INTERNAL_ERROR ? 503 : 400;
  }

  return result;
}

async function savePayment(env, data, requestId) {
  const logResult = await logToSupabase(env, {
    payment_id: data.orderId || data.purchaseToken,
    email: data.email?.toLowerCase().trim(),
    name: data.name || "",
    status: "COMPLETE",
    item_name: `HMS-${data.productId}`,
    productId: data.productId,
    planId: data.planId,
    isSubscription: data.isSubscription,
    isDeeper: data.isDeeper,
    raw_payload: {
      purchaseData: data.purchaseData,
      signature: data.signature,
      hms_verified: data.hmsVerified,
      verification_response: data.verifyResult,
      request_id: requestId,
      already_consumed: data.alreadyConsumed,
    }
  });

  if (!logResult.success) {
    logger.warn(`[${requestId}] Database logging failed: ${logResult.error}`);
  }
}

function buildResponse(startTime, requestId, context) {
  const duration = Date.now() - startTime;
  const { evaluation, consumption } = context;

  return jsonResponse({
    success: true,
    verified: true,
    orderId: context.orderId || context.purchaseToken,
    purchaseToken: context.purchaseToken,
    productId: context.productId,
    hmsVerified: evaluation.hmsVerified,
    verificationNote: evaluation.note,
    consumed: !!consumption?.success || !!consumption?.already_consumed,
    consumptionStatus: consumption,
    productType: context.isConsumable ? 'consumable' : context.isSubscription ? 'subscription' : 'non-consumable',
    duration,
    requestId,
    message: 'Purchase processed successfully',
  });
}

function handleFatalError(err, startTime, requestId, env, ctx) {
  const duration = Date.now() - startTime;
  logger.error(`[${requestId}] Fatal error: ${err.message}`);

  if (ctx && ctx.waitUntil) {
    ctx.waitUntil(logError(env, requestId, 'FATAL_ERROR', err.message, null));
  } else {
    logError(env, requestId, 'FATAL_ERROR', err.message, null);
  }

  return jsonResponse({
    error: "Internal Server Error",
    message: err.message,
    requestId,
    duration
  }, 500);
}

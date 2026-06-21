import { fetchWithRetry } from '../utils/retry';
import { logger } from '../utils/logger';
import { TIMEOUTS } from '../constants';

// ============================================================
// 13. DATABASE HELPERS
// ============================================================

export async function logToSupabase(env, data) {
  try {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logger.warn('[Supabase] Missing credentials');
      return { success: false, error: 'Supabase not configured' };
    }

    // Check if already logged (idempotency)
    const checkRes = await fetchWithRetry(
      `${supabaseUrl}/rest/v1/payment_log?payment_id=eq.${encodeURIComponent(data.payment_id)}`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        }
      },
      { timeout: TIMEOUTS.DATABASE }
    );

    if (!checkRes.ok) {
      logger.warn(`[Supabase] Check failed: ${checkRes.status}`);
    } else {
      const existingLogs = await checkRes.json();
      if (existingLogs && existingLogs.length > 0) {
        logger.info('[Supabase] Already logged, skipping duplicate');
        return { success: true, duplicate: true };
      }
    }

    // Insert new log
    const insertRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/payment_log`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        payment_id: data.payment_id,
        email: data.email,
        name: data.name,
        status: data.status,
        item_name: data.item_name,
        raw_payload: data.raw_payload,
      }),
    }, { timeout: TIMEOUTS.DATABASE });

    if (!insertRes.ok) {
      const errorText = await insertRes.text();
      logger.error(`[Supabase] Insert failed: ${insertRes.status} ${errorText}`);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    logger.error(`[Supabase] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function logError(env, requestId, errorType, errorMessage, purchaseToken) {
  try {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    await fetchWithRetry(`${supabaseUrl}/rest/v1/error_log`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        request_id: requestId,
        error_type: errorType,
        error_message: errorMessage,
        purchase_token: purchaseToken,
        timestamp: new Date().toISOString(),
      }),
    }, { timeout: TIMEOUTS.DATABASE, maxRetries: 1 });
  } catch (err) {
    logger.error(`[Supabase] Failed to log error: ${err.message}`);
  }
}

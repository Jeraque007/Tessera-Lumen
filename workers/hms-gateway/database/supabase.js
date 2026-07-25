import { fetchWithRetry } from '../utils/retry';
import { logger } from '../utils/logger';
import { TIMEOUTS } from '../constants';

/**
 * Persists payment data to Supabase with idempotency check
 */
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

    // --- BUSINESS LOGIC: Activate Subscriptions / Deeper Readings ---
    const { productId, planId, isSubscription, isDeeper } = data;
    const email = data.email?.toLowerCase().trim();

    if (email && isSubscription && planId) {
      const PLAN_CONFIG = {
        4: { readsLimit: 10, readsPerDay: 1 },
        5: { readsLimit: 20, readsPerDay: 2 },
        6: { readsLimit: 30, readsPerDay: 3 },
      };
      const cfg = PLAN_CONFIG[planId] || {};
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      await fetchWithRetry(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          email,
          plan_id: planId,
          plan_name: productId,
          reads_remaining: cfg.readsLimit ?? null,
          reads_limit: cfg.readsLimit ?? null,
          reads_per_day: cfg.readsPerDay ?? null,
          active: true,
          activated_at: new Date().toISOString(),
          renewal_date: renewalDate.toISOString(),
          subscription_token: data.payment_id,
        }),
      }, { timeout: TIMEOUTS.DATABASE });
      logger.info(`[Supabase] Subscription activated for ${email}`);
    }

    if (email && isDeeper) {
      await fetchWithRetry(`${supabaseUrl}/rest/v1/deeper_readings`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          payment_id: data.payment_id,
          email,
          name: data.name || "",
          amount: 0,
          status: "complete"
        }),
      }, { timeout: TIMEOUTS.DATABASE });
      logger.info(`[Supabase] Deeper reading created for ${email}`);
    }

    return { success: true };
  } catch (error) {
    logger.error(`[Supabase] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Logs errors to a dedicated error_log table in Supabase
 */
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

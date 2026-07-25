import { fetchWithRetry } from '../utils/retry';
import { TIMEOUTS, HMS_CODES } from '../constants';
import { logger } from '../utils/logger';
import { logError } from '../database/supabase';

/**
 * Handles the S2S consumption of a Huawei IAP purchase
 */
export async function consumeIfNeeded(shouldConsume, alreadyConsumed, purchaseToken, productId, accessToken, requestId, url, isSubscription, isConsumable, env) {
  if (alreadyConsumed) return { already_consumed: true };
  if (!shouldConsume) {
    if (isSubscription || !isConsumable) return { consumed: true, note: 'No consumption needed' };
    return null;
  }

  const authHeader = `Basic ${btoa(`APPAT:${accessToken}`)}`;

  try {
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "X-Request-ID": `${requestId}-consume`,
      },
      body: JSON.stringify({ purchaseToken, productId })
    }, { timeout: TIMEOUTS.CONSUME });

    const data = await res.json();
    const code = String(data.responseCode ?? data.code ?? '');

    if (code === HMS_CODES.SUCCESS || code === HMS_CODES.ORDER_CONSUMED) {
      return { success: true, code, already_consumed: code === HMS_CODES.ORDER_CONSUMED };
    }

    logger.warn(`[${requestId}] Consumption failed with code ${code}`);
    return { success: false, code };
  } catch (err) {
    logger.error(`[${requestId}] Consumption error: ${err.message}`);
    // Log error to Supabase (using env for the DB helpers)
    await logError(env, requestId, 'CONSUME_ERROR', err.message, purchaseToken);
    return { success: false, error: err.message };
  }
}

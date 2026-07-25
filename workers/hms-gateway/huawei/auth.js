import { fetchWithRetry } from '../utils/retry';
import { TIMEOUTS } from '../constants';
import { logger } from '../utils/logger';

/**
 * Obtains a Huawei OAuth 2.0 Access Token (Client Credentials Grant)
 */
export async function getHuaweiToken(config, requestId, url) {
  const { clientId, clientSecret } = config;

  if (!clientId || !clientSecret) {
    logger.error(`[${requestId}] Missing Huawei credentials in config`);
    throw new Error("Server configuration error: missing HMS credentials");
  }

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  }, { timeout: TIMEOUTS.TOKEN });

  const data = await res.json();
  if (!data.access_token) {
    logger.error(`[${requestId}] Token response missing access_token`, data);
    throw new Error("Failed to obtain Huawei access token");
  }

  return data.access_token;
}

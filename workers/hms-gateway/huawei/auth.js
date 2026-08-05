import { fetchWithRetry } from '../utils/retry';
import { TIMEOUTS } from '../constants';
import { logger } from '../utils/logger';
import { signHmsJwt } from '../utils/crypto';

/**
 * Obtains a Huawei OAuth 2.0 Access Token
 * Supports both Legacy (Client Secret) and Modern (JWT/IAP Key) flows
 */
export async function getHuaweiToken(config, requestId, url) {
  const { clientId, clientSecret, issuerId, keyId, privateKey } = config;

  // 1. Try MODERN JWT FLOW (Recommended for Sandbox/Subscriptions)
  if (issuerId && keyId && privateKey) {
    try {
      logger.info(`[${requestId}] Attempting JWT-based token exchange`);
      const payload = {
        iss: issuerId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "https://oauth-login.cloud.huawei.com/oauth2/v3/token"
      };

      const jwt = await signHmsJwt(payload, privateKey, keyId);

      const res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: jwt
        })
      }, { timeout: TIMEOUTS.TOKEN });

      const data = await res.json();
      if (data.access_token) return data.access_token;

      logger.warn(`[${requestId}] JWT exchange failed, falling back to Secret`, data);
    } catch (jwtErr) {
      logger.error(`[${requestId}] JWT signing error: ${jwtErr.message}`);
    }
  }

  // 2. Fallback to LEGACY CLIENT SECRET FLOW
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

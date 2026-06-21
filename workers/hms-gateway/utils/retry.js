import { logger } from './logger';

/**
 * Enhanced fetch with retry logic, timeout, and exponential backoff
 */
export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    timeout = 10000,
    retryOnStatuses = [500, 502, 503, 504],
  } = retryConfig;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Check if we should retry based on status code
      if (!retryOnStatuses.includes(response.status) || attempt === maxRetries) {
        return response;
      }

      logger.warn(`[Fetch] Attempt ${attempt} failed with status ${response.status}. Retrying in ${delay}ms...`);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        logger.error(`[Fetch] Attempt ${attempt} timed out after ${timeout}ms`);
      } else {
        logger.error(`[Fetch] Attempt ${attempt} failed: ${err.message}`);
      }

      if (attempt === maxRetries) break;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= backoffFactor;
  }

  throw lastError || new Error(`Fetch failed after ${maxRetries} attempts`);
}

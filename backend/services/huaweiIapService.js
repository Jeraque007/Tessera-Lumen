import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';

const TIMEOUTS = {
  VERIFY: 10000,
  TOKEN: 5000,
  CONSUME: 8000
};

const HMS_CODES = {
  SUCCESS: '0',
  ORDER_CONSUMED: '6'
};

const REGION_MAP = {
  'dra': 'https://iap-dra.cloud.huawei.com/applications/v2', // Singapore/Asia/Africa
  'dre': 'https://iap-dre.cloud.huawei.com/applications/v2', // Europe
  'drcn': 'https://iap-drcn.cloud.huawei.com/applications/v2', // China
  'drru': 'https://iap-drru.cloud.huawei.com/applications/v2', // Russia
};

/**
 * Huawei IAP Service
 * Ported from Cloudflare Worker for Backend Unification
 */
export class HuaweiIapService {
  constructor() {
    this.clientId = process.env.HUAWEI_CLIENT_ID;
    this.clientSecret = process.env.HUAWEI_CLIENT_SECRET;
    this.publicKey = process.env.HUAWEI_IAP_PUBLIC_KEY;
    this.region = process.env.HMS_REGION || 'dra';
  }

  getEndpoints() {
    const base = REGION_MAP[this.region] || REGION_MAP['dra'];
    return {
      ORDER: `${base}/order/confirm`,
      CONSUME: `${base}/order/consume`,
      TOKEN: 'https://oauth-login.cloud.huawei.com/oauth2/v3/token'
    };
  }

  /**
   * Main verification entry point
   */
  async verifyPurchase(purchaseData, signature, userContext = {}) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const endpoints = this.getEndpoints();

    console.log(`[HMS-Service][${requestId}] Starting verification for ${userContext.email}`);

    try {
      // 1. Parse Purchase Data
      const purchase = typeof purchaseData === 'string' ? JSON.parse(purchaseData) : purchaseData;
      const { productId, purchaseToken, orderId } = purchase;

      // 2. Verify Signature locally using RSA-SHA256
      const isSignatureValid = this.verifySignature(purchaseData, signature);
      if (!isSignatureValid) {
        await this.logToDatabase({
          payment_id: orderId || purchaseToken,
          email: userContext.email,
          status: 'FRAUD_ATTEMPT',
          item_name: `HMS-${productId}`,
          raw_payload: { purchaseData, signature, reason: 'Invalid RSA Signature' }
        });
        return { success: false, verified: false, error: 'SIGNATURE_INVALID' };
      }

      // 3. Obtain Access Token from Huawei
      const accessToken = await this.getAccessToken(endpoints.TOKEN);

      // 4. Verify with Huawei S2S API
      const verifyResult = await this.verifyWithHuawei(purchaseToken, productId, accessToken, endpoints.ORDER);

      // 5. Evaluate Results
      const evaluation = this.evaluatePurchase(verifyResult, productId);
      if (!evaluation.success) {
        return { success: false, verified: true, hmsResult: verifyResult, error: evaluation.error };
      }

      // 6. Save to Database
      await this.logToDatabase({
        payment_id: orderId || purchaseToken,
        email: userContext.email?.toLowerCase().trim(),
        name: userContext.name || "",
        status: "COMPLETE",
        item_name: `HMS-${productId}`,
        productId: productId,
        raw_payload: {
          purchaseData,
          signature,
          hms_verified: true,
          verification_response: verifyResult,
          request_id: requestId,
          already_consumed: evaluation.alreadyConsumed
        }
      });

      // 7. Consume if needed
      let consumed = evaluation.alreadyConsumed;
      if (evaluation.shouldConsume && !evaluation.alreadyConsumed) {
        consumed = await this.consumePurchase(purchaseToken, productId, accessToken, endpoints.CONSUME);
      }

      return {
        success: true,
        verified: true,
        orderId,
        productId,
        consumed,
        duration: Date.now() - startTime,
        requestId
      };

    } catch (err) {
      console.error(`[HMS-Service][${requestId}] Fatal Error:`, err.message);
      return { success: false, error: 'INTERNAL_ERROR', message: err.message };
    }
  }

  verifySignature(purchaseData, signature) {
    try {
      if (!this.publicKey) throw new Error("Missing HUAWEI_IAP_PUBLIC_KEY");

      const verifier = crypto.createVerify('SHA256');
      verifier.update(purchaseData);
      verifier.end();

      // Ensure key is in correct PEM format if not already
      let key = this.publicKey;
      if (!key.includes('-----BEGIN PUBLIC KEY-----')) {
        key = `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
      }

      return verifier.verify(key, signature, 'base64');
    } catch (e) {
      console.error("[HMS-Service] Signature verification crash:", e.message);
      return false;
    }
  }

  async getAccessToken(url) {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(TIMEOUTS.TOKEN)
    });

    const data = await res.json();
    if (!data.access_token) throw new Error("Failed to obtain HMS access token: " + JSON.stringify(data));
    return data.access_token;
  }

  async verifyWithHuawei(purchaseToken, productId, accessToken, url) {
    const auth = Buffer.from(`APPAT:${accessToken}`).toString('base64');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({ purchaseToken, productId }),
      signal: AbortSignal.timeout(TIMEOUTS.VERIFY)
    });
    return await res.json();
  }

  evaluatePurchase(verifyResult, productId) {
    const responseCode = String(verifyResult.responseCode ?? verifyResult.code ?? '');
    const purchaseState = verifyResult.purchaseState;

    // Consumable IDs list (from huaweiIap.js)
    const consumables = ["Quick.Insight", "Past.Present.Future", "Deep.Dive", "Astrological.Chart.Reading"];
    const isConsumable = consumables.includes(productId);

    if (responseCode === HMS_CODES.SUCCESS) {
      if (purchaseState === 0) {
        return { success: true, shouldConsume: isConsumable, alreadyConsumed: false };
      }
      return { success: false, error: 'PURCHASE_NOT_COMPLETE', state: purchaseState };
    }

    if (responseCode === HMS_CODES.ORDER_CONSUMED) {
      return { success: true, shouldConsume: false, alreadyConsumed: true };
    }

    return { success: false, error: `HMS_ERROR_${responseCode}` };
  }

  async consumePurchase(purchaseToken, productId, accessToken, url) {
    try {
      const auth = Buffer.from(`APPAT:${accessToken}`).toString('base64');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({ purchaseToken, productId }),
        signal: AbortSignal.timeout(TIMEOUTS.CONSUME)
      });
      const data = await res.json();
      return String(data.responseCode) === '0';
    } catch (e) {
      console.warn("[HMS-Service] Consumption failed:", e.message);
      return false;
    }
  }

  async logToDatabase(data) {
    try {
      const { error } = await supabase.from('payments').insert([{
        ...data,
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
    } catch (e) {
      console.error("[HMS-Service] DB Logging failed:", e.message);
    }
  }
}

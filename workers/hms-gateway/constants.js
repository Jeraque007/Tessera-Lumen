export const HMS_REGIONS = {
  CHINA: 'drcn',
  EUROPE: 'dre',
  RUSSIA: 'drru',
  ASIA: 'dra',
};

export const getHmsEndpoints = (region = HMS_REGIONS.ASIA) => ({
  TOKEN: "https://oauth-login.cloud.huawei.com/oauth2/v3/token",
  ORDER: `https://orders-${region}.iap.cloud.huawei.com/applications/v2/purchases/get`,
  CONSUME: `https://orders-${region}.iap.cloud.huawei.com/applications/v2/purchases/consume`,
});

export const HMS_CODES = {
  SUCCESS: '0',
  ORDER_NOT_EXIST: '1',
  ORDER_CONSUMED: '2',
  ORDER_CLOSED: '3',
  INVALID_TOKEN: '4',
  PRODUCT_NOT_EXIST: '5',
  PRODUCT_NOT_PURCHASED: '6',
  INTERNAL_ERROR: '7',
};

export const TIMEOUTS = {
  TOKEN: 10000,
  VERIFY: 15000,
  CONSUME: 10000,
  DATABASE: 5000,
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, X-Request-ID",
};

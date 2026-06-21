/**
 * @typedef {Object} HuaweiConfig
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} appId
 * @property {string} publicKey
 * @property {string} region
 */

/**
 * @typedef {Object} SupabaseConfig
 * @property {string} url
 * @property {string} key
 */

/**
 * @typedef {Object} AppConfig
 * @property {HuaweiConfig} huawei
 * @property {SupabaseConfig} supabase
 * @property {string} backendUrl
 */

/**
 * @typedef {Object} PurchaseData
 * @property {string} purchaseToken
 * @property {string} productId
 * @property {string} orderId
 * @property {number} [purchaseState]
 * @property {number} [kind]
 */

export {};

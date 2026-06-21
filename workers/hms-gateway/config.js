/**
 * Sophia Tarot - Huawei IAP Gateway Configuration
 * maps to the 3 distinct Huawei Developer "Rooms"
 */
export const getConfig = (env) => ({
  huawei: {
    // ROOM 2: Project Information (Server-to-Server Authentication)
    clientId: env.HUAWEI_CLIENT_ID || "1707533721919297472",
    clientSecret: env.HUAWEI_CLIENT_SECRET,

    // ROOM 3: App Information (Payment & Identity)
    appId: env.HUAWEI_APP_ID || "114450405",
    publicKey: env.HUAWEI_IAP_PUBLIC_KEY,

    // ROOM 1: Developer Information
    developerId: env.HMS_DEVELOPER_ID || "70027000000111176",

    region: env.HMS_REGION || 'dra',
  },
  supabase: {
    url: env.SUPABASE_URL,
    // Look for any of the common naming variations found in the dashboard
    key: env.SUPABASE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_API_KEY || env.SUPABASE_ANON_KEY,
  },
  backendUrl: env.BACKEND_URL || "https://app.963.co.za",
});

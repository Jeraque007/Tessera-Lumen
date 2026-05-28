// Live USD to ZAR exchange rate
// Uses exchangerate-api.com free tier (1500 requests/month free)
// Falls back to a conservative fixed rate if API is unavailable

const FALLBACK_RATE = 18.80; // Conservative fallback — update periodically
let cachedRate = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour in ms

async function fetchLiveRate() {
  // Free tier  no API key needed for basic rates
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Rate fetch failed");
  const data = await res.json();
  if (data.result !== "success") throw new Error("Rate API error");
  return data.rates.ZAR;
}

export default async function handler(req, res) {
  // Allow CORS for frontend
  res.setHeader("Access-Control-Allow-Origin", "*");

  const now = Date.now();

  // Return cached rate if fresh
  if (cachedRate && (now - cacheTime) < CACHE_TTL) {
    return res.status(200).json({ rate: cachedRate, source: "cache", fallback: false });
  }

  try {
    const rate = await fetchLiveRate();
    cachedRate = rate;
    cacheTime = now;
    return res.status(200).json({ rate, source: "live", fallback: false });
  } catch (err) {
    console.warn("FX rate fetch failed, using fallback:", err.message);
    return res.status(200).json({ rate: FALLBACK_RATE, source: "fallback", fallback: true });
  }
}

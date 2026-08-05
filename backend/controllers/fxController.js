/**
 * Advanced FX Rate Controller
 * Synchronized with Vercel/API logic to include country detection
 */
export const getRate = async (req, res) => {
  try {
    // 1. Detect Country via Headers (Standard, Cloudflare or Vercel)
    const country = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || req.headers['x-country-code'] || 'US';

    // 2. Map Country to Currency Code
    const countryToCurrency = {
      'ZA': 'ZAR', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
      'IN': 'INR', 'AE': 'AED', 'SA': 'SAR', 'BH': 'BHD', 'AU': 'AUD', 'NZ': 'NZD',
      'CA': 'CAD', 'SG': 'SGD', 'CN': 'CNY', 'JP': 'JPY', 'BR': 'BRL', 'MX': 'MXN'
    };

    const currencyCode = countryToCurrency[country] || 'USD';
    const currencySymbols = {
      'ZAR': 'R', 'GBP': '£', 'EUR': '€', 'INR': '₹', 'AED': 'د.إ', 'SAR': '﷼',
      'BHD': 'BD', 'AUD': 'A$', 'NZD': 'NZ$', 'CAD': 'C$', 'SGD': 'S$', 'CNY': '¥',
      'JPY': '¥', 'BRL': 'R$', 'MXN': '$', 'USD': '$'
    };

    // 3. Fetch Real-time Rates with 3.5s Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rates = data.rates || {};
        const userRate = rates[currencyCode] || 1;
        const zarRate = rates['ZAR'] || 19.10;

        return res.json({
          rate: userRate,
          symbol: currencySymbols[currencyCode] || '$',
          code: currencyCode,
          zarRate: zarRate,
          country: country
        });
      }
    } catch (e) {
      console.warn("[FX] Fetch aborted or failed:", e.message);
    } finally {
      clearTimeout(timeoutId);
    }

    // Fallback
    res.json({ rate: 1, symbol: '$', code: 'USD', zarRate: 19.10, country });
  } catch (error) {
    console.error("[FX] Controller Error:", error.message);
    res.json({ rate: 19.10, symbol: 'R', code: 'ZAR' });
  }
};

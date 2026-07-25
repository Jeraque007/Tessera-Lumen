export default async function handler(req, res) {
  try {
    // 1. Detect Country via Vercel Header (defaults to US)
    const country = req.headers['x-vercel-ip-country'] || 'US';

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

    // 3. Fetch Real-time Rates
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (response.ok) {
      const data = await response.json();
      const userRate = data.rates[currencyCode] || 1;
      const zarRate = data.rates['ZAR'] || 19.10;

      return res.status(200).json({
        rate: userRate,
        symbol: currencySymbols[currencyCode] || '$',
        code: currencyCode,
        zarRate: zarRate,
        country: country
      });
    }

    // Fallback to USD
    res.status(200).json({ rate: 1, symbol: '$', code: 'USD', zarRate: 19.10, country });
  } catch (error) {
    res.status(200).json({ rate: 1, symbol: '$', code: 'USD', zarRate: 19.10 });
  }
}

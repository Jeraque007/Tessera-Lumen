import nodeFetch from "node-fetch";

export const getRate = async (req, res) => {
  try {
    // Try fetching from a public API, fallback to hardcoded
    const response = await nodeFetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.ZAR || 19.10;
      return res.json({ rate });
    }
    res.json({ rate: 19.10 });
  } catch (error) {
    res.json({ rate: 19.10 });
  }
};

import nodeFetch from "node-fetch";
import { getCachedTranslation, setCachedTranslation } from "../lib/supabase.js";

export const getLanguages = async (req, res) => {
  const DEEPL_KEY = process.env.DEEPL_API_KEY || "";
  if (!DEEPL_KEY) return res.json({ languages: [] });

  try {
    const response = await nodeFetch("https://api-free.deepl.com/v2/languages?type=target", {
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
    });
    const data = await response.json();
    res.json({ languages: data });
  } catch (err) {
    res.json({ languages: [] });
  }
};

export const translate = async (req, res) => {
  const { texts, targetLang, cacheKey } = req.body;
  const DEEPL_KEY = process.env.DEEPL_API_KEY;

  if (!DEEPL_KEY || !targetLang || targetLang.toUpperCase() === "EN") {
    return res.json({ translations: texts });
  }

  try {
    // 1. Check Supabase Cache
    if (cacheKey) {
      const cached = await getCachedTranslation(`${targetLang.toUpperCase()}:${cacheKey}`);
      if (cached) return res.json({ translations: cached });
    }

    // 2. Call DeepL
    const body = new URLSearchParams();
    texts.forEach(t => body.append("text", t));
    body.append("target_lang", targetLang.toUpperCase());

    const response = await nodeFetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[DeepL] Error:", response.status, errText);
      return res.json({ translations: texts });
    }

    const data = await response.json();
    const translations = data.translations.map(t => t.text);

    // 3. Save to Cache
    if (cacheKey) {
      await setCachedTranslation(`${targetLang.toUpperCase()}:${cacheKey}`, targetLang.toUpperCase(), translations);
    }

    res.json({ translations });
  } catch (error) {
    console.error("[DeepL] Fatal error:", error.message);
    res.json({ translations: texts });
  }
};

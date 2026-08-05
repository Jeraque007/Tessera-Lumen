import { getCachedTranslation, setCachedTranslation, supabase } from "../lib/supabase.js";

export const checkFreeReading = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const guestId = `free-guest-${ip}`;

  try {
    const { data, error } = await supabase
      .from("reading_log")
      .select("id")
      .eq("email", guestId)
      .limit(1);

    if (error) throw error;
    res.json({ consumed: data && data.length > 0 });
  } catch (err) {
    // If table doesn't support this or other error, allow it (fail-open)
    res.json({ consumed: false });
  }
};

export const claimFreeReading = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const guestId = `free-guest-${ip}`;

  try {
    const { error } = await supabase.from("reading_log").insert({
      email: guestId,
      card_numbers: req.body.cardNumbers || [],
      intention: "Free Sample",
      plan_id: "free"
    });

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLanguages = async (req, res) => {
  const DEEPL_KEY = process.env.DEEPL_API_KEY || "";
  if (!DEEPL_KEY) return res.json({ languages: [] });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch("https://api-free.deepl.com/v2/languages?type=target", {
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    res.json({ languages: data });
  } catch (err) {
    console.warn("[DeepL] Languages fetch aborted or failed:", err.message);
    res.json({ languages: [] });
  } finally {
    clearTimeout(timeoutId);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

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
      console.error("[DeepL] Fetch aborted or failed:", error.message);
      res.json({ translations: texts });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("[DeepL] Fatal error:", error.message);
    res.json({ translations: texts });
  }
};

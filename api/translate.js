import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { texts, targetLang, cacheKey } = req.body;
  const DEEPL_KEY = process.env.DEEPL_API_KEY;

  if (!DEEPL_KEY || !targetLang || targetLang.toUpperCase() === "EN") {
    return res.status(200).json({ translations: texts });
  }

  try {
    const supabase = getSupabase();
    // 1. Check Supabase Cache
    if (cacheKey) {
      const { data: cached } = await supabase
        .from("translation_cache")
        .select("translations")
        .eq("cache_key", `${targetLang.toUpperCase()}:${cacheKey}`)
        .maybeSingle();

      if (cached?.translations) return res.status(200).json({ translations: cached.translations });
    }

    // 2. Call DeepL
    const body = new URLSearchParams();
    texts.forEach(t => body.append("text", t));
    body.append("target_lang", targetLang.toUpperCase());

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[DeepL] Error:", response.status, errText);
      return res.status(200).json({ translations: texts });
    }

    const data = await response.json();
    const translations = data.translations.map(t => t.text);

    // 3. Save to Cache
    if (cacheKey) {
      await supabase
        .from("translation_cache")
        .upsert({
          cache_key: `${targetLang.toUpperCase()}:${cacheKey}`,
          lang: targetLang.toUpperCase(),
          translations
        }, { onConflict: "cache_key" });
    }

    res.status(200).json({ translations });
  } catch (error) {
    console.error("[DeepL] Fatal error:", error.message);
    res.status(200).json({ translations: texts });
  }
}

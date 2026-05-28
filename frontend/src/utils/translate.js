
// Full DeepL language list  hardcoded fallback so picker works without backend
export const DEEPL_LANGUAGES = [
  { language: "AR",    name: "Arabic" },
  { language: "BG",    name: "Bulgarian" },
  { language: "CS",    name: "Czech" },
  { language: "DA",    name: "Danish" },
  { language: "DE",    name: "German" },
  { language: "EL",    name: "Greek" },
  { language: "EN-GB", name: "English (British)" },
  { language: "EN-US", name: "English (American)" },
  { language: "ES",    name: "Spanish" },
  { language: "ET",    name: "Estonian" },
  { language: "FI",    name: "Finnish" },
  { language: "FR",    name: "French" },
  { language: "HU",    name: "Hungarian" },
  { language: "ID",    name: "Indonesian" },
  { language: "IT",    name: "Italian" },
  { language: "JA",    name: "Japanese" },
  { language: "KO",    name: "Korean" },
  { language: "LT",    name: "Lithuanian" },
  { language: "LV",    name: "Latvian" },
  { language: "NB",    name: "Norwegian" },
  { language: "NL",    name: "Dutch" },
  { language: "PL",    name: "Polish" },
  { language: "PT-BR", name: "Portuguese (Brazilian)" },
  { language: "PT-PT", name: "Portuguese (European)" },
  { language: "RO",    name: "Romanian" },
  { language: "RU",    name: "Russian" },
  { language: "SK",    name: "Slovak" },
  { language: "SL",    name: "Slovenian" },
  { language: "SV",    name: "Swedish" },
  { language: "TR",    name: "Turkish" },
  { language: "UK",    name: "Ukrainian" },
  { language: "ZH",    name: "Chinese (Simplified)" },
];

// DeepL translation service  calls backend which caches results
// The API key never touches the browser

const BACKEND = "/api";

// In-memory cache for this session (backend also persists to disk)
const sessionCache = {};

/**
 * Translate an array of strings to a target language via the backend.
 * Results are cached  same request never hits DeepL twice.
 * @param {string[]} texts
 * @param {string} targetLang  DeepL language code e.g. "FR", "ES", "DE", "PT", "IT", "JA", "ZH"
 * @param {string} cacheKey    Stable key for this batch (e.g. "ui" or "cards")
 * @returns {Promise<string[]>}
 */
export async function translateTexts(texts, targetLang, cacheKey = "") {
  if (!targetLang || targetLang.toUpperCase() === "EN") return texts;

  const key = `${targetLang}:${cacheKey}`;
  if (sessionCache[key]) return sessionCache[key];

  try {
    const res = await fetch(`${BACKEND}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, targetLang: targetLang.toUpperCase(), cacheKey }),
    });

    if (!res.ok) {
      console.warn("Translation failed, using English fallback");
      return texts;
    }

    const data = await res.json();
    sessionCache[key] = data.translations;
    return data.translations;
  } catch (err) {
    console.warn("Translation service unavailable:", err.message);
    return texts; // Graceful fallback to English
  }
}

/**
 * Fetch all languages supported by DeepL from the backend.
 * @returns {Promise<Array<{language: string, name: string}>>}
 */
export async function fetchSupportedLanguages() {
  try {
    const res = await fetch(`${BACKEND}/languages`);
    if (!res.ok) return DEEPL_LANGUAGES;
    const data = await res.json();
    return data.languages?.length ? data.languages : DEEPL_LANGUAGES;
  } catch (_) {
    // Backend offline — use hardcoded list so picker always works
    return DEEPL_LANGUAGES;
  }
}

/**
 * Check DeepL usage quota.
 * @returns {Promise<{character_count: number, character_limit: number}>}
 */
export async function fetchUsage() {
  try {
    const res = await fetch(`${BACKEND}/translate/usage`);
    return await res.json();
  } catch (_) {
    return { character_count: 0, character_limit: 0 };
  }
}

// DeepL language code mapping from browser locale codes
export const LOCALE_TO_DEEPL = {
  "fr": "FR", "fr-FR": "FR", "fr-BE": "FR", "fr-CA": "FR",
  "es": "ES", "es-ES": "ES", "es-MX": "ES", "es-AR": "ES",
  "de": "DE", "de-DE": "DE", "de-AT": "DE", "de-CH": "DE",
  "pt": "PT-PT", "pt-PT": "PT-PT", "pt-BR": "PT-BR",
  "it": "IT", "it-IT": "IT",
  "nl": "NL", "nl-NL": "NL",
  "pl": "PL", "pl-PL": "PL",
  "ru": "RU", "ru-RU": "RU",
  "ja": "JA", "ja-JP": "JA",
  "zh": "ZH", "zh-CN": "ZH", "zh-TW": "ZH",
  "ko": "KO", "ko-KR": "KO",
  "ar": "AR", "ar-SA": "AR",
  "tr": "TR", "tr-TR": "TR",
  "sv": "SV", "sv-SE": "SV",
  "da": "DA", "da-DK": "DA",
  "fi": "FI", "fi-FI": "FI",
  "nb": "NB", "nb-NO": "NB",
  "cs": "CS", "cs-CZ": "CS",
  "ro": "RO", "ro-RO": "RO",
  "hu": "HU", "hu-HU": "HU",
  "sk": "SK", "sk-SK": "SK",
  "bg": "BG", "bg-BG": "BG",
  "uk": "UK", "uk-UA": "UK",
  "id": "ID", "id-ID": "ID",
};

export function getBrowserDeepLCode() {
  const lang = navigator.language || navigator.languages?.[0] || "en";
  return LOCALE_TO_DEEPL[lang] || LOCALE_TO_DEEPL[lang.split("-")[0]] || null;
}

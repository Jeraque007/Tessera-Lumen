import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.js";
import es from "./locales/es.js";
import fr from "./locales/fr.js";
import de from "./locales/de.js";
import pt from "./locales/pt.js";
import ms from "./locales/ms.js";
import ta from "./locales/ta.js";
import zh from "./locales/zh.js";
import it from "./locales/it.js";
import nl from "./locales/nl.js";
import ru from "./locales/ru.js";
import ja from "./locales/ja.js";
import ko from "./locales/ko.js";
import ar from "./locales/ar.js";
import hi from "./locales/hi.js";
import tr from "./locales/tr.js";
import pl from "./locales/pl.js";
import sv from "./locales/sv.js";
import no from "./locales/no.js";
import da from "./locales/da.js";
import th from "./locales/th.js";
import vi from "./locales/vi.js";

// Flatten nested objects for i18next (it uses dot notation)
// We store translations as flat keys since our data includes arrays/objects
// Use i18next with returnObjects:true to support arrays and objects

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      ms: { translation: ms },
      ta: { translation: ta },
      zh: { translation: zh },
      it: { translation: it },
      nl: { translation: nl },
      ru: { translation: ru },
      ja: { translation: ja },
      ko: { translation: ko },
      ar: { translation: ar },
      hi: { translation: hi },
      tr: { translation: tr },
      pl: { translation: pl },
      sv: { translation: sv },
      no: { translation: no },
      da: { translation: da },
      th: { translation: th },
      vi: { translation: vi },
    },
    // Auto-detect from browser, fallback to English
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "de", "pt", "ms", "ta", "zh", "it", "nl", "ru", "ja", "ko", "ar", "hi", "tr", "pl", "sv", "no", "da", "th", "vi"],
    // Detection order: localStorage -> navigator language -> htmlTag
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "tl_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    returnObjects: true, // Allow returning arrays and objects (packages, intentions, etc.)
  });

export default i18n;

// Supported languages list for the selector
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",   flag: "EN" },
  { code: "es", label: "Espanol",   flag: "ES" },
  { code: "fr", label: "Francais",  flag: "FR" },
  { code: "de", label: "Deutsch",   flag: "DE" },
  { code: "pt", label: "Portugues", flag: "PT" },
  { code: "ms", label: "Malay",     flag: "MS" },
  { code: "ta", label: "Tamil",     flag: "TA" },
  { code: "zh", label: "Chinese",   flag: "ZH" },
];

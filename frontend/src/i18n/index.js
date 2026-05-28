import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.js";
import es from "./locales/es.js";
import fr from "./locales/fr.js";
import de from "./locales/de.js";
import pt from "./locales/pt.js";

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
    },
    // Auto-detect from browser, fallback to English
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "de", "pt"],
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
];

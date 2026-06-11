// Card Content Resolver - Central abstraction layer
// Handles: English fallback, translation overlays, future CMS migration
//
// Architecture:
//   1. Cards store canonical English fields: title_en, purpose_en, meaning_en, mantra_en, pillar_en
//   2. Translations come from an overlay (local or remote in future)
//   3. This resolver is the ONLY place that reads card fields
//   4. All consumers call resolveCard() or drawCards() - never access _en fields directly
//
// Future: replace getTranslationOverlay() with a Supabase/API fetch. No other changes needed.

// Translation overlay store (populated from local cache or remote)
let translationOverlays = {};

/**
 * Load translation overlays. Can be called with local data or remote fetch result.
 * @param {object} overlays - { "fr": { 1: { title: "...", purpose: "..." }, 2: {...} }, "es": {...} }
 */
export function setTranslationOverlays(overlays) {
  translationOverlays = overlays || {};
}

/**
 * Get a translated field for a specific card, with English fallback.
 */
function getField(card, field, lang) {
  // Try translation overlay first
  if (lang && lang !== "en" && translationOverlays[lang]) {
    const overlay = translationOverlays[lang][card.number];
    if (overlay && overlay[field]) return overlay[field];
  }
  // Fallback to English canonical field
  return card[`${field}_en`] || "";
}

/**
 * Resolve a card to flat readable fields for a given language.
 * This is what consumers use - never access card._en fields directly.
 * @param {object} card - Raw card from CARDS array
 * @param {string} lang - Language code
 * @returns {{ number, image, title, purpose, meaning, mantra, pillar }}
 */
export function resolveCard(card, lang = "en") {
  if (!card) return {};
  return {
    number: card.number,
    image: card.image,
    title: getField(card, "title", lang),
    purpose: getField(card, "purpose", lang),
    meaning: getField(card, "meaning", lang),
    mantra: getField(card, "mantra", lang),
    pillar: getField(card, "pillar", lang),
  };
}

/**
 * Draw n random cards, resolved to the given language.
 * @param {array} deck - CARDS array (canonical English)
 * @param {number} count - How many to draw
 * @param {string} lang - Language code
 * @returns {array} Array of resolved card objects (flat strings)
 */
export function drawCards(deck, count, lang = "en") {
  const shuffled = [...deck].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, deck.length)).map(c => resolveCard(c, lang));
}

/**
 * Get a single card by number, resolved.
 */
export function getCard(deck, number, lang = "en") {
  const card = deck.find(c => c.number === number);
  return card ? resolveCard(card, lang) : null;
}

/**
 * Future: fetch translations from remote source.
 * Uncomment and implement when CMS is ready.
 */
// export async function fetchTranslations(lang) {
//   const res = await fetch(`/api/cards/translations?lang=${lang}`);
//   const data = await res.json();
//   translationOverlays[lang] = data;
// }
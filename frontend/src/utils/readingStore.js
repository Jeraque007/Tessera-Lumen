

/**
 * Create an immutable reading object from a resolved card.
 * The card should already be resolved via cardResolver.resolveCard() or drawCards().
 */
export function createReadingObject(card, index, packageInfo, user, intention) {
  const reading = {
    id: `TL-${Date.now()}-${card.number}-${index}`,
    timestamp: new Date().toISOString(),
    seeker: user?.name || "Seeker",
    intention: intention || "General Guidance",
    packageName: packageInfo?.name || "Oracle Reading",
    card: {
      number: card.number,
      title: (card.title || "").toUpperCase(),
      pillar: (card.pillar || "").toUpperCase(),
      image: card.image,
      purpose: card.purpose || "",
      meaning: card.meaning || "",
      mantra: card.mantra || "",
    },
    export: {
      blob: null,
      dataUrl: null,
      filename: `tessera-lumen-${(card.title || "card").toLowerCase().replace(/\s+/g, "-")}.jpg`
    }
  };

  return Object.freeze(reading);
}
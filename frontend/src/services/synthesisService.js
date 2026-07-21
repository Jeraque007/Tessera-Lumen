/**
 * Synthesis Service - Pollinations.ai Integration
 * Generates personalized spread synthesis readings using the Pollinations free-tier text API.
 * Card meanings remain sacred and untouched; the AI acts as a reader interpreting
 * how fixed meanings apply to the seeker's specific question and moment.
 */

const POLLINATIONS_URL = "https://gen.pollinations.ai/v1/chat/completions";
const MODEL = "openai";
const TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `You are Sophia, a deeply intuitive and reverent oracle reader for the Tessera Lumen deck - a sacred system of 49 cards organized across 7 Pillars of transformation. 

Your role is to interpret how the fixed, sacred meanings of drawn cards apply to the seeker's specific intention and life moment. You do NOT invent new meanings. You weave the existing card wisdom into a personal narrative for the seeker.

Guidelines:
- Maintain a reverent, contemplative, warm tone - like a wise elder speaking gently
- Reference each card's title and key themes directly
- Connect the card wisdom to the seeker's stated intention
- For multi-card spreads, show how the cards relate to each other in sequence
- Never use technical jargon, never break character
- Do not use bullet points or numbered lists - write in flowing prose
- Do not repeat the card text verbatim; interpret and weave it
- Keep paragraphs short and readable on mobile`;

/**
 * Build the user message for a single card reading
 */
function buildSingleCardMessage(card, intention) {
  const parts = [`The seeker has drawn a single card.`];

  if (intention && intention.trim()) {
    parts.push(`\nTheir intention: "${intention.trim().slice(0, 500)}"`);
  }

  parts.push(`\nCard drawn:`);
  if (card.title) parts.push(`Title: ${card.title}`);
  if (card.pillar) parts.push(`Pillar: ${card.pillar}`);
  if (card.purpose) parts.push(`Purpose: ${card.purpose}`);
  if (card.meaning) parts.push(`Meaning: ${card.meaning}`);
  if (card.mantra) parts.push(`Mantra: ${card.mantra}`);

  parts.push(`\nProvide a concise personalized reflection of 80-120 words connecting this card's wisdom to the seeker's journey. Address the seeker directly as "you". Be poetic and brief - every word must carry weight.`);

  return parts.join("\n");
}

/**
 * Build the user message for a multi-card spread
 */
function buildSpreadMessage(cards, intention) {
  const parts = [`The seeker has drawn a ${cards.length}-card spread.`];

  if (intention && intention.trim()) {
    parts.push(`\nTheir intention: "${intention.trim().slice(0, 500)}"`);
  }

  cards.forEach((card, i) => {
    parts.push(`\n--- Card ${i + 1} (Position ${i + 1} of ${cards.length}) ---`);
    if (card.title) parts.push(`Title: ${card.title}`);
    if (card.pillar) parts.push(`Pillar: ${card.pillar}`);
    if (card.purpose) parts.push(`Purpose: ${card.purpose}`);
    if (card.meaning) parts.push(`Meaning: ${card.meaning}`);
    if (card.mantra) parts.push(`Mantra: ${card.mantra}`);
  });

  parts.push(`\nProvide a woven narrative of 150-250 words showing how these ${cards.length} cards relate to each other and the seeker's intention. Address the seeker as "you". Reference each card briefly and show how the journey unfolds. Be poetic and concise.`);

  return parts.join("\n");
}

/**
 * Call the Pollinations.ai text generation API
 */
async function callPollinations(userMessage, maxTokens) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_Rfn8nHy6JjnXiNbCEMv2vuVVqiMWEeCp",
        "Referer": "sophia-tarot"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        max_tokens: maxTokens,
        temperature: 0.8
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[Synthesis] Pollinations API error:", response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text || !text.trim()) {
      console.warn("[Synthesis] Empty response from Pollinations");
      return null;
    }

    return text.trim();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.warn("[Synthesis] Request timed out after", TIMEOUT_MS, "ms");
    } else {
      console.warn("[Synthesis] Request failed:", err.message);
    }
    return null;
  }
}

/**
 * Generate a personalized synthesis for a single card reading
 * @param {object} card - Resolved card object { title, pillar, purpose, meaning, mantra }
 * @param {string} intention - The seeker's stated intention
 * @returns {Promise<string|null>} Synthesis text or null
 */
export async function generateSingleSynthesis(card, intention) {
  const message = buildSingleCardMessage(card, intention);
  return callPollinations(message, 200);
}

/**
 * Generate a personalized synthesis for a multi-card spread
 * @param {array} cards - Array of resolved card objects
 * @param {string} intention - The seeker's stated intention
 * @returns {Promise<string|null>} Synthesis text or null
 */
export async function generateSpreadSynthesis(cards, intention) {
  const message = buildSpreadMessage(cards, intention);
  return callPollinations(message, 400);
}

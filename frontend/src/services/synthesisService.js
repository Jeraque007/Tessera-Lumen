/**
 * Synthesis Service - Backend Proxy
 * Generates personalized readings via /api/synthesis (proxied to Pollinations.ai)
 * API key is kept server-side for security.
 */

import { apiUrl } from "../utils/apiBase.js";

const TIMEOUT_MS = 18000;
const CONTACT_EMAIL = "holistic@963.co.za";

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
- Keep paragraphs short and readable on mobile
- NEVER use markdown formatting: no **, no ##, no ---, no * bullets, no backticks
- Output plain text only with natural paragraph breaks`;

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

async function callSynthesisAPI(userMessage, maxTokens) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl("/api/synthesis"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn("[Synthesis] API error:", response.status, errorData);
      if (errorData?.warning && errorData?.notifyUrl && !localStorage.getItem("tl_pollinations_warning")) {
        localStorage.setItem("tl_pollinations_warning", JSON.stringify({
          contactEmail: errorData.contactEmail || CONTACT_EMAIL,
          notifyUrl: errorData.notifyUrl,
          status: errorData.status || response.status,
          detail: errorData.detail || "Pollinations request failed",
          warnedAt: Date.now()
        }));
      }
      return null;
    }

    const data = await response.json();
    return data?.text || null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.warn("[Synthesis] Request timed out");
    } else {
      console.warn("[Synthesis] Request failed:", err.message);
    }
    return null;
  }
}

export async function generateSingleSynthesis(card, intention) {
  const message = buildSingleCardMessage(card, intention);
  return callSynthesisAPI(message, 200);
}

export async function generateSpreadSynthesis(cards, intention) {
  const message = buildSpreadMessage(cards, intention);
  return callSynthesisAPI(message, 400);
}

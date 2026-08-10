import { Router } from "express";

const router = Router();

const POLLINATIONS_URL = "https://gen.pollinations.ai/v1/chat/completions";
const MODEL = "openai";
const API_KEY = process.env.POLLINATIONS_API_KEY;
const CONTACT_EMAIL = "holistic@963.co.za";

function buildWarningMailto(status, detail) {
  const subject = encodeURIComponent("Tessera Lumen Pollinations warning");
  const body = encodeURIComponent(`Pollinations.ai is reporting a low-capacity or failed synthesis request.\n\nStatus: ${status}\nDetail: ${detail || "Unknown upstream error"}\n\nPlease top up the provider or disable the free offer until service is restored.`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

// POST /api/synthesis - Proxy synthesis requests to Pollinations
router.post("/", async (req, res) => {
  const { messages, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "Referer": "sophia-tarot"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: max_tokens || 200,
        temperature: 0.8
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "no body");
      console.error("[Synthesis] Pollinations returned", response.status, errBody.substring(0, 200));
      return res.status(response.status).json({
        error: "Upstream API error",
        status: response.status,
        detail: errBody.substring(0, 100),
        warning: true,
        contactEmail: CONTACT_EMAIL,
        notifyUrl: buildWarningMailto(response.status, errBody.substring(0, 100))
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || null;

    if (!text) {
      return res.status(502).json({
        error: "Empty synthesis response",
        warning: true,
        contactEmail: CONTACT_EMAIL,
        notifyUrl: buildWarningMailto(502, "Pollinations returned an empty content payload")
      });
    }

    res.json({ text });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Synthesis timeout" });
    }
    console.error("[Synthesis] Proxy error:", err.message);
    res.status(500).json({ error: "Synthesis failed" });
  }
});

export default router;

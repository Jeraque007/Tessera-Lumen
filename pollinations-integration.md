# Tessera Lumen — Pollinations.ai Integration

## Application Overview

**App Name:** Tessera Lumen  
**URL:** https://app.963.co.za  
**Platform:** Web (PWA), Android (WebView APK)  
**Developer:** Jeraque007  
**Category:** Spiritual / Oracle / Tarot Reading  

## Integration Summary

Tessera Lumen is a sacred oracle reading app featuring 49 original tarot cards organized across 7 Pillars of transformation. The app uses Pollinations.ai to generate personalized AI synthesis readings that interpret how the fixed card meanings apply to each seeker's specific intention.

## How Pollinations.ai Is Used

### Endpoint
- `POST https://gen.pollinations.ai/v1/chat/completions`

### Authentication
- Secret key (`sk_` prefix) stored server-side only
- Proxied through our backend at `/api/synthesis` — the key never reaches the client

### Model
- `openai` (default model)

### Request Structure
```json
{
  "model": "openai",
  "messages": [
    { "role": "system", "content": "<Sophia system prompt>" },
    { "role": "user", "content": "<card data + seeker intention>" }
  ],
  "max_tokens": 200,
  "temperature": 0.8
}
```

### System Prompt (Character: "Sophia")
Sophia is a reverent oracle reader who interprets how fixed card meanings apply to the seeker's intention. She:
- Writes in flowing prose (no markdown, no bullet points, no lists)
- Addresses the seeker as "you"
- References card titles and themes directly
- Keeps responses to 80-120 words (single card) or 150-250 words (spread)
- Never uses technical jargon or breaks character

### Use Cases
1. **Single Card Reading** — One card drawn, ~100 word synthesis connecting card meaning to seeker's intention
2. **Multi-Card Spread** — 3 or 5 cards, ~200 word woven narrative showing how cards relate to each other

### Output Handling
- Response text is sanitized (markdown stripped) before rendering
- Displayed on-screen in the card back view
- Embedded in exported JPG sacred records
- Non-blocking: if synthesis fails, the reading still renders with all static content

## Volume & Usage Pattern

- **Requests per reading:** 1 (single card) or 1 per card in spread (3-5)
- **Average tokens:** 100-200 per response
- **User base:** Individual seekers, not high-volume
- **Rate limiting:** Backend applies strict rate limit (10 requests/15 min per IP)

## Compliance

- API key is stored server-side (environment variable), never exposed to clients
- No user PII is sent to Pollinations (only card data + intention text)
- Attribution: "Powered by Pollinations.ai" displayed in the footer of every exported reading
- Content is spiritual/wellness — no harmful, illegal, or adult content generated

## Technical Architecture

```
[Browser] → POST /api/synthesis → [Vercel Serverless Function]
                                         ↓
                              POST gen.pollinations.ai/v1/chat/completions
                                         ↓
                              [Response: synthesis text]
                                         ↓
                              [Returned to browser → rendered]
```

## Contact

- **Developer:** Jeraque007
- **App URL:** https://app.963.co.za
- **Support:** Available via app contact page

---

*This document is submitted for Pollinations.ai integration approval.*

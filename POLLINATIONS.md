# Pollinations.ai Integration — Tessera Lumen

This app uses a **backend proxy integration** with Pollinations.ai to generate personalised tarot readings.

## Pollinations endpoint used

```
https://gen.pollinations.ai/v1/chat/completions
```

Model: `openai`  
Request method: `POST`  
Auth: Bearer token via `POLLINATIONS_API_KEY`

## Integration flow

1. The user starts a reading in the app at [https://app.963.co.za](https://app.963.co.za)
2. The frontend (`synthesisService.js`) calls the app's own backend at `/api/synthesis`
3. The backend (`backend/routes/synthesis.js`) forwards the request to `https://gen.pollinations.ai/v1/chat/completions`
4. Pollinations generates the reading text
5. The response is returned to the app and displayed on the reveal card

## Repository files

| File | Role |
|---|---|
| [`backend/routes/synthesis.js`](backend/routes/synthesis.js) | Backend proxy — receives the request and calls Pollinations |
| [`frontend/src/services/synthesisService.js`](frontend/src/services/synthesisService.js) | Frontend service — builds the prompt and calls `/api/synthesis` |
| [`frontend/src/components/CardBack.jsx`](frontend/src/components/CardBack.jsx) | UI component — displays the generated reading text |

## Relevant code (backend proxy)

```js
// backend/routes/synthesis.js

const POLLINATIONS_URL = "https://gen.pollinations.ai/v1/chat/completions";
const MODEL = "openai";

router.post("/", async (req, res) => {
  const { messages, max_tokens } = req.body;

  const response = await fetch(POLLINATIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      "Referer": "sophia-tarot"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: max_tokens || 200,
      temperature: 0.8
    })
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  res.json({ text });
});
```

## Live reproduction

1. Open [https://app.963.co.za](https://app.963.co.za)
2. Enter your name and email to start
3. Choose a reading package
4. Enter an intention and select a card from the fan
5. The backend sends a POST request to `https://gen.pollinations.ai/v1/chat/completions` and returns the generated reading text, which is displayed on the card reveal screen

## Attribution

The app displays **"Powered by Pollinations.ai"** on each generated reading card (see `CardBack.jsx` and `readingExport.js`).

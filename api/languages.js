export default async function handler(req, res) {
  const DEEPL_KEY = process.env.DEEPL_API_KEY || "";
  if (!DEEPL_KEY) return res.status(200).json({ languages: [] });

  try {
    const response = await fetch("https://api-free.deepl.com/v2/languages?type=target", {
      headers: { "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
    });
    const data = await response.json();
    res.status(200).json({ languages: data });
  } catch (err) {
    res.status(200).json({ languages: [] });
  }
}

// frontend/api/payfast/relay.js
// Vercel serverless function that acts as a bridge for POSTing to PayFast
// This is used to launch PayFast in an external browser using Capacitor Browser plugin (GET -> POST)

export default async function handler(req, res) {
  const { url, ...fields } = req.query;

  if (!url) {
    return res.status(400).send("Missing target URL");
  }

  // Create auto-submitting form with fields in alphabetical order to match signature
  const formFields = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, "&quot;")}">`)
    .join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting to PayFast...</title>
      <style>
        body { background: #0a0a1a; color: #D4AF37; font-family: serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .loader { border: 3px solid rgba(212,175,55,0.1); border-top: 3px solid #D4AF37; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div style="text-align: center;">
        <div class="loader" style="margin: 0 auto 20px;"></div>
        <p>Connecting to secure payment gateway...</p>
      </div>
      <form id="pfForm" method="POST" action="${url}">
        ${formFields}
      </form>
      <script>
        document.getElementById("pfForm").submit();
      </script>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}

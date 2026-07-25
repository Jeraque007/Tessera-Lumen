export default function handler(req, res) {
  const { url, ...fields } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  const formFields = Object.keys(fields)
    .map(key => `<input type="hidden" name="${key}" value="${fields[key]}">`)
    .join("\n");

  const html = `
    <html>
      <head><title>Redirecting...</title></head>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${url}">
          ${formFields}
          <button type="submit">Click here if not redirected</button>
        </form>
      </body>
    </html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}

// Tessera Lumen â€” Reading Export System
// Generates text, HTML, and PDF exports WITHOUT card images (artwork stays in-app)
// Uses Web Share API for native share sheets on iOS and Android




//  HTML Email Template 
// Inline styles only â€” required for Gmail, Outlook, Apple Mail compatibility
// Table-based layout for maximum email client support
export function buildEmailHTML(user, intention, cards, positions) {
  const cardRows = cards.map((card, i) => {
    const pos = positions && positions[i]
      ? `<p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a7020;text-align:center;">${positions[i]}</p>`
      : "";
    return `
    <!-- Card block -->
    <tr><td style="padding:0 0 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0a1e;border:1px solid #3a2e10;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 28px 0;text-align:center;">
          ${pos}
          <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#c8a028;">${card.number}</p>
          <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#D4AF37;letter-spacing:1px;">${card.title}</h2>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#5a4820;">${card.pillar}</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #2a2010;padding:0;"></td></tr></table>
        </td></tr>
        <!-- Purpose -->
        <tr><td style="padding:20px 28px 0;">
          <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;border-bottom:1px solid #2a2010;padding-bottom:8px;">Purpose</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:15px;line-height:1.85;color:#e8dcc8;">${card.purpose}</p>
        </td></tr>
        <!-- Meaning -->
        <tr><td style="padding:20px 28px 0;">
          <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;border-bottom:1px solid #2a2010;padding-bottom:8px;">Meaning</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:15px;line-height:1.85;color:#e8dcc8;">${card.meaning}</p>
        </td></tr>
        <!-- Mantra -->
        <tr><td style="padding:20px 28px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1030;border:1px solid #3a2e10;border-radius:8px;">
            <tr><td style="padding:18px 20px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;">Mantra</p>
              <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-style:italic;line-height:1.75;color:#f0d060;">&ldquo;${card.mantra}&rdquo;</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Your Tessera Lumen Oracle Reading</title>
</head>
<body style="margin:0;padding:0;background:#060810;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#060810;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

  <!-- Header -->
  <tr><td style="padding:0 0 32px;text-align:center;">
    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#8a7020;">Oracle of the Soul</p>
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:32px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;">Tessera Lumen</h1>
    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:13px;letter-spacing:2px;color:#8a7020;">Your Sacred Reading</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-top:1px solid #2a2010;"></td>
      <td width="8" style="color:#D4AF37;font-size:8px;text-align:center;padding:0 8px;">&#9670;</td>
      <td style="border-top:1px solid #2a2010;"></td>
    </tr></table>
  </td></tr>

  <!-- Seeker block -->
  <tr><td style="padding:0 0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0a1e;border:1px solid #3a2e10;border-radius:12px;">
      <tr><td style="padding:24px 28px;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;">Seeker</p>
        <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;color:#f0e8d8;">${user.name || "Anonymous"}</p>
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;">Intention</p>
        <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;color:#f0e8d8;">${intention || ""}</p>
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#D4AF37;">Date</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#f0e8d8;">${new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Cards -->
  ${cardRows}

  <!-- Footer -->
  <tr><td style="padding:16px 0 0;text-align:center;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-top:1px solid #1a1408;"></td>
      <td width="8" style="color:#3a2e10;font-size:8px;text-align:center;padding:0 8px;">&#9670;</td>
      <td style="border-top:1px solid #1a1408;"></td>
    </tr></table>
    <p style="margin:16px 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#3a2e10;">Tessera Lumen &bull; Oracle of the Soul</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
//  Text Summary 
export function buildTextSummary(user, intention, cards, positions) {
  const lines = [
    "TESSERA LUMEN  Oracle of the Soul",
    "Your Sacred Reading",
    "".repeat(40),
    "",
    `Seeker:    ${user.name || "Anonymous"}`,
    `Intention: ${intention || ""}`,
    `Date:      ${new Date().toLocaleDateString()}`,
    "",
    "".repeat(40),
    "",
  ];

  cards.forEach((card, i) => {
    const pos = positions && positions[i] ? `${positions[i]}  ` : "";
    lines.push(`${pos}${card.number}. ${card.title}`);
    lines.push(`Pillar: ${card.pillar}`);
    lines.push("");
    lines.push("PURPOSE");
    lines.push(card.purpose);
    lines.push("");
    lines.push("MEANING");
    lines.push(card.meaning);
    lines.push("");
    lines.push("MANTRA");
    lines.push(`"${card.mantra}"`);
    lines.push("");
    lines.push("".repeat(40));
    lines.push("");
  });

  lines.push("TESSERA LUMEN  Oracle of the Soul");
  lines.push("tessera-lumen.com");
  return lines.join("\n");
}

//  HTML Export (no images) 
export function buildHTML(user, intention, cards, positions) {
  const cardRows = cards.map((card, i) => {
    const pos = positions && positions[i] ? `${positions[i]} &mdash; ` : "";
    return `
      <div class="card-block">
        <div class="card-num">${card.number}</div>
        <h2>${pos}${card.title}</h2>
        <div class="pillar">${card.pillar}</div>
        <div class="section-label">Purpose</div>
        <p>${card.purpose}</p>
        <div class="section-label">Meaning</div>
        <p>${card.meaning}</p>
        <div class="mantra-block">
          <div class="section-label">Mantra</div>
          <p class="mantra">&ldquo;${card.mantra}&rdquo;</p>
        </div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Tessera Lumen Reading</title>
  <style>
    /* LOCAL FONTS INLINE (China Compliance & Performance) */
    @font-face {
      font-family: 'Cinzel';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('https://app.963.co.za/fonts/cinzel-regular.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Cormorant Garamond';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('https://app.963.co.za/fonts/cormorant-regular.woff2') format('woff2');
    }

    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Cormorant Garamond",Georgia,serif;background:#060810;color:#f0e8d8;max-width:680px;margin:0 auto;padding:40px 20px}
    h1{font-family:"Cinzel",serif;color:#D4AF37;text-align:center;font-size:2rem;letter-spacing:0.1em;margin-bottom:4px}
    .tagline{font-family:"Cinzel",serif;color:rgba(212,175,55,0.5);text-align:center;font-size:0.6rem;letter-spacing:0.35em;text-transform:uppercase;margin-bottom:8px}
    .divider{border:none;border-top:1px solid rgba(212,175,55,0.25);margin:20px 0}
    .seeker-block{background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:20px;margin-bottom:24px}
    .seeker-label{font-family:"Cinzel",serif;font-size:0.65rem;letter-spacing:0.25em;color:#D4AF37;text-transform:uppercase;display:block;margin-bottom:4px}
    .seeker-value{font-size:1.05rem;color:#f0e8d8;margin-bottom:12px}
    .card-block{background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:28px;margin-bottom:24px}
    .card-num{font-family:"Cinzel",serif;color:#f0d060;font-size:0.7rem;letter-spacing:0.25em;text-align:center;margin-bottom:4px;text-shadow:0 0 8px rgba(212,175,55,0.5)}
    h2{font-family:"Cinzel",serif;color:#D4AF37;text-align:center;font-size:1.3rem;margin-bottom:4px}
    .pillar{font-family:"Cinzel",serif;color:rgba(212,175,55,0.4);font-size:0.6rem;letter-spacing:0.3em;text-align:center;text-transform:uppercase;margin-bottom:20px}
    .section-label{font-family:"Cinzel",serif;color:#D4AF37;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:5px;margin:16px 0 10px}
    p{line-height:1.85;color:#f0e8d8;font-size:1.05rem}
    .mantra-block{background:rgba(45,20,80,0.4);border:1px solid rgba(212,175,55,0.2);border-radius:8px;padding:16px;margin-top:16px;text-align:center}
    .mantra{color:#f0d060;font-style:italic;font-size:1.1rem}
    .footer{text-align:center;margin-top:40px;font-family:"Cinzel",serif;font-size:0.55rem;letter-spacing:0.35em;color:rgba(212,175,55,0.25);text-transform:uppercase}.footer-links{text-align:center;font-family:"Cinzel",serif;font-size:0.5rem;letter-spacing:0.2em;color:rgba(90,72,32,0.6);margin:4px 0;text-transform:uppercase}
    @media print{body{background:#fff;color:#000}.card-block,.seeker-block{border-color:#ccc;background:#f9f9f9}h1,.card-num,.section-label,.tagline,.pillar{color:#8a6000}.mantra{color:#5a4000}.mantra-block{background:#f5f0e0;border-color:#ccc}}
  </style>
</head>
<body>
  <h1>Tessera Lumen</h1>
  <p class="tagline">Oracle of the Soul &bull; Your Sacred Reading</p>
  <hr class="divider">
  <div class="seeker-block">
    <span class="seeker-label">Seeker</span>
    <div class="seeker-value">${user.name || "Anonymous"}</div>
    <span class="seeker-label">Intention</span>
    <div class="seeker-value">${intention || ""}</div>
    <span class="seeker-label">Date</span>
    <div class="seeker-value">${new Date().toLocaleDateString()}</div>
  </div>
  ${cardRows}
  <p class="footer">Tessera Lumen &bull; Oracle of the Soul</p>
    <p class="footer-links">&copy; 2026 Tessera Lumen. All rights reserved.</p>
    <p class="footer-links">
      <a href="mailto:holistic@963.co.za" style="color:#5a4820;text-decoration:none;">holistic@963.co.za</a>
    </p>
</body>
</html>`;
}

//  Export as downloadable file 
export function exportAsHTML(user, intention, cards, positions) {
  const html = buildHTML(user, intention, cards, positions);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  return { blob, filename: "tessera-lumen-reading.html", mimeType: "text/html" };
}

export function exportAsText(user, intention, cards, positions) {
  const text = buildTextSummary(user, intention, cards, positions);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  return { blob, filename: "tessera-lumen-reading.txt", mimeType: "text/plain" };
}

// PDF: open HTML in new window and trigger print dialog (browser saves as PDF)
export function exportAsPDF(user, intention, cards, positions) {
  const html = buildHTML(user, intention, cards, positions);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, 500);
    });
  }
  return { method: "pdf-print" };
}

//  Native Share API 
export function canNativeShare() {
  return typeof navigator !== "undefined" && !!navigator.share;
}

export async function nativeShare(user, intention, cards, positions) {
  const text = buildTextSummary(user, intention, cards, positions);
  const html = buildHTML(user, intention, cards, positions);

  const shareTitle = "Tessera Lumen â€” " + (user.name || "My Reading");
  const shareText = "My Tessera Lumen Oracle Reading" + (intention ? " â€” " + intention : "");

  // Try file sharing with proper named File objects
  // Note: Android Chrome passes filename correctly to most apps but Drive may still rename
  if (navigator.canShare) {
    const htmlFile = new File([html], "tessera-lumen-reading.html", { type: "text/html" });
    const txtFile  = new File([text], "tessera-lumen-reading.txt",  { type: "text/plain" });

    // Try HTML + text files
    if (navigator.canShare({ files: [htmlFile] })) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, files: [htmlFile, txtFile] });
        return { method: "native-files" };
      } catch (e) {
        if (e.name === "AbortError") return { method: "cancelled" };
        // Fall through to text-only share
      }
    }

    // Try text file only (wider compatibility)
    if (navigator.canShare({ files: [txtFile] })) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, files: [txtFile] });
        return { method: "native-text-file" };
      } catch (e) {
        if (e.name === "AbortError") return { method: "cancelled" };
      }
    }
  }

  // Final fallback: share plain text (no files)  works everywhere
  if (navigator.share) {
    try {
      await navigator.share({ title: shareTitle, text: text.slice(0, 2000) });
      return { method: "native-text" };
    } catch (e) {
      if (e.name === "AbortError") return { method: "cancelled" };
      return { method: "failed", error: e.message };
    }
  }

  return { method: "unsupported" };
}

//  Email via mailto 
export function emailReading(email, user, intention, cards, positions) {
  if (!email) return;
  const subject = encodeURIComponent("Your Tessera Lumen Oracle Reading");
  const body = encodeURIComponent(buildTextSummary(user, intention, cards, positions).slice(0, 2000));
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}


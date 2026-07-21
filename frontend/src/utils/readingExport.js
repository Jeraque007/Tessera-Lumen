import html2canvas from "html2canvas";

async function fetchImageAsBase64(url) {
  const encodedUrl = encodeURI(url);
  try {
    const res = await fetch(encodedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("[Export] Image load failed:", url, err);
    return null;
  }
}

/**
 * Build a single card export: A (front) + B (back) SIDE BY SIDE — landscape
 * Left half: Card artwork (full bleed)
 * Right half: Two-column content (sacred text | AI synthesis)
 */
function buildCardExportDOM(reading, cardImageBase64, synthesis) {
  const container = document.createElement("div");
  container.style.cssText = `
    width: 1400px;
    height: 900px;
    background: #060810;
    color: #f0e8d8;
    font-family: 'Cinzel', serif;
    position: relative;
    box-sizing: border-box;
    border: 3px solid rgba(212,175,55,0.4);
    border-radius: 20px;
    display: flex;
    overflow: hidden;
  `;

  const dateStr = new Date(reading.timestamp).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  });

  container.innerHTML = `
    <!-- LEFT: Card Artwork (A) -->
    <div style="width:45%; height:100%; position:relative; overflow:hidden; border-right:2px solid rgba(212,175,55,0.3);">
      ${cardImageBase64
        ? `<img src="${cardImageBase64}" style="width:100%; height:100%; object-fit:cover; display:block;" />`
        : `<div style="width:100%; height:100%; background:#1a1535; display:flex; align-items:center; justify-content:center;"><p style="color:#D4AF37; font-size:48px; font-weight:bold;">${reading.card.number}</p></div>`
      }
      <!-- Overlay with card number + title at bottom -->
      <div style="position:absolute; bottom:0; left:0; right:0; padding:24px 20px; background:linear-gradient(to top, rgba(6,8,16,0.95) 0%, rgba(6,8,16,0.7) 60%, transparent 100%);">
        <p style="font-size:48px; color:#f0d060; font-weight:bold; margin:0 0 4px 0; text-shadow:0 0 20px rgba(212,175,55,0.5);">${reading.card.number}</p>
        <h2 style="font-size:20px; color:#D4AF37; letter-spacing:4px; margin:0 0 2px 0; text-transform:uppercase;">${reading.card.title}</h2>
        <p style="font-size:10px; letter-spacing:4px; color:rgba(212,175,55,0.5); margin:0; text-transform:uppercase;">${reading.card.pillar}</p>
      </div>
    </div>

    <!-- RIGHT: 3-section layout: Header | Centered Body | Footer -->
    <div style="width:55%; height:100%; display:flex; flex-direction:column; overflow:hidden; text-align:center;">

      <!-- TOP LINE: Seeker + Date only -->
      <div style="flex-shrink:0; padding:14px 48px 0 48px; display:flex; justify-content:space-between; align-items:center;">
        <p style="font-family:'Cinzel',serif; font-size:8px; letter-spacing:3px; color:rgba(212,175,55,0.5); margin:0; text-transform:uppercase;">${reading.seeker}</p>
        <p style="font-family:'Cinzel',serif; font-size:8px; letter-spacing:3px; color:rgba(212,175,55,0.5); margin:0;">${dateStr}</p>
      </div>

      <!-- BODY -->
      <div style="flex:1; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; padding:8px 48px; overflow:hidden;">

        <!-- Intention (small italic, centered) -->
        <p style="font-family:'Cormorant Garamond',serif; font-size:13px; font-style:italic; letter-spacing:2px; color:rgba(212,175,55,0.7); margin:0 0 16px 0; text-transform:uppercase;">${reading.intention}</p>

        <!-- Purpose -->
        <h4 style="font-family:'Cinzel',serif; font-size:8px; color:#D4AF37; letter-spacing:4px; THIS_WONT_MATCH width:100%;">${reading.card.purpose}</p>

        <!-- Meaning -->
        <h4 style="font-family:'Cinzel',serif; font-size:8px; color:#D4AF37; letter-spacing:4px; margin:0 0 5px 0; text-transform:uppercase;">Meaning</h4>
        <p style="font-family:'Cormorant Garamond',serif; font-size:11px; line-height:1.45; color:#dcd0bc; margin:0 0 24px 0; width:100%;">${reading.card.meaning}</p>

        <!-- Mantra -->
        <div style="background:linear-gradient(135deg,rgba(45,20,80,0.3),rgba(10,12,26,0.5)); border:1px solid rgba(212,175,55,0.2); border-radius:10px; padding:14px 20px; margin-bottom:28px; width:100%;">
          <h4 style="font-family:'Cinzel',serif; font-size:7px; color:#D4AF37; letter-spacing:4px; margin:0 0 3px 0; text-transform:uppercase;">Mantra</h4>
          <p style="font-family:'Cormorant Garamond',serif; font-size:11px; font-style:italic; color:#f0d060; margin:0; line-height:1.3;">&ldquo;${reading.card.mantra}&rdquo;</p>
        </div>

        <!-- AI Synthesis + Pollinations -->
        ${synthesis ? `
          <div style="width:100%;">
            <span style="color:#D4AF37; font-size:12px;">&#10022;</span>
            <h4 style="font-family:'Cinzel',serif; font-size:8px; color:#D4AF37; letter-spacing:3px; margin:3px 0 5px 0; text-transform:uppercase;">Your Personal Reading</h4>
            <p style="font-family:'Cormorant Garamond',serif; font-size:10px; line-height:1.45; color:#dcd0bc; margin:0 0 10px 0; white-space:pre-line; width:100%;">${synthesis}</p>
            <p style="font-size:7px; letter-spacing:2px; margin:0; color:rgba(212,175,55,0.25);">Powered by Pollinations.ai</p>
          </div>
        ` : ``}

      </div>

      <!-- SECTION 3: BOTTOM FOOTER (pinned) -->
      <div style="flex-shrink:0; padding:14px 48px; border-top:1px solid rgba(212,175,55,0.15); display:flex; justify-content:space-between; align-items:center;">
        <p style="font-family:'Cinzel',serif; font-size:9px; letter-spacing:5px; text-transform:uppercase; margin:0; color:rgba(212,175,55,0.35);">Tessera Lumen</p>
        <p style="font-size:8px; letter-spacing:2px; margin:0; color:rgba(212,175,55,0.25);">Powered by Pollinations.ai</p>
      </div>

    </div>
  `;

  return container;
}

/**
 * Render a single card to a landscape JPG (A+B side by side)
 */
export async function renderReadingCard(reading, synthesis) {
  console.log("[Export] Starting render...");
  const cardImageBase64 = await fetchImageAsBase64(reading.card.image);
  const dom = buildCardExportDOM(reading, cardImageBase64, synthesis);
  dom.style.position = "absolute";
  dom.style.left = "-9999px";
  dom.style.top = "0";
  document.body.appendChild(dom);

  try {
    await new Promise(r => setTimeout(r, 1000));
    const canvas = await html2canvas(dom, {
      scale: 1,
      useCORS: true,
      backgroundColor: "#060810",
      width: 1400,
      height: 900,
      logging: false
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const dataUrl = URL.createObjectURL(blob);
        document.body.removeChild(dom);
        console.log("[Export] JPG produced:", (blob.size / 1024).toFixed(1), "KB");
        resolve({
          ...reading,
          export: {
            blob,
            dataUrl,
            filename: `tessera-lumen-${reading.card.title.toLowerCase().replace(/\s+/g, "-")}.jpg`
          }
        });
      }, "image/jpeg", 0.92);
    });
  } catch (err) {
    console.error("[Export] Render failed:", err);
    if (dom.parentNode) document.body.removeChild(dom);
    return reading;
  }
}

/**
 * Render multiple cards — each as its own A+B landscape image
 * Returns array of export objects
 */
export async function renderSpreadCards(readings, syntheses) {
  console.log("[Export] Starting spread render...", readings.length, "cards");
  const results = [];

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    const synthesis = syntheses[i] || null;
    const result = await renderReadingCard(reading, synthesis);
    results.push(result);
  }

  return results;
}

/**
 * Dispatch a single export (download or share)
 */
export async function dispatchExport(exportData) {
  const { blob, dataUrl, filename } = exportData.export || exportData;
  if (!blob) return false;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Tessera Lumen Sacred Record",
          text: `My Oracle Reading`
        });
        return true;
      } catch (e) {
        if (e.name === "AbortError") return false;
      }
    }
  }

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 300);
  return true;
}

/**
 * Dispatch multiple exports (one per card) — bundle download
 */
export async function dispatchBundleExport(exportDataArray) {
  for (let i = 0; i < exportDataArray.length; i++) {
    await dispatchExport(exportDataArray[i]);
    // Small delay between downloads to avoid browser blocking
    if (i < exportDataArray.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return true;
}

import html2canvas from "html2canvas";

/**
 * READING EXPORT ENGINE v2.0
 * Stable landscape JPG renderer for Tessera Lumen sacred records.
 *
 * Fixes: background-image (not object-fit), overflow:hidden, font preload,
 * image decode guarantee, null blob guards, fixed positioning for layout.
 */

async function fetchImageAsBase64(url) {
  const encodedUrl = encodeURI(url);
  try {
    const res = await fetch(encodedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("[Export] Image load failed:", url, err);
    return null;
  }
}

function preloadImage(base64) {
  return new Promise((resolve) => {
    if (!base64) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = base64;
  });
}

async function ensureFontsLoaded() {
  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise(r => setTimeout(r, 3000))
      ]);
    } else {
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (e) {
    console.warn("[Export] Font check failed:", e);
  }
}

/**
 * Strip markdown formatting from AI synthesis text.
 * Pollinations.ai sometimes returns **bold**, ## headings, --- dividers, etc.
 * This ensures only clean plain text reaches the JPG template.
 */
function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s*/g, "")           // ## headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** -> text
    .replace(/\*([^*]+)\*/g, '$1')       // *italic* -> text
    .replace(/__([^_]+)__/g, '$1')       // __bold__ -> text
    .replace(/_([^_]+)_/g, '$1')         // _italic_ -> text
    .replace(/~~([^~]+)~~/g, '$1')       // ~~strike~~ -> text
    .replace(/`([^`]+)`/g, '$1')       // `code` -> text
    .replace(/^[-*]\s+/gm, "")           // - bullet or * bullet
    .replace(/^\d+\.\s+/gm, "")         // 1. numbered list
    .replace(/^---+$/gm, "")             // --- horizontal rules
    .replace(/^===+$/gm, "")             // === horizontal rules
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/\n{3,}/g, '\n\n')          // collapse excessive newlines
    .trim();
}

function getExportViewportConfig() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return {
    isMobile,
    width: isMobile ? 1100 : 1400,
    height: isMobile ? 760 : 900,
    scale: isMobile ? 1.15 : 1.5,
  };
}

function buildCardExportDOM(reading, cardImageBase64, synthesis) {
  const container = document.createElement("div");
  const esc = (str) => (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const { width, height } = getExportViewportConfig();

  const dateStr = new Date(reading.timestamp).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  });

  container.style.cssText = `
    width: ${width}px;
    min-height: ${height}px;
    background: #060810;
    color: #f0e8d8;
    font-family: 'Cinzel', serif;
    position: relative;
    box-sizing: border-box;
    border: 3px solid rgba(212,175,55,0.4);
    border-radius: 20px;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  `;

  container.innerHTML = `
    <div style="width:45%; min-height:900px; position:relative; overflow:hidden; border-right:2px solid rgba(212,175,55,0.3); flex-shrink:0;">
      ${cardImageBase64
        ? `<img src="${cardImageBase64}" style="position:absolute; top:0; left:0; width:100%; height:100%; display:block;" />`
        : `<div style="position:absolute; top:0; left:0; right:0; bottom:0; background:#1a1535; display:flex; align-items:center; justify-content:center;"><p style="color:#D4AF37; font-size:48px; font-weight:bold; margin:0;">${reading.card.number}</p></div>`
      }
      <div style="position:absolute; bottom:0; left:0; right:0; padding:24px 20px; background:linear-gradient(to top, rgba(6,8,16,0.95) 0%, rgba(6,8,16,0.7) 60%, transparent 100%); z-index:2;">
        <p style="font-family:'Cinzel',serif; font-size:48px; color:#f0d060; font-weight:bold; margin:0 0 4px 0; text-shadow:0 0 20px rgba(212,175,55,0.5);">${reading.card.number}</p>
        <h2 style="font-family:'Cinzel',serif; font-size:20px; color:#D4AF37; letter-spacing:4px; margin:0 0 2px 0; text-transform:uppercase;">${esc(reading.card.title)}</h2>
        <p style="font-family:'Cinzel',serif; font-size:10px; letter-spacing:4px; color:rgba(212,175,55,0.5); margin:0; text-transform:uppercase;">${esc(reading.card.pillar)}</p>
      </div>
    </div>

    <div style="width:55%; display:flex; flex-direction:column; text-align:center; min-height:900px; justify-content:space-between;">

      <!-- HEADER: Seeker + Date - PROMINENT -->
      <div style="flex-shrink:0; padding:20px 40px 0 40px; text-align:center;">
        <p style="font-family:'Cinzel',serif; font-size:11px; letter-spacing:4px; color:#D4AF37; margin:0; text-transform:uppercase;">${esc(reading.seeker)} &middot; ${dateStr}</p>
      </div>

      <!-- BODY: Fills all space -->
      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:16px 65px;">

        <!-- Intention -->
        <p style="font-family:'Cormorant Garamond',serif; font-size:20px; font-style:normal; font-weight:bold; letter-spacing:5px; color:#D4AF37; margin:10px 0 40px 0; text-transform:uppercase;">${esc(reading.intention)}</p>

        <!-- Purpose -->
        <h4 style="font-family:'Cinzel',serif; font-size:10px; color:#D4AF37; letter-spacing:5px; margin:0 0 6px 0; text-transform:uppercase;">Purpose</h4>
        <p style="font-family:'Cormorant Garamond',serif; font-size:15px; line-height:1.55; font-style:italic; color:#f0e8d8; margin:0 0 18px 0; width:100%;">${esc(reading.card.purpose)}</p>

        <!-- Meaning -->
        <h4 style="font-family:'Cinzel',serif; font-size:10px; color:#D4AF37; letter-spacing:5px; margin:0 0 6px 0; text-transform:uppercase;">Meaning</h4>
        <p style="font-family:'Cormorant Garamond',serif; font-size:15px; line-height:1.55; color:#f0e8d8; margin:0 0 22px 0; width:100%;">${esc(reading.card.meaning)}</p>

        <!-- Mantra - tight elegant box -->
        <div style="border:1px solid rgba(212,175,55,0.35); border-radius:8px; padding:12px 20px; width:100%; background:rgba(10,12,26,0.4);">
          <h4 style="font-family:'Cinzel',serif; font-size:9px; color:#D4AF37; letter-spacing:4px; margin:0 0 4px 0; text-transform:uppercase;">Mantra</h4>
          <p style="font-family:'Cormorant Garamond',serif; font-size:14px; font-style:italic; color:#f0d060; margin:0; line-height:1.35;">&ldquo;${esc(reading.card.mantra)}&rdquo;</p>
        </div>

        <!-- AI Synthesis -->
        ${synthesis ? `
          <div style="width:100%; margin-top:18px;">
            <span style="color:#D4AF37; font-size:14px;">&#10022;</span>
            <h4 style="font-family:'Cinzel',serif; font-size:10px; color:#D4AF37; letter-spacing:4px; margin:6px 0 8px 0; text-transform:uppercase;">Your Personal Reading</h4>
            <p style="font-family:'Cormorant Garamond',serif; font-size:14px; line-height:1.55; color:#f0e8d8; margin:0; white-space:pre-line; width:100%;">${esc(stripMarkdown(synthesis))}</p>
          </div>
        ` : ``}
      </div>

      <!-- FOOTER -->
      <div style="flex-shrink:0; padding:12px 40px; border-top:1px solid rgba(212,175,55,0.15); display:flex; justify-content:space-between; align-items:center;">
        <p style="font-family:'Cinzel',serif; font-size:9px; letter-spacing:5px; text-transform:uppercase; margin:0; color:rgba(212,175,55,0.4);">Tessera Lumen</p>
        <p style="font-family:'Cinzel',serif; font-size:8px; letter-spacing:2px; margin:0; color:rgba(212,175,55,0.25); text-transform:uppercase;">Powered by Pollinations.ai</p>
      </div>
    </div>
  `;

  return container;
}

export async function renderReadingCard(reading, synthesis) {
  console.log("[Export] Starting render for:", reading.card.title);

  const { width, height, scale } = getExportViewportConfig();
  const cardImageBase64 = await fetchImageAsBase64(reading.card.image);
  if (cardImageBase64) await preloadImage(cardImageBase64);
  await ensureFontsLoaded();

  const dom = buildCardExportDOM(reading, cardImageBase64, synthesis || null);
  dom.style.position = "absolute";
  dom.style.left = "-9999px";
  dom.style.top = "0px";
  dom.style.zIndex = "1";
  dom.style.opacity = "1";
  dom.style.pointerEvents = "none";
  document.body.appendChild(dom);

  try {
    // Wait for all images inside the DOM element to fully load/decode
    const images = dom.querySelectorAll("img");
    if (images.length > 0) {
      await Promise.all(Array.from(images).map(img => {
        if (img.complete && img.naturalHeight > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // proceed even if image fails
          setTimeout(resolve, 5000); // 5s max wait per image
        });
      }));
    }
    // Additional layout settle time
    await new Promise(r => setTimeout(r, 120));
    const computedHeight = Math.max(height, dom.scrollHeight, dom.offsetHeight);

    const canvas = await html2canvas(dom, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#060810",
      width,
      height: computedHeight,
      logging: false,
      imageTimeout: 10000,
      removeContainer: false
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (dom.parentNode) document.body.removeChild(dom);

        if (!blob) {
          console.error("[Export] toBlob returned null");
          resolve({ ...reading, export: { blob: null, dataUrl: null, filename: null } });
          return;
        }

        const dataUrl = URL.createObjectURL(blob);
        const filename = `tessera-lumen-${(reading.card.title || "card").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}.jpg`;
        console.log("[Export] JPG produced:", (blob.size / 1024).toFixed(1), "KB");
        resolve({ ...reading, export: { blob, dataUrl, filename } });
      }, "image/jpeg", 0.92);
    });
  } catch (err) {
    console.error("[Export] Render failed:", err);
    if (dom.parentNode) document.body.removeChild(dom);
    return { ...reading, export: { blob: null, dataUrl: null, filename: null } };
  }
}

export async function renderSpreadCards(readings, syntheses) {
  console.log("[Export] Spread render:", readings.length, "cards");
  const results = [];
  for (let i = 0; i < readings.length; i++) {
    const result = await renderReadingCard(readings[i], (syntheses && syntheses[i]) || null);
    results.push(result);
    if (i < readings.length - 1) await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

export async function dispatchExport(exportData) {
  const exportInfo = exportData?.export || exportData;
  const { blob, dataUrl, filename } = exportInfo || {};
  if (!blob) {
    console.error("[Export] Cannot dispatch - no blob");
    return false;
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Tessera Lumen Sacred Record", text: "My Oracle Reading" });
        return true;
      }
    } catch (e) {
      if (e.name === "AbortError") return false;
      console.warn("[Export] Share failed, falling back to download:", e.message);
    }
  }

  try {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { if (a.parentNode) document.body.removeChild(a); }, 1000);
    return true;
  } catch (e) {
    console.error("[Export] Download fallback failed:", e);
    return false;
  }
}

export async function dispatchBundleExport(exportDataArray) {
  let allSuccess = true;
  for (let i = 0; i < exportDataArray.length; i++) {
    const success = await dispatchExport(exportDataArray[i]);
    if (!success) allSuccess = false;
    if (i < exportDataArray.length - 1) await new Promise(r => setTimeout(r, 800));
  }
  return allSuccess;
}

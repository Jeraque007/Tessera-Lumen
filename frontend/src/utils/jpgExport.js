import html2canvas from "html2canvas";

/**
 * Strategy: Zero-Interference Individual Card Export
 * Renders high-res JPG for each card and dispatches directly.
 */

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

function buildExportCard(reading, cardImageBase64) {
  const container = document.createElement("div");
  container.style.cssText = `
    width: 800px;
    background: #060810;
    color: #f0e8d8;
    font-family: 'Cinzel', serif;
    padding: 50px;
    border: 2px solid rgba(212,175,55,0.4);
    border-radius: 30px;
    position: relative;
  `;

  container.innerHTML = `
    <div style="text-align:center; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 25px; margin-bottom: 35px;">
      <h1 style="color:#D4AF37; margin:0; font-size:36px; letter-spacing:4px;">TESSERA LUMEN</h1>
      <p style="font-size:14px; letter-spacing:5px; color:rgba(212,175,55,0.6); margin-top:10px;">SACRED ORACLE READING</p>
      <div style="font-size:11px; margin-top:15px; color:rgba(240,232,216,0.4);">
        ID: ${reading.readingId} | ${new Date(reading.timestamp).toLocaleString()}
      </div>
    </div>

    <div style="text-align:center; margin-bottom:40px;">
      <h2 style="color:#D4AF37; margin:0 0 10px 0; font-size:32px;">${reading.cardTitle}</h2>
      <p style="font-size:14px; letter-spacing:3px; color:rgba(212,175,55,0.5);">${reading.cardPillar}</p>
    </div>

    ${cardImageBase64 ? `
      <div style="text-align:center; margin-bottom:40px;">
        <img src="${cardImageBase64}" style="width:100%; border-radius:15px; border:1px solid rgba(212,175,55,0.2);" />
      </div>
    ` : ''}

    <div style="font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 21px; line-height: 1.8; padding: 0 20px;">
      <p style="margin-bottom:30px;"><strong style="color:#D4AF37; font-family:Cinzel; font-size:14px; letter-spacing:2px; display:block; margin-bottom:10px;">PURPOSE</strong> ${reading.purpose}</p>
      <p style="margin-bottom:35px;"><strong style="color:#D4AF37; font-family:Cinzel; font-size:14px; letter-spacing:2px; display:block; margin-bottom:10px;">MEANING</strong> ${reading.meaning}</p>
    </div>

    <div style="margin-top: 20px; background: rgba(212,175,55,0.08); padding: 30px; border-radius: 12px; text-align: center; border: 1px solid rgba(212,175,55,0.1);">
      <p style="margin:0; font-size:26px; color:#f0d060;">&ldquo;${reading.mantra}&rdquo;</p>
    </div>

    <div style="text-align:center; margin-top:50px; border-top: 1px solid rgba(212,175,55,0.15); padding-top:20px;">
      <p style="font-size:12px; color:#D4AF37; margin-bottom:5px;">SEEKER: ${reading.userName}</p>
      <p style="font-size:9px; opacity:0.3; letter-spacing:2px;">&copy; 2026 TESSERA LUMEN. PERSONAL SACRED RECORD.</p>
    </div>
  `;

  return container;
}

export async function autoExportReading(reading) {
  const cardImageBase64 = await fetchImageAsBase64(reading.cardImage);
  const exportEl = buildExportCard(reading, cardImageBase64);
  exportEl.style.position = "absolute";
  exportEl.style.left = "-9999px";
  document.body.appendChild(exportEl);

  try {
    await new Promise(r => setTimeout(r, 600));

    const canvas = await html2canvas(exportEl, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#060810",
      width: 800
    });

    const filename = `tessera-lumen-${reading.cardTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], filename, { type: "image/jpeg" });

        // MOBILE
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Tessera Lumen Reading" });
          } catch (e) {
            triggerSilentDownload(blob, filename);
          }
        } else {
          // DESKTOP
          triggerSilentDownload(blob, filename);
        }
        resolve(true);
      }, "image/jpeg", 0.85);
    });
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(exportEl);
  }
}

function triggerSilentDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000); // Increased delay for multiple downloads
}

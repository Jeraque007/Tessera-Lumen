import html2canvas from "html2canvas";
import { isIOS } from "./download.js";

// Fetch card image as base64 to bypass cross-origin restrictions
async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (_) {
    return null;
  }
}

function buildExportCard(card, cardImageBase64, position, intention, userName) {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 480px;
    background: linear-gradient(160deg, #0d0a1e 0%, #060810 60%, #0a0618 100%);
    border: 1px solid rgba(212,175,55,0.4);
    border-radius: 16px;
    overflow: hidden;
    font-family: Georgia, serif;
    color: #f0e8d8;
    padding: 0 0 28px 0;
  `;

  const posHtml = position
    ? `<p style="text-align:center;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,175,55,0.6);padding:14px 0 4px;margin:0;">${position}</p>`
    : "";

  const headerHtml = `
    <div style="text-align:center;padding:${position ? "4px" : "20px"} 20px 0;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(212,175,55,0.7);">${card.number}</p>
      <h2 style="margin:0 0 4px;font-size:22px;font-weight:bold;color:#D4AF37;letter-spacing:1px;">${card.title}</h2>
      <p style="margin:0 0 16px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,175,55,0.4);">${card.pillar}</p>
    </div>
  `;

  const imgHtml = cardImageBase64
    ? `<div style="padding:0 20px 16px;">
        <img src="${cardImageBase64}" style="width:100%;border-radius:10px;border:1px solid rgba(212,175,55,0.25);display:block;filter:brightness(0.88) saturate(0.9);" />
      </div>`
    : `<div style="height:200px;background:linear-gradient(160deg,#1a1535,#060810);margin:0 20px 16px;border-radius:10px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:48px;color:rgba(212,175,55,0.3);">${card.number}</span>
      </div>`;

  const purposeHtml = `
    <div style="padding:0 24px 14px;">
      <p style="margin:0 0 8px;font-size:9px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#D4AF37;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:6px;">Purpose</p>
      <p style="margin:0;font-size:13px;line-height:1.75;color:#e8dcc8;">${card.purpose}</p>
    </div>
  `;

  const meaningHtml = `
    <div style="padding:0 24px 14px;">
      <p style="margin:0 0 8px;font-size:9px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#D4AF37;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:6px;">Meaning</p>
      <p style="margin:0;font-size:13px;line-height:1.75;color:#e8dcc8;">${card.meaning}</p>
    </div>
  `;

  const mantraHtml = `
    <div style="margin:0 24px;background:rgba(45,20,80,0.5);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:16px;text-align:center;">
      <p style="margin:0 0 8px;font-size:9px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#D4AF37;">Mantra</p>
      <p style="margin:0;font-size:14px;font-style:italic;line-height:1.7;color:#f0d060;">&ldquo;${card.mantra}&rdquo;</p>
    </div>
  `;

  const seekerHtml = userName
    ? `<p style="text-align:center;margin:14px 0 0;font-size:10px;letter-spacing:2px;color:rgba(212,175,55,0.4);">Seeker: ${userName}</p>`
    : "";

  const watermarkHtml = `
    <div style="text-align:center;margin-top:16px;padding:0 20px;">
      <p style="margin:0 0 2px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,175,55,0.25);">Tessera Lumen &bull; Oracle of the Soul</p>
      <p style="margin:0;font-size:8px;letter-spacing:2px;color:rgba(212,175,55,0.18);">Personal Sacred Reading &bull; For personal use only</p>
      <p style="margin:2px 0 0;font-size:8px;color:rgba(212,175,55,0.15);">&copy; 2026 Tessera Lumen. All rights reserved.</p>
    </div>
  `;

  el.innerHTML = posHtml + headerHtml + imgHtml + purposeHtml + meaningHtml + mantraHtml + seekerHtml + watermarkHtml;
  return el;
}

// Render card to JPG dataUrl + trigger download
export async function exportCardAsJPG(card, position, intention, userName) {
  const imageBase64 = await fetchImageAsBase64(card.image);
  const exportEl = buildExportCard(card, imageBase64, position, intention, userName);

  exportEl.style.position = "fixed";
  exportEl.style.top = "-9999px";
  exportEl.style.left = "-9999px";
  document.body.appendChild(exportEl);

  try {
    const canvas = await html2canvas(exportEl, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#060810",
      logging: false,
      imageTimeout: 10000,
    });

    const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const filename = `tessera-lumen-${card.title.toLowerCase().replace(/\s+/g, "-")}.jpg`;

    if (isIOS()) {
      // iOS: open in new tab  user taps Share > Save Image
      const win = window.open(jpgDataUrl, "_blank");
      if (!win) window.location.href = jpgDataUrl;
    } else {
      const a = document.createElement("a");
      a.href = jpgDataUrl;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    return { success: true, dataUrl: jpgDataUrl, filename };
  } finally {
    document.body.removeChild(exportEl);
  }
}

/**
 * Share card as actual JPG image via WhatsApp.
 * Strategy:
 *  1. Try Web Share API with file attachment (works on Android Chrome, iOS Safari 15.1+)
 *  2. Fallback: open WhatsApp with a text message + download link hint
 */
export async function shareCardViaWhatsApp(card, position, intention, userName, phone) {
  // Always generate the JPG first
  const imageBase64 = await fetchImageAsBase64(card.image);
  const exportEl = buildExportCard(card, imageBase64, position, intention, userName);
  exportEl.style.position = "fixed";
  exportEl.style.top = "-9999px";
  exportEl.style.left = "-9999px";
  document.body.appendChild(exportEl);

  let jpgBlob = null;
  let filename = `tessera-lumen-${card.title.toLowerCase().replace(/\s+/g, "-")}.jpg`;

  try {
    const canvas = await html2canvas(exportEl, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#060810",
      logging: false,
      imageTimeout: 10000,
    });
    const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.82);
    // Convert dataUrl to Blob
    const res = await fetch(jpgDataUrl);
    jpgBlob = await res.blob();
  } catch (_) {
    // If render fails, fall back to text-only
  } finally {
    document.body.removeChild(exportEl);
  }

  const cleanPhone = (phone || "").replace(/\D/g, "");
  const posLabel = position ? `${position}  ` : "";
  const caption = ` My Tessera Lumen Oracle Reading\n\n${posLabel}${card.title}\n\n"${card.mantra}"\n\nTessera Lumen  Oracle of the Soul`;

  // Try native share with file (Android Chrome / iOS Safari 15.1+)
  if (jpgBlob && navigator.share && navigator.canShare) {
    const file = new File([jpgBlob], filename, { type: "image/jpeg" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Tessera Lumen Reading", text: caption });
        return { method: "native-share" };
      } catch (e) {
        if (e.name !== "AbortError") console.warn("Native share failed:", e.message);
      }
    }
  }

  // Fallback: open WhatsApp with text (image can't be sent via URL scheme)
  const waText = encodeURIComponent(caption + "\n\n(Save the JPG from the download button to attach it)");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${waText}`
    : `https://wa.me/?text=${waText}`;
  window.open(waUrl, "_blank");
  return { method: "whatsapp-text" };
}

// Legacy text-only WhatsApp (kept for backward compat)
export function shareViaWhatsApp(phone, cardTitle, intention) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const message = encodeURIComponent(
    `My Tessera Lumen Oracle Reading\n\nCard: ${cardTitle}\nIntention: ${intention || ""}\n\nTessera Lumen \u2022 Oracle of the Soul`
  );
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${message}`
    : `https://wa.me/?text=${message}`;
  window.open(url, "_blank");
}

// iOS/Android native share with JPG file
export async function nativeShareJPG(dataUrl, filename, cardTitle) {
  if (!navigator.share) return false;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "My Tessera Lumen Reading",
        text: `My oracle reading: ${cardTitle}`,
        files: [file],
      });
      return true;
    }
  } catch (_) {}
  return false;
}

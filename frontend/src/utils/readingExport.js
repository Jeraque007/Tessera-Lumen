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

function buildCompositionDOM(reading, cardImageBase64) {
  const container = document.createElement("div");
  container.style.cssText = `
    width: 900px;
    background: #060810;
    color: #f0e8d8;
    font-family: 'Cinzel', serif;
    padding: 60px 56px 56px;
    position: relative;
    box-sizing: border-box;
    border: 3px solid rgba(212,175,55,0.4);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;

  const dateStr = new Date(reading.timestamp).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  });

  container.innerHTML = `
    <!-- SEEKER HEADER -->
    <div style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(212,175,55,0.2); border-radius:16px; padding:28px 36px; margin-bottom:52px; box-sizing:border-box; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <p style="font-size:11px; letter-spacing:5px; color:rgba(212,175,55,0.6); margin:0 0 6px 0; text-transform:uppercase;">The Seeker</p>
        <p style="font-size:28px; font-weight:bold; color:#fff; margin:0; letter-spacing:1px;">${reading.seeker}</p>
      </div>
      <div style="text-align:center;">
        <p style="font-size:11px; letter-spacing:5px; color:rgba(212,175,55,0.6); margin:0 0 6px 0; text-transform:uppercase;">Your Intention</p>
        <p style="font-size:20px; color:#f0e8d8; margin:0; font-family:'Cormorant Garamond',serif; font-style:italic;">${reading.intention}</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:11px; letter-spacing:5px; color:rgba(212,175,55,0.6); margin:0 0 6px 0; text-transform:uppercase;">Date</p>
        <p style="font-size:18px; color:#f0e8d8; margin:0; font-family:'Cormorant Garamond',serif;">${dateStr}</p>
      </div>
    </div>

    <!-- CARD NUMBER -->
    <div style="text-align:center; margin-bottom:8px;">
      <span style="font-size:110px; color:#f0d060; font-weight:bold; line-height:0.9; display:block; text-shadow:0 0 40px rgba(212,175,55,0.5);">${reading.card.number}</span>
    </div>

    <!-- GOLD LINE -->
    <div style="height:2px; width:280px; background:linear-gradient(to right,transparent,#D4AF37,transparent); margin:20px auto 24px;"></div>

    <!-- CARD TITLE -->
    <h1 style="font-size:58px; color:#D4AF37; margin:0 0 12px 0; letter-spacing:10px; font-weight:700; text-transform:uppercase; text-align:center; text-shadow:0 0 20px rgba(212,175,55,0.3);">${reading.card.title}</h1>

    <!-- PILLAR -->
    <p style="font-size:18px; letter-spacing:8px; color:rgba(212,175,55,0.6); margin:0 0 52px 0; text-transform:uppercase; text-align:center;">${reading.card.pillar}</p>

        <!-- PURPOSE: full width above -->
    <div style="width:100%; margin-bottom:40px;">
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
        <div style="width:30px; height:1px; background:rgba(212,175,55,0.4);"></div>
        <h3 style="font-family:'Cinzel',serif; font-size:20px; color:#D4AF37; letter-spacing:6px; margin:0; text-transform:uppercase;">Purpose</h3>
        <div style="flex-grow:1; height:1px; background:rgba(212,175,55,0.3);"></div>
      </div>
      <p style="font-family:'Cormorant Garamond',serif; font-size:28px; line-height:1.7; font-style:italic; color:#e8dcc8; margin:0; text-align:justify;">${reading.card.purpose}</p>
    </div>

    <!-- IMAGE LEFT + MEANING RIGHT -->
    <div style="display:table; width:100%; margin-bottom:52px; border-spacing:0;">
      <div style="display:table-cell; width:380px; vertical-align:middle; padding-right:40px;">
        ${cardImageBase64
          ? `<img src="${cardImageBase64}" style="width:100%; border-radius:18px; border:3px solid rgba(212,175,55,0.35); box-shadow:0 20px 60px rgba(0,0,0,0.9); display:block;" />`
          : `<div style="width:100%; aspect-ratio:2/3; background:#1a1535; border-radius:18px; border:2px dashed rgba(212,175,55,0.3); display:flex; align-items:center; justify-content:center;"><p style="color:#D4AF37; font-size:20px;">${reading.card.number}</p></div>`
        }
      </div>
      <div style="display:table-cell; vertical-align:middle; font-family:'Cormorant Garamond',serif;">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
          <div style="width:30px; height:1px; background:rgba(212,175,55,0.4);"></div>
          <h3 style="font-family:'Cinzel',serif; font-size:20px; color:#D4AF37; letter-spacing:6px; margin:0; text-transform:uppercase;">Meaning</h3>
          <div style="flex-grow:1; height:1px; background:rgba(212,175,55,0.3);"></div>
        </div>
        <p style="font-size:24px; line-height:1.75; color:#dcd0bc; margin:0; text-align:justify;">${reading.card.meaning}</p>
      </div>
    </div>

    <!-- MANTRA PANEL -->
    <div style="width:100%; background:linear-gradient(135deg,rgba(45,20,80,0.6),rgba(10,12,26,0.8)); border:2px solid rgba(212,175,55,0.45); border-radius:28px; padding:52px 60px; margin-bottom:52px; text-align:center; box-sizing:border-box; box-shadow:inset 0 0 40px rgba(212,175,55,0.1);">
      <div style="display:flex; align-items:center; gap:20px; margin-bottom:28px;">
        <div style="flex:1; height:1px; background:linear-gradient(to right,transparent,rgba(212,175,55,0.4));"></div>
        <h4 style="font-size:16px; color:#D4AF37; letter-spacing:10px; margin:0; text-transform:uppercase;">The Sacred Mantra</h4>
        <div style="flex:1; height:1px; background:linear-gradient(to left,transparent,rgba(212,175,55,0.4));"></div>
      </div>
      <p style="font-family:'Cormorant Garamond',serif; font-size:44px; font-style:italic; color:#f0d060; margin:0; line-height:1.4; font-weight:500;">&ldquo;${reading.card.mantra}&rdquo;</p>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center; border-top:1px solid rgba(212,175,55,0.15); padding-top:36px; width:100%;">
      <p style="font-size:14px; letter-spacing:10px; text-transform:uppercase; margin:0; color:rgba(212,175,55,0.4);">Tessera Lumen &bull; Oracle of the Soul</p>
      <p style="font-size:10px; margin-top:12px; opacity:0.2; letter-spacing:3px;">&copy; 2026 Personal Sacred Record</p>
    </div>
  `;

  return container;
}

export async function renderReadingCard(reading) {
  console.log("[Export] Starting render...");
  const cardImageBase64 = await fetchImageAsBase64(reading.card.image);
  const dom = buildCompositionDOM(reading, cardImageBase64);
  dom.style.position = "absolute";
  dom.style.left = "-9999px";
  dom.style.top = "0";
  document.body.appendChild(dom);

  try {
    await new Promise(r => setTimeout(r, 1200));
    const canvas = await html2canvas(dom, {
      scale: 1,
      useCORS: true,
      backgroundColor: "#060810",
      width: 900,
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

export async function dispatchExport(reading) {
  const { blob, dataUrl, filename } = reading.export;
  if (!blob) return false;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Tessera Lumen Sacred Record",
          text: `My Oracle Reading: ${reading.card.title}`
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
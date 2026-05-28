import { useState } from "react";
import { exportCardAsJPG, shareCardViaWhatsApp, nativeShareJPG } from "../utils/jpgExport.js";
import { isIOS } from "../utils/download.js";

export default function ExportPanel({ user, intention, cards, positions, phone }) {
  const [status, setStatus] = useState("idle"); // idle | generating | done | error

  const tel = (phone || "").replace(/\D/g, "");
  const hasPhone = tel.length >= 7;

  const handleSaveJPG = async (card, position) => {
    setStatus("generating");
    try {
      await exportCardAsJPG(card, position || null, intention, user?.name || "");
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("JPG export error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleWhatsApp = async (card, position) => {
    setStatus("generating");
    try {
      await shareCardViaWhatsApp(card, position || null, intention, user?.name || "", tel);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("WhatsApp share error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const btnStyle = (active, color = "#D4AF37") => ({
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    border: `1px solid ${active ? "rgba(212,175,55,0.6)" : "rgba(212,175,55,0.3)"}`,
    background: active ? "rgba(212,175,55,0.14)" : "rgba(212,175,55,0.05)",
    color: active ? "#f0d060" : color,
    cursor: status === "generating" ? "default" : "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    outline: "none",
    WebkitAppearance: "none",
    transition: "all 0.2s ease",
    fontFamily: "Cinzel, serif",
    fontSize: "0.72rem",
    fontWeight: "700",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  });

  const isGenerating = status === "generating";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>

      {/* Section label */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
        <div style={{ flex:1, height:"1px", background:"linear-gradient(to right,transparent,rgba(212,175,55,0.25))" }} />
        <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.6rem", letterSpacing:"0.28em", color:"rgba(212,175,55,0.5)", textTransform:"uppercase" }}>
          Save Your Reading
        </span>
        <div style={{ flex:1, height:"1px", background:"linear-gradient(to left,transparent,rgba(212,175,55,0.25))" }} />
      </div>

      {cards.map((card, i) => {
        const position = positions && positions[i] ? positions[i] : null;
        const label = cards.length > 1
          ? `Save ${position || card.title} as JPG`
          : "Save Reading as JPG";
        return (
          <div key={card.number} style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {/* Download JPG */}
            <button
              onClick={() => handleSaveJPG(card, position)}
              disabled={isGenerating}
              style={btnStyle(false)}
            >
              <span style={{ fontSize:"1.1rem", flexShrink:0 }}>&#128247;</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontFamily:"Cinzel,serif", fontSize:"0.72rem", fontWeight:"700", letterSpacing:"0.15em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {isGenerating ? "Generating..." : label}
                </p>
                <p style={{ margin:"2px 0 0", fontFamily:"Cormorant Garamond,serif", fontSize:"0.8rem", color:"rgba(240,232,216,0.4)", fontStyle:"italic" }}>
                  {isIOS() ? "Opens in Safari  tap Share to save" : "Saves to your device"}
                </p>
              </div>
            </button>

            {/* WhatsApp  share actual JPG image */}
            {hasPhone && (
              <button
                onClick={() => handleWhatsApp(card, position)}
                disabled={isGenerating}
                style={btnStyle(false, "#25D366")}
              >
                <span style={{ fontSize:"1.1rem", flexShrink:0 }}>&#128242;</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontFamily:"Cinzel,serif", fontSize:"0.72rem", fontWeight:"700", letterSpacing:"0.15em" }}>
                    Share Image via WhatsApp
                  </p>
                  <p style={{ margin:"2px 0 0", fontFamily:"Cormorant Garamond,serif", fontSize:"0.8rem", color:"rgba(240,232,216,0.4)", fontStyle:"italic" }}>
                    Sends the reading card as an image
                  </p>
                </div>
              </button>
            )}
          </div>
        );
      })}

      {status === "done" && (
        <p style={{ textAlign:"center", fontFamily:"Cinzel,serif", fontSize:"0.65rem", letterSpacing:"0.2em", color:"rgba(212,175,55,0.7)", marginTop:"4px" }}>
           Done
        </p>
      )}
      {status === "error" && (
        <p style={{ textAlign:"center", fontFamily:"Cormorant Garamond,serif", fontSize:"0.9rem", color:"rgba(248,113,113,0.8)", fontStyle:"italic", marginTop:"4px" }}>
          Export failed  please try again
        </p>
      )}

      {isIOS() && (
        <p style={{ textAlign:"center", fontFamily:"Cormorant Garamond,serif", fontSize:"0.8rem", color:"rgba(240,232,216,0.35)", fontStyle:"italic", marginTop:"4px", lineHeight:1.5 }}>
          On iPhone: tap the image then hold to save, or tap Share
        </p>
      )}
    </div>
  );
}

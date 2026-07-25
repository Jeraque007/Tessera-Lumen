import { useState } from "react";
import { shareCardViaWhatsApp, sendEmailReading } from "../utils/jpgExport.js";

export default function ExportPanel({ user, intention, cards, positions, email, phone }) {
  const [status, setStatus] = useState("idle"); // idle | generating | done | error

  const tel = (phone || "").replace(/\D/g, "");
  const hasPhone = tel.length >= 7;

  const handleEmailAndSave = async (card, position) => {
    setStatus("generating");
    try {
      await sendEmailReading(card, position || null, intention, user?.name || "", email || user?.email || "");
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Export error:", err);
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

  const btnStyle = (color = "#D4AF37") => ({
    width: "100%",
    padding: "16px 20px",
    borderRadius: "14px",
    border: "1px solid rgba(212,175,55,0.3)",
    background: "rgba(212,175,55,0.06)",
    color: color,
    cursor: status === "generating" ? "default" : "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    minHeight: "60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "2px",
    outline: "none",
    WebkitAppearance: "none",
    transition: "all 0.2s ease",
    fontFamily: "Cinzel, serif",
    textAlign: "center"
  });

  const isGenerating = status === "generating";

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* Section label */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/25" />
        <span className="font-cinzel text-[10px] tracking-[0.28em] text-[#D4AF37]/50 uppercase">
          Share Your Reading
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/25" />
      </div>

      {cards.map((card, i) => {
        const position = positions && positions[i] ? positions[i] : null;
        const mainLabel = cards.length > 1
          ? `Email & Save ${position || card.title}`
          : "Email Reading & Save to Library";

        return (
          <div key={card.number} className="flex flex-col gap-3">
            {/* Download JPG + Email */}
            <button
              onClick={() => handleEmailAndSave(card, position)}
              disabled={isGenerating}
              style={btnStyle()}
              className="hover:bg-[#D4AF37]/10 active:scale-[0.98] transition-transform"
            >
              <p className="m-0 font-cinzel text-[11px] font-bold tracking-[0.15em] uppercase">
                {isGenerating ? "Processing..." : mainLabel}
              </p>
              <p className="m-0 font-cormorant text-[13px] text-[#f0e8d8]/40 italic">
                JPG automatically saves to your library
              </p>
            </button>

            {/* WhatsApp */}
            {hasPhone && (
              <button
                onClick={() => handleWhatsApp(card, position)}
                disabled={isGenerating}
                style={btnStyle()}
                className="hover:bg-[#D4AF37]/10 active:scale-[0.98] transition-transform"
              >
                <p className="m-0 font-cinzel text-[11px] font-bold tracking-[0.15em] uppercase">
                  Share to WhatsApp
                </p>
                <p className="m-0 font-cormorant text-[13px] text-[#f0e8d8]/40 italic">
                  Sends the reading as an image attachment
                </p>
              </button>
            )}
          </div>
        );
      })}

      {status === "done" && (
        <p className="text-center font-cinzel text-[10px] tracking-[0.2em] text-[#D4AF37]/70 mt-1 animate-fade-in">
           Success
        </p>
      )}
      {status === "error" && (
        <p className="text-center font-cormorant text-sm text-red-400/80 italic mt-1 animate-fade-in">
          Failed  please try again
        </p>
      )}
    </div>
  );
}

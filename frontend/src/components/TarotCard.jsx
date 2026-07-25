import { useState } from "react";
import AmbientAudio from "../utils/ambient-audio-manager.js";

export default function TarotCard({ card, position, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const handleTouch = async () => {
    setPulsing(true);
    await AmbientAudio.onCardTouch();
    setTimeout(() => setPulsing(false), 450);
  };

  return (
    <article
      onClick={handleTouch}
      className={["w-full animate-fade-in-up", pulsing ? "pulse-glow" : ""].join(" ")}
      style={{
        animationDelay: index * 0.4 + "s",
        background: "linear-gradient(160deg, #0d0a1e 0%, #060810 60%, #0a0618 100%)",
        border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(212,175,55,0.12), 0 16px 48px rgba(0,0,0,0.8)",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* POSITION LABEL */}
      {position && (
        <div style={{ textAlign: "center", padding: "16px 20px 0" }}>
          <span className="font-cinzel uppercase"
            style={{ fontSize: "0.6rem", letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)" }}>
            {position}
          </span>
        </div>
      )}

      {/* CARD NUMBER */}
      <div style={{ textAlign: "center", padding: position ? "10px 20px 0" : "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.5))" }} />
          <span className="font-cinzel font-bold"
            style={{ fontSize: "clamp(2.2rem, 10vw, 3.2rem)", color: "#f0d060",
              textShadow: "0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)", lineHeight: 1 }}>
            {card.number}
          </span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.5))" }} />
        </div>
      </div>

      {/* CARD TITLE */}
      <div style={{ textAlign: "center", padding: "10px 24px 4px" }}>
        <h2 className="font-cinzel font-bold"
          style={{
            fontSize: "clamp(1.5rem, 6vw, 2.2rem)",
            background: "linear-gradient(135deg, #f0d060, #D4AF37, #b8941e)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            filter: "drop-shadow(0 0 6px rgba(212,175,55,0.35))",
            lineHeight: 1.2, margin: 0,
          }}>
          {card.title}
        </h2>
      </div>

      {/* PILLAR */}
      <div style={{ textAlign: "center", padding: "6px 24px 20px" }}>
        <span className="font-cinzel uppercase"
          style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(212,175,55,0.45)" }}>
          {card.pillar.replace("PILLAR ", "Pillar ").replace(" - ", " \u2022 ")}
        </span>
      </div>

      <GoldDivider />

      {/* CARD IMAGE  full width */}
      <div style={{ padding: "20px 20px 0" }}>
        <div className="protected-image-wrapper"
          style={{
            borderRadius: "12px", overflow: "hidden",
            border: "1px solid rgba(212,175,55,0.3)",
            boxShadow: "0 0 30px rgba(212,175,55,0.2), 0 8px 32px rgba(0,0,0,0.7)",
            position: "relative",
          }}
          onContextMenu={e => e.preventDefault()}>
          {!imgError ? (
            <img src={card.image} alt={card.title}
              onError={() => setImgError(true)}
              className="protected-image" draggable="false"
              style={{ width: "100%", height: "auto", display: "block" }} />
          ) : (
            <div style={{
              aspectRatio: "2/3",
              background: "linear-gradient(160deg,#1a1535,#060810)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="font-cinzel" style={{ fontSize: "4rem", color: "#D4AF37" }}>{card.number}</span>
            </div>
          )}
          <div className="card-image-watermark">
            <span>Tessera Lumen &bull; Oracle of the Soul</span>
          </div>
        </div>
      </div>

      {/* PURPOSE */}
      <div style={{ padding: "28px 24px 0" }}>
        <SectionLabel>Purpose</SectionLabel>
        <p className="font-cormorant"
          style={{ fontSize: "clamp(1rem, 4vw, 1.1rem)", color: "rgba(240,232,216,0.9)",
            lineHeight: 1.9, margin: "12px 0 0", textAlign: "center" }}>
          {card.purpose}
        </p>
      </div>

      {/* MEANING */}
      <div style={{ padding: "24px 24px 0" }}>
        <SectionLabel>Meaning</SectionLabel>
        <p className="font-cormorant"
          style={{ fontSize: "clamp(1rem, 4vw, 1.1rem)", color: "rgba(240,232,216,0.85)",
            lineHeight: 1.9, margin: "12px 0 0", textAlign: "center" }}>
          {card.meaning}
        </p>
      </div>

      {/* MANTRA */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(45,20,80,0.7), rgba(26,10,58,0.9))",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "12px",
          padding: "22px 24px",
          textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.4))" }} />
            <span className="font-cinzel uppercase"
              style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#D4AF37" }}>
              Sacred Mantra
            </span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.4))" }} />
          </div>
          <p className="font-cormorant italic"
            style={{ fontSize: "clamp(1.15rem, 4.5vw, 1.4rem)", color: "#f0e8d8", lineHeight: 1.8, margin: 0 }}>
            &ldquo;{card.mantra}&rdquo;
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "20px 20px 24px" }}>
        <span className="font-cinzel uppercase"
          style={{ fontSize: "0.5rem", letterSpacing: "0.35em", color: "rgba(212,175,55,0.2)" }}>
          Tessera Lumen &bull; Oracle of the Soul
        </span>
      </div>
    </article>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.35))" }} />
      <span className="font-cinzel uppercase"
        style={{ fontSize: "0.62rem", letterSpacing: "0.3em", color: "#D4AF37" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.35))" }} />
    </div>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "0 24px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.35))" }} />
      <span style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.5rem" }}>&#9670;</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.35))" }} />
    </div>
  );
}
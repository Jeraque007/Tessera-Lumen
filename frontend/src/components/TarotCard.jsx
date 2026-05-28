import { useState } from "react";

// TarotCard  matches the oracle archive layout from design reference
// Mobile: stacked vertically. Tablet/Desktop: image left, text right.
export default function TarotCard({ card, position, index = 0 }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="w-full animate-fade-in-up"
      style={{
        animationDelay: index * 0.4 + "s",
        background: "linear-gradient(160deg, #0d0a1e 0%, #060810 60%, #0a0618 100%)",
        border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(212,175,55,0.12), 0 16px 48px rgba(0,0,0,0.8)",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/*  HEADER: position label (if multi-card)  */}
      {position && (
        <div style={{ textAlign: "center", padding: "14px 20px 0" }}>
          <span
            className="font-cinzel uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.35em", color: "rgba(212,175,55,0.6)" }}
          >
            {position}
          </span>
        </div>
      )}

      {/* ── CARD NUMBER ── */}
      <div style={{ textAlign: "center", padding: position ? "8px 20px 0" : "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.5))" }} />
          <span
            className="font-cinzel font-bold"
            style={{
              fontSize: "clamp(2rem, 8vw, 3rem)",
              color: "#f0d060",
              textShadow: "0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)",
              lineHeight: 1,
            }}
          >
            {card.number}
          </span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.5))" }} />
        </div>
      </div>

      {/*  CARD TITLE  */}
      <div style={{ textAlign: "center", padding: "8px 24px 4px" }}>
        <h2
          className="font-cinzel font-bold"
          style={{
            fontSize: "clamp(1.4rem, 5.5vw, 2rem)",
            background: "linear-gradient(135deg, #f0d060, #D4AF37, #b8941e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 6px rgba(212,175,55,0.35))",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {card.title}
        </h2>
      </div>

      {/*  PILLAR SUBTITLE  */}
      <div style={{ textAlign: "center", padding: "4px 24px 16px" }}>
        <span
          className="font-cinzel uppercase"
          style={{ fontSize: "clamp(0.55rem, 2vw, 0.65rem)", letterSpacing: "0.3em", color: "rgba(212,175,55,0.45)" }}
        >
          {card.pillar.replace("PILLAR ", "Pillar ").replace(" - ", " \u2022 ")}
        </span>
      </div>

      {/*  GOLD DIVIDER  */}
      <GoldDivider />

      {/*  MAIN BODY: image + purpose/meaning  */}
      {/* Responsive: flex-col on mobile, flex-row on sm+ */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "0",
          padding: "20px 20px 0",
        }}
      >
        {/* Artwork */}
        <div
          style={{
            flex: "0 0 auto",
            width: "100%",
            maxWidth: "100%",
          }}
          className="card-image-col"
        >
          <div
            className="protected-image-wrapper"
            style={{
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.25)",
              boxShadow: "0 0 24px rgba(212,175,55,0.15), 0 8px 32px rgba(0,0,0,0.6)",
              position: "relative",
            }}
            onContextMenu={e => e.preventDefault()}
          >
            {!imgError ? (
              <img
                src={card.image}
                alt={card.title}
                onError={() => setImgError(true)}
                className="protected-image"
                draggable="false"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: "2/3",
                  background: "linear-gradient(160deg,#1a1535,#060810)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="font-cinzel" style={{ fontSize: "3rem", color: "#D4AF37" }}>{card.number}</span>
              </div>
            )}
            {/* Diagonal watermark overlay */}
            <div className="card-image-watermark">
              <span>Tessera Lumen &bull; Oracle of the Soul</span>
            </div>
            <span className="card-watermark">Tessera Lumen</span>
          </div>
        </div>

        {/* Purpose + Meaning  right column on desktop, below on mobile */}
        <div
          style={{ flex: "1 1 200px", paddingLeft: "0", paddingTop: "20px" }}
          className="card-text-col"
        >
          <ContentSection label="Purpose" text={card.purpose} />
          <div style={{ marginTop: "20px" }}>
            <ContentSection label="Meaning" text={card.meaning} />
          </div>
        </div>
      </div>

      {/*  MANTRA PANEL  */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(45,20,80,0.6), rgba(26,10,58,0.8))",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: "12px",
            padding: "20px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.4))" }} />
            <span
              className="font-cinzel uppercase"
              style={{ fontSize: "clamp(0.6rem,2.2vw,0.7rem)", letterSpacing: "0.3em", color: "#D4AF37" }}
            >
              Mantra
            </span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.4))" }} />
          </div>
          <p
            className="font-cormorant italic"
            style={{
              fontSize: "clamp(1.1rem,4.5vw,1.35rem)",
              color: "#f0e8d8",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            &ldquo;{card.mantra}&rdquo;
          </p>
        </div>
      </div>

      {/*  FOOTER TAGLINE  */}
      <div style={{ textAlign: "center", padding: "16px 20px 20px" }}>
        <span
          className="font-cinzel uppercase"
          style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(212,175,55,0.25)" }}
        >
          Tessera Lumen &bull; Oracle of the Soul
        </span>
      </div>
    </article>
  );
}

function ContentSection({ label, text }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{ width: "16px", height: "1px", background: "rgba(212,175,55,0.4)" }} />
        <h3
          className="font-cinzel uppercase"
          style={{
            fontSize: "clamp(0.6rem,2.2vw,0.7rem)",
            letterSpacing: "0.28em",
            color: "#D4AF37",
            margin: 0,
          }}
        >
          {label}
        </h3>
        <div style={{ width: "16px", height: "1px", background: "rgba(212,175,55,0.4)" }} />
      </div>
      <p
        className="font-cormorant"
        style={{
          fontSize: "clamp(0.95rem,3.8vw,1.05rem)",
          color: "#f0e8d8",
          lineHeight: 1.85,
          margin: 0,
          textAlign: "center",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "0 24px 4px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.35))" }} />
      <span style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.5rem" }}>&#9670;</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.35))" }} />
    </div>
  );
}

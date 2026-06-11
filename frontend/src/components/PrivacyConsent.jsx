import { useState } from "react";

export default function PrivacyConsent({ onAccept, onReject, onViewPolicy }) {
  const [fading, setFading] = useState(false);

  const handleAccept = () => {
    setFading(true);
    setTimeout(() => onAccept(), 400);
  };

  const handleReject = () => {
    setFading(true);
    setTimeout(() => { if (onReject) onReject(); }, 400);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: "env(safe-area-inset-bottom, 24px)",
        background: "rgba(6,8,16,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <div
        style={{
          width: "calc(100% - 40px)",
          maxWidth: "400px",
          background: "rgba(10,12,26,0.95)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "20px",
          padding: "28px 24px 24px",
          marginBottom: "32px",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3))" }} />
          <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase" }}>
            Privacy Notice
          </span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,55,0.3))" }} />
        </div>

        <p style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "1rem",
          lineHeight: 1.7,
          color: "rgba(240,232,216,0.8)",
          margin: "0 0 8px",
        }}>
          By continuing, you acknowledge that you have read and agree to our{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            style={{ color: "#D4AF37", textDecoration: "underline", textUnderlineOffset: "3px", cursor: "pointer" }}
          >
            Privacy Policy
          </a>
        </p>

        <p style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "0.85rem",
          color: "rgba(240,232,216,0.4)",
          margin: "0 0 22px",
          fontStyle: "italic",
        }}>
          We respect your data and your journey.
        </p>

        {/* Agree button */}
        <button
          onClick={handleAccept}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: "14px",
            border: "1.5px solid rgba(212,175,55,0.6)",
            background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))",
            color: "#f0d060",
            fontFamily: "Cinzel, serif",
            fontSize: "0.75rem",
            fontWeight: "700",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            touchAction: "manipulation",
            transition: "all 0.3s",
            boxShadow: "0 4px 20px rgba(212,175,55,0.15)",
            marginBottom: "12px",
          }}
        >
          Agree
        </button>

        {/* Reject button */}
        <button
          onClick={handleReject}
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(240,232,216,0.5)",
            fontFamily: "Cinzel, serif",
            fontSize: "0.7rem",
            fontWeight: "400",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            touchAction: "manipulation",
            transition: "all 0.3s",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari, not already in standalone mode, not dismissed before
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/crios|fxios|chrome/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.navigator.standalone === true;
    const dismissed = localStorage.getItem("tl_install_dismissed");

    if (isIos && isSafari && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("tl_install_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "16px",
        right: "16px",
        zIndex: 9998,
        background: "rgba(10, 12, 26, 0.95)",
        border: "1px solid rgba(212, 175, 55, 0.4)",
        borderRadius: "16px",
        padding: "20px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
      }}
    >
      <button
        onClick={dismiss}
        style={{
          position: "absolute",
          top: "12px",
          right: "14px",
          background: "none",
          border: "none",
          color: "rgba(212, 175, 55, 0.6)",
          fontSize: "1.2rem",
          cursor: "pointer",
        }}
      >
        &times;
      </button>
      <p
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.8rem",
          letterSpacing: "0.15em",
          color: "#D4AF37",
          marginBottom: "10px",
          textTransform: "uppercase",
          fontWeight: "700",
        }}
      >
        &#10022; Add Tessera Lumen to Your Device
      </p>
      <p
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "1rem",
          color: "rgba(240, 232, 216, 0.8)",
          lineHeight: "1.6",
        }}
      >
        Tap the <span style={{ display: "inline-block", border: "1px solid rgba(212,175,55,0.5)", borderRadius: "4px", padding: "1px 6px", fontSize: "0.85rem", color: "#D4AF37" }}>&#9741;</span> share icon, then <strong style={{ color: "#f0d060" }}>&ldquo;Add to Home Screen&rdquo;</strong> for instant access.
      </p>
    </div>
  );
}
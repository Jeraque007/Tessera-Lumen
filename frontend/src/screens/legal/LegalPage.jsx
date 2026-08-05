import { useApp } from "../../context/AppContext.jsx";

const CONTACT_EMAIL = "holistic@963.co.za";

export default function LegalPage({ title, subtitle, children, onBack }) {
  const { goTo, previousScreen } = useApp();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #0a0c1a, #060810)", color: "#f0e8d8", fontFamily: "Cormorant Garamond, Georgia, serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(212,175,55,0.15)", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", position: "sticky", top: 0, background: "rgba(6,8,16,0.95)", backdropFilter: "blur(12px)", zIndex: 60 }}>
        <img src="/transparent.logo.png" alt="Tessera Lumen" style={{ width: "65px", height: "auto" }} />

        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(212,175,55,0.6)", cursor: "pointer", fontFamily: "Cinzel,serif", fontSize: "0.65rem", letterSpacing: "0.2em", padding: "4px 0", touchAction: "manipulation" }}>
           BACK
        </button>

        <div style={{ flex: 1, textAlign: "center", marginRight: "61px" }}>
          <p style={{ fontFamily: "Cinzel,serif", fontSize: "0.6rem", letterSpacing: "0.35em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", margin: 0 }}>Tessera Lumen</p>
          <h1 style={{ fontFamily: "Cinzel,serif", fontSize: "clamp(0.9rem,3vw,1.1rem)", color: "#D4AF37", margin: "2px 0 0", letterSpacing: "0.1em" }}>{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px 80px" }}>
        {subtitle && (
          <p style={{ fontFamily: "Cinzel,serif", fontSize: "0.7rem", letterSpacing: "0.25em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", textAlign: "center", marginBottom: "32px" }}>
            {subtitle}
          </p>
        )}
        {children}

        {/* Footer */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid rgba(212,175,55,0.12)", textAlign: "center" }}>
          <p style={{ fontFamily: "Cinzel,serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(212,175,55,0.3)", textTransform: "uppercase", marginBottom: "8px" }}>
            &copy; 2026 Tessera Lumen. All rights reserved.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{ fontFamily: "Cinzel,serif", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)", textDecoration: "none", textTransform: "uppercase" }}
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ fontFamily: "Cinzel,serif", fontSize: "clamp(0.8rem,2.5vw,0.95rem)", color: "#D4AF37", letterSpacing: "0.15em", textTransform: "uppercase", borderBottom: "1px solid rgba(212,175,55,0.18)", paddingBottom: "8px", marginBottom: "14px" }}>
        {title}
      </h2>
      <div style={{ fontSize: "clamp(0.95rem,3.5vw,1.05rem)", lineHeight: 1.85, color: "#e8dcc8" }}>
        {children}
      </div>
    </div>
  );
}

export function P({ children }) {
  return <p style={{ margin: "0 0 12px" }}>{children}</p>;
}

export function Li({ children }) {
  return (
    <li style={{ margin: "6px 0", paddingLeft: "4px" }}>
      <span style={{ color: "rgba(212,175,55,0.5)", marginRight: "8px" }}>&#9670;</span>
      {children}
    </li>
  );
}

export function Ul({ children }) {
  return <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 12px" }}>{children}</ul>;
}

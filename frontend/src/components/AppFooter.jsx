import { useApp } from "../context/AppContext.jsx";

const CONTACT_EMAIL = "holistic@963.co.za";

export default function AppFooter() {
  const { goTo } = useApp();

  const link = (label, screen) => (
    <button
      onClick={() => goTo(screen)}
      style={{
        background: "none",
        border: "none",
        color: "rgba(212,175,55,0.45)",
        fontFamily: "Cinzel,serif",
        fontSize: "0.6rem",
        letterSpacing: "0.15em",
        cursor: "pointer",
        padding: "4px 6px",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        textTransform: "uppercase",
        transition: "color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.color = "rgba(212,175,55,0.8)"}
      onMouseLeave={e => e.currentTarget.style.color = "rgba(212,175,55,0.45)"}
    >
      {label}
    </button>
  );

  const dot = (
    <span style={{ color: "rgba(212,175,55,0.2)", fontSize: "0.5rem", margin: "0 2px" }}></span>
  );

  return (
    <div style={{
      width: "100%",
      padding: "16px 20px",
      borderTop: "1px solid rgba(212,175,55,0.1)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      background: "rgba(6,8,16,0.6)",
    }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: "2px" }}>
        {link("Terms", "terms")}
        {dot}
        {link("Privacy", "privacy")}
        {dot}
        {link("Licensing", "licensing")}
        {dot}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          style={{
            color: "rgba(212,175,55,0.45)",
            fontFamily: "Cinzel,serif",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            textDecoration: "none",
            padding: "4px 6px",
            textTransform: "uppercase",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(212,175,55,0.8)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(212,175,55,0.45)"}
        >
          Contact
        </a>
      </div>
      <p style={{ fontFamily: "Cinzel,serif", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(212,175,55,0.2)", margin: 0, textAlign: "center" }}>
        &copy; 2026 Tessera Lumen. All rights reserved.
      </p>
    </div>
  );
}

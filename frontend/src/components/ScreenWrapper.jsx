import { useEffect, useRef } from "react";
import LangSwitcher from "./LangSwitcher.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function ScreenWrapper({ children, className = "", hideLogo = false }) {
  const ref = useRef(null);
  const { screen, goTo } = useApp();
  const isWelcome = screen === "welcome";

  useEffect(() => { if (ref.current) ref.current.scrollTo({ top: 0 }); }, []);

  return (
    <div
      ref={ref}
      className={`relative z-10 min-h-screen w-full mx-auto flex flex-col overflow-y-auto animate-fade-in-up ${className}`}
      style={{ maxWidth: "min(100%, 860px)" }}
    >
      {!hideLogo && (
        <button
          onClick={() => goTo("welcome")}
          aria-label="Return to home"
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 60,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            touchAction: "manipulation",
            transition: "transform 0.2s active:scale-95",
          }}
        >
          <img
            src="/assets/logo.png"
            alt="Tessera Lumen"
            title="Tap to return home"
            style={{ width: "75px", height: "auto", objectFit: "contain" }}
          />
        </button>
      )}
      {!isWelcome && (
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 50 }}>
          <LangSwitcher />
        </div>
      )}
      {isWelcome && (
        <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 50 }}>
          <LangSwitcher />
        </div>
      )}
      {children}
    </div>
  );
}
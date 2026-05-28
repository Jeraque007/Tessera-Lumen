import { useEffect, useRef } from "react";
import LangSwitcher from "./LangSwitcher.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function ScreenWrapper({ children, className = "", hideLogo = false }) {
  const ref = useRef(null);
  const { screen } = useApp();
  const isWelcome = screen === "welcome";

  useEffect(() => { if (ref.current) ref.current.scrollTo({ top: 0 }); }, []);

  return (
    <div
      ref={ref}
      className={`relative z-10 min-h-screen w-full mx-auto flex flex-col overflow-y-auto animate-fade-in-up ${className}`} style={{ maxWidth: "min(100%, 860px)" }}
    >
      {!isWelcome && !hideLogo && (
        <img
          src="/assets/logo.png"
          alt="Tessera Lumen"
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "90px",
            height: "auto",
            objectFit: "contain",
            zIndex: 50,
            pointerEvents: "none",
          }}
        />
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

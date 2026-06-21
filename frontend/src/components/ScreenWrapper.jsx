import { useEffect, useRef } from "react";
import LangSwitcher from "./LangSwitcher.jsx";
import AppFooter from "./AppFooter.jsx";
import { useApp } from "../context/AppContext.jsx";

const LEGAL_SCREENS = ["terms", "privacy", "licensing", "payment-success", "payment-cancelled", "success", "failed"];

export default function ScreenWrapper({ children, className = "", hideLogo = false }) {
  const ref = useRef(null);
  const { screen, goTo, paymentLoading, previousScreen } = useApp();
  const isWelcome = screen === "welcome";
  const isLegal = LEGAL_SCREENS.includes(screen);

  useEffect(() => { if (ref.current) ref.current.scrollTo({ top: 0 }); }, []);

  return (
    <div
      ref={ref}
      className={`relative z-10 min-h-screen w-full mx-auto flex flex-col overflow-y-auto page-transition ${className}`}
      style={{ maxWidth: "min(100%, 860px)" }}
    >
      {!hideLogo && !isWelcome && (
        <button
          onClick={() => goTo(isLegal ? previousScreen : "welcome")}
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
            title={isLegal ? "Go back" : "Tap to return home"}
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
      {!LEGAL_SCREENS.includes(screen) && !paymentLoading && <AppFooter />}
    </div>
  );
}
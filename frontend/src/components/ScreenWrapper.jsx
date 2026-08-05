import { useEffect, useRef } from "react";

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


      {children}
      {!LEGAL_SCREENS.includes(screen) && !paymentLoading && <AppFooter />}
    </div>
  );
}
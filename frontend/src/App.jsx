import { AppProvider, useApp } from "./context/AppContext.jsx";
import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { App as CapApp } from "@capacitor/app";
import AppFooter from "./components/AppFooter.jsx";
import PrivacyConsent from "./components/PrivacyConsent.jsx";
import { routes } from "./routes/index.jsx";

const LEGAL_SCREENS = ["terms", "privacy", "licensing", "payment-success", "payment-cancelled", "success", "failed"];

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-3 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-3"></div>
      <p className="font-cinzel text-[#D4AF37]/60 text-xs tracking-widest uppercase">Loading...</p>
    </div>
  );
}

function Router() {
  const { screen, goTo, setIsPaid, setDeeperPaid, user, refreshPaymentStatus, paymentLoading, paymentPending, setPaymentPending } = useApp();

  // Diagnostic mode: set to true to see on-device HMS error alerts
  useEffect(() => { window.__HMS_DEBUG = true; }, []);

  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("paid") || params.get("deeper_paid") || params.get("cancelled") || params.get("deeper_cancelled")) {
        localStorage.setItem("tl_privacy_accepted", "true");
        return true;
      }
      return localStorage.getItem("tl_privacy_accepted") === "true";
    } catch (e) { return true; } // Default to accepted if LS fails
  });

  // Refs to avoid stale closures in Capacitor listeners
  const userRef = useRef(user);
  const paymentPendingRef = useRef(paymentPending);
  const screenRef = useRef(screen);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { paymentPendingRef.current = paymentPending; }, [paymentPending]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  const handlePrivacyAccept = () => {
    localStorage.setItem("tl_privacy_accepted", "true");
    setPrivacyAccepted(true);
  };

  const processDeepLink = useCallback(async (urlStr) => {
    try {
      const normalized = urlStr.replace("tessera://app", "https://tessera.app");
      const url = new URL(normalized);
      const isPaidParam = url.searchParams.get("paid") === "1";
      const cancelledParam = url.searchParams.get("cancelled") === "1";
      if (isPaidParam || cancelledParam) {
        let emailToVerify = userRef.current?.email || JSON.parse(localStorage.getItem("tl_user") || "{}").email;
        if (isPaidParam && emailToVerify) {
          const status = await refreshPaymentStatus(emailToVerify);
          if (status?.isPaid || status?.deeperPaid) setPaymentPending(null);
        }
        if (cancelledParam) setPaymentPending(null);
        if (url.pathname.includes("deeper") || paymentPendingRef.current?.type === "deeper") {
          goTo("deeper");
        } else {
          goTo("reveal");
        }
      }
    } catch (e) {
      console.error("[DeepLink] Error:", e);
    }
  }, [goTo, refreshPaymentStatus, setPaymentPending]);

  // 1. URL path routing (direct page access)
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/privacy") goTo("privacy");
    else if (path === "/payment-success") goTo("payment-success");
    else if (path === "/payment-cancelled") goTo("payment-cancelled");
  }, [goTo]);

  // 2. Payment return - clean URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasPaidParam = params.get("paid") === "1" || params.get("deeper_paid") === "1";
    const hasCancelParam = params.get("cancelled") === "1" || params.get("deeper_cancelled") === "1";

    if (hasPaidParam || hasCancelParam) {
      console.log("[Payment:Return] Cleaning URL:", window.location.search);

      // We removed the aggressive "tessera://app" bounce here because
      // the backend now handles the redirect through the Cloudflare Gateway
      // using superior Intent URLs when 'native' is detected.

      window.history.replaceState({}, "", window.location.pathname);

      // Only set states if they aren't already set to prevent re-render loops
      if (params.get("paid") === "1") {
        setIsPaid(true);
        localStorage.setItem("tl_is_paid", "true");
      }
      if (params.get("deeper_paid") === "1") {
        setDeeperPaid(true);
        localStorage.setItem("tl_deeper_paid", "true");
      }
    }
  }, [setIsPaid, setDeeperPaid]);

  // 3. Capacitor native listeners (deep links + back button)
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return;

    const listeners = [];

    CapApp.addListener("backButton", () => {
      if (screenRef.current === "welcome") {
        CapApp.exitApp();
      } else {
        goTo("welcome");
      }
    }).then(l => listeners.push(l)).catch(() => {});

    CapApp.getLaunchUrl().then(ret => {
      if (ret?.url) processDeepLink(ret.url);
    }).catch(() => {});

    CapApp.addListener("appUrlOpen", (data) => {
      processDeepLink(data.url);
    }).then(l => listeners.push(l)).catch(() => {});

    return () => {
      listeners.forEach(l => { if (l?.remove) l.remove(); });
    };
  }, [goTo, processDeepLink]);

  const renderScreen = () => {
    const Component = routes[screen] || routes["welcome"];
    const { previousScreen } = useApp();

    // Special handling for screens that need props
    if (screen === "terms") return <Component onBack={() => goTo(previousScreen)} />;
    if (screen === "privacy") return <Component onBack={() => goTo(previousScreen)} />;
    if (screen === "licensing") return <Component onBack={() => goTo(previousScreen)} />;

    return <Component />;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Cinematic Layered Background */}
      <div className="app-bg" />
      <div className="nebula-layer-1" />
      <div className="nebula-layer-2" />
      <div className="stars-layer" />
      <div className="cosmic-depth" />
      <div className="vignette-overlay" />

      {/* High-fidelity Cinematic Diamond Sparkle Stars (8-Point) */}
      <div className="starfield">
        {/* Top left cluster */}
        <div className="diamond-star top-[12%] left-[15%]" style={{ animationDelay: "0s" }}>
           <div className="diamond-star-secondary" />
        </div>
        <div className="diamond-star top-[18%] left-[10%]" style={{ animationDelay: "1.2s", transform: "scale(0.6)" }}>
           <div className="diamond-star-secondary" />
        </div>

        {/* Central Prominent Diamond */}
        <div className="diamond-star top-[45%] left-[50%]" style={{ animationDelay: "2.5s", transform: "scale(1.2)" }}>
           <div className="diamond-star-secondary" />
        </div>

        {/* Right side cluster */}
        <div className="diamond-star top-[25%] left-[82%]" style={{ animationDelay: "0.8s" }}>
           <div className="diamond-star-secondary" />
        </div>
        <div className="diamond-star top-[10%] left-[75%]" style={{ animationDelay: "3.1s", transform: "scale(0.8)" }}>
           <div className="diamond-star-secondary" />
        </div>

        {/* Bottom clusters */}
        <div className="diamond-star top-[65%] left-[25%]" style={{ animationDelay: "4.5s" }}>
           <div className="diamond-star-secondary" />
        </div>
        <div className="diamond-star top-[82%] left-[70%]" style={{ animationDelay: "1.9s" }}>
           <div className="diamond-star-secondary" />
        </div>
        <div className="diamond-star top-[90%] left-[15%]" style={{ animationDelay: "5.3s", transform: "scale(0.7)" }}>
           <div className="diamond-star-secondary" />
        </div>
        <div className="diamond-star top-[55%] left-[88%]" style={{ animationDelay: "3.7s" }}>
           <div className="diamond-star-secondary" />
        </div>
        <div className="diamond-star top-[75%] left-[45%]" style={{ animationDelay: "6.1s", transform: "scale(0.5)" }}>
           <div className="diamond-star-secondary" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        {paymentLoading ? (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
            <p className="font-cinzel text-[#D4AF37] text-xs tracking-widest uppercase animate-pulse">Verifying Payment...</p>
          </div>
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            {renderScreen()}
          </Suspense>
        )}
      </div>
      {!privacyAccepted && screen !== "privacy" && (
        <PrivacyConsent
          onAccept={handlePrivacyAccept}
          onReject={() => { window.history.back(); }}
          onViewPolicy={() => goTo("privacy")}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
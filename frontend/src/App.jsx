import { AppProvider, useApp } from "./context/AppContext.jsx";
import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { App as CapApp } from "@capacitor/app";
import AppFooter from "./components/AppFooter.jsx";
import PrivacyConsent from "./components/PrivacyConsent.jsx";

// Lazy-loaded screens - only loaded when navigated to
const WelcomeScreen = lazy(() => import("./screens/WelcomeScreen.jsx"));
const DetailsScreen = lazy(() => import("./screens/DetailsScreen.jsx"));
const IntentionScreen = lazy(() => import("./screens/IntentionScreen.jsx"));
const PackagesScreen = lazy(() => import("./screens/PackagesScreen.jsx"));
const PaymentScreen = lazy(() => import("./screens/PaymentScreen.jsx"));
const RevealScreen = lazy(() => import("./screens/RevealScreen.jsx"));
const DeeperScreen = lazy(() => import("./screens/DeeperScreen.jsx"));
const TermsScreen = lazy(() => import("./screens/legal/TermsScreen.jsx"));
const PrivacyScreen = lazy(() => import("./screens/legal/PrivacyScreen.jsx"));
const LicensingScreen = lazy(() => import("./screens/legal/LicensingScreen.jsx"));
const PaymentSuccessScreen = lazy(() => import("./screens/PaymentSuccessScreen.jsx"));
const PaymentCancelledScreen = lazy(() => import("./screens/PaymentCancelledScreen.jsx"));

const LEGAL_SCREENS = ["terms", "privacy", "licensing", "payment-success", "payment-cancelled"];

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
  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") || params.get("deeper_paid") || params.get("cancelled") || params.get("deeper_cancelled")) {
      localStorage.setItem("tl_privacy_accepted", "true");
      return true;
    }
    return localStorage.getItem("tl_privacy_accepted") === "true";
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
    switch (screen) {
      case "welcome": return <WelcomeScreen />;
      case "details": return <DetailsScreen />;
      case "intention": return <IntentionScreen />;
      case "packages": return <PackagesScreen />;
      case "payment": return <PaymentScreen />;
      case "reveal": return <RevealScreen />;
      case "deeper": return <DeeperScreen />;
      case "terms": return <TermsScreen onBack={() => goTo("welcome")} />;
      case "privacy": return <PrivacyScreen onBack={() => goTo("welcome")} />;
      case "licensing": return <LicensingScreen onBack={() => goTo("welcome")} />;
      case "payment-success": return <PaymentSuccessScreen />;
      case "payment-cancelled": return <PaymentCancelledScreen />;
      default: return <WelcomeScreen />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="app-bg" />
      <div className="nebula-overlay" />
      <div className="starfield" />
      <div className="particles" />
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
        {!LEGAL_SCREENS.includes(screen) && !paymentLoading && <AppFooter />}
      </div>
      {!privacyAccepted && screen !== "privacy" && <PrivacyConsent onAccept={handlePrivacyAccept} onReject={() => { window.history.back(); }} />}
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
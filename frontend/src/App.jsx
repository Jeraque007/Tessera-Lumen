import { AppProvider, useApp } from "./context/AppContext.jsx";
import { useEffect, useRef, useState, useCallback } from "react";
import { App as CapApp } from "@capacitor/app";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import DetailsScreen from "./screens/DetailsScreen.jsx";
import IntentionScreen from "./screens/IntentionScreen.jsx";
import PackagesScreen from "./screens/PackagesScreen.jsx";
import PaymentScreen from "./screens/PaymentScreen.jsx";
import RevealScreen from "./screens/RevealScreen.jsx";
import DeeperScreen from "./screens/DeeperScreen.jsx";
import TermsScreen from "./screens/legal/TermsScreen.jsx";
import PrivacyScreen from "./screens/legal/PrivacyScreen.jsx";
import LicensingScreen from "./screens/legal/LicensingScreen.jsx";
import AppFooter from "./components/AppFooter.jsx";

const LEGAL_SCREENS = ["terms", "privacy", "licensing"];

function Router() {
  const { screen, goTo, setIsPaid, setDeeperPaid, user, refreshPaymentStatus, paymentLoading, paymentPending, setPaymentPending } = useApp();
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);

  const processDeepLink = useCallback(async (urlStr) => {
    try {
      console.log("--- [EVIDENCE] 4 & 5. STATE AFTER RETURN ---");
      console.log("Deep Link URL:", urlStr);
      console.log("Current Context User:", JSON.stringify(user));

      const normalized = urlStr.replace("tessera://app", "https://tessera.app");
      const url = new URL(normalized);
      const isPaidParam = url.searchParams.get('paid') === '1';
      const cancelledParam = url.searchParams.get('cancelled') === '1';

      if (isPaidParam || cancelledParam) {
        let emailToVerify = user?.email;
        if (!emailToVerify) {
           const savedUser = JSON.parse(localStorage.getItem("tl_user") || "{}");
           emailToVerify = savedUser.email;
        }

        if (isPaidParam && emailToVerify) {
          console.log("Verifying payment status with server for:", emailToVerify);
          const status = await refreshPaymentStatus(emailToVerify);

          if (status?.isPaid || status?.deeperPaid) {
            setPaymentPending(null); // Success! Clear pending state
          }
        }

        if (cancelledParam) {
           setPaymentPending(null); // Cancelled, clear state
        }

        // Navigation based on URL or pending state
        if (url.pathname.includes('deeper') || paymentPending?.type === 'deeper') {
          console.log("Navigating to DEEPER");
          goTo('deeper');
        } else {
          console.log("Navigating to REVEAL");
          goTo('reveal');
        }
      } else {
        console.log("Reason: Deep link detected but no paid/cancelled param");
      }
      console.log("------------------------------------------");
    } catch (e) {
      console.error("[EVIDENCE] Deep link error:", e);
    }
  }, [goTo, user, refreshPaymentStatus, paymentPending, setPaymentPending]);

  // Restore session from paymentPending on cold start
  useEffect(() => {
    if (screen === "welcome" && paymentPending) {
       console.log("Detected pending payment on cold start. Restoring screen.");
       if (paymentPending.type === "deeper") {
          goTo("deeper");
       } else {
          goTo("reveal");
       }
    }
  }, []);

  useEffect(() => {
    // 1. Audio Logic
    if (!window.Capacitor) {
      const unlockAudio = () => {
        if (audioRef.current && !audioReady) {
          audioRef.current.volume = 0.5;
          audioRef.current.play()
            .then(() => setAudioReady(true))
            .catch(e => console.warn("Web audio blocked:", e));
        }
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
      return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
    }

    // 2. Web-to-App Bridge
    if (!window.Capacitor) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('paid') === '1' || params.get('cancelled') === '1') {
        console.log("[EVIDENCE] Web redirect detected. Parameters:", window.location.search);
        window.location.href = `tessera://app${window.location.pathname}${window.location.search}`;
      }
    }

    // 3. Capacitor Native Listeners
    if (window.Capacitor) {
      CapApp.getLaunchUrl().then(ret => {
        if (ret?.url) {
          console.log("[EVIDENCE] App launched via URL:", ret.url);
          processDeepLink(ret.url);
        }
      });

      const sub = CapApp.addListener('appUrlOpen', (data) => {
        console.log("[EVIDENCE] App resumed via URL:", data.url);
        processDeepLink(data.url);
      });
      return () => sub.remove();
    }
  }, [processDeepLink, audioReady]);

  const screens = {
    welcome:   <WelcomeScreen />,
    details:   <DetailsScreen />,
    intention: <IntentionScreen />,
    packages:  <PackagesScreen />,
    payment:   <PaymentScreen />,
    reveal:    <RevealScreen />,
    deeper:    <DeeperScreen />,
    terms:     <TermsScreen onBack={() => goTo("welcome")} />,
    privacy:   <PrivacyScreen onBack={() => goTo("welcome")} />,
    licensing: <LicensingScreen onBack={() => goTo("welcome")} />,
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {!window.Capacitor && (
        <audio ref={audioRef} src="/ambient.mp3" loop preload="auto" style={{ display: 'none' }} />
      )}
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
          screens[screen] || <WelcomeScreen />
        )}
        {!LEGAL_SCREENS.includes(screen) && !paymentLoading && <AppFooter />}
      </div>
      {!window.Capacitor && !audioReady && (
        <div className="fixed bottom-4 left-4 z-50 text-[10px] text-[#D4AF37]/40 uppercase tracking-widest font-cinzel animate-pulse pointer-events-none">Tap anywhere for sound</div>
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

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { UserProvider, useUser } from "./modules/UserContext.jsx";
import { BillingProvider, useBilling } from "./modules/BillingContext.jsx";
import { ReadingProvider, useReading } from "./modules/ReadingContext.jsx";
import { verifyWithBackend } from "../services/PaymentEngine.js";

const AppContext = createContext(null);

const APP_VERSION = "1.0.25"; // Incremented for the startup fix

/**
 * HMS COMPLIANCE: Safe Boot Initialization
 * Ensures localStorage issues don't crash the startup module.
 */
function safeBootInit() {
  try {
    window.__HMS_DEBUG = false;
    const stored = localStorage.getItem("tl_app_version");
    if (stored !== APP_VERSION) {
      const privacy = localStorage.getItem("tl_privacy_accepted");
      // Clear specific keys instead of everything to avoid disrupting critical storage
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("tl_") && k !== "tl_privacy_accepted") {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem("tl_app_version", APP_VERSION);
      if (privacy) localStorage.setItem("tl_privacy_accepted", privacy);
    }
  } catch (e) {
    console.warn("[Boot] Storage init failed:", e.message);
  }
}

/**
 * MODULAR ARCHITECTURE: AppContext is now a thin wrapper that orchestrates
 * sub-providers and handles global lifecycle/navigation.
 */
export function AppProvider({ children }) {
  // Run safe boot once on component mount
  useEffect(() => {
    safeBootInit();
  }, []);

  return (
    <UserProvider>
      <BillingProvider>
        <ReadingProvider>
          <AppCore>{children}</AppCore>
        </ReadingProvider>
      </BillingProvider>
    </UserProvider>
  );
}

function AppCore({ children }) {
  const { user, logout, setUploadedImage } = useUser();
  const { setIsPaid, setDeeperPaid, setFreeReadingUsed, setPaymentPending } = useBilling();
  const { clearReading, setDrawnCards, setImmutableReadings, setDrawHistory, setIntention, setSelectedPackage } = useReading();

  const [screen, setScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") return "reveal";
    if (params.get("deeper_paid") === "1") return "deeper";
    return "welcome";
  });

  const goTo = useCallback((s) => {
    if (window.Capacitor?.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setScreen(s);
  }, []);

  const [previousScreen, setPreviousScreen] = useState("welcome");
  useEffect(() => {
    setScreen(current => {
      if (current !== screen && screen !== "welcome") {
        setPreviousScreen(current);
      }
      return screen;
    });
  }, [screen]);

  const resetSession = useCallback(() => {
    logout();
    clearReading();
    setIsPaid(false);
    setDeeperPaid(false);
    setFreeReadingUsed(false);
    setPaymentPending(null);
    setDrawHistory({ daily: { date: "", count: 0 }, monthly: { month: "", count: 0 } });
    window.history.replaceState({}, "", window.location.pathname);
    setScreen("welcome");
  }, [logout, clearReading, setIsPaid, setDeeperPaid, setFreeReadingUsed, setPaymentPending, setDrawHistory]);

  // Session Restoration
  useEffect(() => {
    const restore = async () => {
      try {
        const { loadReadingState } = await import("../utils/persistence.js");
        const saved = await loadReadingState();
        if (saved && (saved.screen === "reveal" || saved.screen === "deeper")) {
          console.log("[Persistence] Restoring orphaned session:", saved.screen);
          // Map properties back to individual contexts
          setIntention(saved.intention);
          setSelectedPackage(saved.selectedPackage);
          setIsPaid(saved.isPaid);
          setDeeperPaid(saved.deeperPaid);
          setDrawnCards(saved.drawnCards);
          setImmutableReadings(saved.immutableReadings || []);
          setUploadedImage(saved.uploadedImage);
          setScreen(saved.screen);
        }
      } catch (e) {
        console.warn("[Persistence] Restoration skipped:", e.message);
      }
    };
    restore();
  }, [setIntention, setSelectedPackage, setIsPaid, setDeeperPaid, setDrawnCards, setImmutableReadings, setUploadedImage]);

  // Background Verification Queue (Shared Logic)
  useEffect(() => {
    const processQueue = async () => {
      try {
        const pending = JSON.parse(localStorage.getItem("tl_pending_verifications") || "[]");
        if (pending.length === 0) return;

        const remaining = [];
        for (const item of pending) {
          try {
            const { verified } = await verifyWithBackend(item, user);
            if (!verified) remaining.push(item);
          } catch (e) { remaining.push(item); }
        }
        localStorage.setItem("tl_pending_verifications", JSON.stringify(remaining));
      } catch (e) {}
    };
    const timer = setInterval(processQueue, 60000);
    return () => clearInterval(timer);
  }, [user]);

  // Facade object to maintain backward compatibility with components using useApp()
  const api = {
    screen, goTo, resetSession, previousScreen,
    setScreen, setPreviousScreen, // Allow direct screen manipulation if needed
    // Note: Components should ideally use useUser(), useBilling(), useReading() directly.
    // This facade is for transition purposes.
    ...useUser(),
    ...useBilling(),
    ...useReading(),
  };

  return (
    <AppContext.Provider value={api}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

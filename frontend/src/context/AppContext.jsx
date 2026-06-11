import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { checkHmsReady, consumeOrphanedPurchases } from "../utils/huaweiIap.js";
import { apiUrl } from "../utils/apiBase.js";

const AppContext = createContext(null);

const APP_VERSION = "1.0.7";

// Version-based cache clear - runs once before any state initializes
function checkVersionAndClear() {
  const stored = localStorage.getItem("tl_app_version");
  if (stored !== APP_VERSION) {
    console.log(`[Version] Upgrading ${stored || "none"} -> ${APP_VERSION}. Clearing stale state.`);
    const preserve = localStorage.getItem("tl_privacy_accepted");
    const keys = Object.keys(localStorage).filter(k => k.startsWith("tl_"));
    keys.forEach(k => localStorage.removeItem(k));
    if (preserve) localStorage.setItem("tl_privacy_accepted", preserve);
    localStorage.setItem("tl_app_version", APP_VERSION);
  }
}
checkVersionAndClear();

export function AppProvider({ children }) {
  const [screen, setScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") return "reveal";
    if (params.get("deeper_paid") === "1") return "deeper";
    if (params.get("cancelled") === "1") return "payment";
    if (params.get("deeper_cancelled") === "1") return "deeper";
    const path = window.location.pathname;
    if (path === "/privacy") return "privacy";
    if (path === "/payment-success") return "payment-success";
    if (path === "/payment-cancelled") return "payment-cancelled";
    // Note: payment_pending is tracked for deep-link return handling only.
    // We never force the user to the payment screen based on it.
    return "welcome";
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("tl_user");
    return saved ? JSON.parse(saved) : { name: "", email: "", dob: "" };
  });

  const [intention, setIntention] = useState(() => localStorage.getItem("tl_intention") || "");

  const [selectedPackage, setSelectedPackage] = useState(() => {
    const saved = localStorage.getItem("tl_selected_pkg");
    return saved ? JSON.parse(saved) : null;
  });

  const [isPaid, setIsPaid] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") return true;
    return localStorage.getItem("tl_is_paid") === "true";
  });

  const [drawnCards, setDrawnCards] = useState(() => {
    const saved = localStorage.getItem("tl_drawn_cards");
    return saved ? JSON.parse(saved) : [];
  });

  const [immutableReadings, setImmutableReadings] = useState(() => {
    const saved = localStorage.getItem("tl_immutable_readings");
    return saved ? JSON.parse(saved) : [];
  });

  const [deeperPaid, setDeeperPaid] = useState(() => localStorage.getItem("tl_deeper_paid") === "true");

  const [uploadedImage, setUploadedImage] = useState(() => localStorage.getItem("tl_uploaded_image") || null);

  const [paymentPending, setPaymentPending] = useState(() => {
    const saved = localStorage.getItem("tl_payment_pending");
    return saved ? JSON.parse(saved) : null;
  });

  const [paymentLoading, setPaymentLoading] = useState(false);

  // Check HMS IAP availability on native Android + consume any stuck purchases
  useEffect(() => {
    checkHmsReady()
      .then((ready) => { if (ready) consumeOrphanedPurchases(); })
      .catch(() => {});
  }, []);

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem("tl_user", JSON.stringify(user));
    localStorage.setItem("tl_intention", intention);
    localStorage.setItem("tl_selected_pkg", JSON.stringify(selectedPackage));
    localStorage.setItem("tl_is_paid", String(isPaid));
    localStorage.setItem("tl_deeper_paid", String(deeperPaid));
    localStorage.setItem("tl_drawn_cards", JSON.stringify(drawnCards));
    localStorage.setItem("tl_immutable_readings", JSON.stringify(immutableReadings.map(r => ({...r, export: { ...r.export, blob: null, dataUrl: null }}))));

    if (uploadedImage) localStorage.setItem("tl_uploaded_image", uploadedImage);
    else localStorage.removeItem("tl_uploaded_image");

    if (paymentPending) {
      localStorage.setItem("tl_payment_pending", JSON.stringify(paymentPending));
    } else {
      localStorage.removeItem("tl_payment_pending");
    }
  }, [user, intention, selectedPackage, isPaid, drawnCards, deeperPaid, immutableReadings, uploadedImage, paymentPending]);

  const goTo = useCallback((s) => {
    console.log("[Nav] Navigating to:", s);
    setScreen(s);
  }, []);

  const resetSession = useCallback(() => {
    console.log("[Session] Resetting all reading state");
    setUser({ name: "", email: "", dob: "" });
    setIntention("");
    setSelectedPackage(null);
    setIsPaid(false);
    setDrawnCards([]);
    setImmutableReadings([]);
    setDeeperPaid(false);
    setUploadedImage(null);
    setPaymentPending(null);
    ["tl_user","tl_intention","tl_selected_pkg","tl_is_paid","tl_deeper_paid","tl_drawn_cards","tl_immutable_readings","tl_uploaded_image","tl_payment_pending"].forEach(k => localStorage.removeItem(k));
  }, []);

  // Verify payment status against backend (used after deep link return)
  const refreshPaymentStatus = useCallback(async (email) => {
    if (!email) return null;
    setPaymentLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/subscription/status?email=${encodeURIComponent(email)}`));
      if (!res.ok) { setPaymentLoading(false); return null; }
      const data = await res.json();
      if (data.isPaid) setIsPaid(true);
      if (data.deeperPaid) setDeeperPaid(true);
      setPaymentLoading(false);
      return data;
    } catch (e) {
      console.error("[Payment] Status check failed:", e);
      setPaymentLoading(false);
      return null;
    }
  }, []);

  return (
    <AppContext.Provider value={{
      screen, goTo, resetSession,
      user, setUser,
      intention, setIntention,
      selectedPackage, setSelectedPackage,
      isPaid, setIsPaid,
      drawnCards, setDrawnCards,
      immutableReadings, setImmutableReadings,
      deeperPaid, setDeeperPaid,
      uploadedImage, setUploadedImage,
      paymentLoading, setPaymentLoading,
      paymentPending, setPaymentPending,
      refreshPaymentStatus
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
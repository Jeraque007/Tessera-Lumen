import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Screen state is NOT persisted to ensure we always start at Welcome (unless deep linked)
  const [screen, setScreen] = useState("welcome");

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("tl_user");
    return saved ? JSON.parse(saved) : { name: "", email: "", dob: "" };
  });

  const [intention, setIntention] = useState(() => localStorage.getItem("tl_intention") || "");

  const [selectedPackage, setSelectedPackage] = useState(() => {
    const saved = localStorage.getItem("tl_selected_pkg");
    return saved ? JSON.parse(saved) : null;
  });

  const [isPaid, setIsPaid] = useState(() => localStorage.getItem("tl_is_paid") === "true");

  const [drawnCards, setDrawnCards] = useState(() => {
    const saved = localStorage.getItem("tl_drawn_cards");
    return saved ? JSON.parse(saved) : [];
  });

  const [deeperPaid, setDeeperPaid] = useState(() => localStorage.getItem("tl_deeper_paid") === "true");

  const [uploadedImage, setUploadedImage] = useState(() => localStorage.getItem("tl_uploaded_image") || null);

  const [paymentPending, setPaymentPending] = useState(() => {
    const saved = localStorage.getItem("tl_payment_pending");
    return saved ? JSON.parse(saved) : null;
  });

  const [paymentLoading, setPaymentLoading] = useState(false);

  const refreshPaymentStatus = async (targetEmail) => {
    const emailToUse = targetEmail || user?.email;
    if (!emailToUse) return;

    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/payfast/status?email=${encodeURIComponent(emailToUse)}`);
      if (res.ok) {
        const data = await res.json();
        console.log("--- [EVIDENCE] Payment Status Refreshed ---");
        console.log("API Response:", JSON.stringify(data));
        setIsPaid(data.isPaid);
        setDeeperPaid(data.deeperPaid);

        // Auto-clear pending state if we are now paid
        if (data.isPaid || data.deeperPaid) {
          setPaymentPending(null);
        }

        return data;
      }
    } catch (err) {
      console.error("Failed to refresh payment status:", err);
    } finally {
      setPaymentLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (user?.email) {
      refreshPaymentStatus(user.email);
    }
  }, []); // Only on mount

  // Persistence Sync (excluding screen)
  useEffect(() => {
    localStorage.setItem("tl_user", JSON.stringify(user));
    localStorage.setItem("tl_intention", intention);
    localStorage.setItem("tl_selected_pkg", JSON.stringify(selectedPackage));
    localStorage.setItem("tl_is_paid", String(isPaid));
    localStorage.setItem("tl_deeper_paid", String(deeperPaid));
    localStorage.setItem("tl_drawn_cards", JSON.stringify(drawnCards));
    if (uploadedImage) localStorage.setItem("tl_uploaded_image", uploadedImage);
    if (paymentPending) {
      localStorage.setItem("tl_payment_pending", JSON.stringify(paymentPending));
    } else {
      localStorage.removeItem("tl_payment_pending");
    }
  }, [user, intention, selectedPackage, isPaid, drawnCards, deeperPaid, uploadedImage, paymentPending]);

  const goTo = (s) => {
    if (s === "welcome") {
      // Clear all state on return to home
      setUser({ name: "", email: "", dob: "" });
      setIntention("");
      setSelectedPackage(null);
      setIsPaid(false);
      setDrawnCards([]);
      setDeeperPaid(false);
      setUploadedImage(null);
      setPaymentPending(null);
      localStorage.clear();
    }
    setScreen(s);
  };

  return (
    <AppContext.Provider value={{
      screen, goTo,
      user, setUser,
      intention, setIntention,
      selectedPackage, setSelectedPackage,
      isPaid, setIsPaid,
      drawnCards, setDrawnCards,
      deeperPaid, setDeeperPaid,
      uploadedImage, setUploadedImage,
      paymentLoading, refreshPaymentStatus,
      paymentPending, setPaymentPending
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { buyProduct, consumePurchase } from "../utils/huaweiIap.js";
import { initiatePayFastPayment } from "../utils/payfast.js";

export default function PaymentScreen() {
  const { goTo, selectedPackage, setIsPaid, user, setPaymentPending } = useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!selectedPackage) return;

    // [EVIDENCE] 4. Router/Auth Before Redirect
    console.log("--- [EVIDENCE] 4 & 5. STATE BEFORE REDIRECT ---");
    console.log("Current Route:", "payment");
    console.log("User Context:", JSON.stringify(user));
    console.log("Selected Package:", JSON.stringify(selectedPackage));
    console.log("Local Storage Keys:", Object.keys(localStorage));
    console.log("Redirecting to: PayFast Sandbox");
    console.log("----------------------------------------------");

    setLoading(true);
    setError("");

    try {
      // Set pending state before leaving the app
      setPaymentPending({
        type: "standard",
        pkgId: selectedPackage.id,
        timestamp: Date.now()
      });

      await initiatePayFastPayment(selectedPackage, user);
      return;
    } catch (payFastErr) {
      console.error("[EVIDENCE] PayFast Trigger Error:", payFastErr);
      setPaymentPending(null); // Clear on immediate error
    }

    // Huawei Fallback
    try {
      let productId = "";
      let type = 0;
      if (selectedPackage.id === 1) productId = "Quick.Insight";
      else if (selectedPackage.id === 2) productId = "Past.Present.Future";
      else if (selectedPackage.id === 3) productId = "Deep.Dive";
      else if (selectedPackage.id === 4) { productId = "10.Readings_Month"; type = 2; }
      else if (selectedPackage.id === 5) { productId = "20.Readings_Month"; type = 2; }
      else if (selectedPackage.id === 6) { productId = "30.Readings_Month"; type = 2; }

      const purchase = await buyProduct(productId, type);
      const verifyRes = await fetch("/api/huawei/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseData: purchase.purchaseData, signature: purchase.signature, email: user.email, name: user.name })
      });

      if (!verifyRes.ok) throw new Error("Verification failed");
      if (type === 0) {
        const data = JSON.parse(purchase.purchaseData);
        await consumePurchase(data.purchaseToken);
      }
      setIsPaid(true);
      goTo("reveal");
    } catch (err) {
      setError(err.message || t("paymentError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = () => {
    console.log("[EVIDENCE] Simulating payment success");
    setIsPaid(true);
    goTo("reveal");
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 pb-10">
        <div className="animate-fade-in-up mb-6 text-center" style={{ paddingTop: "64px" }}>
          <p className="font-cinzel text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: "#D4AF37" }}>{t("paymentTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold" style={{ background: "linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t("paymentTitle")}</h2>
        </div>
        <Divider />
        <div className="flex flex-col gap-4 animate-fade-in-up delay-200">
          {selectedPackage && (
            <div className="glass-gold rounded-2xl p-5">
              <p className="font-cinzel text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#D4AF37" }}>{t("paymentSelected")}</p>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel text-sm text-white">{selectedPackage.name}</p>
                  <p className="font-cormorant text-sm italic mt-0.5" style={{ color: "rgba(240,232,216,0.55)" }}>{selectedPackage.desc}</p>
                </div>
                <span className="font-cinzel text-lg shrink-0" style={{ color: "#D4AF37" }}>{selectedPackage.price}</span>
              </div>
            </div>
          )}
          <div className="glass-gold rounded-2xl p-5 text-center">
            <p className="font-cinzel text-xs mb-2" style={{ color: "#D4AF37", letterSpacing: "0.15em" }}>{t("paymentAwait")}</p>
            <p className="font-cormorant text-base italic leading-relaxed" style={{ color: "rgba(240,232,216,0.6)" }}>{t("paymentAwaitsBody")}</p>
          </div>
          {error && <p className="text-red-400 text-center font-cormorant text-sm px-4">{error}</p>}
          <div className="mt-4 px-10">
            <button onClick={handleSimulateSuccess} className="w-full py-3 rounded-xl border border-dashed border-[#D4AF37]/40 text-[#D4AF37]/60 font-cinzel text-[10px] tracking-widest uppercase hover:bg-white/5 transition-all">Skip to Reveal (Sandbox Test)</button>
          </div>
        </div>
        <div className="mt-auto pt-8 pb-8 animate-fade-in-up delay-400">
          <GoldButton onClick={handlePay} disabled={loading || !selectedPackage}>{loading ? t("paymentProcessing") : t("paymentBtn")}</GoldButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}

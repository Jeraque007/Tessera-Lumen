import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { processPayment } from "../services/PaymentEngine.js";

export default function PaymentScreen() {
  const { goTo, selectedPackage, setIsPaid, user, setPaymentPending, setDrawnCards, setImmutableReadings } = useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    setError("");
    // Clear any previous readings (e.g. from free trial) before starting new payment
    setDrawnCards([]);
    setImmutableReadings([]);

    await processPayment(selectedPackage, user, {
      onSuccess: () => {
        setIsPaid(true);
        setLoading(false);
        goTo("reveal");
      },
      onError: (msg) => {
        setError(msg);
        setLoading(false);
        setPaymentPending(null);
      },
      onPending: (data) => setPaymentPending(data),
    });
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
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel text-sm text-white">{selectedPackage.name}</p>
                  <p className="font-cormorant text-sm italic mt-0.5" style={{ color: "rgba(240,232,216,0.55)" }}>{selectedPackage.desc}</p>
                </div>
                <div className="animate-glow-pulse" style={{border:"1.5px solid rgba(212,175,55,0.6)",borderRadius:"10px",padding:"10px 16px",background:"linear-gradient(135deg,rgba(10,12,26,0.9),rgba(26,21,53,0.8))",flexShrink:0,textAlign:"center",minWidth:"80px"}}><span className="font-cinzel font-bold" style={{fontSize:"1rem",color:"#f0d060",letterSpacing:"0.03em",textShadow:"0 0 8px rgba(212,175,55,0.5)"}}>{selectedPackage.price}</span></div>
              </div>
            </div>
          )}
          <div className="glass-gold rounded-2xl p-5 text-center">
            <p className="font-cinzel text-xs mb-2" style={{ color: "#D4AF37", letterSpacing: "0.15em" }}>{t("paymentAwait")}</p>
            <p className="font-cormorant text-base italic leading-relaxed" style={{ color: "rgba(240,232,216,0.6)" }}>{t("paymentAwaitsBody")}</p>
          </div>
          {error && <p className="text-red-400 text-center font-cormorant text-sm px-4">{error}</p>}
        </div>
        <div className="mt-auto pt-8 pb-8 flex flex-col gap-3 animate-fade-in-up delay-400">
          <GoldButton onClick={handlePay} disabled={loading || !selectedPackage}>{loading ? t("paymentProcessing") : t("paymentBtn")}</GoldButton>
          <button
            onClick={() => goTo("packages")}
            className="w-full py-4 rounded-xl border border-white/10 text-white/70 font-cinzel text-xs tracking-widest hover:border-white/20 transition-all"
          >
            {t("changePackage") || "Change Selection"}
          </button>
        </div>
      </div>
    </ScreenWrapper>
  );
}
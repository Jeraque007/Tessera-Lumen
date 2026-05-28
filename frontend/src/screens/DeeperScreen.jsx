import { useState, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import CosmicButton from "../components/CosmicButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { buyProduct, consumePurchase } from "../utils/huaweiIap.js";
import { initiateDeeperPayment } from "../utils/payfast.js";

export default function DeeperScreen() {
  const { goTo, user, deeperPaid, setDeeperPaid, uploadedImage, setUploadedImage, paymentLoading, setPaymentPending } = useApp();
  const { t } = useTranslation();

  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [payDone, setPayDone] = useState(deeperPaid);
  const [confirmed, setConfirmed] = useState(false);

  // Note: We don't necessarily redirect to welcome here because
  // users can view this screen to DECIDE to pay.
  // But we should ensure payDone is synced with deeperPaid from context.

  useEffect(() => {
    setPayDone(deeperPaid);
  }, [deeperPaid]);

  const handleOpenLink = () =>
    window.open("https://www.greenstonelobo.com/free-horoscope", "_blank");

  const handlePay44 = async () => {
    if (!user?.email) {
      setPayError("Please complete your details first.");
      return;
    }
    setPayProcessing(true);
    setPayError("");

    // Try PayFast first
    try {
      setPaymentPending({
        type: "deeper",
        timestamp: Date.now()
      });

      await initiateDeeperPayment(user);
      return;
    } catch (payFastErr) {
      console.error("[PayFast Deeper] error:", payFastErr);
      setPaymentPending(null);
    }

    try {
      const purchase = await buyProduct("Astrological.Chart.Reading", 0);

      const verifyRes = await fetch("/api/huawei/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseData: purchase.purchaseData,
          signature: purchase.signature,
          email: user.email,
          name: user.name
        })
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.error || "Verification failed");
      }

      const data = JSON.parse(purchase.purchaseData);
      await consumePurchase(data.purchaseToken);

      setDeeperPaid(true);
      setPayDone(true);
    } catch (err) {
      console.error("[Deeper] payment error:", err);
      setPayError(err.message || t("deeperPayError"));
    } finally {
      setPayProcessing(false);
    }
  };

  const handleSimulateSuccess = () => {
    setDeeperPaid(true);
    setPayDone(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">

        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3"
            style={{ textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>
            {t("deeperTag")}
          </p>
          <h2 className="font-cinzel text-2xl font-bold"
            style={{ background: "linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {t("deeperTitle")}
          </h2>
        </div>

        <Divider />

        <div className="flex flex-col gap-5 animate-fade-in-up delay-200">

          <div className="glass-gold rounded-2xl p-5 text-center">
            <p className="font-cormorant text-lg leading-relaxed text-white italic">
              {t("deeperBody")}
            </p>
          </div>

          <CosmicButton onClick={handleOpenLink}>{t("deeperBtn")}</CosmicButton>

          <div className="glass-gold rounded-2xl p-4 text-center">
            <p className="font-cormorant text-base text-white/60 italic leading-relaxed">
              {t("deeperReturn")}{" "}
              <span className="text-[#D4AF37] font-semibold">{t("deeperPrice")}</span>
            </p>
          </div>

          {!payDone && (
            <div className="flex flex-col gap-3">
              <label className="w-full py-4 rounded-xl border border-dashed border-[#D4AF37]/30 text-[#D4AF37] font-cormorant text-base text-center cursor-pointer hover:border-[#D4AF37]/55 hover:bg-white/4 transition-all">
                {uploadedImage ? t("deeperUploaded") : t("deeperUpload")}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {uploadedImage && (
                <img src={uploadedImage} alt="Uploaded" className="w-full rounded-xl border border-[#D4AF37]/20 max-h-48 object-cover" />
              )}

              {payError && (
                <p className="font-cormorant text-sm text-center" style={{ color: "rgba(248,113,113,0.85)" }}>
                  {payError}
                </p>
              )}

              <GoldButton onClick={handlePay44} disabled={payProcessing}>
                {payProcessing ? t("deeperPayProcessing") : t("deeperPayBtn")}
              </GoldButton>

              {/* SANDBOX TEST BYPASS */}
              <button
                onClick={handleSimulateSuccess}
                className="w-full py-3 rounded-xl border border-dashed border-[#D4AF37]/40 text-[#D4AF37]/60 font-cinzel text-[10px] tracking-widest uppercase hover:bg-white/5 transition-all mt-1"
              >
                Skip to Upload (Sandbox Test)
              </button>

              <p className="font-cormorant text-xs text-center italic" style={{ color: "rgba(212,175,55,0.4)" }}>
                Secure payment via PayFast  ZAR equivalent of $44
              </p>
            </div>
          )}

          {payDone && !confirmed && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="glass-gold rounded-2xl p-4 text-center border border-[#D4AF37]/25">
                <p className="font-cinzel text-[#D4AF37] text-sm tracking-widest mb-1">
                  {t("deeperPaidTitle")}
                </p>
                <p className="font-cormorant text-white/55 text-sm italic">
                  {t("deeperPaidSub")}
                </p>
              </div>

              <label className="w-full py-4 rounded-xl border border-dashed border-[#D4AF37]/30 text-[#D4AF37] font-cormorant text-base text-center cursor-pointer hover:border-[#D4AF37]/55 transition-all">
                {uploadedImage ? t("deeperUploaded") : t("deeperUpload")}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {uploadedImage && (
                <img src={uploadedImage} alt="Uploaded" className="w-full rounded-xl border border-[#D4AF37]/20 max-h-48 object-cover" />
              )}

              <GoldButton onClick={() => setConfirmed(true)} disabled={!uploadedImage}>
                {t("deeperConfirmBtn")}
              </GoldButton>
            </div>
          )}

          {payDone && confirmed && (
            <div className="glass-gold rounded-2xl p-6 text-center animate-fade-in">
              <p className="text-3xl mb-3" style={{ color: "#D4AF37" }}></p>
              <p className="font-cinzel text-[#D4AF37] text-base tracking-widest mb-2">
                {t("deeperThankTitle")}
              </p>
              <p className="font-cormorant text-white/90 text-base italic leading-relaxed">
                {t("deeperThankBody")}
              </p>
            </div>
          )}

        </div>

        <div className="mt-auto pt-8 pb-8 flex flex-col gap-3 animate-fade-in-up delay-400">
          <Divider />
          <button
            onClick={() => goTo("welcome")}
            className="w-full py-4 rounded-xl border border-white/10 text-white/70 font-cinzel text-xs tracking-widest hover:border-white/20 hover:text-white/60 transition-all"
          >
            {t("returnHome")}
          </button>
        </div>

      </div>
    </ScreenWrapper>
  );
}

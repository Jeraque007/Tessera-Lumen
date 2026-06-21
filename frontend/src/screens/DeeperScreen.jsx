import { useState, useEffect } from "react";
import { Browser } from "@capacitor/browser";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import CosmicButton from "../components/CosmicButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { processDeeperPayment } from "../services/PaymentEngine.js";
import { getProductInfo, isHmsDevice } from "../utils/huaweiIap.js";

export default function DeeperScreen() {
  const { goTo, user, deeperPaid, setDeeperPaid, uploadedImage, setUploadedImage, resetSession } = useApp();
  const { t } = useTranslation();
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showGlowPrompt, setShowGlowPrompt] = useState(false);
  const [hmsPrice, setHmsPrice] = useState("");
  const [currencyData, setCurrencyData] = useState({ symbol: '$', rate: 1, code: 'USD' });

  // Derived directly from context - no local duplication
  const payDone = deeperPaid;

  useEffect(() => {
    // 1. Fetch HMS Price
    if (isHmsDevice()) {
      getProductInfo(["Astrological.Chart.Reading"], 0).then(res => {
        if (res?.[0]?.price) setHmsPrice(res[0].price);
      }).catch(() => {});
    }

    // 2. Fetch Localized Currency
    const fetchCurrency = async () => {
      try {
        const { apiUrl } = await import("../utils/apiBase.js");
        const res = await fetch(apiUrl("/api/rate"));
        if (res.ok) {
          const data = await res.json();
          setCurrencyData({
            symbol: data.symbol || '$',
            rate: data.rate || 1,
            code: data.code || 'USD'
          });
        }
      } catch (e) { console.warn(e); }
    };
    fetchCurrency();
  }, []);

  const getDisplayPrice = () => {
    if (hmsPrice) return hmsPrice;
    const converted = (44 * currencyData.rate).toFixed(currencyData.code === 'BHD' ? 3 : 2);
    const display = converted.endsWith(".00") ? Math.round(converted) : converted;
    return `${currencyData.symbol}${display}`;
  };

  const displayPrice = getDisplayPrice();

  // Handle returning from external browser
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const isPending = localStorage.getItem("tl_pending_deeper") === "true";
        if (isPending && !uploadedImage) {
          setShowGlowPrompt(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [uploadedImage]);

  const handleOpenLink = async () => {
    const url = "https://www.greenstonelobo.com/free-horoscope";
    localStorage.setItem("tl_pending_deeper", "true");
    if (window.Capacitor?.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  const handlePay44 = async () => {
    if (!uploadedImage) { setPayError("Please upload your image before proceeding to payment."); return; }
    if (!user?.email) { setPayError("Please complete your details first."); return; }
    setPayProcessing(true);
    setPayError("");

    await processDeeperPayment(user, {
      onSuccess: () => {
        setDeeperPaid(true);
        setPayProcessing(false);
      },
      onError: (msg) => {
        setPayError(msg || t("deeperPayError"));
        setPayProcessing(false);
      },
      onPending: () => {},
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target.result);
      setShowGlowPrompt(false); // Hide prompt once uploaded
      localStorage.removeItem("tl_pending_deeper");
    };
    reader.readAsDataURL(file);
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">

        {showGlowPrompt && !uploadedImage && (
          <div className="fixed bottom-32 left-6 right-6 z-50 animate-glow-pulse bg-[#D4AF37] p-4 rounded-xl text-center shadow-[0_0_30px_rgba(212,175,55,0.8)] border border-white/20">
            <p className="font-cinzel text-[#060810] text-[10px] font-bold tracking-[0.2em] uppercase">
              Details Received: Upload Image to Proceed
            </p>
          </div>
        )}

        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3" style={{ textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>{t("deeperTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold" style={{ background: "linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t("deeperTitle")}</h2>
        </div>
        <Divider />
        <div className="flex flex-col gap-5 animate-fade-in-up delay-200">
          <div className="glass-gold rounded-2xl p-5 text-center">
            <p className="font-cormorant text-lg leading-relaxed text-white italic">{t("deeperBody")}</p>
          </div>
          <CosmicButton onClick={handleOpenLink}>{t("deeperBtn")}</CosmicButton>
          <div className="glass-gold rounded-2xl p-4 text-center">
            <p className="font-cormorant text-base text-white/60 italic leading-relaxed">{t("deeperReturn")} <span className="text-[#D4AF37] font-semibold">{displayPrice}</span></p>
          </div>

          {!payDone && (
            <div className="flex flex-col gap-3">
              <label className="w-full py-4 rounded-xl border border-dashed border-[#D4AF37]/30 text-[#D4AF37] font-cormorant text-base text-center cursor-pointer hover:border-[#D4AF37]/55 transition-all">
                {uploadedImage ? t("deeperUploaded") : t("deeperUpload")}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {uploadedImage && <img src={uploadedImage} alt="Uploaded" className="w-full rounded-xl border border-[#D4AF37]/20 max-h-48 object-cover" />}
              {payError && <p className="font-cormorant text-sm text-center" style={{ color: "rgba(248,113,113,0.85)" }}>{payError}</p>}
              <GoldButton onClick={handlePay44} disabled={payProcessing || !uploadedImage}>{payProcessing ? t("deeperPayProcessing") : `Pay ${displayPrice} - Get Advanced Reading`}</GoldButton>
            </div>
          ) }

          {payDone && !confirmed && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="glass-gold rounded-2xl p-4 text-center border border-[#D4AF37]/25">
                <p className="font-cinzel text-[#D4AF37] text-sm tracking-widest mb-1">{t("deeperPaidTitle")}</p>
                <p className="font-cormorant text-white/55 text-sm italic">{t("deeperPaidSub")}</p>
              </div>
              <label className="w-full py-4 rounded-xl border border-dashed border-[#D4AF37]/30 text-[#D4AF37] font-cormorant text-base text-center cursor-pointer hover:border-[#D4AF37]/55 transition-all">
                {uploadedImage ? t("deeperUploaded") : t("deeperUpload")}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {uploadedImage && <img src={uploadedImage} alt="Uploaded" className="w-full rounded-xl border border-[#D4AF37]/20 max-h-48 object-cover" />}
              <GoldButton onClick={() => setConfirmed(true)} disabled={!uploadedImage}>{t("deeperConfirmBtn")}</GoldButton>
            </div>
          )}

          {payDone && confirmed && (
            <div className="glass-gold rounded-2xl p-6 text-center animate-fade-in">
              <p className="font-cinzel text-[#D4AF37] text-base tracking-widest mb-2">{t("deeperThankTitle")}</p>
              <p className="font-cormorant text-white/90 text-base italic leading-relaxed">{t("deeperThankBody")}</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 pb-8 flex flex-col gap-3 animate-fade-in-up delay-400">
          <Divider />
          <button onClick={() => goTo("welcome")} className="w-full py-4 rounded-xl border border-white/10 text-white/70 font-cinzel text-xs tracking-widest hover:border-white/20 transition-all">{t("returnHome")}</button>
          <button onClick={resetSession} className="w-full py-2 text-white/30 font-cinzel text-[8px] tracking-[0.3em] uppercase hover:text-white/50 transition-all">Reset Session</button>
        </div>
      </div>
    </ScreenWrapper>
  );
}
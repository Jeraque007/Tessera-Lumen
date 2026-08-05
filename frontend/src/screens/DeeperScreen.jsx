import { useState, useEffect } from "react";
import SEO from "../components/SEO.jsx";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import CosmicButton from "../components/CosmicButton.jsx";

import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { processDeeperPayment } from "../services/PaymentEngine.js";
// UI uses Strategy Pattern via services/payments

export default function DeeperScreen() {
  const { goTo, user, deeperPaid, setDeeperPaid, uploadedImage, setUploadedImage, resetSession, currencyData, refreshPaymentStatus } = useApp();
  const { t } = useTranslation();

  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [hmsPrice, setHmsPrice] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { PaymentFactory } = await import("../services/payments/PaymentFactory.js");
        const provider = await PaymentFactory.getProvider();
        if (typeof provider.getPrices === 'function') {
           const prices = await provider.getPrices();
           if (prices["Astrological.Chart.Reading"]) {
             setHmsPrice(prices["Astrological.Chart.Reading"]);
           }
        }
      } catch (e) {}
    };
    fetchPrice();
  }, []);

  // Reset isRevealed if deeperPaid becomes false (e.g. via Reset Session)
  useEffect(() => {
    if (!deeperPaid) {
      setIsRevealed(false);
    }
  }, [deeperPaid]);

  const getDisplayPrice = () => {
    if (hmsPrice) return hmsPrice;
    const basePrice = 44;
    const converted = (basePrice * currencyData.rate).toFixed(currencyData.code === 'BHD' ? 3 : 2);
    const display = converted.endsWith(".00") ? Math.round(converted) : converted;
    return `${currencyData.symbol}${display}`;
  };

  const displayPrice = getDisplayPrice();

  const handleOpenLink = async () => {
    // Use Unified Platform Service for audio and browser
    const { PlatformService } = await import("../services/platform/PlatformService.js");
    await PlatformService.startAmbientMusic();

    setIsRevealed(true);
    const url = "https://www.greenstonelobo.com/free-horoscope";
    await PlatformService.openUrl(url);
  };

  const handlePay = async () => {
    // Use Unified Platform Service for audio
    const { PlatformService } = await import("../services/platform/PlatformService.js");
    await PlatformService.startAmbientMusic();

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
    };
    reader.readAsDataURL(file);
  };

  return (
    <ScreenWrapper>
      <SEO title="Deeper Reading" description="Go deeper with an extended tarot interpretation from Tessera Lumen. Unlock profound insights and personalized spiritual guidance." path="/deeper" />
      <div className="flex flex-col min-h-screen px-6 py-10">

        {/* HEADER */}
        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3" style={{ textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>{t("deeperTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold text-gold-gradient">{t("deeperTitle")}</h2>
        </div>

        

        <div className="flex flex-col gap-6 animate-fade-in-up delay-200">

          {/* INTRODUCTION - ALWAYS VISIBLE */}
          <div className="glass-gold rounded-2xl p-6 text-center border border-[#D4AF37]/10">
            <p className="font-cormorant text-lg leading-relaxed text-white italic">
               Advanced astrology insights are available for deeper clarity and soul alignment. You will be redirected to an external page. Complete as much of the details as possible and save the image for upload. Once done, payment is required to allow the transmission to be completed. Allow 24 hours for completion from payment.
            </p>
          </div>

          {/* GET ADVANCED READING BUTTON - ALWAYS VISIBLE */}
          <CosmicButton onClick={handleOpenLink}>{t("deeperBtn")}</CosmicButton>

          {/* REVEAL LOGIC: Show Preparation only after clicking button, or show Success if already paid */}
          {!deeperPaid ? (
            isRevealed && (
              /* PHASE: PREPARATION (IMAGE 2) */
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* DETAILS RECEIVED */}
                <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-center">
                  <p className="font-cinzel text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase">
                    Details Received: Upload Image to Proceed
                  </p>
                </div>

                {/* UPLOAD IMAGE */}
                <div className="flex flex-col gap-3">
                  <label className="w-full py-4 rounded-xl border border-dashed border-[#D4AF37]/30 text-[#D4AF37] font-cormorant text-base text-center cursor-pointer hover:border-[#D4AF37]/55 transition-all bg-white/5">
                    {uploadedImage ? t("deeperUploaded") : t("deeperUpload")}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {uploadedImage && <img src={uploadedImage} alt="Preview" className="w-full rounded-xl border border-[#D4AF37]/20 max-h-48 object-cover shadow-lg" />}
                </div>

                {/* PRICE NOTICE */}
                <div className="px-4 text-center">
                   <p className="font-cormorant text-base text-white/60 italic leading-relaxed">
                     When you are ready, return to the Divine Disrupter to continue your journey of illumination at a cost of <span className="text-[#D4AF37] font-semibold">{displayPrice}</span>
                   </p>
                </div>

                {/* PROCEED WITH PAYMENT */}
                <div className="flex flex-col gap-3">
                  {payError && <p className="font-cormorant text-sm text-center text-red-400 font-bold px-2">{payError}</p>}
                  <GoldButton onClick={handlePay} disabled={payProcessing || !uploadedImage}>
                     {payProcessing ? t("deeperPayProcessing") : `Proceed with Payment - ${displayPrice}`}
                  </GoldButton>
                </div>
              </div>
            )
          ) : (
            /* PHASE: SUCCESS (IMAGE 1) */
            <div className="glass-gold rounded-2xl p-8 text-center animate-fade-in border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <h3 className="font-cinzel text-[#D4AF37] text-xl tracking-widest mb-4">{t("deeperThankTitle")}</h3>
              <p className="font-cormorant text-white/90 text-lg italic leading-relaxed">{t("deeperThankBody")}</p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="mt-auto pt-10 pb-8 flex flex-col gap-4">
          
          <button
            onClick={() => goTo("welcome")}
            className="w-full py-4 rounded-xl border border-white/10 text-white/70 font-cinzel text-xs tracking-widest hover:border-white/20 transition-all"
          >
            {t("returnHome")}
          </button>
          <button
            onClick={resetSession}
            className="w-full py-2 text-white/20 font-cinzel text-[8px] tracking-[0.3em] uppercase hover:text-white/50 transition-all"
          >
            Reset Session
          </button>
        </div>
      </div>
    </ScreenWrapper>
  );
}


import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import CosmicButton from "../components/CosmicButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { processDeeperPayment } from "../services/PaymentEngine.js";

export default function DeeperScreen() {
  const { goTo, user, deeperPaid, setDeeperPaid, uploadedImage, setUploadedImage } = useApp();
  const { t } = useTranslation();
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Derived directly from context - no local duplication
  const payDone = deeperPaid;

  const handleOpenLink = () =>
    window.open("https://www.greenstonelobo.com/free-horoscope", "_blank");

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
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">
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
            <p className="font-cormorant text-base text-white/60 italic leading-relaxed">{t("deeperReturn")} <span className="text-[#D4AF37] font-semibold">{t("deeperPrice")}</span></p>
          </div>

          {!payDone && (
            <div className="flex flex-col gap-3">
              <label className="w-full py-4 rounded-xl border border-dashed border-[#D4AF37]/30 text-[#D4AF37] font-cormorant text-base text-center cursor-pointer hover:border-[#D4AF37]/55 transition-all">
                {uploadedImage ? t("deeperUploaded") : t("deeperUpload")}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {uploadedImage && <img src={uploadedImage} alt="Uploaded" className="w-full rounded-xl border border-[#D4AF37]/20 max-h-48 object-cover" />}
              {payError && <p className="font-cormorant text-sm text-center" style={{ color: "rgba(248,113,113,0.85)" }}>{payError}</p>}
              <GoldButton onClick={handlePay44} disabled={payProcessing || !uploadedImage}>{payProcessing ? t("deeperPayProcessing") : t("deeperPayBtn")}</GoldButton>
            </div>
          )}

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
        </div>
      </div>
    </ScreenWrapper>
  );
}
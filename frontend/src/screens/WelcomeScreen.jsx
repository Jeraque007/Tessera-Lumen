import { useEffect } from "react";
import SEO from "../components/SEO.jsx";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import AmbientAudio from "../utils/ambient-audio-manager.js";

export default function WelcomeScreen() {
  const { goTo, resetSession, user, refreshPaymentStatus } = useApp();
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.email) {
      refreshPaymentStatus(user.email, true);
    }
  }, []);

  const handleStart = async () => {
    await AmbientAudio.init();
    AmbientAudio.startAmbient();
    resetSession();
    goTo("details");
  };

  return (
    <ScreenWrapper hideLogo={true}>
      <SEO
        title="Guided Tarot Readings"
        description="Tessera Lumen offers intuitive tarot readings for illumination and self-discovery. Explore sacred guidance through beautifully crafted oracle cards."
        path="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Tessera Lumen",
          "url": "https://app.963.co.za",
          "description": "Guided tarot readings for illumination and insight",
          "applicationCategory": "LifestyleApplication",
          "operatingSystem": "Web, Android",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ZAR" }
        }}
      />
      <div aria-hidden="true" style={{ position:"fixed",inset:0,zIndex:0,backgroundImage:"url(/bg-sophia.png)",backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat" }} />
      <div aria-hidden="true" style={{ position:"fixed",inset:0,zIndex:1,background:"linear-gradient(to bottom,rgba(6,8,16,0.45) 0%,rgba(10,12,26,0.55) 40%,rgba(6,8,16,0.82) 75%,rgba(6,8,16,0.97) 100%)" }} />
      <div className="relative flex flex-col min-h-screen px-6" style={{ zIndex:2 }}>
        <div className="flex-none pt-10 pb-2 text-center animate-fade-in-up">
          <p className="font-cinzel text-xs tracking-[0.35em] uppercase mb-5" style={{ color:"#D4AF37",textShadow:"0 0 12px rgba(212,175,55,0.8)" }}>
            {t("sacredSpace")}
          </p>
          <h1 className="font-cinzel text-3xl font-bold leading-snug" style={{ background:"linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",filter:"drop-shadow(0 0 8px rgba(212,175,55,0.5))" }}>
            {t("welcomeTop")}
          </h1>
        </div>
        <div className="flex-1 min-h-[40px]" />
        <div className="animate-fade-in-up delay-300 mb-3">
          <div className="rounded-2xl p-6 text-center" style={{ background:"rgba(255,255,255,0.08)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",border:"1px solid rgba(255,255,255,0.15)" }}>
            <p className="font-cormorant text-xl leading-relaxed italic" style={{ color:"#f0e8d8" }}>
              {t("welcomeBody")}
            </p>
          </div>
        </div>
        <div className="flex-none animate-fade-in-up delay-400 mb-3">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px flex-1" style={{ background:"linear-gradient(to right,transparent,rgba(212,175,55,0.4))" }} />
            <span style={{ color:"#D4AF37",opacity:0.6,fontSize:"0.75rem" }}>+</span>
            <div className="h-px flex-1" style={{ background:"linear-gradient(to left,transparent,rgba(212,175,55,0.4))" }} />
          </div>
          <GoldButton onClick={handleStart}>{t("welcomeBtn")}</GoldButton>
        </div>
        <div className="flex-none flex flex-col items-center animate-fade-in-up delay-500" style={{ paddingTop:"16px",paddingBottom:"16px" }}>
          <img src="/assets/logo.png" alt="Tessera Lumen" title="Tessera Lumen - Oracle of the Soul" style={{ width:"90px",height:"auto",opacity:0.8,objectFit:"contain",display:"block" }} />
        </div>
      </div>
    </ScreenWrapper>
  );
}

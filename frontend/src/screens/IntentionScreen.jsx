import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import TpButton from "../components/TpButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";


export default function IntentionScreen() {
  const { goTo, setIntention, intention } = useApp();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(intention || "");
  const intentions = t("intentions");
  const handleContinue = () => { if (!selected) return; setIntention(selected); goTo("packages"); };
  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">
        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3" style={{ textShadow:"0 0 8px rgba(212,175,55,0.6)" }}>{t("intentionTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold text-gold-gradient mb-4">{t("intentionTitle")}</h2>
          <div className="glass-gold rounded-2xl p-5">
            <p className="font-cormorant text-lg leading-relaxed text-white italic">{t("intentionBody")}</p>
          </div>
        </div>
        <Divider />
        {/* Single column, full width, touch-friendly */}
        <div className="flex flex-col gap-3 w-full animate-fade-in-up delay-200">
          {intentions.map((item, i) => (
            <button
              key={item}
              onClick={() => setSelected(item)}
              style={{ animationDelay: i * 0.04 + "s" }}
              className={[
                "w-full py-4 px-5 rounded-xl font-cormorant text-base text-left transition-all duration-300 border backdrop-blur-sm animate-fade-in-up",
                selected === item
                  ? "border-[#D4AF37] bg-[#D4AF37]/12 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  : "border-white/10 bg-white/4 text-white/90 hover:border-[#D4AF37]/35 hover:bg-white/7"
              ].join(" ")}
            >
              <span className="mr-3 text-sm">{selected === item ? "" : ""}</span>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-auto pt-8 pb-8 animate-fade-in-up delay-500">
          <TpButton onClick={handleContinue} disabled={!selected}>{t("intentionBtn")}</TpButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}

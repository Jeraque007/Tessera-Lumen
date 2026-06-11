import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";


function PkgCard({ pkg, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(pkg)}
      className={[
        "w-full py-4 px-5 rounded-xl text-left transition-all duration-300 border backdrop-blur-sm",
        selected
          ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          : "border-white/10 bg-white/4 hover:border-[#D4AF37]/35 hover:bg-white/7"
      ].join(" ")}
    >
      <div className="flex justify-between items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-sm text-white leading-snug">{pkg.name}</p>
          <p className="font-cormorant text-sm text-white italic mt-1">{pkg.desc}</p>
        </div>
        <div className="animate-glow-pulse" style={{ border:"1.5px solid rgba(212,175,55,0.6)", borderRadius:"10px", padding:"8px 14px", background:"linear-gradient(135deg, rgba(10,12,26,0.9), rgba(26,21,53,0.8))", flexShrink:0, textAlign:"center", minWidth:"72px" }}><span className="font-cinzel font-bold" style={{ fontSize:"clamp(0.75rem,2.5vw,0.85rem)", color:"#f0d060", letterSpacing:"0.03em", textShadow:"0 0 8px rgba(212,175,55,0.5)" }}>{pkg.price}</span></div>
      </div>
    </button>
  );
}

export default function PackagesScreen() {
  const { goTo, setSelectedPackage, selectedPackage } = useApp();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(selectedPackage);
  const packages = t("packages");
  const oneTime = packages.filter(p => p.type === "one-time");
  const subs = packages.filter(p => p.type === "sub");
  const handleContinue = () => { if (!selected) return; setSelectedPackage(selected); goTo("payment"); };
  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">
        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3" style={{ textShadow:"0 0 8px rgba(212,175,55,0.6)" }}>{t("packagesTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold text-gold-gradient">{t("packagesTitle")}</h2>
        </div>
        <Divider />
        {/* Single column, full width */}
        <div className="flex flex-col gap-3 w-full animate-fade-in-up delay-200">
          <p className="font-cinzel text-[9px] tracking-[0.28em] text-[#D4AF37]/80 uppercase mb-1">{t("packagesOneTime")}</p>
          {oneTime.map(pkg => (
            <PkgCard key={pkg.id} pkg={pkg} selected={selected?.id===pkg.id} onSelect={setSelected} />
          ))}
          <p className="font-cinzel text-[9px] tracking-[0.28em] text-[#D4AF37]/80 uppercase mt-4 mb-1">{t("packagesSub")}</p>
          {subs.map(pkg => (
            <PkgCard key={pkg.id} pkg={pkg} selected={selected?.id===pkg.id} onSelect={setSelected} />
          ))}
        </div>
        <div className="mt-auto pt-8 pb-8 animate-fade-in-up delay-400">
          <GoldButton onClick={handleContinue} disabled={!selected}>{t("packagesBtn")}</GoldButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}

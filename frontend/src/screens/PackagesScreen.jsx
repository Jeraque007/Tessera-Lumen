import { useState, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";
import { getProductInfo, productIds, isHmsDevice } from "../utils/huaweiIap.js";

const HMS_PRODUCT_MAP = {
  1: "Quick.Insight",
  2: "Past.Present.Future",
  3: "Deep.Dive",
  4: "10.Readings_Month",
  5: "20.Readings_Month",
  6: "30.Readings_Month1",
};

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
  const { goTo, setSelectedPackage, selectedPackage, setDeeperPaid } = useApp();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(selectedPackage);
  const [hmsPrices, setHmsPrices] = useState({});
  const [currencyData, setCurrencyData] = useState({ symbol: '$', rate: 1, code: 'USD' });

  useEffect(() => {
    // 1. Fetch HMS Prices if on native Huawei device
    if (isHmsDevice()) {
      const fetchPrices = async () => {
        try {
          const [conRes, subRes] = await Promise.all([
            getProductInfo(productIds.consumables, 0),
            getProductInfo(productIds.subscriptions, 2)
          ]);

          const priceMap = {};
          [...conRes, ...subRes].forEach(p => {
            priceMap[p.productId] = p.price;
          });
          setHmsPrices(priceMap);
        } catch (e) {
          console.warn("[Packages] Failed to fetch HMS prices:", e);
        }
      };
      fetchPrices();
    }

    // 2. Fetch Localized Currency & Exchange Rate
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
      } catch (e) {
        console.warn("[Packages] Currency fetch failed:", e);
      }
    };
    fetchCurrency();
  }, []);

  const rawPackages = t("packages");

  // Merge HMS prices or localized display prices
  const packages = rawPackages.map(pkg => {
    // Priority 1: Huawei Localized Price (Native)
    const hmsId = HMS_PRODUCT_MAP[pkg.id];
    if (hmsPrices[hmsId]) {
      return { ...pkg, price: hmsPrices[hmsId] };
    }

    // Priority 2: Web Localized Display (FX Conversion)
    const usdBase = parseFloat(pkg.price.replace("$", ""));
    if (!isNaN(usdBase)) {
      const convertedPrice = (usdBase * currencyData.rate).toFixed(currencyData.code === 'BHD' ? 3 : 2);
      // Clean up .00 if it's USD or similar to look professional
      const displayPrice = convertedPrice.endsWith(".00") ? Math.round(convertedPrice) : convertedPrice;
      const isSub = pkg.type === "sub";

      return {
        ...pkg,
        price: `${currencyData.symbol}${displayPrice}${isSub ? "/mo" : ""}`,
        priceUSD: usdBase // Store original USD for the backend
      };
    }

    return pkg;
  });

  const oneTime = packages.filter(p => p.type === "one-time");
  const subs = packages.filter(p => p.type === "sub");

  const handleContinue = () => { if (!selected) return; setSelectedPackage(selected); goTo("payment"); };
  const handleBypass = () => {
    setDeeperPaid(true);
    goTo("deeper");
  };
  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">
        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3" style={{ textShadow:"0 0 8px rgba(212,175,55,0.6)" }}>{t("packagesTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold text-gold-gradient">{t("packagesTitle")}</h2>
        </div>
        <Divider />
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
        <div className="mt-auto pt-8 pb-8 animate-fade-in-up delay-400 flex flex-col gap-3">
          <GoldButton onClick={handleContinue} disabled={!selected}>{t("packagesBtn")}</GoldButton>
          <button
            onClick={handleBypass}
            className="w-full py-4 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37]/70 font-cinzel text-[10px] tracking-widest uppercase hover:bg-[#D4AF37]/5 transition-all"
          >
            Direct Deep Dive Access
          </button>
        </div>
      </div>
    </ScreenWrapper>
  );
}

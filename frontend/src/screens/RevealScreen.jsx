import { useState, useEffect, useMemo } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import TpButton from "../components/TpButton.jsx";
import CosmicButton from "../components/CosmicButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { CARDS } from "../data/cards.js";
import { drawCards } from "../data/cardResolver.js";
import { useTranslation } from "react-i18next";
import { createReadingObject } from "../utils/readingStore.js";
import { renderReadingCard, dispatchExport } from "../utils/readingExport.js";

export default function RevealScreen() {
  const {
    goTo, user, intention, selectedPackage,
    setDrawnCards,
    immutableReadings, setImmutableReadings
  } = useApp();

  const { t, i18n } = useTranslation();
  const hasRenderedReadings = immutableReadings.length > 0 && immutableReadings[0]?.export?.dataUrl;
  const [revealed, setRevealed] = useState(!!hasRenderedReadings);
  const [processing, setProcessing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(hasRenderedReadings ? immutableReadings.length : 0);

  const cardCount = useMemo(() => selectedPackage?.cards || 1, [selectedPackage]);

  // Handle payment return cleanup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      setDrawnCards([]);
      setImmutableReadings([]);
      setRevealed(false);
      setVisibleCount(0);
    }
  }, [setDrawnCards, setImmutableReadings]);

  // Reveal: draw cards and render JPGs
  const handleReveal = async () => {
    if (processing || revealed) return;
    setProcessing(true);

    const cards = drawCards(CARDS, cardCount, i18n.language);
    const baseReadings = cards.map((c, i) => createReadingObject(c, i, selectedPackage, user, intention, i18n.language));

    // Render all JPGs
    const finalizedReadings = [];
    for (let r of baseReadings) {
      const finalized = await renderReadingCard(r);
      finalizedReadings.push(finalized);
    }

    setImmutableReadings(finalizedReadings);
    setDrawnCards(cards);
    setRevealed(true);
    setProcessing(false);
    setVisibleCount(1);
  };

  // Stagger card reveal
  useEffect(() => {
    if (revealed && visibleCount < immutableReadings.length) {
      const timer = setTimeout(() => setVisibleCount(v => v + 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [revealed, visibleCount, immutableReadings.length]);

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-4 pb-10 sm:px-6">

        <div className="animate-fade-in-up mb-6 text-center" style={{ paddingTop: "64px" }}>
          <p className="font-cinzel text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: "#D4AF37" }}>
            {t("revealTag")}
          </p>
        </div>

        <Divider />

        <div className="flex flex-col items-center gap-8 w-full py-4">

          {!revealed ? (
            <div className="flex flex-col items-center gap-12 w-full animate-fade-in-up delay-200">
              <div
                onClick={handleReveal}
                className="relative w-48 h-72 rounded-2xl border-2 border-[#D4AF37]/35 bg-gradient-to-br from-[#1a1535] to-[#060810] flex items-center justify-center cursor-pointer hover:border-[#D4AF37] transition-all duration-500 animate-float shadow-[0_0_50px_rgba(212,175,55,0.15)]"
              >
                <div className="absolute inset-4 border border-[#D4AF37]/10 rounded-xl" />
                <span className="text-6xl text-[#D4AF37]/10 font-cinzel">?</span>
              </div>
              <TpButton onClick={handleReveal} disabled={processing}>
                {processing ? t("revealRevealing") : t("revealBtn")}
              </TpButton>
            </div>

          ) : (
            <div className="flex flex-col gap-10 w-full animate-fade-in" style={{ maxWidth: "560px" }}>

              {immutableReadings.slice(0, visibleCount).map((reading, i) => (
                <div key={reading.id} className="flex flex-col gap-6 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.3}s` }}>

                  {/* THE CARD: rendered JPG */}
                  {reading.export?.dataUrl ? (
                    <img
                      src={reading.export.dataUrl}
                      alt={reading.card.title}
                      className="w-full h-auto rounded-2xl border border-[#D4AF37]/30 shadow-2xl"
                    />
                  ) : (
                    <div className="w-full aspect-[9/16] rounded-2xl border border-[#D4AF37]/20 bg-[#0d0a1e] flex items-center justify-center">
                      <p className="font-cinzel text-[#D4AF37]/40 text-xs tracking-widest uppercase animate-pulse">Rendering...</p>
                    </div>
                  )}

                  {/* SAVE BUTTON */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => dispatchExport(reading)}
                      disabled={!reading.export?.blob}
                      className="w-full max-w-[320px] py-4 rounded-xl border-2 border-[#D4AF37]/60 bg-[#D4AF37]/8 text-[#f0d060] font-cinzel text-xs tracking-[0.2em] font-bold uppercase hover:bg-[#D4AF37]/15 active:scale-95 transition-all"
                    >
                      Save Reading to Device
                    </button>
                  </div>
                </div>
              ))}

              {/* Loading next card */}
              {visibleCount < immutableReadings.length && (
                <div className="text-center py-10 animate-fade-in">
                  <p className="font-cinzel text-xs tracking-[0.4em] text-[#D4AF37]/60 uppercase animate-pulse">
                    Revealing next card...
                  </p>
                </div>
              )}

              {/* All cards revealed */}
              {visibleCount >= immutableReadings.length && (
                <div className="pt-8 pb-16 animate-fade-in-up flex flex-col items-center gap-8">
                  {selectedPackage?.type === "free" ? (
                    <>
                      <CosmicButton onClick={() => goTo("details")}>
                        {t("startJourney") || "Start Your Full Reading"}
                      </CosmicButton>
                      <p className="font-cormorant text-sm text-white/50 italic text-center px-4">
                        {t("freeTrialCta") || "Ready for deeper insight? Begin your personalised journey."}
                      </p>
                    </>
                  ) : (
                    <>
                      <CosmicButton onClick={() => goTo("deeper")}>
                        {t("revealDeeperBtn")}
                      </CosmicButton>
                      <button
                        onClick={() => goTo("packages")}
                        className="w-full max-w-[320px] py-4 rounded-xl border border-white/10 text-white/70 font-cinzel text-xs tracking-widest hover:border-white/20 transition-all"
                      >
                        {t("newReading") || "Begin Another Reading"}
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );
}
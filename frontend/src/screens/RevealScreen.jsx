import { useState, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import TpButton from "../components/TpButton.jsx";
import CosmicButton from "../components/CosmicButton.jsx";
import Divider from "../components/Divider.jsx";
import TarotCard from "../components/TarotCard.jsx";
import { useApp } from "../context/AppContext.jsx";

import { drawLocalizedCards } from "../data/cards.js";
import { checkQuota, deductRead } from "../utils/quota.js";
import QuotaGate from "../components/QuotaGate.jsx";
import { useTranslation } from "react-i18next";
import ExportPanel from "../components/ExportPanel.jsx";

export default function RevealScreen() {
  const { goTo, user, intention, selectedPackage, drawnCards, setDrawnCards, isPaid, paymentLoading } = useApp();
  const { t, i18n } = useTranslation();
  const [revealed, setRevealed] = useState(drawnCards.length > 0);

  // Guard: if not paid and not currently checking, redirect home
  useEffect(() => {
    if (!paymentLoading && !isPaid) {
      console.log("[Guard] Not paid, redirecting to welcome");
      goTo("welcome");
    }
  }, [isPaid, paymentLoading, goTo]);
  const [flipping, setFlipping] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  const [visibleCount, setVisibleCount] = useState(drawnCards.length > 0 ? drawnCards.length : 0);

  // Quota gate state  null = not blocked
  const [quotaBlock, setQuotaBlock] = useState(null);
  // { code, tomorrow, renewalDate, readsPerDay }

  const cardCount = selectedPackage?.cards || 1;
  const positions = t("revealPositions");

  useEffect(() => {
    if (revealed && visibleCount < drawnCards.length) {
      const timer = setTimeout(() => setVisibleCount(v => v + 1), 500);
      return () => clearTimeout(timer);
    }
  }, [revealed, visibleCount, drawnCards.length]);

  const handleReveal = async () => {
    if (flipping) return;
    setFlipping(true);

    // Check quota for subscription users
    if (selectedPackage?.type === "sub" && user?.email) {
      const quota = await checkQuota(user.email);
      if (!quota.allowed) {
        setFlipping(false);
        setQuotaBlock({
          code:        quota.code,
          tomorrow:    quota.tomorrow || null,
          renewalDate: quota.renewalDate || null,
          readsPerDay: quota.readsPerDay || null,
        });
        return;
      }
    }

    setTimeout(async () => {
      setDrawnCards(drawLocalizedCards(cardCount, i18n.language));
      setRevealed(true);
      setFlipping(false);
      setVisibleCount(1);
      // Deduct 1 read for subscription users
      if (selectedPackage?.type === "sub" && user?.email) {
        await deductRead(user.email);
      }
    }, 900);
  };

  return (
    <ScreenWrapper>
      {quotaBlock ? (
        <QuotaGate
          code={quotaBlock.code}
          tomorrow={quotaBlock.tomorrow}
          renewalDate={quotaBlock.renewalDate}
          readsPerDay={quotaBlock.readsPerDay}
          onUpgrade={() => goTo("packages")}
          onGoHome={() => goTo("welcome")}
        />
      ) : (
        <div className="flex flex-col min-h-screen px-4 pb-10 sm:px-6">
          <div className="animate-fade-in-up mb-6 text-center" style={{ paddingTop: "64px" }}>
            <p className="font-cinzel text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: "#D4AF37" }}>
              {t("revealTag")}
            </p>
            <p className="font-cormorant italic" style={{ fontSize: "clamp(0.9rem,4vw,1rem)", color: "rgba(240,232,216,0.45)", lineHeight: 1.6, maxWidth: "260px", margin: "0 auto", wordWrap: "break-word", overflowWrap: "break-word", display: "block" }}>
              {t("revealTitle")}
            </p>
          </div>
          <Divider />
          <div className="flex flex-col items-center gap-6 w-full py-2">
            {!revealed ? (
              <div className="flex flex-col items-center gap-8 w-full animate-fade-in-up delay-200">
                <div
                  onClick={handleReveal}
                  className="relative w-40 h-64 rounded-2xl border-2 border-[#D4AF37]/35 bg-gradient-to-br from-[#1a1535] to-[#060810] flex items-center justify-center cursor-pointer hover:border-[#D4AF37] transition-all duration-300 animate-float"
                  style={{ boxShadow: "0 0 30px rgba(212,175,55,0.15)" }}
                >
                  <span className="text-5xl opacity-25" style={{ color: "#D4AF37" }}>+</span>
                  <span className="card-watermark">Tessera Lumen</span>
                </div>
                <TpButton onClick={handleReveal} disabled={flipping}>
                  {flipping ? t("revealRevealing") : t("revealBtn")}
                </TpButton>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full animate-fade-in">
                {drawnCards.slice(0, visibleCount).map((card, i) => (
                  <TarotCard
                    key={card.number}
                    card={card}
                    position={cardCount > 1 ? positions[i] : null}
                    index={i}
                  />
                ))}
                {visibleCount < drawnCards.length && (
                  <div className="text-center py-4 animate-fade-in">
                    <p className="font-cinzel text-xs tracking-widest animate-glow-pulse" style={{ color: "rgba(212,175,55,0.5)" }}>+ + +</p>
                  </div>
                )}
                {visibleCount >= drawnCards.length && (
                  <div className="glass-gold rounded-2xl p-5 w-full animate-fade-in">
                    <div className="flex flex-col gap-4 mb-5">
                      <div>
                        <label className="block font-cinzel text-[9px] tracking-[0.18em] uppercase mb-2" style={{ color: "rgba(240,232,216,0.6)" }}>
                          {t("revealEmail")}
                        </label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("revealEmailPh")} className="tc-input" />
                      </div>
                      <div>
                        <label className="block font-cinzel text-[9px] tracking-[0.18em] uppercase mb-2" style={{ color: "rgba(240,232,216,0.6)" }}>
                          {t("revealPhone")}
                        </label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t("revealPhonePh")} className="tc-input" />
                      </div>
                    </div>
                    <ExportPanel
                      user={user}
                      intention={intention}
                      cards={drawnCards}
                      positions={cardCount > 1 ? positions : []}
                      email={email}
                      phone={phone}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {revealed && visibleCount >= drawnCards.length && (
            <div className="pt-4 pb-8 animate-fade-in-up">
              <CosmicButton onClick={() => goTo("deeper")}>{t("revealDeeperBtn")}</CosmicButton>
            </div>
          )}
        </div>
      )}
    </ScreenWrapper>
  );
}

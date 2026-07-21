import { useState, useEffect, useMemo, useRef } from "react";
import SEO from "../components/SEO.jsx";
import { motion, AnimatePresence } from "framer-motion";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import { useApp } from "../context/AppContext.jsx";
import { CARDS } from "../data/cards.js";
import { resolveCard } from "../data/cardResolver.js";
import { useTranslation } from "react-i18next";
import { createReadingObject } from "../utils/readingStore.js";
import { renderReadingCard, renderSpreadCards, dispatchExport, dispatchBundleExport } from "../utils/readingExport.js";
import { generateSingleSynthesis, generateSpreadSynthesis } from "../services/synthesisService.js";
import CardBack from "../components/CardBack.jsx";
import AmbientAudio from "../utils/ambient-audio-manager.js";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { apiUrl } from "../utils/apiBase.js";

const getSeededCards = (interactionCount) => {
  const dateStr = new Date().toISOString().split("T")[0];
  const seedStr = `${dateStr}-${interactionCount}`;
  let seedNum = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seedNum = ((seedNum << 5) - seedNum) + seedStr.charCodeAt(i);
    seedNum |= 0;
  }
  const shuffled = [...CARDS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.abs(seedNum + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    seedNum = (seedNum * 16807) % 2147483647;
  }
  return shuffled;
};

export default function RevealScreen() {
  const {
    goTo, user, intention, selectedPackage,
    isPaid, setIsPaid,
    drawnCards, setDrawnCards,
    drawHistory, setDrawHistory,
    immutableReadings, setImmutableReadings,
    setFreeReadingUsed
  } = useApp();

  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState("init");
  // Phases: init, fan, revealing, revealed (single), spread, viewing

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);
  const dailyCount = drawHistory.daily.date === today ? drawHistory.daily.count : 0;
  const monthlyCount = drawHistory.monthly.month === thisMonth ? drawHistory.monthly.count : 0;

  const [interactionCount, setInteractionCount] = useState(() =>
    parseInt(localStorage.getItem("tl_interaction_count") || "0")
  );
  // FIX: Lock the deck seed at mount time - do NOT reshuffle mid-session
  // Reshuffling on each pick caused cards to shift positions between selections
  const [deckSeed] = useState(() => parseInt(localStorage.getItem("tl_interaction_count") || "0"));
  const deck = useMemo(() => getSeededCards(deckSeed), [deckSeed]);

  const isSub = selectedPackage?.type === "sub";
  const subLimitDaily = useMemo(() => {
    if (!isSub) return 999;
    return Math.floor((parseInt(selectedPackage.cards) || 10) / 10);
  }, [selectedPackage, isSub]);
  const subLimitMonthly = useMemo(() => {
    if (!isSub) return 999;
    return parseInt(selectedPackage.cards) || 10;
  }, [selectedPackage, isSub]);
  const hasReachedLimit = isSub && (dailyCount >= subLimitDaily || monthlyCount >= subLimitMonthly);

  const sessionLimit = useMemo(() => {
    if (isSub) return subLimitDaily;
    const id = String(selectedPackage?.id);
    if (id === "1" || id === "quick-insight") return 1;
    if (id === "2" || id === "past-present-future") return 3;
    if (id === "3" || id === "deep-dive") return 5;
    return 1;
  }, [selectedPackage, isSub, subLimitDaily]);

  // Single card state
  const [currentReading, setCurrentReading] = useState(null);
  const [singleSynthesis, setSingleSynthesis] = useState(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Multi-card state
  const [selectedCards, setSelectedCards] = useState([]);
  const selectedCountRef = useRef(0);
  const [spreadRevealed, setSpreadRevealed] = useState(false);
  const [allReadings, setAllReadings] = useState([]);
  const [cardSyntheses, setCardSyntheses] = useState([]);
  const [viewingCardIndex, setViewingCardIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fan state
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

  // FIX: Clear stale drawnCards from previous sessions on mount
  // Without this, old cards appear as "already picked" ghosts in the fan
  useEffect(() => {
    setDrawnCards([]);
    selectedCountRef.current = 0;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: useEffect watches selectedCards and triggers spread when limit is reached
  // This avoids the broken setTimeout-inside-updater pattern
  useEffect(() => {
    if (sessionLimit <= 1) return;
    if (selectedCards.length < sessionLimit) return;
    if (phase === "spread" || phase === "viewing") return; // already transitioned

    setIsPaid(true);
    localStorage.setItem("tl_is_paid", "true");

    const readings = selectedCards.map((card, i) => {
      const resolved = resolveCard(card, i18n.language);
      return createReadingObject(resolved, i, selectedPackage, user, intention);
    });
    setAllReadings(readings);

    // Generate individual synthesis for each card
    setSynthesisLoading(true);
    const allResolved = selectedCards.map(c => resolveCard(c, i18n.language));
    const synthPromises = allResolved.map(card => generateSingleSynthesis(card, intention));
    Promise.all(synthPromises).then(results => {
      setCardSyntheses(results);
      setSynthesisLoading(false);
    }).catch(() => setSynthesisLoading(false));

    setPhase("spread");
  }, [selectedCards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard: only runs ONCE on mount to check if user should be here
  // DO NOT add isPaid to deps - it changes mid-session when cards are selected
  useEffect(() => {
    const timer = setTimeout(() => {
      const persistedPaid = localStorage.getItem("tl_is_paid") === "true";
      const isFree = selectedPackage?.type === "free";
      if (!isPaid && !persistedPaid && !isFree) {
        goTo("welcome");
      } else {
        setPhase("fan");
        AmbientAudio.init().then(() => AmbientAudio.startAmbient());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Fan Interaction ---
  const handlePointerMove = (e) => {
    if (phase !== "fan") return;
    if (e.touches) e.preventDefault();
    if (!AmbientAudio.isPlaying) AmbientAudio.startAmbient();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height;
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    angle = 180 + angle;

    if (angle >= 0 && angle <= 180) {
      const idx = Math.floor((angle / 180) * deck.length);
      const safeIdx = Math.max(0, Math.min(deck.length - 1, idx));
      const isDrawn = drawnCards.some(c => c.number === deck[safeIdx].number) ||
                      selectedCards.some(c => c.number === deck[safeIdx].number);
      if (!isDrawn && safeIdx !== hoveredIndex) {
        setHoveredIndex(safeIdx);
        if (window.Capacitor?.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } else if (isDrawn) {
        setHoveredIndex(-1);
      }
    } else {
      setHoveredIndex(-1);
    }
  };

  const handlePointerDown = (e) => {
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    touchStartPos.current = { x: cx, y: cy, time: Date.now() };
  };

  const handlePointerUp = (e) => {
    if (phase !== "fan" || hoveredIndex === -1) return;
    const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    if (Math.abs(cx - touchStartPos.current.x) < 30 &&
        Math.abs(cy - touchStartPos.current.y) < 30 &&
        Date.now() - touchStartPos.current.time < 500) {
      selectCard(hoveredIndex);
    }
  };

  const handleCardTap = (idx) => {
    if (phase !== "fan") return;
    const isAlreadyPicked = drawnCards.some(c => c.number === deck[idx].number) ||
                            selectedCards.some(c => c.number === deck[idx].number);
    if (isAlreadyPicked) return;
    selectCard(idx);
  };

  // --- Card Selection ---
  const selectCard = async (idx) => {
    if (hasReachedLimit) return;
    AmbientAudio.onCardTouch();

    const rawCard = deck[idx];
    const nextCount = interactionCount + 1;
    setInteractionCount(nextCount);
    localStorage.setItem("tl_interaction_count", nextCount.toString());

    // MULTI-CARD MODE
    if (sessionLimit > 1) {
      if (selectedCountRef.current >= sessionLimit) return;
      selectedCountRef.current += 1;
      setSelectedCards(prev => [...prev, rawCard]);
      setDrawnCards(prev => [...prev, rawCard]);
      setDrawHistory(prev => ({
        daily: { date: today, count: (prev.daily.date === today ? prev.daily.count : 0) + 1 },
        monthly: { month: thisMonth, count: (prev.monthly.month === thisMonth ? prev.monthly.count : 0) + 1 }
      }));


      return;
    }

    // SINGLE CARD MODE
    setPhase("revealing");
    const resolvedCard = resolveCard(rawCard, i18n.language);
    const reading = createReadingObject(resolvedCard, drawnCards.length, selectedPackage, user, intention);

    try {
      setCurrentReading(reading);
      setDrawnCards(prev => [...prev, rawCard]);
      setDrawHistory(prev => ({
        daily: { date: today, count: (prev.daily.date === today ? prev.daily.count : 0) + 1 },
        monthly: { month: thisMonth, count: (prev.monthly.month === thisMonth ? prev.monthly.count : 0) + 1 }
      }));
      setPhase("revealed");
      setIsPaid(true);
      localStorage.setItem("tl_is_paid", "true");

      setSingleSynthesis(null);
      setSynthesisLoading(true);
      generateSingleSynthesis(resolvedCard, intention).then(text => {
        setSingleSynthesis(text);
        setSynthesisLoading(false);
      }).catch(() => setSynthesisLoading(false));

      if (selectedPackage?.type === "free") {
        setFreeReadingUsed(true);
        localStorage.setItem("tl_free_consumed", "true");
        fetch(apiUrl("/api/free-claim"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardNumbers: [rawCard.number] }) }).catch(() => {});
      }
    } catch (err) {
      console.error("Reveal failed:", err);
      setPhase("fan");
    }
  };

  // --- Save Handlers ---
  const handleSaveSingle = async () => {
    if (!currentReading) return;
    setSaving(true);
    const exported = await renderReadingCard(currentReading, singleSynthesis);
    await dispatchExport(exported);
    setSaving(false);
  };

  const handleSaveSpread = async () => {
    if (!allReadings.length) return;
    setSaving(true);
    const exported = await renderSpreadCards(allReadings, cardSyntheses);
    await dispatchBundleExport(exported);
    setSaving(false);
  };

  // --- Render Fan ---
  const renderFan = () => {
    const isMobile = window.innerWidth < 768;
    const radius = isMobile ? 180 : 340;
    const cardWidth = isMobile ? 65 : 100;
    const cardHeight = cardWidth * 1.6;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-[350px] sm:h-[500px] mt-12 mb-10 flex items-end justify-center overflow-visible select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {deck.map((card, i) => {
          const total = deck.length;
          const angle = -170 + (i / (total - 1)) * 160;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const rotation = angle + 90;
          const isHovered = hoveredIndex === i;
          const isAlreadyPicked = drawnCards.some(c => c.number === card.number) ||
                                  selectedCards.some(c => c.number === card.number);

          return (
            <motion.div
              key={i}
              className="absolute origin-center"
              onClick={() => handleCardTap(i)}
              initial={false}
              animate={{
                x, y: y + (isMobile ? 40 : 60), rotate: rotation,
                scale: isHovered ? 1.2 : 1,
                opacity: isAlreadyPicked ? 0 : 1,
                zIndex: isHovered ? 100 : i
              }}
              style={{
                width: cardWidth, height: cardHeight,
                backgroundImage: "url('/Backofcard.png')",
                backgroundSize: "cover", backgroundPosition: "center",
                borderRadius: "6px",
                border: "1px solid rgba(212,175,55,0.25)",
                boxShadow: isHovered ? "0 0 25px rgba(212,175,55,0.5)" : "0 4px 10px rgba(0,0,0,0.3)",
                pointerEvents: isAlreadyPicked ? "none" : "auto",
                cursor: "pointer"
              }}
            >
              {isHovered && <div className="absolute inset-0 rounded-[6px] bg-gradient-to-t from-[#D4AF37]/40 to-transparent animate-pulse" />}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // --- RENDER ---
  if (phase === "init") {
    return (
      <ScreenWrapper>
        <SEO title="Your Reading Revealed" path="/reveal" noindex={true} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SEO title="Your Reading Revealed" path="/reveal" noindex={true} />
      <div className="flex flex-col min-h-screen pb-20 overflow-x-hidden relative">
        <AnimatePresence mode="wait">

          {/* FAN PHASE */}
          {phase === "fan" && (
            <motion.div key="fan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center flex-1 pt-16">
              <div className="text-center mb-2 px-6">
                <h2 className="font-cinzel text-xl sm:text-2xl text-gold-gradient mb-2 uppercase tracking-[0.4em]">
                  Channel Your Energy
                </h2>
                <p className="font-cormorant italic text-white/50 text-sm">
                  Scan the arc with your finger and select your card.
                </p>
                {sessionLimit > 1 && selectedCards.length > 0 && (
                  <div className="mt-3 py-2 px-5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 inline-block">
                    <p className="font-cinzel text-[11px] tracking-[0.2em] text-[#D4AF37]">
                      Card {selectedCards.length} of {sessionLimit} selected
                    </p>
                  </div>
                )}
              </div>
              {renderFan()}
              <div className="mt-auto pb-6 flex flex-col items-center gap-4">
                <p className="font-cinzel text-[9px] tracking-[0.4em] text-[#D4AF37]/40 uppercase text-center">
                  Oracle Active
                </p>
              </div>
            </motion.div>
          )}

          {/* REVEALING (single card) */}
          {phase === "revealing" && (
            <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-1 py-20">
              <div className="w-10 h-10 border-2 border-t-[#D4AF37] border-white/10 rounded-full animate-spin mx-auto mb-6" />
              <p className="font-cinzel text-[#D4AF37] text-[12px] tracking-[0.4em] uppercase animate-pulse">
                Illuminating Your Sacred Record...
              </p>
            </motion.div>
          )}

          {/* REVEALED (single card) */}
          {phase === "revealed" && currentReading && (
            <motion.div key="revealed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center pt-10 px-4">

              {!cardFlipped ? (
                <div className="w-full max-w-[400px] cursor-pointer" onClick={() => setCardFlipped(true)}>
                  <div className="shadow-2xl rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                    <img src={currentReading.card.image} className="w-full h-auto block" alt={currentReading.card.title} />
                  </div>
                  <div className="mt-5 py-3.5 px-10 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/15 mx-auto w-fit animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    <p className="font-cinzel text-[13px] tracking-[0.25em] text-[#D4AF37] uppercase text-center font-bold">
                      &#10022; Tap Card to Reveal &#10022;
                    </p>
                  </div>
                </div>
              ) : (
                <CardBack reading={currentReading} synthesis={singleSynthesis} isLoading={synthesisLoading} />
              )}

              <div className="w-full max-w-[400px] flex flex-col gap-4 mt-10 mb-20 px-2">
                <button onClick={handleSaveSingle} disabled={saving}
                  className="w-full py-4 rounded-xl bg-[#D4AF37] text-[#060810] font-cinzel text-[11px] font-bold tracking-[0.3em] uppercase shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50">
                  {saving ? "SAVING..." : "SAVE READING TO DEVICE"}
                </button>
                <button onClick={() => goTo("packages")}
                  className="w-full py-4 rounded-2xl border border-white/10 text-white/40 font-cinzel text-[11px] tracking-[0.3em] uppercase hover:text-white/60 transition-all">
                  Begin New Reading
                </button>
              </div>
            </motion.div>
          )}

          {/* SPREAD PHASE (multi-card) */}
          {phase === "spread" && (
            <motion.div key="spread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center pt-12 px-4">
              <h2 className="font-cinzel text-xl text-gold-gradient mb-2 uppercase tracking-[0.3em] text-center">
                Your {sessionLimit}-Card Spread
              </h2>

              {!spreadRevealed ? (
                null
              ) : (
                <div className="mb-6 py-3 px-8 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/15 animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                  <p className="font-cinzel text-[13px] tracking-[0.25em] text-[#D4AF37] uppercase text-center font-bold">
                    &#10022; Tap Any Card to Read Its Message &#10022;
                  </p>
                </div>
              )}

              {/* Cards */}
              <div className="flex justify-center items-center gap-2 sm:gap-3 mb-8 flex-wrap">
                {allReadings.map((reading, i) => {
                  const isCenter = i === Math.floor(allReadings.length / 2);
                  const distFromCenter = Math.abs(i - Math.floor(allReadings.length / 2));
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 40, scale: 0.8 }}
                      animate={spreadRevealed
                        ? { opacity: 1, y: 0, scale: 1, rotateY: 0 }
                        : { opacity: 1, y: 0, scale: 1, rotateY: 0 }
                      }
                      transition={spreadRevealed
                        ? { delay: distFromCenter * 0.15, type: "spring", stiffness: 300, damping: 20 }
                        : { delay: i * 0.12, type: "spring", stiffness: 200 }
                      }
                      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        isCenter && !spreadRevealed
                          ? "border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.7)] "
                          : spreadRevealed
                            ? "border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                            : "border-[#D4AF37]/20"
                      }`}
                      style={{ width: "clamp(70px, 16vw, 130px)", aspectRatio: "2/3.5", perspective: "800px" }}
                      onClick={() => {
                        if (!spreadRevealed && isCenter) setSpreadRevealed(true);
                        else if (spreadRevealed) { setViewingCardIndex(i); setPhase("viewing"); }
                      }}
                    >
                      {!spreadRevealed ? (
                        <>
                          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/Backofcard.png')" }} />
                          {isCenter && (
                            <>
                              <div className="absolute inset-0 bg-[#D4AF37]/20 animate-pulse rounded-xl" />
                              <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(212,175,55,0.3)]" />
                            </>
                          )}
                        </>
                      ) : (
                        <motion.img
                          src={reading.card.image}
                          className="w-full h-full object-cover"
                          alt={reading.card.title}
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ delay: distFromCenter * 0.15, duration: 0.5, ease: "easeOut" }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Tap Centre prompt */}
              {!spreadRevealed && (
                <div className="py-4 px-10 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/15 animate-pulse shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                  <p className="font-cinzel text-[13px] tracking-[0.25em] text-[#D4AF37] uppercase text-center font-bold">
                    &#10022; Tap Centre Card to Reveal All &#10022;
                  </p>
                </div>
              )}

              {/* Save button */}
              {spreadRevealed && (
                <div className="w-full max-w-[400px] flex flex-col gap-4 mt-6">
                  <button onClick={handleSaveSpread} disabled={saving || synthesisLoading}
                    className="w-full py-4 rounded-xl bg-[#D4AF37] text-[#060810] font-cinzel text-[11px] font-bold tracking-[0.3em] uppercase shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50">
                    {saving ? "SAVING..." : synthesisLoading ? "CHANNELING..." : "SAVE READING TO DEVICE"}
                  </button>
                  <button onClick={() => goTo("packages")}
                    className="w-full py-4 rounded-2xl border border-white/10 text-white/40 font-cinzel text-[11px] tracking-[0.3em] uppercase hover:text-white/60 transition-all">
                    Begin New Reading
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEWING: Individual card back from spread */}
          {phase === "viewing" && viewingCardIndex !== null && allReadings[viewingCardIndex] && (
            <motion.div key="viewing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center pt-10 px-4">
              <p className="font-cinzel text-[10px] tracking-[0.3em] text-[#D4AF37]/60 uppercase mb-4">
                Card {viewingCardIndex + 1} of {sessionLimit}
              </p>
              <CardBack
                reading={allReadings[viewingCardIndex]}
                synthesis={cardSyntheses[viewingCardIndex] || null}
                isLoading={synthesisLoading && !cardSyntheses[viewingCardIndex]}
              />
              <div className="w-full max-w-[400px] mt-8 mb-20">
                <button onClick={() => { setViewingCardIndex(null); setPhase("spread"); }}
                  className="w-full py-4 rounded-2xl border border-[#D4AF37]/40 text-[#D4AF37] font-cinzel text-[12px] tracking-[0.3em] uppercase hover:bg-[#D4AF37]/5 transition-all">
                  Back to Spread
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </ScreenWrapper>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import { CARDS } from "../data/cards.js";
import { resolveCard } from "../data/cardResolver.js";
import { createReadingObject } from "../utils/readingStore.js";
import { renderReadingCard, dispatchExport } from "../utils/readingExport.js";
import { generateSingleSynthesis } from "../services/synthesisService.js";
import SynthesisDisplay from "./SynthesisDisplay.jsx";
import CardBack from "./CardBack.jsx";
import { apiUrl } from "../utils/apiBase.js";
import GoldButton from "./GoldButton.jsx";
import { useTranslation } from "react-i18next";

const SHARE_LINKS = {
  web: "https://app.963.co.za",
  apk: "https://apkpure.com/p/com.godcode963.app",
};

const SHARE_TEXT = "I just received a free tarot reading from Tessera Lumen! Try it yourself:";

// Seeded shuffle
const getSeededCards = () => {
  const dateStr = new Date().toISOString().split("T")[0];
  const seedStr = `${dateStr}-free-promo`;
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

export default function FreeCardPromo() {
  const { user } = useApp();
  const { i18n } = useTranslation();
  const [remaining, setRemaining] = useState(null);
  const [promoEnded, setPromoEnded] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle, fan, revealing, revealed
  const [revealedReading, setRevealedReading] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [claimActive, setClaimActive] = useState(false); // prevents hide after claim

  // Fan state
  const deck = useMemo(() => getSeededCards(), []);
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

  // Check if already claimed - localStorage first (instant), then verify with server
  const [alreadyClaimed, setAlreadyClaimed] = useState(() => {
    if (!user?.email) return false;
    return localStorage.getItem(`tl_free_card_${user.email.toLowerCase().trim()}`) === "true";
  });

  useEffect(() => {
    fetchStatus();
    // Server-side check: covers cross-browser, cross-app, incognito scenarios
    if (user?.email && !alreadyClaimed) {
      checkServerClaim(user.email);
    }
  }, [user?.email]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(apiUrl("/api/promo/free-card/status"));
      if (!res.ok) return;
      const data = await res.json();
      if (data.remaining <= 0) setPromoEnded(true);
      setRemaining(data.remaining);
    } catch (e) {
      console.warn("[FreeCard] Status fetch failed:", e);
      setRemaining(100);
    }
  };

  const checkServerClaim = async (email) => {
    try {
      const res = await fetch(apiUrl("/api/promo/free-card/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.claimed) {
        setAlreadyClaimed(true);
        localStorage.setItem(`tl_free_card_${email.toLowerCase().trim()}`, "true");
      }
    } catch (e) {
      // Fail silently - worst case they see the promo but server will reject claim
    }
  };

  const handleStartClaim = async () => {
    if (!user?.email) {
      setError("Please enter your details first to claim your free card.");
      return;
    }
    setError("");
    setClaimActive(true); // Prevent component from disappearing

    try {
      const res = await fetch(apiUrl("/api/promo/free-card/claim"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (res.status === 409) {
        // Already claimed - but since they're here, let them pick a card anyway (cosmetic)
        setPhase("fan");
        return;
      }
      if (res.status === 410) {
        setPromoEnded(true);
        setClaimActive(false);
        return;
      }
      if (!res.ok) {
        // API might not be deployed yet - allow the experience anyway
        console.warn("[FreeCard] Claim API returned", res.status, "- allowing fan anyway");
      }

      localStorage.setItem(`tl_free_card_${user.email.toLowerCase().trim()}`, "true");
      if (data.remaining !== undefined) setRemaining(data.remaining);
      setPhase("fan");
    } catch (e) {
      // Network error (API not deployed, offline, etc.) - still allow the fan experience
      console.warn("[FreeCard] Claim fetch failed:", e, "- allowing fan anyway");
      localStorage.setItem(`tl_free_card_${user.email.toLowerCase().trim()}`, "true");
      setPhase("fan");
    }
  };

  // --- Fan interaction ---
  const handlePointerMove = (e) => {
    if (phase !== "fan") return;
    if (e.touches) e.preventDefault(); // Prevent scroll on Safari/iOS

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height;
    const dx = x - centerX;
    const dy = y - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = 180 + angle;

    if (angle >= 0 && angle <= 180) {
      const idx = Math.floor((angle / 180) * deck.length);
      setHoveredIndex(Math.max(0, Math.min(deck.length - 1, idx)));
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
    const dx = Math.abs(cx - touchStartPos.current.x);
    const dy = Math.abs(cy - touchStartPos.current.y);
    const dt = Date.now() - touchStartPos.current.time;

    // More generous tap detection for mobile
    if (dx < 30 && dy < 30 && dt < 500) {
      revealCard(hoveredIndex);
    }
  };

  // Direct tap on a card (mobile-friendly fallback)
  const handleCardTap = (idx) => {
    if (phase !== "fan") return;
    revealCard(idx);
  };

  const revealCard = async (idx) => {
    setPhase("revealing");

    const rawCard = deck[idx];
    const resolvedCard = resolveCard(rawCard, i18n.language);
    const reading = createReadingObject(resolvedCard, 0, { name: "Free Card" }, user, "Sacred Guidance");

    try {
      const finalized = await renderReadingCard(reading);
      setRevealedReading(finalized);
      setPhase("revealed");

      // Trigger AI synthesis (non-blocking)
      setSynthesis(null);
      setSynthesisLoading(true);
      generateSingleSynthesis(resolvedCard, "Sacred Guidance").then(text => {
        setSynthesis(text);
        setSynthesisLoading(false);
      }).catch(() => setSynthesisLoading(false));
    } catch (err) {
      console.error("[FreeCard] Reveal failed:", err);
      setPhase("fan");
      setError("Failed to render card. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!revealedReading) return;
    // Re-render the JPG with synthesis text included
    if (synthesis) {
      const withSynthesis = await renderReadingCard(revealedReading, synthesis);
      await dispatchExport(withSynthesis);
    } else {
      await dispatchExport(revealedReading);
    }
    setDownloaded(true);
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent(SHARE_TEXT);
    const webUrl = encodeURIComponent(SHARE_LINKS.web);
    const apkUrl = encodeURIComponent(SHARE_LINKS.apk);

    const urls = {
      whatsapp: `https://wa.me/?text=${text}%20${webUrl}%20%7C%20Download%3A%20${apkUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${webUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${webUrl}&quote=${text}`,
      copy: null,
    };

    if (platform === "copy") {
      navigator.clipboard?.writeText(`${SHARE_TEXT} ${SHARE_LINKS.web} | Download: ${SHARE_LINKS.apk}`);
      alert("Link copied to clipboard!");
      return;
    }

    if (urls[platform]) window.open(urls[platform], "_blank");
  };

  // --- Render guards ---
  // Only hide if promo ended AND user hasn't started claiming
  if (promoEnded && !claimActive) return null;
  // Only hide if already claimed AND not currently in a flow
  if (alreadyClaimed && phase === "idle" && !claimActive) return null;

  const renderFan = () => {
    const radius = 160;
    const cardWidth = 55;
    const cardHeight = cardWidth * 1.6;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-[280px] mt-4 mb-4 flex items-end justify-center overflow-visible select-none"
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
          const angleRange = 160;
          const startAngle = -170;
          const angle = startAngle + (i / (total - 1)) * angleRange;
          const rad = (angle * Math.PI) / 180;

          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const rotation = angle + 90;
          const isHovered = hoveredIndex === i;

          return (
            <motion.div
              key={i}
              className="absolute origin-center"
              initial={false}
              animate={{
                x, y: y + 30, rotate: rotation,
                scale: isHovered ? 1.25 : 1,
                zIndex: isHovered ? 100 : i
              }}
              onClick={() => handleCardTap(i)}
              style={{
                width: cardWidth, height: cardHeight,
                backgroundImage: "url('/Backofcard.png')",
                backgroundSize: "cover", backgroundPosition: "center",
                borderRadius: "5px",
                border: "1px solid rgba(212,175,55,0.25)",
                boxShadow: isHovered ? "0 0 20px rgba(212,175,55,0.5)" : "0 3px 8px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
            >
              {isHovered && (
                <div className="absolute inset-0 rounded-[5px] bg-gradient-to-t from-[#D4AF37]/40 to-transparent animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full mb-6 animate-fade-in-up">
      <div className="rounded-2xl p-5 border border-[#D4AF37]/30 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(10,12,26,0.95))" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.3) 0%, transparent 70%)" }} />

        <div className="relative z-10">
          {/* IDLE: Show promo and claim button */}
          {phase === "idle" && (
            <>
              <div className="text-center mb-4">
                <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-2" style={{ textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>
                  &#10022; Limited Offer &#10022;
                </p>
                <h3 className="font-cinzel text-lg font-bold text-white mb-1">
                  Free Card for First 100 Viewers
                </h3>
                <p className="font-cormorant text-sm italic text-[#f0e8d8]/70">
                  Select your card from the sacred arc
                </p>
              </div>

              {remaining !== null && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/40" style={{ background: "rgba(212,175,55,0.1)" }}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="font-cinzel text-[11px] tracking-wider text-[#f0d060]">
                      {remaining} of 100 remaining
                    </span>
                  </div>
                </div>
              )}

              {error && <p className="text-center text-red-400 text-xs mb-3 font-cormorant">{error}</p>}

              <GoldButton onClick={handleStartClaim}>
                &#10022; Claim Your Free Card
              </GoldButton>
            </>
          )}

          {/* FAN: Card selection */}
          {phase === "fan" && (
            <div className="text-center">
              <h3 className="font-cinzel text-sm text-[#D4AF37] tracking-[0.3em] uppercase mb-1">
                Channel Your Energy
              </h3>
              <p className="font-cormorant text-xs italic text-white/50 mb-2">
                Tap a card to reveal your message
              </p>
              {renderFan()}
            </div>
          )}

          {/* REVEALING: Loading */}
          {phase === "revealing" && (
            <div className="flex flex-col items-center py-10">
              <div className="w-14 h-14 rounded-full border-3 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mb-4" />
              <p className="font-cinzel text-[#D4AF37] text-[11px] tracking-[0.3em] uppercase animate-pulse">
                Illuminating Your Sacred Record...
              </p>
            </div>
          )}

          {/* REVEALED: Show card front + flip to back */}
          {phase === "revealed" && revealedReading && (
            <div className="flex flex-col items-center">
              <p className="font-cinzel text-[10px] tracking-[0.3em] text-[#D4AF37]/80 uppercase mb-3">Your Free Sacred Reading</p>

              {/* CARD FRONT - tap to flip */}
              {!cardFlipped && (
                <div className="w-full max-w-[320px] cursor-pointer mb-4" onClick={() => setCardFlipped(true)}>
                  <div className="rounded-xl overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.3)] border-2 border-[#D4AF37]/30">
                    <img
                      src={revealedReading.card.image}
                      alt={revealedReading.card.title}
                      className="w-full h-auto block"
                    />
                  </div>
                  <div className="mt-3 py-2.5 px-6 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 mx-auto w-fit animate-pulse">
                    <p className="font-cinzel text-[11px] tracking-[0.2em] text-[#D4AF37] uppercase text-center">
                      &#10022; Tap Card to Reveal &#10022;
                    </p>
                  </div>
                </div>
              )}

              {/* CARD BACK - two columns */}
              {cardFlipped && (
                <div className="w-full mb-4">
                  <CardBack reading={revealedReading} synthesis={synthesis} isLoading={synthesisLoading} />
                </div>
              )}

              {!downloaded && (
                <button
                  onClick={handleSave}
                  className="w-full max-w-[320px] mx-auto block py-3 rounded-lg bg-[#D4AF37] text-[#060810] font-cinzel text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_12px_rgba(212,175,55,0.3)] active:scale-95 transition-all mb-4"
                >
                  SAVE READING TO DEVICE
                </button>
              )}

              {downloaded && (
                <div className="w-full pt-4 border-t border-[#D4AF37]/20">
                  <p className="font-cinzel text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase mb-2 text-center">
                    &#10022; Share the Light &#10022;
                  </p>
                  <p className="font-cormorant text-sm italic text-[#f0e8d8]/70 mb-4 text-center">
                    Help others discover their sacred message
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    <button onClick={() => handleShare("whatsapp")} className="px-4 py-2.5 rounded-lg border border-[#25D366]/50 bg-[#25D366]/10 text-[#25D366] font-cinzel text-[10px] tracking-wider uppercase hover:bg-[#25D366]/20 transition-all">
                      WhatsApp
                    </button>
                    <button onClick={() => handleShare("facebook")} className="px-4 py-2.5 rounded-lg border border-[#1877F2]/50 bg-[#1877F2]/10 text-[#1877F2] font-cinzel text-[10px] tracking-wider uppercase hover:bg-[#1877F2]/20 transition-all">
                      Facebook
                    </button>
                    <button onClick={() => handleShare("twitter")} className="px-4 py-2.5 rounded-lg border border-[#1DA1F2]/50 bg-[#1DA1F2]/10 text-[#1DA1F2] font-cinzel text-[10px] tracking-wider uppercase hover:bg-[#1DA1F2]/20 transition-all">
                      Twitter / X
                    </button>
                    <button onClick={() => handleShare("copy")} className="px-4 py-2.5 rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37] font-cinzel text-[10px] tracking-wider uppercase hover:bg-[#D4AF37]/20 transition-all">
                      Copy Link
                    </button>
                  </div>

                  <a
                    href="https://apkpure.com/p/com.godcode963.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3.5 rounded-xl border border-[#4CAF50]/40 bg-[#4CAF50]/10 text-center font-cinzel text-[10px] tracking-wider uppercase text-[#4CAF50] hover:bg-[#4CAF50]/20 transition-all"
                  >
                    &#8681; Download Android App (APKPure)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



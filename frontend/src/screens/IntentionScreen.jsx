import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import TpButton from "../components/TpButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";

const INTENTION_IMAGES = {
  family: "/Intention%20cards/Family.jpg",
  love: "/Intention%20cards/Love.jpg",
  path: "/Intention%20cards/Path.jpg",
  career: "/Intention%20cards/Career.jpg",
  relocation: "/Intention%20cards/Relocation.jpg",
  lovequery: "/Intention%20cards/Does%20He%20or%20She%20love%20me.jpg",
  marriage: "/Intention%20cards/Marriage.jpg",
  other: "/Intention%20cards/Other.jpg",
};

const INTENTION_IDS = ["family", "love", "path", "career", "relocation", "lovequery", "marriage", "other"];

export default function IntentionScreen() {
  const { goTo, setIntention, intention } = useApp();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(intention || "");
  const [customText, setCustomText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (card) => {
    if (card.id === "other") {
      setShowCustomInput(true);
      setSelected(customText || "Other");
    } else {
      setShowCustomInput(false);
      setSelected(card.label.replace("\n", " "));
    }
  };

  const handleContinue = () => {
    if (!selected) return;
    const finalIntention = showCustomInput && customText.trim() ? customText.trim() : selected;
    setIntention(finalIntention);
    goTo("packages");
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-4 py-10 sm:px-6">

        <div className="animate-fade-in-up pt-10 mb-6 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-3"
            style={{ textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>
            {t("intentionTag")}
          </p>
          <h2 className="font-cinzel text-2xl font-bold text-gold-gradient mb-4">
            {t("intentionTitle")}
          </h2>
          <p className="font-cormorant text-base italic text-white/60 max-w-md mx-auto">
            {t("intentionBody")}
          </p>
        </div>

        <Divider />

        {/* 4x2 CARD GRID */}
        <div
          className="animate-fade-in-up delay-200 intention-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "14px",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "8px 0",
          }}
        >
          {INTENTION_IDS.map((id, i) => {
            const labels = t("intentionCards");
            const card = { id, label: labels[id] || id, image: INTENTION_IMAGES[id] };
            const isSelected = selected === card.label.replace("\n", " ");
            return (
              <button
                key={card.id}
                onClick={() => handleSelect(card)}
                style={{
                  animationDelay: i * 0.06 + "s",
                  border: isSelected
                    ? "2px solid rgba(212,175,55,0.9)"
                    : "1px solid rgba(212,175,55,0.2)",
                  borderRadius: "14px",
                  padding: "0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: isSelected
                    ? "0 0 24px rgba(212,175,55,0.4), inset 0 0 20px rgba(212,175,55,0.1)"
                    : "0 4px 16px rgba(0,0,0,0.4)",
                  aspectRatio: "3/4",
                  position: "relative",
                  overflow: "hidden",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                  background: "#060810",
                }}
                className="animate-fade-in-up"
              >
                {/* Background image */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: isSelected ? 0.7 : 0.45,
                  transition: "opacity 0.3s",
                }} />

                {/* Dark gradient overlay for text readability */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(6,8,16,0.85) 0%, rgba(6,8,16,0.3) 50%, transparent 100%)",
                  pointerEvents: "none",
                }} />

                {/* Selected glow */}
                {isSelected && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />
                )}

                {/* Label */}
                <span
                  className="font-cinzel"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    fontSize: "clamp(0.5rem, 2vw, 0.65rem)",
                    letterSpacing: "0.08em",
                    color: isSelected ? "#f0d060" : "rgba(240,232,216,0.9)",
                    textAlign: "center",
                    lineHeight: 1.3,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    whiteSpace: "pre-line",
                    padding: "8px 4px",
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                  }}
                >
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom intention input (appears when Other is selected) */}
        {showCustomInput && (
          <div className="animate-fade-in" style={{ maxWidth: "600px", width: "100%", margin: "16px auto 0" }}>
            <textarea
              value={customText}
              onChange={(e) => { setCustomText(e.target.value.slice(0, 200)); setSelected(e.target.value.slice(0, 200) || "Other"); }}
              placeholder="Describe your intention..."
              maxLength={200}
              rows={2}
              className="tc-input font-cormorant"
              style={{ resize: "none", fontSize: "1rem", lineHeight: 1.6 }}
            />
            <p className="font-cinzel text-right" style={{ fontSize: "0.55rem", color: "rgba(212,175,55,0.4)", marginTop: "4px", letterSpacing: "0.1em" }}>
              {customText.length}/200
            </p>
          </div>
        )}

        {/* Continue button */}
        <div className="mt-auto pt-8 pb-8 animate-fade-in-up delay-500" style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
          <TpButton onClick={handleContinue} disabled={!selected}>
            {t("intentionBtn")}
          </TpButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}
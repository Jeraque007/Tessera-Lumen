import { motion } from "framer-motion";

/**
 * CardBack - Two-column card back for on-screen display
 * Column 1: Sacred text (Title, Pillar, Purpose, Meaning, Mantra)
 * Column 2: AI Synthesis (personalized reading)
 * Both columns center-aligned, auto-balanced height
 */
export default function CardBack({ reading, synthesis, isLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-[700px] mx-auto rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 bg-[#060810]"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3)" }}
    >
      <div className="grid grid-cols-2 min-h-[400px]">
        {/* COLUMN 1: Sacred Text */}
        <div className="p-5 sm:p-6 border-r border-[#D4AF37]/20 flex flex-col justify-center">
          {/* Card Number */}
          <div className="text-center mb-4">
            <span className="text-5xl sm:text-6xl font-bold text-[#f0d060]" style={{ textShadow: "0 0 30px rgba(212,175,55,0.4)" }}>
              {reading.card.number}
            </span>
          </div>

          {/* Divider */}
          <div className="h-[2px] w-20 mx-auto mb-4" style={{ background: "linear-gradient(to right, transparent, #D4AF37, transparent)" }} />

          {/* Title */}
          <h2 className="font-cinzel text-lg sm:text-xl text-[#D4AF37] text-center uppercase tracking-[0.2em] mb-1" style={{ textShadow: "0 0 12px rgba(212,175,55,0.3)" }}>
            {reading.card.title}
          </h2>

          {/* Pillar */}
          <p className="font-cinzel text-[9px] tracking-[0.3em] text-[#D4AF37]/50 text-center uppercase mb-6">
            {reading.card.pillar}
          </p>

          {/* Purpose */}
          <div className="mb-5">
            <h4 className="font-cinzel text-[9px] tracking-[0.3em] text-[#D4AF37] text-center uppercase mb-2">Purpose</h4>
            <p className="font-cormorant text-sm sm:text-base leading-relaxed italic text-[#e8dcc8] text-center">
              {reading.card.purpose}
            </p>
          </div>

          {/* Meaning */}
          <div className="mb-5">
            <h4 className="font-cinzel text-[9px] tracking-[0.3em] text-[#D4AF37] text-center uppercase mb-2">Meaning</h4>
            <p className="font-cormorant text-sm sm:text-base leading-relaxed text-[#dcd0bc] text-center">
              {reading.card.meaning}
            </p>
          </div>

          {/* Mantra */}
          <div className="rounded-xl border border-[#D4AF37]/25 p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(45,20,80,0.3), rgba(10,12,26,0.5))" }}>
            <h4 className="font-cinzel text-[8px] tracking-[0.3em] text-[#D4AF37] uppercase mb-2">The Sacred Mantra</h4>
            <p className="font-cormorant text-sm sm:text-base italic text-[#f0d060] leading-relaxed">
              &ldquo;{reading.card.mantra}&rdquo;
            </p>
          </div>
        </div>

        {/* COLUMN 2: AI Synthesis */}
        <div className="p-5 sm:p-6 flex flex-col justify-center">
          {isLoading && !synthesis && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-t-[#D4AF37] border-[#D4AF37]/20 rounded-full animate-spin mx-auto mb-4" />
              <p className="font-cormorant text-sm italic text-[#f0d060]/60 animate-pulse">
                Channeling your reading...
              </p>
            </div>
          )}

          {synthesis && (
            <>
              {/* Header icon */}
              <div className="text-center mb-4">
                <div className="w-10 h-10 border-2 border-[#D4AF37]/40 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-[#D4AF37] text-lg">&#10022;</span>
                </div>
                <h3 className="font-cinzel text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase">
                  Your Personal Reading
                </h3>
              </div>

              {/* Synthesis text */}
              <p className="font-cormorant text-sm sm:text-base leading-relaxed text-[#dcd0bc] text-center whitespace-pre-line mb-4">
                {synthesis.length > 2000 ? synthesis.slice(0, 2000) + "\u2026" : synthesis}
              </p>

              {/* Attribution */}
              <div className="mt-auto text-center">
                <a
                  href="https://pollinations.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-cinzel text-[8px] tracking-[0.15em] text-[#D4AF37]/40 hover:text-[#D4AF37]/70 transition-colors"
                >
                  Powered by Pollinations.ai
                </a>
              </div>
            </>
          )}

          {!synthesis && !isLoading && (
            <div className="text-center opacity-30">
              <p className="font-cormorant text-sm italic text-[#D4AF37]">
                Your personal reading<br/>will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

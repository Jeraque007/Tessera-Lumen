import { motion } from "framer-motion";

/**
 * SynthesisDisplay - Shows the AI-generated personalized reading synthesis
 * Appears below the card image in the revealed phase.
 * Does NOT affect the JPG export pipeline.
 */
export default function SynthesisDisplay({ synthesis, isLoading }) {
  // Nothing to show and not loading - hide entirely
  if (!synthesis && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-[600px] mt-8 px-2"
    >
      {/* Section divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
        <h3 className="font-cinzel text-[11px] tracking-[0.4em] text-[#D4AF37]/80 uppercase">
          Your Personal Reading
        </h3>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
      </div>

      {/* Loading state */}
      {isLoading && !synthesis && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-t-[#D4AF37] border-[#D4AF37]/20 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cormorant text-sm italic text-[#f0d060]/60 animate-pulse">
            Channeling your reading...
          </p>
        </div>
      )}

      {/* Synthesis text */}
      {synthesis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#060810]/80 p-6 sm:p-8"
            style={{ boxShadow: "inset 0 0 30px rgba(212,175,55,0.03)" }}>
            <p className="font-cormorant text-base sm:text-lg leading-relaxed text-[#e8dcc8]/90"
              style={{ whiteSpace: "pre-line" }}>
              {synthesis.length > 2000 ? synthesis.slice(0, 2000) + "\u2026" : synthesis}
            </p>
          </div>

          {/* Pollinations attribution */}
          <div className="mt-4 text-center">
            <a
              href="https://pollinations.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-cinzel text-[10px] tracking-[0.15em] text-[#D4AF37]/50 hover:text-[#D4AF37]/80 transition-colors"
            >
              <span>Powered by</span>
              <span className="text-[#D4AF37]/70">Pollinations.ai</span>
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

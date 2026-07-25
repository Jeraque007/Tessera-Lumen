export default function GoldButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-8 rounded-full font-cinzel font-semibold tracking-widest text-sm
        bg-gradient-to-r from-[#8a7020] via-[#D4AF37] to-[#f0d060]
        text-[#0a0c1a] uppercase
        transition-all duration-500
        hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]
        active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed
        glow-gold animate-glow-pulse
        shimmer
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

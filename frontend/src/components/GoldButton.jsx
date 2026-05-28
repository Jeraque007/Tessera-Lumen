export default function GoldButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-8 rounded-full font-cinzel font-semibold tracking-widest text-sm
        bg-gradient-to-r from-yellow-600 via-[#D4AF37] to-yellow-500
        text-[#0a0c1a] uppercase
        transition-all duration-300
        hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]
        active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        glow-gold animate-glow-pulse
        ${className}
      `}
    >
      {children}
    </button>
  );
}

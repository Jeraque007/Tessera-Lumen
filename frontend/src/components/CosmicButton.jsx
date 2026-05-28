export default function CosmicButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-8 rounded-full font-cinzel font-semibold tracking-widest text-sm
        bg-cosmic-blue text-white uppercase
        transition-all duration-300
        hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(13,26,46,0.8)]
        active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        glow-cosmic
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default function TpButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-8 rounded-full font-cinzel font-semibold tracking-widest text-sm
        bg-tp-gradient text-white uppercase
        transition-all duration-300
        hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]
        active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        glow-tp
        ${className}
      `}
    >
      {children}
    </button>
  );
}

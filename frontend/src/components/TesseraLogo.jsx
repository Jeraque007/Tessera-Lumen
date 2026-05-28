export default function TesseraLogo({ size = "md", showEye = false, className = "" }) {
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";
  const eyeW = size === "sm" ? 30 : 40;
  const eyeH = size === "sm" ? 12 : 16;
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <span
        className={`font-cinzel font-bold ${textSize} tracking-[0.25em] leading-none`}
        style={{
          background: "linear-gradient(135deg, var(--color-gold-light) 0%, var(--color-gold) 55%, var(--color-gold-dim) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 5px rgba(var(--color-gold-rgb,212,175,55),0.4))",
        }}
      >
        TESSERA LUMEN
      </span>
      {showEye && (
        <svg width={eyeW} height={eyeH} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 0 3px rgba(var(--color-gold-rgb,212,175,55),0.45))", marginTop: "2px" }}
        >
          <path d="M2 10 Q22 0 42 10 Q22 20 2 10 Z" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.65" />
          <circle cx="22" cy="10" r="4.5" stroke="#f0d060" strokeWidth="1" fill="none" opacity="0.75" />
          <circle cx="22" cy="10" r="1.8" fill="#D4AF37" opacity="0.85" />
          <line x1="22" y1="3" x2="22" y2="1.2" stroke="#f0d060" strokeWidth="1" opacity="0.55" />
          <line x1="22" y1="17" x2="22" y2="18.8" stroke="#f0d060" strokeWidth="1" opacity="0.55" />
          <line x1="35" y1="10" x2="37" y2="10" stroke="#f0d060" strokeWidth="1" opacity="0.45" />
          <line x1="7" y1="10" x2="9" y2="10" stroke="#f0d060" strokeWidth="1" opacity="0.45" />
        </svg>
      )}
    </div>
  );
}

export default function Divider({ symbol = "" }) {
  return (
    <div className="flex items-center gap-3 w-full my-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(var(--color-gold-rgb,212,175,55),0.4)] to-transparent" />
      <span className="text-[#D4AF37] text-xs opacity-70">{symbol}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(var(--color-gold-rgb,212,175,55),0.4)] to-transparent" />
    </div>
  );
}

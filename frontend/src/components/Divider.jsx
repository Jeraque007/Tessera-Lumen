export default function Divider({ symbol = "" }) {
  return (
    <div className="flex flex-col items-center justify-center w-full my-6 gap-2">
      <div className="flex items-center w-full px-12">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
        <div className="mx-4 flex items-center justify-center">
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D4AF37] opacity-80">
            <path d="M20 0L23 7H30L24 11L26 18L20 14L14 18L16 11L10 7H17L20 0Z" fill="currentColor" fillOpacity="0.3"/>
            <path d="M0 10C5 10 7 7 10 7C13 7 15 13 20 13C25 13 27 7 30 7C33 7 35 10 40 10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5"/>
          </svg>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
      </div>
      {symbol && (
        <span className="font-cinzel text-[8px] tracking-[0.4em] text-[#D4AF37]/60 uppercase text-center block w-full px-4">
          {symbol}
        </span>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n/index.js";
import { DEEPL_LANGUAGES, fetchSupportedLanguages } from "../utils/translate.js";

// Language switcher
// - 5 static locales (EN/ES/FR/DE/PT): instant switch via i18next
// - 30+ DeepL languages: switches UI to English base, fires deepl-lang-change event
//   so components can translate card content on demand via the backend
// Modal is portalled to document.body  never clipped by parent overflow

const STATIC_CODES = new Set(SUPPORTED_LANGUAGES.map(l => l.code.toLowerCase()));

function buildMergedList(deeplLangs) {
  // Start with the 5 static locales
  const staticEntries = SUPPORTED_LANGUAGES.map(l => ({
    code: l.code.toLowerCase(),
    label: l.label,
    isStatic: true,
    deeplCode: null,
  }));

  // Add DeepL extras (exclude EN variants and anything already in static set)
  const extras = deeplLangs
    .filter(l => {
      const base = l.language.toLowerCase().split("-")[0];
      return l.language !== "EN" &&
             l.language !== "EN-GB" &&
             l.language !== "EN-US" &&
             !STATIC_CODES.has(base);
    })
    .map(l => ({
      code: l.language.toLowerCase(),
      label: l.name,
      isStatic: false,
      deeplCode: l.language,
    }));

  return [...staticEntries, ...extras].sort((a, b) => a.label.localeCompare(b.label));
}

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // Start with hardcoded DeepL list so picker is instant  refresh from API in background
  const [allLangs, setAllLangs] = useState(() => buildMergedList(DEEPL_LANGUAGES));

  useEffect(() => {
    fetchSupportedLanguages().then(live => {
      if (live && live.length > 0) setAllLangs(buildMergedList(live));
    }).catch(() => {});
  }, []);

  const currentCode = i18n.language?.split("-")[0].toLowerCase() || "en";
  const currentLang = allLangs.find(l => l.code === currentCode) || allLangs.find(l => l.code === "en") || allLangs[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return allLangs;
    const q = search.toLowerCase();
    return allLangs.filter(l =>
      l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [search, allLangs]);

  // Focus search when modal opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = async (lang) => {
    setOpen(false);
    setLoading(true);

    if (lang.isStatic) {
      // Instant switch  i18next has the full translation
      await i18n.changeLanguage(lang.code);
      localStorage.setItem("tl_lang", lang.code);
      localStorage.removeItem("tl_deepl_lang");
    } else {
      // DeepL language  switch UI to English base, signal components to translate
      const deeplCode = lang.deeplCode || lang.code.toUpperCase();
      localStorage.setItem("tl_deepl_lang", deeplCode);
      localStorage.setItem("tl_lang", "en");
      await i18n.changeLanguage("en");
      // Broadcast so any component listening can re-translate its content
      window.dispatchEvent(new CustomEvent("deepl-lang-change", { detail: { lang: deeplCode } }));
    }

    setLoading(false);
  };

  const modal = open ? createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(6,8,16,0.93)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        paddingTop: "10vh",
      }}
    >
      <div style={{ width: "calc(100% - 32px)", maxWidth: "400px", display: "flex", flexDirection: "column", maxHeight: "70vh" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontFamily:"Cinzel,serif", fontSize:"0.65rem", letterSpacing:"0.35em", color:"rgba(212,175,55,0.6)", textTransform:"uppercase", margin:"0 0 10px" }}>
            Language
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ flex:1, height:"1px", background:"linear-gradient(to right,transparent,rgba(212,175,55,0.3))" }} />
            <span style={{ color:"rgba(212,175,55,0.4)", fontSize:"0.5rem" }}>&#9670;</span>
            <div style={{ flex:1, height:"1px", background:"linear-gradient(to left,transparent,rgba(212,175,55,0.3))" }} />
          </div>
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:"14px" }}>
          <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"rgba(212,175,55,0.4)", fontSize:"0.9rem", pointerEvents:"none" }}>
            &#128269;
          </span>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search language..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "12px",
              padding: "11px 16px 11px 38px",
              color: "#f0e8d8",
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Language count */}
        <p style={{ textAlign:"center", fontFamily:"Cormorant Garamond,serif", fontSize:"0.8rem", color:"rgba(212,175,55,0.35)", fontStyle:"italic", marginBottom:"8px" }}>
          {filtered.length} language{filtered.length !== 1 ? "s" : ""} available
        </p>

        {/* List */}
        <div style={{ overflowY:"auto", flex:1, borderRadius:"12px", border:"1px solid rgba(212,175,55,0.12)", background:"rgba(10,12,26,0.6)" }}>
          {filtered.length === 0 && (
            <p style={{ textAlign:"center", padding:"24px", fontFamily:"Cormorant Garamond,serif", color:"rgba(240,232,216,0.4)", fontStyle:"italic" }}>
              No languages found
            </p>
          )}
          {filtered.map((lang, i) => {
            const isActive = currentCode === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "13px 18px",
                  background: isActive ? "rgba(212,175,55,0.1)" : "transparent",
                  border: "none",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(212,175,55,0.07)" : "none",
                  cursor: "pointer",
                  color: isActive ? "#f0d060" : "#f0e8d8",
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "1.05rem",
                  textAlign: "left",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span>{lang.label}</span>
                  {!lang.isStatic && (
                    <span style={{ fontSize:"0.6rem", color:"rgba(212,175,55,0.35)", fontFamily:"Cinzel,serif", letterSpacing:"0.1em" }}>AUTO</span>
                  )}
                </div>
                {isActive && <span style={{ color:"#D4AF37", fontSize:"0.75rem" }}>&#10003;</span>}
              </button>
            );
          })}
        </div>

        {/* Close */}
        <p
          onClick={() => setOpen(false)}
          style={{ textAlign:"center", marginTop:"16px", fontFamily:"Cinzel,serif", fontSize:"0.6rem", letterSpacing:"0.2em", color:"rgba(212,175,55,0.35)", cursor:"pointer", textTransform:"uppercase" }}
        >
          Close
        </p>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Select language"
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: "rgba(10,12,26,0.7)",
          border: "1px solid rgba(212,175,55,0.22)",
          borderRadius: "20px", padding: "5px 12px",
          cursor: "pointer", color: "#D4AF37",
          fontFamily: "Cinzel, serif", fontSize: "0.65rem", letterSpacing: "0.08em",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
          minHeight: "32px", outline: "none",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>&#127760;</span>
        <span>{loading ? "..." : currentLang.label.split(" ")[0]}</span>
      </button>
      {modal}
    </>
  );
}

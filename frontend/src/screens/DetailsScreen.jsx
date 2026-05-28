import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";
import Divider from "../components/Divider.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useTranslation } from "react-i18next";

function formatDOB(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length > 4) return d.slice(0,2) + "/" + d.slice(2,4) + "/" + d.slice(4);
  if (d.length > 2) return d.slice(0,2) + "/" + d.slice(2);
  return d;
}

export default function DetailsScreen() {
  const { goTo, setUser } = useApp();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", dob: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDOB = (e) => setForm(p => ({ ...p, dob: formatDOB(e.target.value) }));
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError(t("detailsError")); return; }
    setError(""); setLoading(true); setUser(form);
    try { await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); } catch (_) {}
    setLoading(false); goTo("intention");
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col min-h-screen px-6 py-10">
        <div className="animate-fade-in-up mb-8 text-center">
          <p className="font-cinzel text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color:"#D4AF37" }}>{t("detailsTag")}</p>
          <h2 className="font-cinzel text-2xl font-bold mb-2" style={{ background:"linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>{t("detailsTitle")}</h2>
          <p className="font-cormorant text-base italic" style={{ color:"rgba(240,232,216,0.6)" }}>{t("detailsSub")}</p>
        </div>
        <Divider />
        <div className="flex flex-col gap-5 animate-fade-in-up delay-200">
          <div>
            <label className="block font-cinzel text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color:"rgba(212,175,55,0.8)" }}>{t("detailsName")}</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={t("detailsNamePh")} className="tc-input" />
          </div>
          <div>
            <label className="block font-cinzel text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color:"rgba(212,175,55,0.8)" }}>{t("detailsEmail")}</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder={t("detailsEmailPh")} className="tc-input" />
          </div>
          <div>
            <label className="block font-cinzel text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color:"rgba(212,175,55,0.8)" }}>{t("detailsDOB")}</label>
            <input type="text" inputMode="numeric" value={form.dob} onChange={handleDOB} placeholder={t("detailsDOBPh")} maxLength={10} className="tc-input" />
            <p className="font-cormorant mt-1.5 ml-1" style={{ fontSize:"0.8rem",color:"rgba(240,232,216,0.35)" }}>{t("detailsDOBHint")}</p>
          </div>
          {error && <p className="font-cormorant text-sm text-center" style={{ color:"rgba(248,113,113,0.8)" }}>{error}</p>}
        </div>
        <div className="mt-auto pt-10 pb-8 animate-fade-in-up delay-400">
          <GoldButton onClick={handleSubmit} disabled={loading}>{loading ? t("detailsConnecting") : t("detailsBtn")}</GoldButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}
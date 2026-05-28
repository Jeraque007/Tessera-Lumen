import { formatRenewalDate } from "../utils/quota.js";

// QuotaGate  shown when a subscription user hits their daily or monthly limit
// code = "DAILY_EXHAUSTED" | "MONTHLY_EXHAUSTED"
export default function QuotaGate({ code, tomorrow, renewalDate, readsPerDay, onUpgrade, onGoHome }) {
  const isDaily   = code === "DAILY_EXHAUSTED" || (!code && !!tomorrow);
  const isMonthly = code === "MONTHLY_EXHAUSTED";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
      <div className="glass-gold rounded-2xl p-8 w-full max-w-sm">

        {/* Icon */}
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
          {isDaily ? "" : ""}
        </div>

        {/* Heading */}
        <h2
          className="font-cinzel font-bold mb-3"
          style={{
            fontSize: "clamp(1.1rem,4vw,1.3rem)",
            background: "linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {isDaily ? "Daily Limit Reached" : "Monthly Quota Reached"}
        </h2>

        {/* Message */}
        {isDaily && (
          <>
            <p className="font-cormorant text-base leading-relaxed mb-2" style={{ color: "#f0e8d8" }}>
              You have used your {readsPerDay ? `${readsPerDay} reading${readsPerDay > 1 ? "s" : ""}` : "readings"} for today.
            </p>
            <p className="font-cormorant italic text-sm mb-2" style={{ color: "rgba(212,175,55,0.8)" }}>
              Your daily reads reset tomorrow.
            </p>
            {tomorrow && (
              <p className="font-cormorant italic text-sm mb-4" style={{ color: "rgba(212,175,55,0.55)" }}>
                Come back on {tomorrow}
              </p>
            )}
          </>
        )}

        {isMonthly && (
          <>
            <p className="font-cormorant text-base leading-relaxed mb-2" style={{ color: "#f0e8d8" }}>
              You have used all your readings for this month.
            </p>
            {renewalDate && (
              <p className="font-cormorant italic text-sm mb-4" style={{ color: "rgba(212,175,55,0.7)" }}>
                Your quota resets on {formatRenewalDate(renewalDate)}
              </p>
            )}
          </>
        )}

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", margin:"16px 0" }}>
          <div style={{ flex:1, height:"1px", background:"linear-gradient(to right,transparent,rgba(212,175,55,0.3))" }} />
          <span style={{ color:"rgba(212,175,55,0.4)", fontSize:"0.5rem" }}>&#9670;</span>
          <div style={{ flex:1, height:"1px", background:"linear-gradient(to left,transparent,rgba(212,175,55,0.3))" }} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isMonthly && (
            <button
              onClick={onUpgrade}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid rgba(212,175,55,0.5)",
                background: "rgba(212,175,55,0.1)",
                color: "#f0d060",
                fontFamily: "Cinzel,serif",
                fontSize: "0.72rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                touchAction: "manipulation",
              }}
            >
              Upgrade My Plan
            </button>
          )}
          <button
            onClick={onGoHome}
            style={{
              background: "transparent",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "12px",
              padding: "12px",
              color: "rgba(240,232,216,0.5)",
              fontFamily: "Cinzel,serif",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

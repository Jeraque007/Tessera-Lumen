import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";

export default function PaymentCancelledScreen() {
  const handleRetry = () => {
    window.location.href = "/";
  };

  return (
    <ScreenWrapper>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="glass-gold rounded-2xl p-10 max-w-md w-full animate-fade-in-up">
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>&#10007;</div>
          <h1 className="font-cinzel text-2xl font-bold mb-4" style={{
            background: "linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
          }}>
            Payment Cancelled
          </h1>
          <p className="font-cormorant text-lg text-white/80 italic leading-relaxed mb-2">
            Your transaction was cancelled. No charges were made.
          </p>
          <p className="font-cormorant text-base text-white/50 italic mb-6">
            You may try again at any time.
          </p>
          <GoldButton onClick={handleRetry}>Return to App</GoldButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}
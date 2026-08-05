import SEO from "../components/SEO.jsx";
import ScreenWrapper from "../components/ScreenWrapper.jsx";
import GoldButton from "../components/GoldButton.jsx";

export default function PaymentSuccessScreen() {
  const handleContinue = () => {
    window.location.href = "/";
  };

  return (
    <ScreenWrapper>
      <SEO title="Payment Successful" description="Your payment was successful. Your Tessera Lumen tarot reading is now unlocked." path="/payment-success" noindex={true} />
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="glass-gold rounded-2xl p-10 max-w-md w-full animate-fade-in-up">
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>&#10003;</div>
          <h1 className="font-cinzel text-2xl font-bold mb-4" style={{
            background: "linear-gradient(135deg,#f0d060,#D4AF37,#8a7020)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
          }}>
            Thank You For Your Purchase
          </h1>
          <p className="font-cormorant text-lg text-white/80 italic leading-relaxed mb-6">
            Your subscription is now active. The sacred space awaits your return.
          </p>
          <GoldButton onClick={handleContinue}>Continue to Your Reading</GoldButton>
        </div>
      </div>
    </ScreenWrapper>
  );
}

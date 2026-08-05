import { Component, useState, useEffect, StrictMode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import { SplashScreen as CapSplashScreen } from "@capacitor/splash-screen";
import "./i18n/index.js";
import "./index.css";
import App from "./App.jsx";
import SplashScreen from "./components/SplashScreen.jsx";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[Fatal Error]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "#D4AF37", fontFamily: "sans-serif", textAlign: "center", background: "#0a0c1a", minHeight: "100vh" }}>
          <h1 style={{ fontSize: "24px" }}>Something went wrong.</h1>
          <p style={{ color: "rgba(240,232,216,0.6)" }}>{this.state.error?.message || "Unknown Error"}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: "20px", padding: "10px 20px", background: "#D4AF37", border: "none", borderRadius: "8px", cursor: "pointer" }}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [showSplash, setShowSplash] = useState(() => {
    // HMS COMPLIANCE & UX:
    // Do NOT show the splash screen if we are returning from a payment gateway.
    // The user expects to see their result instantly, not the boot logo again.
    const params = new URLSearchParams(window.location.search);
    const isPaymentReturn = params.has("paid") || params.has("cancelled") ||
                            params.has("deeper_paid") || params.has("deeper_cancelled");
    return !isPaymentReturn;
  });

  useEffect(() => {
    if (!showSplash) {
      // HMS COMPLIANCE & UX:
      // Once the JS-based splash is gone, ensure the native one is too.
      // This is a "double tap" to prevent hangs if one system thinks it's hidden but isn't.
      CapSplashScreen.hide().catch(() => {});
      return;
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
        {showSplash && <SplashScreen />}
        <App />
        </ErrorBoundary>
      </HelmetProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);


import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import "./i18n/index.js";
import "./index.css";
import App from "./App.jsx";

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

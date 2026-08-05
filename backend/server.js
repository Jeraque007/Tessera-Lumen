import express from "express";
import cors from "cors";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
try { require("dotenv").config(); } catch (err) { console.error("dotenv load error:", err); }

// Global Crash Guard
process.on("unhandledRejection", (reason, _promise) => {
  console.error("[Fatal] Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Fatal] Uncaught Exception:", err.message);
});

// Route Imports
import paymentRoutes from "./routes/payment.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import payfastRoutes from "./routes/payfast.js";
import fxRoutes from "./routes/fx.js";
import userRoutes from "./routes/user.js";
import utilityRoutes from "./routes/utility.js";
import promoRoutes from "./routes/promo.js";
import synthesisRoutes from "./routes/synthesis.js";
import { supabase } from "./lib/supabase.js";
import { corsOptions, generalLimiter, strictLimiter, paymentLimiter, apiKeyAuth, securityHeaders } from "./lib/security.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(generalLimiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// API Key Auth (checks origin or X-API-Key header)
app.use("/api", apiKeyAuth);

// Routes with targeted rate limits
app.use("/api/payment", paymentLimiter, paymentRoutes);
app.use("/api/subscription", strictLimiter, subscriptionRoutes);
app.use("/api/payfast", payfastRoutes);
app.use("/api/fx", fxRoutes);
app.use("/api/user", userRoutes);
app.use("/api", utilityRoutes); // Mounts /languages and /translate
app.use("/api/promo", strictLimiter, promoRoutes);
app.use("/api/synthesis", strictLimiter, synthesisRoutes);

// General Health Check
app.get("/api/health", async (_req, res) => {
  try {
    const { error } = await supabase.from("user_profiles").select("id").limit(1);
    res.json({
      status: "ok",
      supabase: error ? "error: " + error.message : "connected",
    });
  } catch (e) {
    res.json({ status: "ok", supabase: "error: " + e.message });
  }
});

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`Backend running on http://localhost:${PORT}`)
  );
}

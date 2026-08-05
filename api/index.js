// Vercel Entry Point
console.log("[Vercel] System Booting...");

// 1. CRASH GUARD
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Vercel Fatal] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Vercel Fatal] Uncaught Exception:", err.message, err.stack);
});

import express from "express";
import cors from "cors";

// 2. ROUTES
import paymentRoutes from "../backend/routes/payment.js";
import subscriptionRoutes from "../backend/routes/subscriptions.js";
import payfastRoutes from "../backend/routes/payfast.js";
import fxRoutes from "../backend/routes/fx.js";
import userRoutes from "../backend/routes/user.js";
import utilityRoutes from "../backend/routes/utility.js";
import promoRoutes from "../backend/routes/promo.js";
import synthesisRoutes from "../backend/routes/synthesis.js";

// 3. CORE
import { supabase } from "../backend/lib/supabase.js";
import { corsOptions, generalLimiter, strictLimiter, paymentLimiter, apiKeyAuth, securityHeaders } from "../backend/lib/security.js";

const app = express();

// SECURITY MIDDLEWARE
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(generalLimiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// API Key Auth
app.use("/api", apiKeyAuth);

// 4. HEALTH CHECK (stripped of sensitive info)
app.get("/api/health", async (req, res) => {
  try {
    const { error } = await supabase.from("user_profiles").select("id").limit(1);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: error ? "error" : "connected",
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Health check failed" });
  }
});

// 5. ROUTING WITH RATE LIMITS
const router = express.Router();

router.use("/payment", paymentLimiter, paymentRoutes);
router.use("/subscription", strictLimiter, subscriptionRoutes);
router.use("/payfast", payfastRoutes);
router.use("/fx", fxRoutes);
router.use("/user", userRoutes);
router.use("/promo", strictLimiter, promoRoutes);
router.use("/synthesis", strictLimiter, synthesisRoutes);
router.use("/", utilityRoutes);

// Legacy CRM mapping
app.post("/api/crm", (req, res, next) => {
  req.url = "/user/crm";
  next();
}, router);

app.use("/api", router);
app.use("/", router);

// 6. 404 CATCHER
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// 7. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("[Vercel] Request Error:", err.message);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: Origin not allowed" });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;

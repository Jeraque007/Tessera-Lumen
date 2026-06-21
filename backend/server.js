import express from "express";
import cors from "cors";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
try { require("dotenv").config(); } catch (_) {}

// Scrubbed Route Imports
import paymentRoutes from "./routes/payment.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import payfastRoutes from "./routes/payfast.js";
import fxRoutes from "./routes/fx.js";
import userRoutes from "./routes/user.js";
import utilityRoutes from "./routes/utility.js";
import { supabase } from "./lib/supabase.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
// Support PayFast's urlencoded ITN notifications
app.use(express.urlencoded({ extended: true }));

// HMS IAP Verified Endpoints (Handled by Cloudflare Worker Gateway)
app.use("/api/payment", paymentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payfast", payfastRoutes);
app.use("/api/fx", fxRoutes);
app.use("/api/user", userRoutes);
app.use("/api", utilityRoutes); // Mounts /languages and /translate


// General Health Check
app.get("/api/health", async (_req, res) => {
  const { error } = await supabase.from("user_profiles").select("id").limit(1);
  res.json({
    status: "ok",
    hms_mode: "production",
    supabase: error ? "error: " + error.message : "connected",
  });
});

app.listen(PORT, () =>
  console.log(`HMS-Scrubbed Backend running on http://localhost:${PORT}`)
);

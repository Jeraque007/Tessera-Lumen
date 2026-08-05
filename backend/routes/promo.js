import { supabase } from "../lib/supabase.js";
import { Router } from "express";

const router = Router();
const FREE_CARD_LIMIT = 100;
const MAX_CLAIMS_PER_IP = 3;
const LOW_REMAINING_THRESHOLD = 12;
const CONTACT_EMAIL = "holistic@963.co.za";

// Extract real client IP (handles proxies/Vercel/Cloudflare)
function getClientIP(req) {
  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// GET /api/promo/free-card/status - Get remaining count
router.get("/free-card/status", async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from("free_card_claims")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    const claimed = count || 0;
    const remaining = Math.max(0, FREE_CARD_LIMIT - claimed);
    const isLow = remaining > 0 && remaining <= LOW_REMAINING_THRESHOLD;
    const isExhausted = remaining === 0;

    res.json({
      remaining,
      total: FREE_CARD_LIMIT,
      claimed,
      lowRemainingThreshold: LOW_REMAINING_THRESHOLD,
      isLow,
      isExhausted,
      state: isExhausted ? "exhausted" : isLow ? "warning" : "active",
      contactEmail: CONTACT_EMAIL,
      notifyUrl: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Tessera Lumen free-card quota warning")}&body=${encodeURIComponent(`The free-card quota is running low.\n\nRemaining: ${remaining}\nTotal: ${FREE_CARD_LIMIT}\nClaimed: ${claimed}\nPlease top up the free-card pool or disable the offer before it reaches zero.`)}`
    });
  } catch (e) {
    console.error("[Promo] Status error:", e.message);
    res.status(500).json({ error: "Failed to fetch promo status" });
  }
});

// POST /api/promo/free-card/check - Check if an email has already claimed
router.post("/free-card/check", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data: existing } = await supabase
      .from("free_card_claims")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    res.json({ claimed: !!existing });
  } catch (e) {
    res.json({ claimed: false }); // Fail open - server will reject at claim time anyway
  }
});

// POST /api/promo/free-card/claim - Claim a free card (email + IP gated)
router.post("/free-card/claim", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const normalizedEmail = email.toLowerCase().trim();
  const clientIP = getClientIP(req);

  try {
    // 1. Check if this email already claimed
    const { data: existing } = await supabase
      .from("free_card_claims")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "already_claimed", message: "You have already claimed your free card." });
    }

    // 2. Check IP abuse (max 3 claims per IP - catches incognito re-use)
    const { count: ipCount } = await supabase
      .from("free_card_claims")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIP);

    if ((ipCount || 0) >= MAX_CLAIMS_PER_IP) {
      return res.status(429).json({
        error: "ip_limit_reached",
        message: "Maximum free cards claimed from this device. Please try from the app."
      });
    }

    // 3. Check if promo is still available
    const { count } = await supabase
      .from("free_card_claims")
      .select("*", { count: "exact", head: true });

    if ((count || 0) >= FREE_CARD_LIMIT) {
      return res.status(410).json({ error: "promo_ended", message: "All free cards have been claimed." });
    }

    // 4. Claim it (store email + IP)
    const { error: insertErr } = await supabase
      .from("free_card_claims")
      .insert({
        email: normalizedEmail,
        ip_address: clientIP,
        claimed_at: new Date().toISOString()
      });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return res.status(409).json({ error: "already_claimed", message: "You have already claimed your free card." });
      }
      throw insertErr;
    }

    const remaining = Math.max(0, FREE_CARD_LIMIT - (count || 0) - 1);
    res.json({ success: true, remaining });
  } catch (e) {
    console.error("[Promo] Claim error:", e.message);
    res.status(500).json({ error: "Claim failed" });
  }
});

export default router;


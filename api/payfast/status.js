import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase.from("subscriptions").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();
    const { data: deeper } = await supabase.from("deeper_readings").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();

    res.status(200).json({
      isPaid: sub?.active || false,
      planId: sub?.plan_id,
      deeperPaid: deeper?.status === "complete" || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

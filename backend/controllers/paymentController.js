import { supabase } from "../lib/supabase.js";

export const getStatus = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;
    res.json({ isPaid: data?.active || false, plan: data?.plan_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

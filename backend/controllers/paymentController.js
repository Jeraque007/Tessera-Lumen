import { supabase } from "../lib/supabase.js";
import { HuaweiIapService } from "../services/huaweiIapService.js";

const hmsService = new HuaweiIapService();

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

export const verifyHuawei = async (req, res) => {
  const { purchaseData, signature, email, name, verifyResult } = req.body;

  if (!purchaseData || !signature) {
    return res.status(400).json({ error: "Missing purchaseData or signature" });
  }

  try {
    // 1. If we received verifyResult from the Gateway, trust it (if signature is valid)
    // 2. If we didn't (direct call), perform full verification
    let result;
    if (verifyResult) {
       // Local signature verification still required for security
       const isSigValid = hmsService.verifySignature(purchaseData, signature);
       if (!isSigValid) return res.status(403).json({ success: false, error: 'SIGNATURE_INVALID' });

       // Process the trusted result
       const productId = JSON.parse(purchaseData).productId;
       await hmsService.logToDatabase({
         payment_id: JSON.parse(purchaseData).orderId || JSON.parse(purchaseData).purchaseToken,
         email: email?.toLowerCase().trim(),
         name: name || "",
         status: "COMPLETE",
         item_name: `HMS-${productId}`,
         productId: productId,
         raw_payload: {
           purchaseData,
           signature,
           hms_verified: true,
           verification_response: verifyResult,
           relay: true
         }
       });
       result = { success: true, verified: true, relay: true };
    } else {
       result = await hmsService.verifyPurchase(purchaseData, signature, { email, name });
    }

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(result.verified ? 400 : 403).json(result);
    }
  } catch (error) {
    console.error("[PaymentController] HMS Verification Error:", error);
    res.status(500).json({ error: "Internal server error during verification" });
  }
};

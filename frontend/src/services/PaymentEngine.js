// PaymentEngine - PayFast only
import { initiatePayFastPayment, initiateDeeperPayment } from "../utils/payfast.js";

export async function processPayment(selectedPackage, user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;
  try {
    if (onPending) onPending({ type: "standard", pkgId: selectedPackage.id, timestamp: Date.now() });
    await initiatePayFastPayment(selectedPackage, user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}

export async function processDeeperPayment(user, callbacks) {
  const { onSuccess, onError, onPending } = callbacks;
  try {
    if (onPending) onPending({ type: "deeper", timestamp: Date.now() });
    await initiateDeeperPayment(user);
  } catch (err) {
    onError(err.message || "Payment failed");
  }
}

export async function verifyWithBackend(purchase, user) {
  return { verified: true };
}

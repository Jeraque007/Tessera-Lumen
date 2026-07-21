import { PaymentProvider } from "./PaymentProvider.js";
import { initiatePayFastPayment, initiateDeeperPayment } from "../../utils/payfast.js";

export class PayFastProvider extends PaymentProvider {
  async isAvailable() {
    // PayFast is the fallback for Web and non-HMS Android
    return true;
  }

  async purchase(selectedPackage, user, callbacks) {
    const { onError, onPending } = callbacks;
    try {
      if (onPending) onPending({ type: "standard", pkgId: selectedPackage.id, timestamp: Date.now() });

      if (selectedPackage.id === "deeper") {
        await initiateDeeperPayment(user);
      } else {
        await initiatePayFastPayment(selectedPackage, user);
      }
    } catch (err) {
      console.error("[PayFastProvider] Initiation Failed:", err.message);
      const msg = err.message === "Failed to fetch"
        ? "Connectivity Error: Unable to reach payment gateway."
        : (err.message || "Payment initiation failed");
      onError(msg);
    }
  }
}

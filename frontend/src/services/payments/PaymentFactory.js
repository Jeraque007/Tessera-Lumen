import { HuaweiIapProvider } from "./HuaweiIapProvider.js";
import { PayFastProvider } from "./PayFastProvider.js";

export class PaymentFactory {
  static async getProvider() {
    // 1. Check if we are on a native platform
    const isNative = window.Capacitor?.isNativePlatform?.();

    if (isNative) {
      // 2. Check if HMS is available on this Android device
      const hms = new HuaweiIapProvider();
      const hmsAvailable = await hms.isAvailable();

      if (hmsAvailable) {
        console.log("[PaymentFactory] Using Huawei IAP Provider");
        return hms;
      }
    }

    // 3. Fallback to PayFast for Web and non-HMS Android
    console.log("[PaymentFactory] Using PayFast Provider");
    return new PayFastProvider();
  }
}

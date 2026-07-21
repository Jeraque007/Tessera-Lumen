import { Browser } from "@capacitor/browser";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { startNativeMusic, stopNativeMusic } from "../../utils/huaweiIap.js";

/**
 * UNIFIED PLATFORM SERVICE
 * Abstracts away the differences between Web and Native (HMS/GMS).
 */
export class PlatformService {
  static isNative() {
    return !!window.Capacitor?.isNativePlatform?.();
  }

  static async openUrl(url) {
    if (this.isNative()) {
      await Browser.open({ url });
    } else {
      window.location.href = url;
    }
  }

  static triggerHaptic() {
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  }

  /**
   * HMS COMPLIANCE: Ambient music must only start on user gesture.
   */
  static async startAmbientMusic() {
    if (this.isNative()) {
      await startNativeMusic();
    }
  }

  static async stopAmbientMusic() {
    if (this.isNative()) {
      await stopNativeMusic();
    }
  }
}

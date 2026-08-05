import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { startNativeMusic, stopNativeMusic } from "./huaweiIap.js";

class AmbientAudioManager {
  constructor() {
    this.context = null;
    this.ambientBuffer = null;
    this.shimmerBuffer = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.isPlaying = false;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) {
      if (this.context?.state === "suspended") await this.context.resume();
      return;
    }
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();

      console.log("[Audio] Initializing assets...");

      await Promise.all([
        this.loadSound("/ambient.mp3", "ambientBuffer"),
        this.loadSound("/intention-card.wav", "shimmerBuffer")
      ]);

      this.initialized = true;
      if (this.context.state === "suspended") await this.context.resume();
      console.log("[Audio] System Ready. Intention Sound:", !!this.shimmerBuffer);
    } catch (e) {
      console.error("[Audio] Init failed:", e);
    }
  }

  async loadSound(url, bufferName) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      this[bufferName] = await this.context.decodeAudioData(arrayBuffer);
      console.log(`[Audio] Loaded: ${url}`);
    } catch (e) {
      console.warn(`[Audio] Could not load ${url}. Ensure it is in /frontend/public/`);
    }
  }

  startAmbient() {
    // HMS COMPLIANCE & PERSISTENCE:
    // We trigger the native foreground service music on user action.
    // This allows music to continue during PayFast redirections.
    startNativeMusic();

    if (!this.context || this.isPlaying || !this.ambientBuffer) return;
    try {
      if (this.context.state === "suspended") this.context.resume();

      this.ambientSource = this.context.createBufferSource();
      this.ambientSource.buffer = this.ambientBuffer;
      this.ambientSource.loop = true;

      this.ambientGain = this.context.createGain();
      // Reduced volume for a pleasing, non-distracting background level
      this.ambientGain.gain.value = 0.25;

      this.ambientSource.connect(this.ambientGain);
      this.ambientGain.connect(this.context.destination);

      this.ambientSource.start(0);
      this.isPlaying = true;
      console.log("[Audio] Ambient started at low volume");
    } catch (e) {
      console.error("[Audio] Ambient failed:", e);
    }
  }

  async onCardTouch() {
    this.triggerHapticImpact();

    if (!this.context || !this.shimmerBuffer) return;

    try {
      // Ensure context is alive for the one-shot sound
      if (this.context.state === "suspended") await this.context.resume();

      const source = this.context.createBufferSource();
      source.buffer = this.shimmerBuffer;

      const gainNode = this.context.createGain();
      // High volume for the interaction "pop" to be heard over background
      gainNode.gain.value = 1.0;

      source.connect(gainNode);
      gainNode.connect(this.context.destination);

      // Use low latency start
      source.start(this.context.currentTime);
      console.log("[Audio] Playing Intention Sound (WAV)");
    } catch (e) {
      console.warn("[Audio] Touch sound failed:", e);
    }
  }

  triggerHapticImpact() {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
    } catch (e) {}
  }

  stopAmbient() {
    stopNativeMusic();
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch (e) {}
      this.ambientSource = null;
      this.isPlaying = false;
    }
  }
}

const manager = new AmbientAudioManager();
export default manager;

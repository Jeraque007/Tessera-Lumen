import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Application ID  matches android/app/build.gradle applicationId
  appId: "com.godcode963.app",
  appName: "Tessera Lumen",

  // Vite production build output directory
  webDir: "dist",

  server: {
    // Production: serve from bundled assets inside the APK
    androidScheme: "https",
    allowNavigation: [
      "sandbox.payfast.co.za",
      "www.payfast.co.za",
      "*.payfast.co.za"
    ],
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    // Set to true during development, false for production release
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a1a",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a1a",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;

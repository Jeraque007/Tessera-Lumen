# Tessera Lumen - Huawei AppGallery & HMS Setup Guide

## Overview
React + Vite web app wrapped in Capacitor 6 Android shell.
Android project: frontend/android/
Application ID: co.za.tessera.lumen

---

## Step 1 - Prerequisites (install once)

| Tool            | Version              | Download                          |
|-----------------|----------------------|-----------------------------------|
| Android Studio  | Hedgehog 2023.1+     | https://developer.android.com/studio |
| JDK             | 17 (bundled)         | Included with Android Studio      |
| Gradle          | 8.2.1 (wrapper)      | Included in android/ folder       |
| HMS Core APK    | Latest               | Pre-installed on Huawei devices   |

Node.js 22+ and npm 10+ are already installed.

---

## Step 2 - Create AppGallery Connect Project

1. Go to https://developer.huawei.com/consumer/en/appgallery
2. Sign in / register as a Huawei developer
3. AppGallery Connect > My Projects > Add Project
   - Project name: Tessera Lumen
4. Inside the project > Add App
   - Platform: Android
   - Package name: co.za.tessera.lumen
   - App name: Tessera Lumen
   - Category: Entertainment
5. Download agconnect-services.json
6. Place it at: frontend/android/app/agconnect-services.json

WARNING: This file contains secrets. It is in .gitignore - never commit it.

---

## Step 3 - Enable HMS Kits (AppGallery Connect)

In your AppGallery Connect project, enable these kits:

| Kit              | Purpose                    | Required    |
|------------------|----------------------------|-------------|
| Analytics Kit    | App analytics              | Recommended |
| Crash Service    | Crash reporting            | Recommended |
| Push Kit         | Push notifications (future)| Optional    |
| Account Kit      | User sign-in (future)      | Optional    |

To enable: Project > Build > select kit > Enable

---

## Step 4 - Open in Android Studio

From the frontend/ directory run:

  npm run android:sync     (builds web app + syncs to android/)
  npm run android:open     (opens android/ in Android Studio)

In Android Studio:
- Wait for Gradle sync to complete
- Connect a Huawei device (USB debugging on) or start an emulator
- Run > Run app

---

## Step 5 - Build APK / AAB

Debug APK (for testing):
  npm run android:build
  Output: frontend/android/app/build/outputs/apk/debug/app-debug.apk

Release AAB (for AppGallery submission):
  npm run android:release
  Output: frontend/android/app/build/outputs/bundle/release/app-release.aab

For release builds you need a keystore. See Step 6.

---

## Step 6 - Create Release Keystore

Run once. Keep the keystore file safe - it cannot be recovered:

  keytool -genkey -v -keystore tessera-lumen-release.jks ^
    -alias tessera-lumen ^
    -keyalg RSA -keysize 2048 ^
    -validity 10000

Add to frontend/android/app/build.gradle under android { signingConfigs }:

  signingConfigs {
      release {
          storeFile file('tessera-lumen-release.jks')
          storePassword 'YOUR_STORE_PASSWORD'
          keyAlias 'tessera-lumen'
          keyPassword 'YOUR_KEY_PASSWORD'
      }
  }
  buildTypes {
      release {
          signingConfig signingConfigs.release
          minifyEnabled false
      }
  }

WARNING: Never commit the .jks file or passwords to git.

---

## Step 7 - Submit to AppGallery

1. AppGallery Connect > Distribute > App Releases
2. Upload the .aab file from Step 5
3. Fill in:
   - App description
   - Screenshots (phone + tablet)
   - Privacy policy URL (link to your deployed app privacy screen)
   - Content rating questionnaire
4. Submit for review (typically 1-3 business days)

---

## Step 8 - Live Reload During Development

To use live reload on a physical Huawei device:

1. Find your machine local IP (e.g. 192.168.1.100)
2. In frontend/capacitor.config.ts uncomment:
     server: {
       url: "http://192.168.1.100:5173",
       cleartext: true,
     }
3. In frontend/android/app/src/main/res/xml/network_security_config.xml
   uncomment the dev domain block
4. Run: npm run dev
5. Run the app on device - it loads from your dev server

Remember to revert both changes before building for release.

---

## npm Scripts Reference

| Script                | What it does                                      |
|-----------------------|---------------------------------------------------|
| npm run build         | Build web app to dist/                            |
| npm run android:sync  | Build + sync web assets into Android project      |
| npm run android:open  | Open Android project in Android Studio            |
| npm run android:build | Build + sync + compile debug APK                  |
| npm run android:release | Build + sync + compile release AAB              |

---

## SDK Versions

| Setting           | Value              |
|-------------------|--------------------|
| minSdkVersion     | 22 (Android 5.1+)  |
| compileSdkVersion | 34 (Android 14)    |
| targetSdkVersion  | 34 (Android 14)    |
| HMS Core Base     | 6.11.0.302         |
| Capacitor         | 6.2.1              |
| Gradle            | 8.2.1              |

---

## Troubleshooting

Gradle sync fails with "Could not resolve com.huawei..."
  Check internet connection. Huawei Maven repo must be reachable:
  https://developer.huawei.com/repo/

App installs but shows blank screen
  Run npm run android:sync to ensure latest web assets are copied.
  Check Android Studio logcat for JS errors.

agconnect-services.json errors
  Ensure the file is in android/app/ (not android/).
  Package name must match exactly: co.za.tessera.lumen

Camera / image upload not working
  Ensure user grants CAMERA and READ_MEDIA_IMAGES permissions.
  Capacitor handles the runtime permission request automatically.

PayFast redirects not returning to app
  Deep link scheme tessera://app is registered in AndroidManifest.
  PayFast return_url uses https:// so the browser handles the redirect.

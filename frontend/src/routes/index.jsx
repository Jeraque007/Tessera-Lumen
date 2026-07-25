import { lazy } from "react";

// Standard Screens
const WelcomeScreen = lazy(() => import("../screens/WelcomeScreen"));
const DetailsScreen = lazy(() => import("../screens/DetailsScreen"));
const IntentionScreen = lazy(() => import("../screens/IntentionScreen"));
const PackagesScreen = lazy(() => import("../screens/PackagesScreen"));
const PaymentScreen = lazy(() => import("../screens/PaymentScreen"));
const RevealScreen = lazy(() => import("../screens/RevealScreen"));
const DeeperScreen = lazy(() => import("../screens/DeeperScreen"));
const PaymentSuccessScreen = lazy(() => import("../screens/PaymentSuccessScreen"));
const PaymentCancelledScreen = lazy(() => import("../screens/PaymentCancelledScreen"));

// Legal Screens
const TermsScreen = lazy(() => import("../screens/legal/TermsScreen"));
const PrivacyScreen = lazy(() => import("../screens/legal/PrivacyScreen"));
const LicensingScreen = lazy(() => import("../screens/legal/LicensingScreen"));

export const routes = {
  "welcome": WelcomeScreen,
  "home": WelcomeScreen, // Standardized
  "details": DetailsScreen,
  "intention": IntentionScreen,
  "packages": PackagesScreen,
  "payment": PaymentScreen,
  "purchase": PaymentScreen, // Standardized
  "subscription": PackagesScreen, // Standardized
  "checkout": PaymentScreen, // Standardized
  "reveal": RevealScreen,
  "deeper": DeeperScreen,
  "terms": TermsScreen,
  "privacy": PrivacyScreen,
  "licensing": LicensingScreen,
  "payment-success": PaymentSuccessScreen,
  "payment-cancelled": PaymentCancelledScreen,
  "success": PaymentSuccessScreen,
  "failed": PaymentCancelledScreen,
};

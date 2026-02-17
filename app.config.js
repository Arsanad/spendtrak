/**
 * SpendTrak App Configuration
 * Dynamic configuration for different environments
 */

// Load .env file for EAS builds - this makes all EXPO_PUBLIC_* vars available
require('dotenv').config();

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
const IS_PRODUCTION = !IS_DEV && !IS_PREVIEW;

// Get environment-specific values
const getAppName = () => {
  if (IS_DEV) return 'SpendTrak (Dev)';
  if (IS_PREVIEW) return 'SpendTrak (Preview)';
  return 'SpendTrak';
};

// IMPORTANT: Keep bundle ID consistent across all builds for OAuth to work
// OAuth providers (Google, Apple) are configured with specific bundle IDs
// Using different IDs for dev/preview would require registering separate OAuth clients
const getBundleIdentifier = () => {
  // Always use production bundle ID so OAuth works in all environments
  return 'com.spendtrak.app';
};

const getAndroidPackage = () => {
  // Always use production package name so OAuth works in all environments
  return 'com.spendtrak.app';
};

const getSupabaseUrl = () => {
  if (IS_DEV) return process.env.SUPABASE_URL_DEV || process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (IS_PREVIEW) return process.env.SUPABASE_URL_PREVIEW || process.env.EXPO_PUBLIC_SUPABASE_URL;
  return process.env.EXPO_PUBLIC_SUPABASE_URL;
};

const getSupabaseAnonKey = () => {
  if (IS_DEV) return process.env.SUPABASE_ANON_KEY_DEV || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (IS_PREVIEW) return process.env.SUPABASE_ANON_KEY_PREVIEW || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
};

// Google OAuth Client IDs
const getGoogleWebClientId = () => process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const getGoogleIosClientId = () => process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const getGoogleAndroidClientId = () => process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// RevenueCat API Keys
const getRevenueCatIosKey = () => process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const getRevenueCatAndroidKey = () => process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

module.exports = {
  name: getAppName(),
  slug: 'spendtrak',
  version: '2.0.0',
  orientation: 'default', // Supports both portrait and landscape
  icon: './assets/icon.png',
  scheme: 'spendtrak',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000', // Pure black for dark theme
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleIdentifier(),
    usesAppleSignIn: true, // Enable Sign in with Apple capability
    icon: './assets/icon-1024.png', // 1024x1024 opaque icon for App Store
    infoPlist: {
      NSCameraUsageDescription: 'SpendTrak uses your camera to scan receipts for automatic expense tracking.',
      NSPhotoLibraryUsageDescription: 'SpendTrak accesses your photos to import receipt images.',
      NSFaceIDUsageDescription: 'SpendTrak uses Face ID for secure app authentication.',
      ITSAppUsesNonExemptEncryption: false,
    },
    buildNumber: '1',
    // Universal Links - iOS App Links
    associatedDomains: [
      'applinks:spendtrak.app',
      'webcredentials:spendtrak.app',
    ],
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000', // Pure black for dark theme
    },
    package: getAndroidPackage(),
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    versionCode: 1,
    // Android App Links - Universal Links
    intentFilters: [
      // Custom scheme for OAuth callbacks (CRITICAL for auth to work)
      {
        action: 'VIEW',
        autoVerify: false,
        data: [
          {
            scheme: 'spendtrak',
            host: 'auth',
            pathPrefix: '/callback',
          },
          {
            scheme: 'spendtrak',
            host: 'auth',
            pathPrefix: '/confirm',
          },
          {
            scheme: 'spendtrak',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      // HTTPS deep links
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'spendtrak.app',
            pathPrefix: '/transaction',
          },
          {
            scheme: 'https',
            host: 'spendtrak.app',
            pathPrefix: '/auth',
          },
          {
            scheme: 'https',
            host: 'spendtrak.app',
            pathPrefix: '/settings',
          },
          {
            scheme: 'https',
            host: 'spendtrak.app',
            pathPrefix: '/budget',
          },
          {
            scheme: 'https',
            host: 'spendtrak.app',
            pathPrefix: '/goal',
          },
          {
            scheme: 'https',
            host: 'spendtrak.app',
            pathPrefix: '/invite',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-font',
    'expo-apple-authentication',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow SpendTrak to access your camera to scan receipts.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow SpendTrak to access your photos to select receipts.',
        cameraPermission: 'Allow SpendTrak to access your camera to take profile photos.',
      },
    ],
    'expo-secure-store',
    'expo-video',
    'expo-web-browser',
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: 'ebe191bf-4937-4664-8582-b2de2ad4d556',
    },
    // Environment-specific config
    environment: IS_DEV ? 'development' : IS_PREVIEW ? 'preview' : 'production',
    supabaseUrl: getSupabaseUrl(),
    supabaseAnonKey: getSupabaseAnonKey(),
    // Google OAuth
    googleWebClientId: getGoogleWebClientId(),
    googleIosClientId: getGoogleIosClientId(),
    googleAndroidClientId: getGoogleAndroidClientId(),
    // RevenueCat (In-App Purchases)
    revenuecatIosKey: getRevenueCatIosKey(),
    revenuecatAndroidKey: getRevenueCatAndroidKey(),
    enableDevTools: IS_DEV,
    enableAnalytics: IS_PRODUCTION,
    // App URLs
    privacyPolicyUrl: 'https://spendtrak.app/privacy',
    termsOfServiceUrl: 'https://spendtrak.app/terms',
    supportUrl: 'https://spendtrak.app/support',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    enabled: true,
    url: 'https://u.expo.dev/ebe191bf-4937-4664-8582-b2de2ad4d556',
    fallbackToCacheTimeout: 5000,
  },
};

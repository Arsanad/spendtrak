/**
 * Jest Environment Setup
 * Runs before test framework - sets up process.env variables
 */

// Auth providers
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-google-client-id';
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID = 'test-microsoft-client-id';

// Supabase
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// AI/ML
process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-gemini-key';

// RevenueCat (subscriptions)
process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'test-rc-ios';
process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = 'test-rc-android';

// Sentry (error monitoring)
process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/test';

// App config
process.env.EXPO_PUBLIC_APP_ENV = 'test';

// Set __DEV__ flag for tests
global.__DEV__ = true;

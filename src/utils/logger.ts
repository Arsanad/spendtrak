/**
 * Logger utility - only logs in development mode
 * Prevents console statements in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

const createLogger = (prefix: string): Logger => ({
  debug: (message: string, ...args: unknown[]) => {
    if (__DEV__) console.log(`[${prefix}] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (__DEV__) console.info(`[${prefix}] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (__DEV__) console.warn(`[${prefix}] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    // In development: log to console for debugging
    // In production: errors are captured by Sentry ErrorBoundary
    // No console output in production to prevent leaking sensitive data
    if (__DEV__) {
      console.error(`[${prefix}] ${message}`, ...args);
    } else {
      // Production: silently capture via Sentry (already configured in errorMonitoring)
      // The error boundary and captureError() handle production error reporting
      try {
        const { captureError } = require('../services/errorMonitoring');
        captureError(new Error(`[${prefix}] ${message}`), { extra: { args } });
      } catch {
        // Sentry not available, fail silently
      }
    }
  },
  group: (label: string) => {
    if (__DEV__) console.group(`[${prefix}] ${label}`);
  },
  groupEnd: () => {
    if (__DEV__) console.groupEnd();
  },
});

// Pre-configured loggers for different services
export const logger = {
  auth: createLogger('Auth'),
  storage: createLogger('Storage'),
  behavior: createLogger('Behavior'),
  api: createLogger('API'),
  navigation: createLogger('Navigation'),
  analytics: createLogger('Analytics'),
  receipt: createLogger('Receipt'),
  exchange: createLogger('Exchange'),
  supabase: createLogger('Supabase'),
  theme: createLogger('Theme'),
  currency: createLogger('Currency'),
  language: createLogger('Language'),
  transaction: createLogger('Transaction'),
  investment: createLogger('Investment'),
  gamification: createLogger('Gamification'),
  budget: createLogger('Budget'),
  general: createLogger('App'),
  // Additional namespaces
  quantum: createLogger('Quantum'),
  performance: createLogger('Performance'),
  video: createLogger('Video'),
  email: createLogger('Email'),
  haptics: createLogger('Haptics'),
  onboarding: createLogger('Onboarding'),
  threeD: createLogger('3D'),
  purchases: createLogger('Purchases'),
};

// Default export for quick usage
export default logger.general;

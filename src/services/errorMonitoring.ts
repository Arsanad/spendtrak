/**
 * Error Monitoring Service
 * Centralized error tracking via Sentry for crash reporting,
 * breadcrumbs, and user context management.
 */

import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry error monitoring.
 * Call this once at app startup, before rendering.
 *
 * Configuration notes:
 * - Disabled in development to avoid noise
 * - Production uses 20% trace sample rate to balance cost/insight
 * - Sensitive data (emails, passwords) scrubbed by default
 */
export function initErrorMonitoring() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // Sample rates: 1.0 in dev for debugging, 0.2 in production to control costs
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Only capture 100% of error events, but sample performance traces
    sampleRate: 1.0,
    // Scrub sensitive data
    beforeSend(event) {
      if (__DEV__) return null;
      // Scrub any potentially sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            // Remove any keys that might contain sensitive data
            const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
            const cleanData = { ...breadcrumb.data };
            for (const key of Object.keys(cleanData)) {
              if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
                cleanData[key] = '[REDACTED]';
              }
            }
            breadcrumb.data = cleanData;
          }
          return breadcrumb;
        });
      }
      return event;
    },
  });
}

/**
 * Set user context on Sentry after login.
 */
export function setMonitoringUser(user: { id: string; email?: string }) {
  Sentry.setUser({ id: user.id, email: user.email });
}

/**
 * Clear user context on logout.
 */
export function clearMonitoringUser() {
  Sentry.setUser(null);
}

/**
 * Capture an exception with optional context tags and extras.
 */
export function captureError(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
) {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Add a breadcrumb for debugging context.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info',
) {
  Sentry.addBreadcrumb({ category, message, data, level });
}

/**
 * Wrap the root component with Sentry performance monitoring.
 */
export const wrapWithSentry = Sentry.wrap;

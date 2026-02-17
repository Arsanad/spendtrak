/**
 * Auth Error Handler
 * Centralized handling of authentication errors across the app
 * Provides retry logic with token refresh and graceful error handling
 */

import { supabase } from '@/services/supabase';
import { logger } from '@/utils/logger';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';

// Auth error codes that should trigger token refresh
const AUTH_ERROR_CODES = ['PGRST301', 'PGRST302', '401', '403', 'JWT expired', 'invalid_token'];

// Track if we're currently refreshing to prevent multiple refreshes
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;

  const errorCode = error?.code?.toString() || '';
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status?.toString() || '';

  return (
    AUTH_ERROR_CODES.some(code =>
      errorCode.includes(code) ||
      errorMessage.includes(code.toLowerCase()) ||
      errorStatus === code
    ) ||
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('not authenticated') ||
    errorStatus === '401' ||
    errorStatus === '403'
  );
}

/**
 * Attempt to refresh the session
 * Returns true if refresh was successful, false otherwise
 */
export async function refreshSession(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      logger.auth.info('Attempting session refresh...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.auth.warn('Session refresh failed:', error.message);
        return false;
      }

      if (data?.session) {
        logger.auth.info('Session refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      logger.auth.error('Session refresh exception:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Handle auth error by attempting refresh, then redirecting if needed
 * Returns true if error was handled (session refreshed), false if user needs to re-login
 */
export async function handleAuthError(error: any): Promise<boolean> {
  if (!isAuthError(error)) {
    return false;
  }

  logger.auth.warn('Auth error detected, attempting recovery:', error?.message);

  // Try to refresh the session
  const refreshed = await refreshSession();

  if (refreshed) {
    logger.auth.info('Session recovered via refresh');
    return true;
  }

  // Refresh failed - need to redirect to login
  logger.auth.warn('Session recovery failed, redirecting to login');

  // Clear auth state and redirect
  await forceSignOut('Your session has expired. Please sign in again.');

  return false;
}

/**
 * Force sign out and redirect to auth screen
 * Used when session cannot be recovered
 */
export async function forceSignOut(message?: string): Promise<void> {
  try {
    // Import clearAllStores dynamically to avoid circular dependency
    const { clearAllStores } = await import('@/stores/authStore');

    // Clear all stores
    await clearAllStores();

    // Sign out from Supabase (will clear tokens)
    await supabase.auth.signOut();

    logger.auth.info('Forced sign out completed');

    // Navigate to welcome screen
    // Use setTimeout to ensure state is cleared before navigation
    setTimeout(() => {
      router.replace('/(auth)/welcome');
    }, 100);
  } catch (error) {
    logger.auth.error('Error during force sign out:', error);
    // Still try to navigate even if there's an error
    router.replace('/(auth)/welcome');
  }
}

/**
 * Wrapper for Supabase operations that handles auth errors with retry
 * Use this for any operation that requires authentication
 */
export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (isAuthError(error)) {
      logger.auth.info(`Auth error in ${operationName}, attempting recovery...`);

      const recovered = await handleAuthError(error);

      if (recovered) {
        // Retry the operation after successful refresh
        logger.auth.info(`Retrying ${operationName} after session refresh...`);
        return await operation();
      }

      // Session couldn't be recovered, throw a user-friendly error
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Not an auth error, rethrow
    throw error;
  }
}

/**
 * Check if we have a valid session (synchronous check from store)
 */
export function hasAuthenticatedUser(): boolean {
  const user = useAuthStore.getState().user;
  return !!user?.id;
}

/**
 * Verify session is valid (async check with Supabase)
 */
export async function verifySession(): Promise<boolean> {
  const user = useAuthStore.getState().user;

  // Dev users don't need Supabase session
  if (user?.id?.startsWith('dev-user-')) {
    return true;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}

export default {
  isAuthError,
  refreshSession,
  handleAuthError,
  forceSignOut,
  withAuthRetry,
  hasAuthenticatedUser,
  verifySession,
};

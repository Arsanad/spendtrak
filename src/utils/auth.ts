/**
 * Auth Utilities
 * Shared authentication helpers for services
 */

import { supabase } from '@/services/supabase';
import { useAuthStore, waitForAuthHydration } from '@/stores/authStore';
import { logger } from '@/utils/logger';

// Re-export authErrorHandler functions for convenience
export {
  isAuthError,
  refreshSession,
  handleAuthError,
  forceSignOut,
  withAuthRetry,
  hasAuthenticatedUser,
  verifySession
} from './authErrorHandler';

/**
 * Get the current authenticated user ID
 * For dev users (ID starts with 'dev-user-'), returns the ID from the store
 * For OAuth users, verifies the Supabase session is valid before returning
 *
 * @throws Error if no authenticated user is found
 */
export async function getAuthenticatedUserId(): Promise<string> {
  // Wait for auth store to be hydrated from AsyncStorage
  await waitForAuthHydration();

  // Check store user
  let storeUser = useAuthStore.getState().user;

  // If no user, wait and retry (handles timing issues)
  if (!storeUser) {
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      storeUser = useAuthStore.getState().user;
      if (storeUser?.id) break;
    }
  }

  // Dev mode check - user ID starts with 'dev-user-'
  // For dev users, we don't need Supabase session
  if (storeUser?.id?.startsWith('dev-user-')) {
    return storeUser.id;
  }

  // For OAuth users, verify the Supabase session is valid
  try {
    // First try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.auth.warn('Session error:', sessionError.message);
    }

    if (sessionData?.session?.user) {
      return sessionData.session.user.id;
    }

    // No valid session, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      logger.auth.warn('Session refresh failed:', refreshError.message);
    }

    if (refreshData?.session?.user) {
      return refreshData.session.user.id;
    }

    // Last resort: try getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      logger.auth.warn('getUser error:', userError.message);
    }

    if (user) {
      return user.id;
    }
  } catch (error) {
    logger.auth.error('Supabase auth check failed:', error);
  }

  throw new Error('Not authenticated');
}

/**
 * Check if the current user is a dev user (bypasses Supabase)
 */
export function isDevUser(): boolean {
  const user = useAuthStore.getState().user;
  return user?.id?.startsWith('dev-user-') || false;
}

/**
 * Verify that we have a valid Supabase session
 * Returns true if session is valid, false otherwise
 */
export async function hasValidSession(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    return !!sessionData?.session;
  } catch {
    return false;
  }
}

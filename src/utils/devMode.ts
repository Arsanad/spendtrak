/**
 * Dev Mode Utilities
 * Centralized utilities for checking dev mode status
 * Optimized to avoid repeated store access and improve performance
 */

// Import directly from authStore to avoid require cycle through stores/index.ts
import { useAuthStore } from '@/stores/authStore';

/**
 * Check if app is in dev mode (non-reactive, for use outside components)
 * This function gets the current state snapshot - use sparingly
 * For components, prefer useIsDevMode() hook instead
 */
export function isDevMode(): boolean {
  const user = useAuthStore.getState().user;
  return user?.id?.startsWith('dev-user-') || false;
}

/**
 * React hook to check dev mode status (reactive)
 * This properly subscribes to store changes and only re-renders when user changes
 * Use this inside React components for optimal performance
 */
export function useIsDevMode(): boolean {
  const userId = useAuthStore((state) => state.user?.id);
  return userId?.startsWith('dev-user-') || false;
}

/**
 * Get the current user ID if in dev mode, otherwise undefined
 * Useful for dev storage operations
 */
export function getDevUserId(): string | undefined {
  const user = useAuthStore.getState().user;
  if (user?.id?.startsWith('dev-user-')) {
    return user.id;
  }
  return undefined;
}

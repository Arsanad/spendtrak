/**
 * SPENDTRAK CINEMATIC EDITION - Entry Point
 * Redirects based on auth state using imperative navigation
 * Shows black screen only (no loading indicator) for seamless transition from intro video
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore, waitForAuthHydration } from '@/stores/authStore';
import { verifySession } from '@/utils/authErrorHandler';
import { supabase } from '@/services/supabase';
import { logger } from '@/utils/logger';
import { theme } from '@/theme';

// Timeout for session verification to prevent app startup hang
const SESSION_VERIFY_TIMEOUT_MS = 10000; // 10 seconds

export default function Index() {
  const router = useRouter();
  const { user, initialize, isInitialized, isLoading } = useAuthStore();
  const rootNavigationState = useRootNavigationState();
  const hasNavigated = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  // Initialize auth state on mount (verifies session is valid)
  const checkAuth = useCallback(async () => {
    try {
      logger.auth.info('Starting auth check...');

      // First wait for store hydration (loads persisted user data)
      await waitForAuthHydration();

      // Then initialize (sets up listener and checks session)
      if (!isInitialized) {
        await initialize();
      }

      // For non-dev users, verify the session is still valid (with timeout)
      const storeUser = useAuthStore.getState().user;
      if (storeUser && !storeUser.id.startsWith('dev-user-')) {
        setIsVerifyingSession(true);

        // Wrap verifySession in a timeout to prevent indefinite hang
        const verifyWithTimeout = async (): Promise<boolean | 'timeout'> => {
          try {
            const result = await Promise.race([
              verifySession(),
              new Promise<'timeout'>((resolve) =>
                setTimeout(() => resolve('timeout'), SESSION_VERIFY_TIMEOUT_MS)
              ),
            ]);
            return result;
          } catch (error) {
            logger.auth.warn('Session verification failed:', error);
            return false;
          }
        };

        const result = await verifyWithTimeout();
        setIsVerifyingSession(false);

        if (result === 'timeout') {
          logger.auth.warn('Session verification timed out — proceeding with cached state');
          // Don't block — use whatever auth state we have from hydration
        } else if (!result) {
          // getSession() reads from local storage, so a false result means
          // the session is genuinely absent (not a network issue).
          // Only clear if the auth store initialize has already confirmed no user.
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            logger.auth.warn('Session not found in local storage, clearing user state');
            useAuthStore.setState({ user: null, emailConnections: [] });
          }
        }
      }

      setAuthChecked(true);
      logger.auth.info('Auth check completed', {
        hasUser: !!useAuthStore.getState().user,
      });
    } catch (error) {
      logger.auth.error('Auth check error:', error);
      setAuthChecked(true); // Still mark as checked so we can proceed
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Wait for navigation state to be ready
    if (!rootNavigationState?.key) {
      return;
    }

    // Wait for auth check to complete
    if (!authChecked) {
      return;
    }

    // Don't navigate while session is being verified
    if (isVerifyingSession) {
      return;
    }

    // Only navigate once on initial load
    if (hasNavigated.current) {
      return;
    }

    // Get the latest user state
    const currentUser = useAuthStore.getState().user;

    // Navigate immediately - no delay needed since app is preloaded during video
    hasNavigated.current = true;

    if (!currentUser) {
      // Splash will be hidden by IntroVideo in the auth layout
      logger.auth.info('No user, navigating to welcome');
      router.replace('/(auth)/welcome');
    } else if (currentUser.id.startsWith('dev-user-')) {
      // Dev users skip intro — hide splash before navigating to tabs
      SplashScreen.hideAsync();
      logger.auth.info('Dev user found, navigating to main app');
      router.replace('/(tabs)');
    } else {
      // Check if email is verified before allowing access
      const checkEmailVerification = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !session.user.email_confirmed_at) {
            logger.auth.info('Email not verified, navigating to verify-email');
            // verify-email goes through auth layout which shows IntroVideo
            router.replace('/(auth)/verify-email');
            return;
          }
        } catch (e) {
          logger.auth.warn('Email verification check failed, allowing access:', e);
        }
        // Authenticated user — hide splash before navigating to tabs
        SplashScreen.hideAsync();
        logger.auth.info('User found, navigating to main app');
        router.replace('/(tabs)');
      };
      checkEmailVerification();
    }
  }, [user, rootNavigationState?.key, authChecked, isVerifyingSession, router]);

  // Show subtle loading indicator if taking too long (more than 2 seconds)
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authChecked) {
        setShowLoading(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [authChecked]);

  // Black screen with optional loading indicator for long waits
  return (
    <View style={styles.container}>
      {showLoading && !authChecked && (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.loader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    opacity: 0.5,
  },
});

// OAuth Callback Handler
// Waits for auth to be fully loaded before navigating
// Includes timeout protection to prevent indefinite hang

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { logger } from '../../src/utils/logger';

// Timeout duration before redirecting to sign-in with error
const CALLBACK_TIMEOUT_MS = 30000; // 30 seconds

export default function AuthCallbackScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    logger.auth.info('Callback screen mounted, listening for auth...');

    // Set up timeout to prevent indefinite hang
    const timeoutId = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        logger.auth.warn('Timed out waiting for auth callback after 30s');
        // Navigate to sign-in with error parameter
        router.replace('/(auth)/signin?error=callback_timeout');
      }
    }, CALLBACK_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.auth.info('Auth event:', event, 'hasNavigated:', hasNavigated.current);

      if (hasNavigated.current) return;

      if (event === 'PASSWORD_RECOVERY' && session) {
        hasNavigated.current = true;
        clearTimeout(timeoutId);
        logger.auth.info('PASSWORD_RECOVERY detected, navigating to reset-password...');
        router.replace('/(auth)/reset-password');
      } else if (event === 'SIGNED_IN' && session) {
        hasNavigated.current = true;
        clearTimeout(timeoutId); // Cancel timeout on success
        logger.auth.info('SIGNED_IN detected, initializing auth store...');

        // CRITICAL: Wait for auth store to load user BEFORE navigating
        // This prevents the race condition where root layout sees no user
        try {
          await useAuthStore.getState().initialize();
          logger.auth.info('Auth store initialized, user:', useAuthStore.getState().user?.id);
        } catch (e) {
          logger.auth.error('Initialize error:', e);
        }

        // Check if email is verified
        if (session.user && !session.user.email_confirmed_at) {
          logger.auth.info('Email not verified, navigating to verify-email...');
          router.replace('/(auth)/verify-email');
        } else {
          logger.auth.info('Navigating to tabs...');
          router.replace('/(tabs)');
        }
      }
    });

    // Also check if session already exists (in case SIGNED_IN fired before mount)
    const checkExistingSession = async () => {
      if (hasNavigated.current) return;

      const { data } = await supabase.auth.getSession();
      logger.auth.info('Existing session check:', !!data?.session);

      if (data?.session && !hasNavigated.current) {
        hasNavigated.current = true;
        clearTimeout(timeoutId); // Cancel timeout on success
        logger.auth.info('Session exists, initializing auth store...');

        try {
          await useAuthStore.getState().initialize();
          logger.auth.info('Auth store initialized, user:', useAuthStore.getState().user?.id);
        } catch (e) {
          logger.auth.error('Initialize error:', e);
        }

        // Check if email is verified
        if (data.session.user && !data.session.user.email_confirmed_at) {
          logger.auth.info('Email not verified, navigating to verify-email...');
          router.replace('/(auth)/verify-email');
        } else {
          logger.auth.info('Navigating to tabs...');
          router.replace('/(tabs)');
        }
      }
    };

    // Small delay to let auth state settle
    setTimeout(checkExistingSession, 100);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <GradientText variant="subtle" style={styles.text}>
        Completing sign in...
      </GradientText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    textAlign: 'center',
  },
});

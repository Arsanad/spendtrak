// Deep Link Handler for Auth Confirmation
// Handles email verification and password reset deep links
// Routes: spendtrak://auth/confirm and https://spendtrak.app/auth/confirm

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { Button } from '../../src/components/ui/Button';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { useTranslation } from '../../src/context/LanguageContext';
import { logger } from '../../src/utils/logger';

const CONFIRM_TIMEOUT_MS = 30000; // 30 seconds

export default function AuthConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();
  const { t } = useTranslation();
  const hasNavigated = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    logger.auth.info('Auth confirm screen mounted with params:', JSON.stringify(params));

    const timeoutId = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        setVerifying(false);
        setError(t('auth.verificationFailed'));
      }
    }, CONFIRM_TIMEOUT_MS);

    const handleConfirmation = async () => {
      try {
        // Check if there's an error from the URL
        if (params.error) {
          setVerifying(false);
          setError(params.error_description || params.error);
          return;
        }

        // Case 1: token_hash-based verification (email confirmation / magic link)
        if (params.token_hash && params.type) {
          const otpType = params.type as 'signup' | 'recovery' | 'email' | 'magiclink';
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: otpType,
          });

          if (verifyError) {
            logger.auth.error('OTP verification error:', verifyError);
            setVerifying(false);
            setError(verifyError.message);
            return;
          }

          if (hasNavigated.current) return;
          hasNavigated.current = true;
          clearTimeout(timeoutId);

          // Route based on the type of verification
          if (params.type === 'recovery') {
            // Password reset - navigate to reset password screen
            router.replace('/(auth)/reset-password');
          } else {
            // Email confirmation - initialize and go to main app
            await useAuthStore.getState().initialize();
            router.replace('/(tabs)');
          }
          return;
        }

        // Case 2: access_token + refresh_token in URL (PKCE flow)
        if (params.access_token && params.refresh_token) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

          if (sessionError) {
            logger.auth.error('Session exchange error:', sessionError);
            setVerifying(false);
            setError(sessionError.message);
            return;
          }

          if (hasNavigated.current) return;
          hasNavigated.current = true;
          clearTimeout(timeoutId);

          // Check if this is a password recovery session
          const session = data.session;
          if (session?.user?.recovery_sent_at) {
            router.replace('/(auth)/reset-password');
          } else {
            await useAuthStore.getState().initialize();
            router.replace('/(tabs)');
          }
          return;
        }

        // Case 3: No recognized params - listen for auth state change
        // (deep link may have already been processed by Supabase client)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          logger.auth.info('Auth confirm - state change:', event);
          if (hasNavigated.current) return;

          if (event === 'SIGNED_IN' && session) {
            hasNavigated.current = true;
            clearTimeout(timeoutId);
            await useAuthStore.getState().initialize();
            router.replace('/(tabs)');
          } else if (event === 'PASSWORD_RECOVERY' && session) {
            hasNavigated.current = true;
            clearTimeout(timeoutId);
            router.replace('/(auth)/reset-password');
          }
        });

        // Also check for an existing session
        const { data } = await supabase.auth.getSession();
        if (data?.session && !hasNavigated.current) {
          hasNavigated.current = true;
          clearTimeout(timeoutId);
          await useAuthStore.getState().initialize();
          router.replace('/(tabs)');
        }

        return () => subscription.unsubscribe();
      } catch (err: any) {
        logger.auth.error('Auth confirm error:', err);
        setVerifying(false);
        setError(err?.message || t('auth.verificationFailed'));
      }
    };

    handleConfirmation();

    return () => clearTimeout(timeoutId);
  }, [params, router, t]);

  const handleTryAgain = () => {
    router.replace('/(auth)/signin');
  };

  return (
    <View style={styles.container}>
      {verifying ? (
        <>
          <ActivityIndicator size="large" color={Colors.primary} />
          <GradientText variant="subtle" style={styles.text}>
            {t('auth.verifyingAccount')}
          </GradientText>
        </>
      ) : error ? (
        <>
          <GradientText variant="subtle" style={styles.errorTitle}>
            {t('auth.verificationFailed')}
          </GradientText>
          <GradientText variant="muted" style={styles.errorText}>
            {error}
          </GradientText>
          <GradientText variant="muted" style={styles.hintText}>
            {t('auth.tryAgainOrResend')}
          </GradientText>
          <Button
            variant="primary"
            size="large"
            onPress={handleTryAgain}
            style={styles.retryButton}
          >
            {t('errors.tryAgain')}
          </Button>
        </>
      ) : (
        <>
          <GradientText variant="bright" style={styles.successText}>
            {t('auth.verificationSuccessful')}
          </GradientText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  text: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  hintText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontSize: 13,
  },
  successText: {
    fontSize: 20,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 200,
  },
});

// SPENDTRAK - Email Verification Screen
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { EmailIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { logger } from '../../src/utils/logger';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const { signOut } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [email, setEmail] = useState('');
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get the user's email on mount
  useEffect(() => {
    const getEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };
    getEmail();
  }, []);

  // Start countdown timer on mount
  useEffect(() => {
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || !email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        Alert.alert(t('common.success'), t('auth.verificationResent'));
        // Restart cooldown
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        cooldownTimer.current = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              if (cooldownTimer.current) clearInterval(cooldownTimer.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      logger.auth.error('Resend verification error:', error);
      Alert.alert(t('common.error'), error?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [resendCooldown, email, t]);

  const handleCheckVerification = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        Alert.alert(t('common.error'), error.message);
        return;
      }

      if (data.session?.user?.email_confirmed_at) {
        // Email is confirmed - initialize auth store and navigate to main app
        logger.auth.info('Email verified, navigating to main app');
        await useAuthStore.getState().initialize();
        triggerBlackout(() => router.replace('/(tabs)'));
      } else {
        Alert.alert(t('common.error'), t('auth.emailNotVerified'));
      }
    } catch (error: any) {
      logger.auth.error('Check verification error:', error);
      Alert.alert(t('common.error'), error?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t, triggerBlackout, router]);

  const handleUseDifferentEmail = useCallback(async () => {
    try {
      await signOut();
      triggerBlackout(() => router.replace('/(auth)/signup'));
    } catch (error) {
      logger.auth.error('Sign out error:', error);
      triggerBlackout(() => router.replace('/(auth)/signup'));
    }
  }, [signOut, triggerBlackout, router]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <GradientTitle style={styles.title}>{t('auth.verifyEmailTitle')}</GradientTitle>
        </View>

        {/* Email Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <EmailIcon size={48} color={Colors.primary} />
          </View>
        </View>

        {/* Message */}
        <GlassCard variant="default" style={styles.messageCard}>
          <GradientText variant="subtle" style={styles.messageText}>
            {t('auth.verifyEmailMessage', { email: email || '...' })}
          </GradientText>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            onPress={handleCheckVerification}
            style={styles.actionButton}
          >
            {t('auth.iveVerified')}
          </Button>

          <Button
            variant="outline"
            size="large"
            fullWidth
            loading={loading}
            disabled={resendCooldown > 0}
            onPress={handleResend}
            style={styles.actionButton}
          >
            {resendCooldown > 0
              ? t('auth.resendIn', { seconds: String(resendCooldown) })
              : t('auth.resendVerification')}
          </Button>

          <Button
            variant="outline"
            size="large"
            fullWidth
            onPress={handleUseDifferentEmail}
            style={styles.actionButton}
          >
            {t('auth.useDifferentEmail')}
          </Button>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCard: {
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
});

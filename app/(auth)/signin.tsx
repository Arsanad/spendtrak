// SPENDTRAK CINEMATIC EDITION - Sign In Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { EmailIcon, SecurityIcon, ChevronLeftIcon } from '../../src/components/icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';
import { validateEmail, validatePassword, requestPasswordReset } from '../../src/services/auth';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, devSignIn, isLoading } = useAuthStore();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    // Validate email
    if (!email.trim()) {
      setEmailError(t('errors.requiredField'));
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError(t('errors.invalidEmail'));
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError(t('errors.requiredField'));
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(t('errors.invalidPassword'));
      isValid = false;
    }

    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(email.trim(), password);
      if (result.success) {
        // Navigate immediately — email verification status comes from sign-in result
        triggerBlackout(() => router.replace('/(tabs)'));
      } else if (result.error) {
        Alert.alert(t('common.error'), result.error);
      }
    } catch (error: any) {
      logger.auth.error('Email sign in error:', error);
      Alert.alert(t('common.error'), error?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        t('auth.resetPassword'),
        t('auth.enterYourEmail'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert(t('common.error'), t('errors.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      if (result.success) {
        Alert.alert(
          t('auth.resetPassword'),
          t('auth.passwordResetSent'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(t('common.error'), result.error || t('errors.generic'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  // SECURITY: Dev sign-in handler only works in development
  const handleDevSignIn = async () => {
    // Double-check we're in dev mode before attempting
    if (!__DEV__) {
      logger.auth.error('Dev sign in attempted in production - blocked');
      return;
    }

    try {
      const result = await devSignIn();
      if (result.success) {
        // Navigate directly — don't use triggerBlackout which can be
        // silently blocked by the transition guard if the welcome→signin
        // transition is still in progress.
        router.replace('/(tabs)');
      }
    } catch (error) {
      logger.auth.error('Dev sign in error:', error);
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <Pressable onPress={() => triggerBlackout(() => router.back())} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={Colors.text.primary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <GradientTitle style={styles.title}>{t('auth.welcomeBack')}</GradientTitle>
          <GradientText variant="subtle" style={styles.subtitle}>
            {t('auth.signInToContinue')}
          </GradientText>
        </View>

        {/* Form */}
        <GlassCard variant="default" style={styles.formCard}>
          <Input
            label={t('auth.email')}
            placeholder={t('auth.enterYourEmail')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<EmailIcon size={18} color={emailError ? Colors.semantic.error : Colors.text.tertiary} />}
            error={emailError || undefined}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.enterYourPassword')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError(null);
            }}
            secureTextEntry
            autoComplete="password"
            leftIcon={<SecurityIcon size={18} color={passwordError ? Colors.semantic.error : Colors.text.tertiary} />}
            error={passwordError || undefined}
          />

          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            onPress={handleSignIn}
            style={styles.signInButton}
          >
            {t('common.signIn')}
          </Button>

          <Pressable style={styles.forgotPassword} onPress={handleForgotPassword}>
            <GradientText variant="subtle">{t('auth.forgotPassword')}</GradientText>
          </Pressable>
        </GlassCard>

        {/* Dev Sign In - ONLY visible in development mode */}
        {__DEV__ && (
          <Button
            variant="outline"
            size="large"
            fullWidth
            style={styles.devButton}
            loading={isLoading}
            onPress={handleDevSignIn}
          >
            {t('auth.devSignIn')}
          </Button>
        )}

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <GradientText variant="muted">{t('auth.dontHaveAccount')} </GradientText>
          <Pressable onPress={() => triggerBlackout(() => router.push('/(auth)/signup' as any))}>
            <GradientText variant="bright">{t('auth.signup')}</GradientText>
          </Pressable>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    alignSelf: 'flex-start',
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
    marginBottom: Spacing.xs,
  },
  subtitle: {},
  formCard: {
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  signInButton: {
    marginTop: Spacing.md,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  devButton: {
    marginBottom: Spacing.xl,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

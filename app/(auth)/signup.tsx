// SPENDTRAK CINEMATIC EDITION - Sign Up Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { EmailIcon, SecurityIcon, ChevronLeftIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';
import { validateEmail, validatePassword, signUpWithEmail } from '../../src/services/auth';
import { supabase } from '../../src/services/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    // Validate email
    if (!email.trim()) {
      setEmailError(t('errors.requiredField'));
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError(t('errors.invalidEmail'));
      isValid = false;
    }

    // Validate password strength
    if (!password) {
      setPasswordError(t('errors.requiredField'));
      isValid = false;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.errors[0]);
        isValid = false;
      }
    }

    // Validate password confirmation
    if (!confirmPassword) {
      setConfirmPasswordError(t('errors.requiredField'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('errors.passwordMismatch'));
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(email.trim(), password);

      if (result.success) {
        if (result.user) {
          // User was created and logged in - check if email is verified
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !session.user.email_confirmed_at) {
            triggerBlackout(() => router.replace('/(auth)/verify-email'));
          } else {
            triggerBlackout(() => router.replace('/(tabs)'));
          }
        } else {
          // Email confirmation required (no session returned)
          // Navigate to verify-email screen
          triggerBlackout(() => router.replace('/(auth)/verify-email'));
        }
      } else {
        Alert.alert(t('common.error'), result.error || t('errors.generic'));
      }
    } catch (error: any) {
      logger.auth.error('Email sign up error:', error);
      Alert.alert(t('common.error'), error?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
          <GradientTitle style={styles.title}>{t('auth.createAccount')}</GradientTitle>
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
            autoComplete="new-password"
            leftIcon={<SecurityIcon size={18} color={passwordError ? Colors.semantic.error : Colors.text.tertiary} />}
            error={passwordError || undefined}
          />

          <Input
            label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError(null);
            }}
            secureTextEntry
            autoComplete="new-password"
            leftIcon={<SecurityIcon size={18} color={confirmPasswordError ? Colors.semantic.error : Colors.text.tertiary} />}
            error={confirmPasswordError || undefined}
          />

          {/* Password Requirements Hint */}
          <GradientText variant="muted" style={styles.passwordHint}>
            {t('auth.passwordRequirements')}
          </GradientText>

          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            onPress={handleSignUp}
            style={styles.signUpButton}
          >
            {t('auth.signup')}
          </Button>
        </GlassCard>

        {/* Terms */}
        <GradientText variant="muted" style={styles.terms}>
          {t('auth.agreeToTerms')}
        </GradientText>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <GradientText variant="muted">{t('auth.alreadyHaveAccount')} </GradientText>
          <Pressable onPress={() => triggerBlackout(() => router.back())}>
            <GradientText variant="bright">{t('auth.login')}</GradientText>
          </Pressable>
        </View>

        <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: Spacing.lg,
  },
  passwordHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  signUpButton: {
    marginTop: Spacing.lg,
  },
  terms: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    fontSize: 12,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

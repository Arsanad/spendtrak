// SPENDTRAK - Password Reset Completion Screen
// Reached via deep link when user clicks the password reset link in their email
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { SecurityIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { supabase } from '../../src/services/supabase';
import { validatePassword } from '../../src/services/auth';
import { logger } from '../../src/utils/logger';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  // When this screen loads via deep link, Supabase should have already
  // set the session from the recovery token in the URL via the auth callback.
  // Check that we have a valid session.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // Listen for the PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setHasSession(true);
          }
        });
        return () => subscription.unsubscribe();
      }
    };
    checkSession();
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!password) {
      setPasswordError(t('errors.requiredField'));
      isValid = false;
    } else {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setPasswordError(validation.errors[0]);
        isValid = false;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('errors.requiredField'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('errors.passwordMismatch'));
      isValid = false;
    }

    return isValid;
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) return;

    if (!hasSession) {
      Alert.alert(t('common.error'), t('auth.resetLinkExpired'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        logger.auth.error('Password update error:', error);
        Alert.alert(t('common.error'), error.message);
        return;
      }

      Alert.alert(
        t('common.success'),
        t('auth.passwordUpdated'),
        [{
          text: t('common.ok'),
          onPress: () => triggerBlackout(() => router.replace('/(auth)/signin')),
        }]
      );
    } catch (error: any) {
      logger.auth.error('Password update error:', error);
      Alert.alert(t('common.error'), t('auth.passwordUpdateFailed'));
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
          contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <GradientTitle style={styles.title}>{t('auth.resetPasswordTitle')}</GradientTitle>
            <GradientText variant="subtle" style={styles.subtitle}>
              {t('auth.passwordRequirements')}
            </GradientText>
          </View>

          {/* Form */}
          <GlassCard variant="default" style={styles.formCard}>
            <Input
              label={t('auth.newPassword')}
              placeholder={t('auth.enterNewPassword')}
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
              label={t('auth.confirmNewPassword')}
              placeholder={t('auth.confirmNewPassword')}
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

            <Button
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              onPress={handleUpdatePassword}
              style={styles.submitButton}
            >
              {t('auth.updatePassword')}
            </Button>
          </GlassCard>

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
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  formCard: {
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});

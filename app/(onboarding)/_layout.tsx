import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { lightTap } from '../../src/utils/haptics';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { completeOnboarding } from '../../src/services/onboardingOrchestrator';
import {
  WelcomeStep,
  IdentityStep,
  FinancialSnapshotStep,
  PainPointsStep,
  GoalStep,
  SmartBudgetStep,
  AIPreviewStep,
  ChoosePathStep,
} from '../../src/components/onboarding/tunnel';
import { ONBOARDING_STEP_COUNT } from '../../src/types/onboarding';
import { getBudgets } from '../../src/services/budgets';
import { getDevBudgets } from '../../src/services/devStorage';

const STEPS = [
  WelcomeStep,
  IdentityStep,
  FinancialSnapshotStep,
  PainPointsStep,
  GoalStep,
  SmartBudgetStep,
  AIPreviewStep,
  ChoosePathStep,
];

export default function OnboardingLayout() {
  const router = useRouter();
  const { currentStep, setStep, data, reset } = useOnboardingStore();
  const user = useAuthStore((s) => s.user);
  const [step, setLocalStep] = useState(currentStep);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const overlayOpacity = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  // Existing user bypass: if user already has budgets, skip tunnel
  useEffect(() => {
    const checkExistingUser = async () => {
      if (!user) return;
      try {
        const isDevUser = user.id?.startsWith('dev-user-');
        let hasBudgets = false;
        if (isDevUser) {
          const budgets = await getDevBudgets();
          hasBudgets = budgets.length > 0;
        } else {
          const budgets = await getBudgets();
          hasBudgets = budgets.length > 0;
        }
        if (hasBudgets) {
          // Existing user — auto-complete onboarding
          await useAuthStore.getState().completeOnboarding();
          useOnboardingStore.getState().markComplete();
          router.replace('/(tabs)');
        }
      } catch {
        // Ignore errors — proceed with tunnel
      }
    };
    checkExistingUser();
  }, [user]);

  const applyStepChange = useCallback((nextStep: number, dir: 'forward' | 'backward') => {
    setDirection(dir);
    setLocalStep(nextStep);
    setStep(nextStep);
    overlayOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(setIsTransitioning)(false);
    });
  }, [setStep, overlayOpacity]);

  const transitionTo = useCallback((nextStep: number, dir: 'forward' | 'backward') => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    overlayOpacity.value = withTiming(1, { duration: 200 }, (finished) => {
      if (finished) runOnJS(applyStepChange)(nextStep, dir);
    });
  }, [isTransitioning, overlayOpacity, applyStepChange]);

  const goNext = useCallback(() => {
    if (step >= STEPS.length - 1) {
      handleComplete();
      return;
    }
    transitionTo(step + 1, 'forward');
  }, [step, transitionTo]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    transitionTo(step - 1, 'backward');
  }, [step, transitionTo]);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await completeOnboarding(data);
      router.replace('/(tabs)');
    } catch (e) {
      // Even on error, try to proceed
      try {
        await useAuthStore.getState().completeOnboarding();
      } catch {}
      router.replace('/(tabs)');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = () => {
    lightTap();
    Alert.alert(
      'Skip Setup?',
      'You can always configure these settings later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await useAuthStore.getState().completeOnboarding();
              useOnboardingStore.getState().markComplete();
            } catch {}
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const CurrentStepComponent = STEPS[step];

  const enteringAnim = direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300);
  const exitingAnim = direction === 'forward' ? SlideOutLeft.duration(300) : SlideOutRight.duration(300);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header: Back button, Progress dots, Skip button */}
        <View style={styles.header}>
          {/* Back button */}
          {step > 0 ? (
            <Pressable onPress={goBack} style={styles.headerButton} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={Colors.text.secondary} />
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}

          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {Array.from({ length: ONBOARDING_STEP_COUNT }).map((_, i) => (
              <View key={i} style={styles.dotWrapper}>
                {i <= step ? (
                  <LinearGradient
                    colors={[Colors.neon, Colors.primary]}
                    style={[styles.dot, styles.dotActive]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                ) : (
                  <View style={[styles.dot, styles.dotInactive]} />
                )}
              </View>
            ))}
          </View>

          {/* Skip button */}
          {step > 0 ? (
            <Pressable onPress={handleSkip} style={styles.headerButton} hitSlop={12}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>

        {/* Step content */}
        <Animated.View
          key={`step-${step}`}
          entering={enteringAnim}
          exiting={exitingAnim}
          style={styles.stepContainer}
        >
          <CurrentStepComponent onNext={goNext} onBack={goBack} />
        </Animated.View>

        {/* Black fade overlay for luxury transitions */}
        <Animated.View style={[styles.blackOverlay, overlayStyle]} pointerEvents="none" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dotWrapper: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    // LinearGradient handles the color
  },
  dotInactive: {
    backgroundColor: Colors.transparent.deep30,
  },
  skipText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: Colors.text.tertiary,
  },
  stepContainer: {
    flex: 1,
  },
  blackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999,
  },
});

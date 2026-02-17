// SPENDTRAK CINEMATIC EDITION - Auth Layout
// Includes intro video on first launch, then onboarding slides
// Phase 8 "App emergence" — content fades in from black as IntroVideo overlay lifts
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { IntroVideo } from '../../src/components/onboarding/IntroVideo';
import OnboardingScreen from '../../src/components/onboarding/OnboardingScreen';

const ONBOARDING_KEY = 'spendtrak_onboarding_complete';

export default function AuthLayout() {
  // 'playing' = intro running, 'emerging' = Phase 8 fade-in, 'done' = intro gone
  const [introPhase, setIntroPhase] = useState<'playing' | 'emerging' | 'done'>('playing');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Phase 8 app emergence animation
  const appOpacity = useSharedValue(0);
  const appScale = useSharedValue(0.98);

  // Check if onboarding was already completed
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      if (value !== 'true') {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    }).catch(() => {
      setShowOnboarding(true);
      setOnboardingChecked(true);
    });
  }, []);

  // Phase 8 start: content renders underneath, fades in
  const handleIntroComplete = useCallback(() => {
    setIntroPhase('emerging');
    appOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    appScale.value = withTiming(1.0, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });
  }, [appOpacity, appScale]);

  // Phase 8 end: safe to remove intro overlay
  const handleIntroDismiss = useCallback(() => {
    setIntroPhase('done');
    // Snap to final values in case animation is still running
    appOpacity.value = 1;
    appScale.value = 1;
  }, [appOpacity, appScale]);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const appStyle = useAnimatedStyle(() => ({
    opacity: appOpacity.value,
    transform: [{ scale: appScale.value }],
    flex: 1,
  }));

  const renderContent = () => {
    if (!onboardingChecked) {
      return <View style={styles.container} />;
    }
    if (showOnboarding) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Content layer — rendered during Phase 8 emergence and after */}
      {introPhase !== 'playing' && (
        <Animated.View style={[styles.container, appStyle]}>
          {renderContent()}
        </Animated.View>
      )}

      {/* IntroVideo overlay — removed after Phase 8 completes */}
      {introPhase !== 'done' && (
        <IntroVideo
          onComplete={handleIntroComplete}
          onDismiss={handleIntroDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

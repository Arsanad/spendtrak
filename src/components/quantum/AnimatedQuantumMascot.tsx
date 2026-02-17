// SPENDTRAK CINEMATIC EDITION - Animated QUANTUM Mascot
// Living AI mascot with sparkles, breathing, and glow effects
// Supports tap (quick tip) and long press (detailed insights)

import React, { useEffect, useCallback, useState, memo } from 'react';
import { View, StyleSheet, Alert, AppState } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { easeInOutQuad, easeOutQuad, easeInQuad } from '../../config/easingFunctions';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../../design/cinematic';
import { QuantumRobotIcon } from './QuantumRobotIcon';
import { lightTap, mediumTap } from '@/utils/haptics';
import { useConfidenceScores, useWinStreak, useTotalWins, useBehaviorStore } from '@/stores/behaviorStore';

const AnimatedView = Animated.View;

interface AnimatedQuantumMascotProps {
  size?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

// Diamond/star sparkle component - memoized for performance
const Sparkle: React.FC<{ size: number }> = memo(({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 10 10">
    <Defs>
      <LinearGradient id="sparkleGradQ" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor={Colors.neon} />
      </LinearGradient>
    </Defs>
    {/* 4-point star/diamond shape */}
    <Path
      d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z"
      fill="url(#sparkleGradQ)"
    />
  </Svg>
));

// Memoized to prevent re-renders when parent updates
export const AnimatedQuantumMascot: React.FC<AnimatedQuantumMascotProps> = memo(({
  size = 56,
  onPress,
  onLongPress,
}) => {
  // Behavioral data for long press insights
  const confidenceScores = useConfidenceScores();
  const winStreak = useWinStreak();
  const totalWins = useTotalWins();
  const profile = useBehaviorStore((s) => s.profile);
  // Animation values
  const breatheScale = useSharedValue(1);
  const breatheY = useSharedValue(0);
  const wobble = useSharedValue(0);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);
  const sparkle3Opacity = useSharedValue(0);
  const sparkle4Opacity = useSharedValue(0);
  const sparkle1Drift = useSharedValue(0);
  const sparkle2Drift = useSharedValue(0);
  const sparkle3Drift = useSharedValue(0);
  const sparkle4Drift = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Breathing scale effect - subtle inhale/exhale
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: easeInOutQuad }),
        withTiming(0.98, { duration: 1500, easing: easeInOutQuad })
      ),
      -1,
      true
    );

    // Floating up and down (breathing movement)
    breatheY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1500, easing: easeInOutQuad }),
        withTiming(3, { duration: 1500, easing: easeInOutQuad })
      ),
      -1,
      true
    );

    // Subtle wobble/look around
    wobble.value = withRepeat(
      withSequence(
        withDelay(3000, withTiming(5, { duration: 300, easing: easeInOutQuad })),
        withTiming(-5, { duration: 600, easing: easeInOutQuad }),
        withTiming(0, { duration: 300, easing: easeInOutQuad }),
        withDelay(5000, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    // Sparkle animations - staggered timing
    const createSparkleAnimation = (delay: number) =>
      withRepeat(
        withSequence(
          withDelay(delay, withTiming(0, { duration: 0 })),
          withTiming(1, { duration: 200, easing: easeOutQuad }),
          withTiming(0, { duration: 400, easing: easeInQuad }),
          withDelay(2500, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      );

    sparkle1Opacity.value = createSparkleAnimation(0);
    sparkle2Opacity.value = createSparkleAnimation(700);
    sparkle3Opacity.value = createSparkleAnimation(1400);
    sparkle4Opacity.value = createSparkleAnimation(2100);

    // Sparkle drift animations - each sparkle floats in a small loop
    const createDriftAnimation = (delay: number, distance: number, duration: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(distance, { duration, easing: easeInOutQuad }),
            withTiming(-distance, { duration, easing: easeInOutQuad })
          ),
          -1,
          true
        )
      );

    sparkle1Drift.value = createDriftAnimation(0, 6, 2000);
    sparkle2Drift.value = createDriftAnimation(500, 5, 2400);
    sparkle3Drift.value = createDriftAnimation(300, 7, 1800);
    sparkle4Drift.value = createDriftAnimation(800, 5, 2200);

    // Cleanup all animations on unmount to prevent memory leaks
    return () => {
      cancelAnimation(breatheScale);
      cancelAnimation(breatheY);
      cancelAnimation(wobble);
      cancelAnimation(sparkle1Opacity);
      cancelAnimation(sparkle2Opacity);
      cancelAnimation(sparkle3Opacity);
      cancelAnimation(sparkle4Opacity);
      cancelAnimation(sparkle1Drift);
      cancelAnimation(sparkle2Drift);
      cancelAnimation(sparkle3Drift);
      cancelAnimation(sparkle4Drift);
      cancelAnimation(pressScale);
    };
  }, []);

  // Pause animations when app is backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // Cancel animations when app is backgrounded
        cancelAnimation(breatheScale);
        cancelAnimation(breatheY);
        cancelAnimation(wobble);
        cancelAnimation(sparkle1Opacity);
        cancelAnimation(sparkle2Opacity);
        cancelAnimation(sparkle3Opacity);
        cancelAnimation(sparkle4Opacity);
        cancelAnimation(sparkle1Drift);
        cancelAnimation(sparkle2Drift);
        cancelAnimation(sparkle3Drift);
        cancelAnimation(sparkle4Drift);
      }
    });

    return () => subscription.remove();
  }, []);

  // Animated styles
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breatheScale.value * pressScale.value },
      { translateY: breatheY.value },
      { rotate: `${wobble.value}deg` },
    ],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
    transform: [
      { scale: interpolate(sparkle1Opacity.value, [0, 1], [0.5, 1]) },
      { translateX: sparkle1Drift.value },
      { translateY: -sparkle1Drift.value * 0.7 },
    ],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
    transform: [
      { scale: interpolate(sparkle2Opacity.value, [0, 1], [0.5, 1]) },
      { translateX: -sparkle2Drift.value * 0.5 },
      { translateY: sparkle2Drift.value },
    ],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3Opacity.value,
    transform: [
      { scale: interpolate(sparkle3Opacity.value, [0, 1], [0.5, 1]) },
      { translateX: sparkle3Drift.value * 0.8 },
      { translateY: sparkle3Drift.value * 0.6 },
    ],
  }));

  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4Opacity.value,
    transform: [
      { scale: interpolate(sparkle4Opacity.value, [0, 1], [0.5, 1]) },
      { translateX: -sparkle4Drift.value },
      { translateY: -sparkle4Drift.value * 0.5 },
    ],
  }));

  const sparkleSize = 8;

  // Handle tap with haptic feedback (no sound - just vibration)
  const handleTap = useCallback(() => {
    lightTap();
    onPress();
  }, [onPress]);

  // Handle long press - show behavioral insights
  const handleLongPress = useCallback(() => {
    mediumTap();

    // If custom onLongPress provided, use it
    if (onLongPress) {
      onLongPress();
      return;
    }

    // Default: Show behavioral stats as an Alert
    const activeBehavior = profile?.active_behavior;
    const streak = winStreak || 0;
    const wins = totalWins || 0;

    // Build insights message
    let insights = '';

    if (streak > 0) {
      insights += `🔥 ${streak} day win streak!\n`;
    }

    if (wins > 0) {
      insights += `🏆 ${wins} total wins achieved\n`;
    }

    if (activeBehavior) {
      const behaviorLabels: Record<string, string> = {
        small_recurring: 'small purchases',
        stress_spending: 'stress spending',
        end_of_month: 'end-of-month spending',
      };
      const label = behaviorLabels[activeBehavior] || activeBehavior;
      const confidence = confidenceScores?.[activeBehavior] || 0;
      insights += `📊 Monitoring: ${label}\n`;
      insights += `🎯 Confidence: ${Math.round(confidence * 100)}%\n`;
    }

    if (!insights) {
      insights = "I'm still learning your spending patterns.\nKeep tracking your expenses!";
    }

    Alert.alert(
      '🤖 QUANTUM Insights',
      insights.trim(),
      [{ text: 'Got it!', style: 'default' }],
      { cancelable: true }
    );
  }, [onLongPress, profile, winStreak, totalWins, confidenceScores]);

  // Combined tap and long press gesture
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      pressScale.value = withTiming(0.9, { duration: 100 });
    })
    .onEnd(() => {
      runOnJS(handleTap)();
    })
    .onFinalize(() => {
      pressScale.value = withTiming(1, { duration: 150 });
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onBegin(() => {
      pressScale.value = withTiming(0.85, { duration: 200 });
    })
    .onEnd(() => {
      runOnJS(handleLongPress)();
    })
    .onFinalize(() => {
      pressScale.value = withTiming(1, { duration: 150 });
    });

  // Combine gestures - long press takes priority
  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={styles.pressable}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="QUANTUM AI Assistant"
        accessibilityHint="Tap for quick tip, hold for detailed insights"
      >
      <View style={[styles.container, { width: size * 1.4, height: size * 1.4 }]}>
        {/* The QUANTUM mascot with breathing animation */}
        <AnimatedView style={mascotStyle}>
          <QuantumRobotIcon
            size={size}
            showGlow={false}
            inGlassSphere={true}
            sphereGlowIntensity="subtle"
          />
        </AnimatedView>

        {/* Sparkle particles around QUANTUM */}
        <AnimatedView style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
          <Sparkle size={sparkleSize} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
          <Sparkle size={sparkleSize * 0.7} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>
          <Sparkle size={sparkleSize * 0.8} />
        </AnimatedView>
        <AnimatedView style={[styles.sparkle, styles.sparkle4, sparkle4Style]}>
          <Sparkle size={sparkleSize * 0.6} />
        </AnimatedView>
      </View>
    </Animated.View>
  </GestureDetector>
  );
});

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: '5%',
    right: '10%',
  },
  sparkle2: {
    top: '20%',
    left: '5%',
  },
  sparkle3: {
    bottom: '15%',
    right: '5%',
  },
  sparkle4: {
    bottom: '10%',
    left: '15%',
  },
});

export default AnimatedQuantumMascot;

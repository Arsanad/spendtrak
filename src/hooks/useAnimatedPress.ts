/**
 * useAnimatedPress - Hook for press animations
 * Provides scale, opacity, and shadow animations for pressable elements
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PREMIUM_TOKENS } from '@/design/tokens';

const { motion, animationValues } = PREMIUM_TOKENS;

interface UseAnimatedPressOptions {
  scalePressed?: number;
  hapticFeedback?: boolean;
  springConfig?: typeof motion.spring.snappy;
}

export function useAnimatedPress(options: UseAnimatedPressOptions = {}) {
  const {
    scalePressed = animationValues.scale.pressed,
    hapticFeedback = true,
    springConfig = motion.spring.snappy,
  } = options;

  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, springConfig);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback, springConfig]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, motion.spring.gentle);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, scalePressed],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.95],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [0.3, 0.15],
      Extrapolation.CLAMP
    );

    return {
      shadowOpacity,
    };
  });

  return {
    pressed,
    handlePressIn,
    handlePressOut,
    animatedStyle,
    shadowStyle,
  };
}

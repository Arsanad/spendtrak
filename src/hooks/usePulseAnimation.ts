/**
 * usePulseAnimation - Hook for pulsing/breathing animations
 * Perfect for attention-grabbing elements like notifications, badges, or CTAs
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { PREMIUM_TOKENS } from '@/design/tokens';

const { motion } = PREMIUM_TOKENS;

interface UsePulseAnimationOptions {
  minScale?: number;
  maxScale?: number;
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
  autoStart?: boolean;
}

export function usePulseAnimation(options: UsePulseAnimationOptions = {}) {
  const {
    minScale = 1,
    maxScale = 1.05,
    minOpacity = 0.8,
    maxOpacity = 1,
    duration = 1500,
    autoStart = true,
  } = options;

  const pulse = useSharedValue(0);

  // Start the pulse animation
  const start = () => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0, { duration })
      ),
      -1,
      true
    );
  };

  // Stop the animation
  const stop = () => {
    cancelAnimation(pulse);
    pulse.value = 0;
  };

  // Pause at current state
  const pause = () => {
    cancelAnimation(pulse);
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      cancelAnimation(pulse);
    };
  }, [autoStart]);

  // Animated style with scale
  const scaleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulse.value,
      [0, 1],
      [minScale, maxScale],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  // Animated style with opacity
  const opacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pulse.value,
      [0, 1],
      [minOpacity, maxOpacity],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Combined scale and opacity
  const combinedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulse.value,
      [0, 1],
      [minScale, maxScale],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      pulse.value,
      [0, 1],
      [minOpacity, maxOpacity],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Glow style for shadow animations
  const glowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      pulse.value,
      [0, 1],
      [0.2, 0.5],
      Extrapolation.CLAMP
    );

    const shadowRadius = interpolate(
      pulse.value,
      [0, 1],
      [10, 20],
      Extrapolation.CLAMP
    );

    return {
      shadowOpacity,
      shadowRadius,
    };
  });

  return {
    pulse,
    start,
    stop,
    pause,
    scaleStyle,
    opacityStyle,
    combinedStyle,
    glowStyle,
  };
}

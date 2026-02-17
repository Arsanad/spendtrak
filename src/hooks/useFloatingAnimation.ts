/**
 * useFloatingAnimation - Hook for floating/bobbing animations
 * Creates a gentle floating effect like items hovering in the air
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
import { easeInOutQuad } from '../config/easingFunctions';

const { motion } = PREMIUM_TOKENS;

interface UseFloatingAnimationOptions {
  floatHeight?: number;
  duration?: number;
  autoStart?: boolean;
  includeRotation?: boolean;
  rotationDegrees?: number;
}

export function useFloatingAnimation(options: UseFloatingAnimationOptions = {}) {
  const {
    floatHeight = 8,
    duration = 2000,
    autoStart = true,
    includeRotation = false,
    rotationDegrees = 2,
  } = options;

  const float = useSharedValue(0);

  // Start the floating animation
  const start = () => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration,
          easing: easeInOutQuad,
        }),
        withTiming(0, {
          duration,
          easing: easeInOutQuad,
        })
      ),
      -1,
      true
    );
  };

  // Stop the animation
  const stop = () => {
    cancelAnimation(float);
    float.value = 0;
  };

  // Pause at current state
  const pause = () => {
    cancelAnimation(float);
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      cancelAnimation(float);
    };
  }, [autoStart]);

  // Basic floating style (just translateY)
  const floatStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      float.value,
      [0, 1],
      [0, -floatHeight],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  // Floating with rotation
  const floatWithRotationStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      float.value,
      [0, 0.5, 1],
      [0, -floatHeight, 0],
      Extrapolation.CLAMP
    );

    const rotate = includeRotation
      ? interpolate(
          float.value,
          [0, 0.5, 1],
          [0, rotationDegrees, 0],
          Extrapolation.CLAMP
        )
      : 0;

    return {
      transform: [
        { translateY },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Shadow style that changes with float
  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      float.value,
      [0, 1],
      [0.2, 0.1],
      Extrapolation.CLAMP
    );

    const shadowScale = interpolate(
      float.value,
      [0, 1],
      [1, 0.85],
      Extrapolation.CLAMP
    );

    return {
      opacity: shadowOpacity,
      transform: [{ scaleX: shadowScale }],
    };
  });

  return {
    float,
    start,
    stop,
    pause,
    floatStyle,
    floatWithRotationStyle,
    shadowStyle,
  };
}

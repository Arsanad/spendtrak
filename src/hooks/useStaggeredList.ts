/**
 * useStaggeredList - Hook for staggered list animations
 * Provides animated values and styles for list item entrance animations
 */

import { useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { PREMIUM_TOKENS } from '@/design/tokens';

const { motion } = PREMIUM_TOKENS;

interface UseStaggeredListOptions {
  itemCount: number;
  staggerDelay?: number;
  animationType?: 'timing' | 'spring';
  direction?: 'up' | 'down' | 'left' | 'right';
  translateDistance?: number;
  duration?: number;
}

interface StaggeredItemStyle {
  opacity: number;
  transform: { translateY: number }[] | { translateX: number }[];
}

export function useStaggeredList(options: UseStaggeredListOptions) {
  const {
    itemCount,
    staggerDelay = motion.stagger.normal,
    animationType = 'spring',
    direction = 'up',
    translateDistance = 20,
    duration = motion.normal,
  } = options;

  // Create shared values for each item
  const progress = useSharedValue(0);

  // Start animation on mount
  useEffect(() => {
    if (animationType === 'spring') {
      progress.value = withSpring(1, motion.spring.gentle);
    } else {
      progress.value = withTiming(1, { duration: duration + (staggerDelay * itemCount) });
    }
  }, [itemCount]);

  // Generate animated style for a specific index
  const getAnimatedStyle = (index: number) => {
    'worklet';

    const delay = index * staggerDelay;
    const normalizedProgress = Math.max(0, Math.min(1, (progress.value * (duration + staggerDelay * itemCount) - delay) / duration));

    const opacity = interpolate(
      normalizedProgress,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    let translateValue = 0;
    switch (direction) {
      case 'up':
        translateValue = interpolate(normalizedProgress, [0, 1], [translateDistance, 0], Extrapolation.CLAMP);
        return { opacity, transform: [{ translateY: translateValue }] };
      case 'down':
        translateValue = interpolate(normalizedProgress, [0, 1], [-translateDistance, 0], Extrapolation.CLAMP);
        return { opacity, transform: [{ translateY: translateValue }] };
      case 'left':
        translateValue = interpolate(normalizedProgress, [0, 1], [translateDistance, 0], Extrapolation.CLAMP);
        return { opacity, transform: [{ translateX: translateValue }] };
      case 'right':
        translateValue = interpolate(normalizedProgress, [0, 1], [-translateDistance, 0], Extrapolation.CLAMP);
        return { opacity, transform: [{ translateX: translateValue }] };
    }
  };

  // Hook to get animated style for individual items
  const useItemAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const delay = index * staggerDelay;
      const totalDuration = duration + staggerDelay * itemCount;
      const itemProgress = progress.value * totalDuration;
      const normalizedProgress = Math.max(0, Math.min(1, (itemProgress - delay) / duration));

      const opacity = interpolate(
        normalizedProgress,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP
      );

      let translateValue = 0;
      switch (direction) {
        case 'up':
          translateValue = interpolate(normalizedProgress, [0, 1], [translateDistance, 0], Extrapolation.CLAMP);
          return { opacity, transform: [{ translateY: translateValue }] };
        case 'down':
          translateValue = interpolate(normalizedProgress, [0, 1], [-translateDistance, 0], Extrapolation.CLAMP);
          return { opacity, transform: [{ translateY: translateValue }] };
        case 'left':
          translateValue = interpolate(normalizedProgress, [0, 1], [translateDistance, 0], Extrapolation.CLAMP);
          return { opacity, transform: [{ translateX: translateValue }] };
        case 'right':
          translateValue = interpolate(normalizedProgress, [0, 1], [-translateDistance, 0], Extrapolation.CLAMP);
          return { opacity, transform: [{ translateX: translateValue }] };
        default:
          return { opacity };
      }
    });
  };

  // Reset animation
  const reset = () => {
    progress.value = 0;
  };

  // Replay animation
  const replay = () => {
    progress.value = 0;
    if (animationType === 'spring') {
      progress.value = withSpring(1, motion.spring.gentle);
    } else {
      progress.value = withTiming(1, { duration: duration + (staggerDelay * itemCount) });
    }
  };

  return {
    progress,
    useItemAnimatedStyle,
    reset,
    replay,
  };
}

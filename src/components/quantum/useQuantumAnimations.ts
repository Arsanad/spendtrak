/**
 * QUANTUM Animation Hooks
 * Reanimated-based animations for the living QUANTUM character
 * Makes QUANTUM fly, bounce, celebrate, and feel ALIVE!
 */

import { useCallback, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
  runOnJS,
  type SharedValue,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { easeOutQuad, easeInOutQuad, easeInOutSine } from '../../config/easingFunctions';
import type { ViewStyle } from 'react-native';
import type { QuantumState, QuantumAnimation, QuantumPosition } from '@/context/QuantumContext';
import { QUANTUM_POSITIONS, QUANTUM_SIZES } from '@/context/QuantumContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spring configs for different animation feels
const SPRING_CONFIGS = {
  snappy: { damping: 12, stiffness: 200 },
  bouncy: { damping: 8, stiffness: 150 },
  gentle: { damping: 15, stiffness: 100 },
  celebration: { damping: 6, stiffness: 180 },
};

interface UseQuantumAnimationsReturn {
  // Animated values
  animatedX: SharedValue<number>;
  animatedY: SharedValue<number>;
  animatedScale: SharedValue<number>;
  animatedRotation: SharedValue<number>;
  animatedOpacity: SharedValue<number>;
  glowIntensity: SharedValue<number>;

  // Animated style
  quantumAnimatedStyle: AnimatedStyle<ViewStyle>;
  glowAnimatedStyle: AnimatedStyle<ViewStyle>;

  // Animation triggers
  animateToPosition: (x: number, y: number, scale?: number) => void;
  animateBounce: () => void;
  animateCelebrate: () => void;
  animateSpeak: () => void;
  animateWiggle: () => void;
  animateLookAround: () => void;
  animateIdle: () => void;
  stopAnimations: () => void;
}

export const useQuantumAnimations = (state: QuantumState): UseQuantumAnimationsReturn => {
  // Animated values
  const animatedX = useSharedValue(state.x);
  const animatedY = useSharedValue(state.y);
  const animatedScale = useSharedValue(state.scale);
  const animatedRotation = useSharedValue(0);
  const animatedOpacity = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  // Bounce offset for idle/speaking
  const bounceOffset = useSharedValue(0);
  const wobbleRotation = useSharedValue(0);

  // Refs for idle animation interval
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Update position when state changes
  useEffect(() => {
    animateToPosition(state.x, state.y, state.scale);
  }, [state.x, state.y, state.scale]);

  // Handle animation state changes
  useEffect(() => {
    if (state.isAnimating) {
      switch (state.currentAnimation) {
        case 'bounce':
          animateBounce();
          break;
        case 'celebrate':
          animateCelebrate();
          break;
        case 'speak':
          animateSpeak();
          break;
        case 'wiggle':
          animateWiggle();
          break;
        case 'lookAround':
          animateLookAround();
          break;
        case 'flyToCenter':
        case 'returnToCorner':
          // Position animation handled by animateToPosition
          break;
      }
    }
  }, [state.currentAnimation, state.isAnimating]);

  // Start/stop idle animations
  useEffect(() => {
    if (state.position === 'corner' && !state.isAnimating && !state.isSpeaking) {
      startIdleAnimations();
    } else {
      stopIdleAnimations();
    }

    return () => stopIdleAnimations();
  }, [state.position, state.isAnimating, state.isSpeaking]);

  // Animate glow based on emotion
  useEffect(() => {
    const glowValue =
      state.emotion === 'celebrating' ? 1 :
      state.emotion === 'happy' ? 0.6 :
      state.emotion === 'alert' ? 0.8 :
      state.emotion === 'thinking' ? 0.4 :
      0.2;

    glowIntensity.value = withTiming(glowValue, { duration: 300 });
  }, [state.emotion]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopIdleAnimations();
    };
  }, []);

  // Animate to a specific position
  const animateToPosition = useCallback((x: number, y: number, scale: number = 1) => {
    animatedX.value = withSpring(x, SPRING_CONFIGS.snappy);
    animatedY.value = withSpring(y, SPRING_CONFIGS.snappy);
    animatedScale.value = withSpring(scale, SPRING_CONFIGS.snappy);
  }, []);

  // Bounce animation (for acknowledgments)
  const animateBounce = useCallback(() => {
    bounceOffset.value = withSequence(
      withSpring(-25, SPRING_CONFIGS.bouncy),
      withSpring(0, { damping: 10, stiffness: 200 }),
      withSpring(-12, { damping: 12, stiffness: 180 }),
      withSpring(0, { damping: 15, stiffness: 150 }),
    );

    // Scale pulse
    animatedScale.value = withSequence(
      withSpring(state.scale * 1.15, SPRING_CONFIGS.bouncy),
      withSpring(state.scale, { damping: 10, stiffness: 200 }),
    );

    // Glow pulse
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0.6, { duration: 300 }),
    );
  }, [state.scale]);

  // Celebration animation (for wins)
  const animateCelebrate = useCallback(() => {
    // Big scale pulse
    animatedScale.value = withSequence(
      withSpring(state.scale * 1.3, SPRING_CONFIGS.celebration),
      withSpring(state.scale, { damping: 8, stiffness: 150 }),
    );

    // Multiple bounces
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 200, easing: easeOutQuad }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.bounce) }),
      ),
      3,
      false
    );

    // Rotation wiggle
    wobbleRotation.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 100 }),
        withTiming(15, { duration: 100 }),
      ),
      6,
      true
    );

    // Max glow
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(1500, withTiming(0.4, { duration: 400 })),
    );
  }, [state.scale]);

  // Speaking animation
  const animateSpeak = useCallback(() => {
    // Small bounce
    bounceOffset.value = withSequence(
      withSpring(-15, { damping: 10, stiffness: 300 }),
      withSpring(0, { damping: 12, stiffness: 200 }),
    );

    // Scale pulse
    animatedScale.value = withSequence(
      withSpring(state.scale * 1.08, { damping: 10, stiffness: 300 }),
      withSpring(state.scale * 1.02, { damping: 12, stiffness: 200 }),
    );

    // Small wiggle
    wobbleRotation.value = withSequence(
      withTiming(-5, { duration: 80 }),
      withTiming(5, { duration: 80 }),
      withTiming(-3, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );

    // Glow
    glowIntensity.value = withTiming(0.7, { duration: 200 });
  }, [state.scale]);

  // Wiggle animation
  const animateWiggle = useCallback(() => {
    wobbleRotation.value = withSequence(
      withTiming(-8, { duration: 80 }),
      withTiming(8, { duration: 80 }),
      withTiming(-5, { duration: 60 }),
      withTiming(5, { duration: 60 }),
      withTiming(0, { duration: 80 }),
    );
  }, []);

  // Look around animation
  const animateLookAround = useCallback(() => {
    wobbleRotation.value = withSequence(
      withTiming(-10, { duration: 400, easing: easeInOutQuad }),
      withDelay(200, withTiming(10, { duration: 400, easing: easeInOutQuad })),
      withDelay(200, withTiming(0, { duration: 300, easing: easeInOutQuad })),
    );
  }, []);

  // Idle breathing/floating animation
  const animateIdle = useCallback(() => {
    // Gentle floating
    bounceOffset.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000, easing: easeInOutSine }),
        withTiming(4, { duration: 2000, easing: easeInOutSine }),
      ),
      -1,
      true
    );

    // Subtle scale breathing
    animatedScale.value = withRepeat(
      withSequence(
        withTiming(state.scale * 1.02, { duration: 2500, easing: easeInOutSine }),
        withTiming(state.scale, { duration: 2500, easing: easeInOutSine }),
      ),
      -1,
      true
    );
  }, [state.scale]);

  // Start idle animations
  const startIdleAnimations = useCallback(() => {
    animateIdle();

    // Random idle behaviors every 5-10 seconds
    idleIntervalRef.current = setInterval(() => {
      if (!isMounted.current) return;

      const behaviors = ['wiggle', 'lookAround', 'nothing', 'nothing'];
      const random = behaviors[Math.floor(Math.random() * behaviors.length)];

      if (random === 'wiggle') {
        animateWiggle();
      } else if (random === 'lookAround') {
        animateLookAround();
      }
    }, 5000 + Math.random() * 5000);
  }, [animateIdle, animateWiggle, animateLookAround]);

  // Stop idle animations
  const stopIdleAnimations = useCallback(() => {
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
  }, []);

  // Stop all animations
  const stopAnimations = useCallback(() => {
    stopIdleAnimations();
    cancelAnimation(bounceOffset);
    cancelAnimation(wobbleRotation);
    bounceOffset.value = 0;
    wobbleRotation.value = 0;
  }, [stopIdleAnimations]);

  // Combined animated style for QUANTUM
  const quantumAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: animatedX.value - SCREEN_WIDTH / 2 },
        { translateY: animatedY.value + bounceOffset.value - SCREEN_HEIGHT / 2 },
        { scale: animatedScale.value },
        { rotate: `${wobbleRotation.value + animatedRotation.value}deg` },
      ],
      opacity: animatedOpacity.value,
    };
  });

  // Glow effect style
  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowIntensity.value,
      transform: [{ scale: interpolate(glowIntensity.value, [0, 1], [1, 1.3]) }],
    };
  });

  return {
    animatedX,
    animatedY,
    animatedScale,
    animatedRotation,
    animatedOpacity,
    glowIntensity,
    quantumAnimatedStyle,
    glowAnimatedStyle,
    animateToPosition,
    animateBounce,
    animateCelebrate,
    animateSpeak,
    animateWiggle,
    animateLookAround,
    animateIdle,
    stopAnimations,
  };
};

export default useQuantumAnimations;

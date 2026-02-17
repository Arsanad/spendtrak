/**
 * QUANTUM Acknowledgment Toast
 * A subtle, brief notification that appears after every transaction
 * Makes QUANTUM feel "alive" and present
 *
 * Design:
 * - Small, minimal, non-intrusive
 * - Fade in, stay 1.5s, fade out
 * - No interaction needed
 * - SEPARATE from behavioral interventions
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { easeOutQuad, easeInQuad } from '../../config/easingFunctions';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@/design/cinematic';

export interface QuantumAcknowledgmentProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

// Timing constants
const FADE_IN_DURATION = 200;
const DISPLAY_DURATION = 1500;
const FADE_OUT_DURATION = 300;
const TOTAL_DURATION = FADE_IN_DURATION + DISPLAY_DURATION + FADE_OUT_DURATION;

export const QuantumAcknowledgment: React.FC<QuantumAcknowledgmentProps> = ({
  message,
  visible,
  onHide,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (visible && message) {
      // Animate in
      opacity.value = withSequence(
        // Fade in
        withTiming(1, { duration: FADE_IN_DURATION, easing: easeOutQuad }),
        // Hold
        withDelay(
          DISPLAY_DURATION,
          // Fade out
          withTiming(0, { duration: FADE_OUT_DURATION, easing: easeInQuad })
        )
      );

      translateY.value = withSequence(
        // Slide up
        withTiming(0, { duration: FADE_IN_DURATION, easing: easeOutQuad }),
        // Hold
        withDelay(
          DISPLAY_DURATION,
          // Slide down
          withTiming(10, { duration: FADE_OUT_DURATION, easing: easeInQuad })
        )
      );

      // Call onHide after total duration
      const timeout = setTimeout(() => {
        onHide();
      }, TOTAL_DURATION);

      return () => clearTimeout(timeout);
    }
  }, [visible, message]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || !message) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.dot} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.background.tertiary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    marginVertical: Spacing.sm,
    // Subtle shadow
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neon,
    marginRight: Spacing.xs,
    // Subtle glow
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  message: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.neon,
    letterSpacing: 0.5,
  },
});

export default QuantumAcknowledgment;

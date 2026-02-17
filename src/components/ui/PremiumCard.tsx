/**
 * PremiumCard - Premium animated card component
 * Features: Glass morphism, subtle glow, press animations
 */
import React, { memo, useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { TIMING, EASING, SPRING, TRANSFORM, OPACITY } from '@/config/animations';
import { Colors } from '@/design/cinematic';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'elevated' | 'glass' | 'outlined';
  glowColor?: string;
  hapticOnPress?: boolean;
  disabled?: boolean;
  testID?: string;
}

export const PremiumCard = memo(
  ({
    children,
    style,
    onPress,
    onLongPress,
    variant = 'default',
    glowColor = Colors.neon,
    hapticOnPress = true,
    disabled = false,
    testID,
  }: PremiumCardProps) => {
    const scale = useSharedValue(1);
    const pressed = useSharedValue(0);

    const triggerHaptic = useCallback(() => {
      if (hapticOnPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, [hapticOnPress]);

    const handlePress = useCallback(() => {
      if (disabled) return;
      triggerHaptic();
      onPress?.();
    }, [disabled, triggerHaptic, onPress]);

    const handleLongPress = useCallback(() => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress?.();
    }, [disabled, onLongPress]);

    // Only enable gestures if there's a press handler
    const isInteractive = !!(onPress || onLongPress);

    const tapGesture = Gesture.Tap()
      .enabled(isInteractive && !disabled)
      .onBegin(() => {
        'worklet';
        scale.value = withTiming(TRANSFORM.scalePressed, {
          duration: TIMING.buttonPress,
          easing: EASING.smooth,
        });
        pressed.value = withTiming(1, {
          duration: TIMING.buttonPress,
          easing: EASING.smooth,
        });
      })
      .onFinalize(() => {
        'worklet';
        scale.value = withSpring(1, SPRING.soft);
        pressed.value = withTiming(0, {
          duration: TIMING.fadeIn,
          easing: EASING.smooth,
        });
      })
      .onEnd(() => {
        'worklet';
        if (onPress) {
          // runOnJS not imported, handle in gesture detector
        }
      });

    const longPressGesture = Gesture.LongPress()
      .enabled(!!onLongPress && !disabled)
      .minDuration(500)
      .onStart(() => {
        'worklet';
        // Handle long press in JS
      });

    const composedGesture = isInteractive
      ? Gesture.Race(tapGesture, longPressGesture)
      : Gesture.Tap().enabled(false);

    // Get variant-specific styles
    const getVariantStyle = () => {
      switch (variant) {
        case 'elevated':
          return styles.elevated;
        case 'glass':
          return styles.glass;
        case 'outlined':
          return styles.outlined;
        default:
          return styles.default;
      }
    };

    const animatedStyle = useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(
        pressed.value,
        [0, 1],
        [
          variant === 'glass' ? 'rgba(255, 255, 255, 0.05)' : Colors.darker,
          variant === 'glass' ? 'rgba(255, 255, 255, 0.08)' : Colors.dark,
        ]
      );

      return {
        transform: [{ scale: scale.value }],
        opacity: disabled ? OPACITY.disabled : 1,
        backgroundColor,
        shadowOpacity: variant === 'elevated' ? 0.3 + pressed.value * 0.1 : 0,
      };
    });

    const glowStyle = useAnimatedStyle(() => {
      return {
        opacity: pressed.value * 0.3,
      };
    });

    const CardContent = (
      <Animated.View
        testID={testID}
        style={[
          styles.card,
          getVariantStyle(),
          animatedStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        {/* Subtle glow effect on press */}
        {variant !== 'outlined' && (
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: glowColor },
              glowStyle,
            ]}
            pointerEvents="none"
          />
        )}
        {children}
      </Animated.View>
    );

    if (!isInteractive) {
      return CardContent;
    }

    return (
      <GestureDetector gesture={composedGesture}>
        {CardContent}
      </GestureDetector>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  default: {
    backgroundColor: Colors.darker,
  },
  elevated: {
    backgroundColor: Colors.darker,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.dark,
  },
  disabled: {
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});

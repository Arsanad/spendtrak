/**
 * PremiumPressable - Premium animated pressable with haptics
 * Features: Scale animation, haptic feedback, gesture handling
 */
import React, { memo, useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { TIMING, EASING, SPRING, TRANSFORM, OPACITY } from '@/config/animations';

interface PremiumPressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  onLongPress?: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'none';
  scaleOnPress?: boolean;
  opacityOnPress?: boolean;
  disabled?: boolean;
  testID?: string;
}

export const PremiumPressable = memo(
  ({
    children,
    style,
    onPress,
    onLongPress,
    hapticStyle = 'light',
    scaleOnPress = true,
    opacityOnPress = true,
    disabled = false,
    testID,
  }: PremiumPressableProps) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const triggerHaptic = useCallback(() => {
      if (hapticStyle === 'none') return;

      const hapticMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };

      Haptics.impactAsync(hapticMap[hapticStyle]);
    }, [hapticStyle]);

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

    const gesture = Gesture.Tap()
      .onBegin(() => {
        'worklet';
        if (scaleOnPress) {
          scale.value = withTiming(TRANSFORM.scalePressed, {
            duration: TIMING.buttonPress,
            easing: EASING.smooth,
          });
        }
        if (opacityOnPress) {
          opacity.value = withTiming(OPACITY.dimmed, {
            duration: TIMING.buttonPress,
            easing: EASING.smooth,
          });
        }
      })
      .onFinalize(() => {
        'worklet';
        scale.value = withSpring(1, SPRING.soft);
        opacity.value = withTiming(1, {
          duration: TIMING.buttonPress,
          easing: EASING.smooth,
        });
      })
      .onEnd(() => {
        'worklet';
        if (!disabled && onPress) {
          runOnJS(handlePress)();
        }
      });

    const longPressGesture = Gesture.LongPress()
      .minDuration(500)
      .onStart(() => {
        'worklet';
        if (!disabled && onLongPress) {
          runOnJS(handleLongPress)();
        }
      });

    const composedGesture = Gesture.Race(gesture, longPressGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: disabled ? OPACITY.disabled : opacity.value,
    }));

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          testID={testID}
          style={[style, animatedStyle, disabled && styles.disabled]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  }
);

PremiumPressable.displayName = 'PremiumPressable';

const styles = StyleSheet.create({
  disabled: {
    pointerEvents: 'none',
  },
});

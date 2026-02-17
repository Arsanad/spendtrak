/**
 * HapticPressable - Drop-in replacement for Pressable with automatic haptic feedback
 *
 * Use this instead of Pressable throughout the app to give users tactile feedback
 * on every touch interaction, making the app feel alive and responsive.
 *
 * @example
 * // Simple usage - light haptic on press
 * <HapticPressable onPress={handlePress}>
 *   <Text>Tap me</Text>
 * </HapticPressable>
 *
 * // With custom intensity
 * <HapticPressable onPress={handlePress} hapticIntensity="medium">
 *   <Text>Tap me</Text>
 * </HapticPressable>
 *
 * // Disable haptics for specific cases
 * <HapticPressable onPress={handlePress} hapticIntensity="none">
 *   <Text>No haptic</Text>
 * </HapticPressable>
 */

import React, { memo, useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  TouchableOpacity,
  TouchableOpacityProps,
  GestureResponderEvent,
} from 'react-native';
import { lightTap, mediumTap, heavyTap, selectionTap, triggerHaptic, HapticIntensity } from '../../utils/haptics';

// ===== TYPES =====

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

export interface HapticPressableProps extends PressableProps {
  /**
   * Haptic feedback intensity on press
   * @default 'light'
   */
  hapticIntensity?: HapticStyle;

  /**
   * Whether to trigger haptic on press-in (default) or press-out
   * @default 'pressIn'
   */
  hapticTrigger?: 'pressIn' | 'pressOut';
}

export interface HapticTouchableProps extends TouchableOpacityProps {
  /**
   * Haptic feedback intensity on press
   * @default 'light'
   */
  hapticIntensity?: HapticStyle;
}

// ===== HAPTIC TRIGGER HELPER =====

const triggerHapticFeedback = (intensity: HapticStyle) => {
  switch (intensity) {
    case 'light':
      lightTap();
      break;
    case 'medium':
      mediumTap();
      break;
    case 'heavy':
      heavyTap();
      break;
    case 'selection':
      selectionTap();
      break;
    case 'none':
    default:
      break;
  }
};

// ===== HAPTIC PRESSABLE =====

/**
 * HapticPressable - Pressable with automatic haptic feedback
 *
 * Drop-in replacement for React Native's Pressable that adds
 * tactile vibration feedback on every press.
 */
export const HapticPressable = memo<HapticPressableProps>(({
  hapticIntensity = 'light',
  hapticTrigger = 'pressIn',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  children,
  ...props
}) => {
  const handlePressIn = useCallback((event: GestureResponderEvent) => {
    if (!disabled && hapticTrigger === 'pressIn' && hapticIntensity !== 'none') {
      triggerHapticFeedback(hapticIntensity);
    }
    onPressIn?.(event);
  }, [disabled, hapticTrigger, hapticIntensity, onPressIn]);

  const handlePressOut = useCallback((event: GestureResponderEvent) => {
    if (!disabled && hapticTrigger === 'pressOut' && hapticIntensity !== 'none') {
      triggerHapticFeedback(hapticIntensity);
    }
    onPressOut?.(event);
  }, [disabled, hapticTrigger, hapticIntensity, onPressOut]);

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
});

HapticPressable.displayName = 'HapticPressable';

// ===== HAPTIC TOUCHABLE OPACITY =====

/**
 * HapticTouchableOpacity - TouchableOpacity with automatic haptic feedback
 *
 * Drop-in replacement for React Native's TouchableOpacity that adds
 * tactile vibration feedback on every press.
 */
export const HapticTouchableOpacity = memo<HapticTouchableProps>(({
  hapticIntensity = 'light',
  onPress,
  disabled,
  children,
  ...props
}) => {
  const handlePress = useCallback((event: GestureResponderEvent) => {
    if (!disabled && hapticIntensity !== 'none') {
      triggerHapticFeedback(hapticIntensity);
    }
    onPress?.(event);
  }, [disabled, hapticIntensity, onPress]);

  return (
    <TouchableOpacity
      {...props}
      disabled={disabled}
      onPress={handlePress}
      activeOpacity={props.activeOpacity ?? 0.7}
    >
      {children}
    </TouchableOpacity>
  );
});

HapticTouchableOpacity.displayName = 'HapticTouchableOpacity';

// ===== PRESET VARIANTS =====

/**
 * LightTapPressable - Pressable with light haptic (for navigation, cards)
 */
export const LightTapPressable = memo<Omit<HapticPressableProps, 'hapticIntensity'>>((props) => (
  <HapticPressable hapticIntensity="light" {...props} />
));
LightTapPressable.displayName = 'LightTapPressable';

/**
 * MediumTapPressable - Pressable with medium haptic (for buttons, actions)
 */
export const MediumTapPressable = memo<Omit<HapticPressableProps, 'hapticIntensity'>>((props) => (
  <HapticPressable hapticIntensity="medium" {...props} />
));
MediumTapPressable.displayName = 'MediumTapPressable';

/**
 * SelectionPressable - Pressable with selection haptic (for toggles, pickers)
 */
export const SelectionPressable = memo<Omit<HapticPressableProps, 'hapticIntensity'>>((props) => (
  <HapticPressable hapticIntensity="selection" {...props} />
));
SelectionPressable.displayName = 'SelectionPressable';

// ===== EXPORTS =====

export default HapticPressable;

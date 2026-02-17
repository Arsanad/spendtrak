// SPENDTRAK CINEMATIC EDITION - Badge, Toggle, Chip Components
import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, BorderRadius, Spacing } from '../../design/cinematic';

// ==========================================
// BADGE
// ==========================================

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.transparent.deep20, text: Colors.text.secondary },
  success: { bg: Colors.transparent.neon20, text: Colors.neon },
  warning: { bg: Colors.transparent.primary20, text: Colors.primary },
  error: { bg: Colors.transparent.neon30, text: Colors.neon },
  info: { bg: Colors.transparent.deep30, text: Colors.bright },
};

const badgeSizes: Record<BadgeSize, { height: number; paddingH: number; fontSize: number }> = {
  small: { height: 18, paddingH: 6, fontSize: 9 },
  medium: { height: 22, paddingH: 8, fontSize: 10 },
  large: { height: 26, paddingH: 10, fontSize: 11 },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'medium', style }) => {
  const colors = badgeColors[variant];
  const sizing = badgeSizes[size];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, height: sizing.height, paddingHorizontal: sizing.paddingH }, style]}>
      <Text style={[styles.badgeText, { color: colors.text, fontSize: sizing.fontSize }]}>{children}</Text>
    </View>
  );
};

// ==========================================
// TOGGLE
// ==========================================

export interface ToggleProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, disabled = false, size = 'medium' }) => {
  const translateX = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    translateX.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 400 });
  }, [value]);

  const sizes = size === 'small' ? { width: 40, height: 24, thumb: 18 } : { width: 52, height: 28, thumb: 22 };
  const trackPadding = (sizes.height - sizes.thumb) / 2;
  const thumbTravel = sizes.width - sizes.thumb - trackPadding * 2;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: translateX.value === 1 ? Colors.transparent.neon30 : Colors.transparent.dark40,
    borderColor: translateX.value === 1 ? Colors.neon : Colors.border.default,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * thumbTravel }],
    backgroundColor: translateX.value === 1 ? Colors.neon : Colors.text.tertiary,
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange?.(!value)}
      style={[styles.toggleContainer, { width: sizes.width, height: sizes.height }, disabled && styles.disabled]}
    >
      <AnimatedView style={[styles.toggleTrack, { width: sizes.width, height: sizes.height }, trackStyle]}>
        <AnimatedView style={[styles.toggleThumb, { width: sizes.thumb, height: sizes.thumb, left: trackPadding }, thumbStyle]} />
      </AnimatedView>
    </Pressable>
  );
};

// ==========================================
// CHIP
// ==========================================

export interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ children, selected = false, onPress, icon, disabled = false, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={() => { if (!disabled) scale.value = withSpring(0.95); }}
        onPressOut={() => scale.value = withSpring(1)}
        style={[styles.chip, selected && styles.chipSelected, disabled && styles.disabled, style]}
      >
        {selected && (
          <LinearGradient
            colors={[Colors.transparent.neon20, Colors.transparent.primary10]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {icon && <View style={styles.chipIcon}>{icon}</View>}
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{children}</Text>
      </Pressable>
    </Animated.View>
  );
};

// ==========================================
// NOTIFICATION DOT
// ==========================================

export interface NotificationDotProps {
  count?: number;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const NotificationDot: React.FC<NotificationDotProps> = ({ count, size = 'medium', style }) => {
  const sizing = size === 'small' ? { minWidth: 16, height: 16, fontSize: 9 } : { minWidth: 20, height: 20, fontSize: 10 };

  if (count === undefined) {
    return <View style={[styles.dot, { width: 8, height: 8 }, style]} />;
  }

  return (
    <View style={[styles.notificationDot, { minWidth: sizing.minWidth, height: sizing.height }, style]}>
      <Text style={[styles.notificationCount, { fontSize: sizing.fontSize }]}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Badge
  badge: { borderRadius: BorderRadius.badge, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: FontFamily.semiBold, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Toggle
  toggleContainer: {},
  toggleTrack: { borderRadius: BorderRadius.round, borderWidth: 1, justifyContent: 'center' },
  toggleThumb: { position: 'absolute', borderRadius: BorderRadius.round },
  disabled: { opacity: 0.5 },

  // Chip
  chip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.chip,
    backgroundColor: Colors.transparent.dark30,
    borderWidth: 1,
    borderColor: Colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipSelected: { borderColor: Colors.neon },
  chipIcon: { marginRight: Spacing.xs },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  chipTextSelected: { color: Colors.neon },

  // Notification Dot
  dot: { backgroundColor: Colors.neon, borderRadius: BorderRadius.round },
  notificationDot: {
    backgroundColor: Colors.neon,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: { fontFamily: FontFamily.bold, color: Colors.void },
});

export { Badge, Toggle, Chip, NotificationDot };

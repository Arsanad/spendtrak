// SPENDTRAK CINEMATIC EDITION - GlassCard Component

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows, Spacing, BorderWidth } from '../../design/cinematic';
import { lightTap } from '../../utils/haptics';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glow' | 'subtle';
export type CardSize = 'compact' | 'default' | 'large';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  animated?: boolean;
  noPadding?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassCard: React.FC<GlassCardProps> = memo(({
  children, variant = 'default', size = 'default', style, contentStyle, onPress, onLongPress, disabled = false, animated = true, noPadding = false, accessibilityLabel, accessibilityHint,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const handlePressIn = () => {
    if (animated && !disabled) {
      lightTap();
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      glowOpacity.value = withTiming(1, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (animated && !disabled) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const paddingStyle = size === 'compact' ? { padding: Spacing.md } : size === 'large' ? { padding: Spacing.xxl } : { padding: Spacing.lg };
  const variantStyles = getVariantStyles(variant);

  const cardContent = (
    <>
      <LinearGradient colors={variantStyles.gradientColors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.topHighlight} />
      <Animated.View style={[styles.glowOverlay, glowStyle]}>
        <LinearGradient colors={[Colors.transparent.neon10, Colors.transparent.neon05, 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={[styles.contentWrapper, !noPadding && paddingStyle, contentStyle]}>{children}</View>
    </>
  );

  const baseStyle = [styles.card, variantStyles.container, disabled && styles.disabled, style];

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[baseStyle, animated && animatedStyle]}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return <Animated.View style={[baseStyle, animated && animatedStyle]}>{cardContent}</Animated.View>;
});

GlassCard.displayName = 'GlassCard';

const getVariantStyles = (variant: CardVariant) => {
  const configs: Record<CardVariant, { container: ViewStyle; gradientColors: string[] }> = {
    default: { container: styles.default, gradientColors: [Colors.background.tertiary, Colors.background.secondary, Colors.void] },
    elevated: { container: styles.elevated, gradientColors: [Colors.background.tertiary, Colors.background.secondary, Colors.void] },
    outlined: { container: styles.outlined, gradientColors: ['transparent', 'transparent'] },
    filled: { container: styles.filled, gradientColors: [Colors.darker, Colors.deepest, Colors.void] },
    glow: { container: styles.glow, gradientColors: [Colors.background.tertiary, Colors.background.secondary, Colors.void] },
    subtle: { container: styles.default, gradientColors: [Colors.background.secondary, Colors.void, Colors.void] },
  };
  return configs[variant];
};

// Quick Action Card
export const QuickActionCard: React.FC<{ children: React.ReactNode; onPress?: () => void; active?: boolean; style?: ViewStyle }> = memo(({ children, onPress, active = false, style }) => (
  <GlassCard variant={active ? 'glow' : 'default'} size="compact" onPress={onPress} style={style ? [quickStyles.card, style] : quickStyles.card}>{children}</GlassCard>
));
QuickActionCard.displayName = 'QuickActionCard';

// Stats Card
export const StatsCard: React.FC<{ children: React.ReactNode; onPress?: () => void; style?: ViewStyle }> = memo(({ children, onPress, style }) => (
  <GlassCard variant="elevated" onPress={onPress} style={style}>{children}</GlassCard>
));
StatsCard.displayName = 'StatsCard';

// List Item Card
export const ListItemCard: React.FC<{ children: React.ReactNode; onPress?: () => void; style?: ViewStyle }> = memo(({ children, onPress, style }) => (
  <GlassCard variant="default" size="compact" onPress={onPress} style={style}>{children}</GlassCard>
));
ListItemCard.displayName = 'ListItemCard';

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.card, overflow: 'hidden', borderWidth: BorderWidth.thin, borderColor: Colors.border.default },
  contentWrapper: { position: 'relative', zIndex: 1 },
  topHighlight: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, backgroundColor: Colors.transparent.primary20, zIndex: 2 },
  glowOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  default: { backgroundColor: Colors.background.secondary, ...Shadows.card },
  elevated: { backgroundColor: Colors.background.secondary, ...Shadows.lg, borderColor: Colors.transparent.primary20 },
  outlined: { backgroundColor: 'transparent', borderColor: Colors.border.default },
  filled: { backgroundColor: Colors.darker, borderColor: Colors.transparent.deep20 },
  glow: { backgroundColor: Colors.background.secondary, ...Shadows.glow, borderColor: Colors.transparent.neon20 },
  disabled: { opacity: 0.5 },
});

const quickStyles = StyleSheet.create({ card: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' } });

export default GlassCard;

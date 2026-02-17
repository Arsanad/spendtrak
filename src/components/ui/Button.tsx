// SPENDTRAK CINEMATIC EDITION - Button Component
import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Colors, FontFamily, BorderRadius, Spacing, Shadows, ComponentHeight } from '../../design/cinematic';
import { softTap, lightTap } from '../../utils/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = memo(({
  children, variant = 'primary', size = 'medium', onPress, disabled = false, loading = false,
  icon, iconRight, fullWidth = false, style, textStyle, accessibilityLabel, accessibilityHint,
}) => {
  // Derive label from children if not provided
  const a11yLabel = accessibilityLabel || (typeof children === 'string' ? children : undefined);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      softTap();
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      if (variant === 'primary') glowOpacity.value = withTiming(1, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const heights = { small: ComponentHeight.buttonSmall, medium: ComponentHeight.button, large: ComponentHeight.buttonLarge };
  const fontSizes = { small: 12, medium: 14, large: 16 };
  const paddings = { small: Spacing.md, medium: Spacing.lg, large: Spacing.xl };

  const variantStyles = getVariantStyles(variant, disabled);

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[styles.text, { color: variantStyles.textColor, fontSize: fontSizes[size] }, textStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {children}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.button,
        { height: heights[size], paddingHorizontal: paddings[size] },
        variantStyles.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {variant === 'primary' && !disabled ? (
        <>
          <LinearGradient
            colors={Colors.gradients.buttonPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[styles.glowOverlay, glowStyle]}>
            <LinearGradient
              colors={[Colors.transparent.neon30, Colors.transparent.neon10, 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {content}
        </>
      ) : (
        content
      )}
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';

const getVariantStyles = (variant: ButtonVariant, disabled: boolean) => {
  if (disabled) {
    return { container: { backgroundColor: Colors.darker, borderWidth: 1, borderColor: Colors.border.default }, textColor: Colors.text.tertiary };
  }
  const configs = {
    primary: { container: { ...Shadows.button, borderRadius: BorderRadius.button, overflow: 'hidden' as const }, textColor: Colors.void },
    secondary: { container: { backgroundColor: Colors.darker, borderWidth: 1, borderColor: Colors.border.default }, textColor: Colors.text.primary },
    outline: { container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border.active }, textColor: Colors.primary },
    ghost: { container: { backgroundColor: 'transparent', borderWidth: 0 }, textColor: Colors.text.primary },
    danger: { container: { backgroundColor: Colors.transparent.neon20, borderWidth: 1, borderColor: Colors.neon }, textColor: Colors.neon },
  };
  return configs[variant];
};

// Icon Button
export const IconButton: React.FC<{
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: 'default' | 'ghost' | 'filled' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}> = memo(({ icon, onPress, size = 44, variant = 'default', disabled = false, style, accessibilityLabel, accessibilityHint }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const variantStyles = {
    default: { backgroundColor: Colors.transparent.dark40, borderWidth: 1, borderColor: Colors.border.default },
    ghost: { backgroundColor: 'transparent', borderWidth: 0 },
    filled: { backgroundColor: Colors.darker, borderWidth: 1, borderColor: Colors.border.default },
    secondary: { backgroundColor: Colors.darker, borderWidth: 1, borderColor: Colors.border.default },
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => { if (!disabled) { lightTap(); scale.value = withSpring(0.9); } }}
      onPressOut={() => scale.value = withSpring(1)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[styles.iconButton, { width: size, height: size }, variantStyles[variant], disabled && styles.disabled, animatedStyle, style]}
    >
      {icon}
    </AnimatedPressable>
  );
});

IconButton.displayName = 'IconButton';

// Floating Action Button
export const FAB: React.FC<{
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}> = memo(({ icon, onPress, size = 56, style, accessibilityLabel, accessibilityHint }) => {
  const flatStyle = StyleSheet.flatten(style);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { lightTap(); scale.value = withSpring(0.9); }}
      onPressOut={() => scale.value = withSpring(1)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.fab, { width: size, height: size }, animatedStyle, flatStyle]}
    >
      <LinearGradient colors={Colors.gradients.buttonPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {icon}
    </AnimatedPressable>
  );
});

FAB.displayName = 'FAB';

const styles = StyleSheet.create({
  button: { borderRadius: BorderRadius.button, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', overflow: 'hidden' },
  contentContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FontFamily.semiBold, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  glowOverlay: { ...StyleSheet.absoluteFillObject },
  iconButton: { borderRadius: BorderRadius.round, alignItems: 'center', justifyContent: 'center' },
  fab: { borderRadius: BorderRadius.round, alignItems: 'center', justifyContent: 'center', ...Shadows.glow, overflow: 'hidden' },
});

export default Button;

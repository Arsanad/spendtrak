// SPENDTRAK CINEMATIC EDITION - Input Component
import React, { useState, forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, Pressable, ViewStyle, TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, BorderRadius, Spacing, BorderWidth, ComponentHeight } from '../../design/cinematic';
import { CloseIcon, SearchIcon } from '../icons';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'default' | 'small';
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = forwardRef<TextInput, InputProps>(({
  label, error, hint, leftIcon, rightIcon, size = 'default', containerStyle, inputStyle, ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const borderOpacity = useSharedValue(0);

  const handleFocus = (e: any) => {
    setFocused(true);
    borderOpacity.value = withTiming(1, { duration: 200 });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    borderOpacity.value = withTiming(0, { duration: 200 });
    props.onBlur?.(e);
  };

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error ? Colors.neon : focused ? Colors.primary : Colors.border.default,
    borderWidth: focused || error ? 1.5 : 1,
  }));

  const height = size === 'small' ? ComponentHeight.inputSmall : ComponentHeight.input;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <AnimatedView style={[styles.inputContainer, { height }, borderStyle, inputStyle]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          {...props}
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, rightIcon && styles.inputWithRightIcon]}
          placeholderTextColor={Colors.text.disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </AnimatedView>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

// Amount Input with currency prefix
export const AmountInput = forwardRef<TextInput, InputProps & { currency?: string }>(({
  currency = 'USD', ...props
}, ref) => (
  <Input
    ref={ref}
    {...props}
    keyboardType="decimal-pad"
    leftIcon={<Text style={styles.currencyPrefix}>{currency}</Text>}
  />
));

// Search Input with icon and clear button
export const SearchInput = forwardRef<TextInput, InputProps & { onClear?: () => void }>(({
  value, onClear, ...props
}, ref) => (
  <Input
    ref={ref}
    value={value}
    {...props}
    size="small"
    leftIcon={<SearchIcon size={18} color={Colors.text.tertiary} />}
    rightIcon={value && value.length > 0 ? (
      <Pressable onPress={onClear} hitSlop={8}>
        <CloseIcon size={16} color={Colors.text.tertiary} />
      </Pressable>
    ) : undefined}
  />
));

// TextArea (multiline)
export const TextArea = forwardRef<TextInput, InputProps & { rows?: number }>(({
  rows = 4, ...props
}, ref) => {
  const height = rows * 24 + Spacing.lg * 2;
  return (
    <Input
      ref={ref}
      {...props}
      multiline
      textAlignVertical="top"
      inputStyle={{ height, paddingTop: Spacing.md }}
    />
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.caption, color: Colors.text.secondary, marginBottom: Spacing.xs, letterSpacing: 1, textTransform: 'uppercase' },
  inputContainer: { backgroundColor: Colors.background.tertiary, borderRadius: BorderRadius.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md },
  input: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.body, color: Colors.text.primary, height: '100%' },
  inputWithLeftIcon: { paddingLeft: Spacing.sm },
  inputWithRightIcon: { paddingRight: Spacing.sm },
  leftIcon: { marginRight: Spacing.xs },
  rightIcon: { marginLeft: Spacing.xs },
  error: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.neon, marginTop: Spacing.xs },
  hint: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: Spacing.xs },
  currencyPrefix: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body, color: Colors.text.secondary },
});

export default Input;

/**
 * SpendTrak Text Component
 * Plain text component with consistent typography variants
 *
 * Use this for non-gradient text. For gradient text, use GradientText.
 *
 * @example
 * <Text variant="h1">Heading</Text>
 * <Text variant="body" color="secondary">Description</Text>
 * <Text variant="label" color="success">+$100</Text>
 */

import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { Colors, FontFamily, FontSize, LineHeight, LetterSpacing } from '@/design/cinematic';

// ===== VARIANT TYPES =====
export type TextVariant =
  | 'hero'       // 48px - Hero displays
  | 'display'    // 36px - Large displays
  | 'h1'         // 32px - Page titles
  | 'h2'         // 28px - Section titles
  | 'h3'         // 24px - Card titles
  | 'h4'         // 20px - Subsection titles
  | 'h5'         // 18px - Small headings
  | 'body'       // 14px - Default body text
  | 'bodyLarge'  // 16px - Emphasized body
  | 'bodySmall'  // 13px - Secondary body
  | 'caption'    // 12px - Captions, timestamps
  | 'label'      // 10px - Labels, badges
  | 'tiny';      // 9px - Nav labels

export type TextColor =
  | 'primary'    // Main text color (green)
  | 'secondary'  // Secondary text
  | 'tertiary'   // Muted text
  | 'muted'      // Disabled/very muted
  | 'inverse'    // Dark on light
  | 'success'    // Success/income (phosphorescent green)
  | 'error'      // Error/expense (red)
  | 'warning'    // Warning (orange)
  | 'info'       // Info (blue)
  | 'income'     // Income amount
  | 'expense'    // Expense amount
  | 'balance';   // Balance/neutral (bronze)

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextAlign = 'left' | 'center' | 'right' | 'auto';

// ===== PROPS =====
export interface TextProps extends Omit<RNTextProps, 'style'> {
  /** Typography variant */
  variant?: TextVariant;
  /** Text color */
  color?: TextColor;
  /** Font weight override */
  weight?: TextWeight;
  /** Text alignment */
  align?: TextAlign;
  /** Transform text */
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  /** Additional style */
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

// ===== VARIANT STYLES =====
const variantStyles: Record<TextVariant, TextStyle> = {
  hero: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display1,
    lineHeight: LineHeight.display1,
    letterSpacing: LetterSpacing.tight,
  },
  display: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display3,
    lineHeight: LineHeight.display3,
    letterSpacing: LetterSpacing.tight,
  },
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    lineHeight: LineHeight.h1,
    letterSpacing: LetterSpacing.normal,
  },
  h2: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h2,
    lineHeight: LineHeight.h2,
    letterSpacing: LetterSpacing.normal,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h3,
    lineHeight: LineHeight.h3,
    letterSpacing: LetterSpacing.wide,
  },
  h4: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.h4,
    lineHeight: LineHeight.h4,
    letterSpacing: LetterSpacing.wide,
  },
  h5: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.h5,
    lineHeight: LineHeight.h5,
    letterSpacing: LetterSpacing.wide,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    letterSpacing: LetterSpacing.normal,
  },
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLarge,
    lineHeight: LineHeight.bodyLarge,
    letterSpacing: LetterSpacing.normal,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    lineHeight: LineHeight.bodySmall,
    letterSpacing: LetterSpacing.normal,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    letterSpacing: LetterSpacing.wide,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    lineHeight: LineHeight.label,
    letterSpacing: LetterSpacing.spaced,
    textTransform: 'uppercase',
  },
  tiny: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.tiny,
    lineHeight: LineHeight.tiny,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
};

// ===== COLOR MAP =====
const colorMap: Record<TextColor, string> = {
  primary: Colors.text.primary,
  secondary: Colors.text.secondary,
  tertiary: Colors.text.tertiary,
  muted: Colors.text.disabled,
  inverse: Colors.text.inverse,
  success: Colors.semantic.success,
  error: Colors.semantic.error,
  warning: Colors.semantic.warning,
  info: Colors.semantic.info,
  income: Colors.semantic.income,
  expense: Colors.semantic.expense,
  balance: Colors.semantic.balance,
};

// ===== WEIGHT MAP =====
const weightMap: Record<TextWeight, string> = {
  regular: FontFamily.regular,
  medium: FontFamily.medium,
  semibold: FontFamily.semiBold,
  bold: FontFamily.bold,
};

// ===== COMPONENT =====
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align = 'auto',
  transform = 'none',
  style,
  children,
  ...props
}) => {
  const baseStyle = variantStyles[variant];
  const textColor = colorMap[color];
  const fontFamily = weight ? weightMap[weight] : baseStyle.fontFamily;

  return (
    <RNText
      style={[
        baseStyle,
        {
          color: textColor,
          fontFamily,
          textAlign: align,
          textTransform: transform !== 'none' ? transform : baseStyle.textTransform,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// ===== PRE-STYLED VARIANTS =====

/** Page title - h1 with primary color */
export const Title: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h1" {...props} />
);

/** Section heading - h2 with primary color */
export const Heading: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h2" {...props} />
);

/** Subheading - h4 with secondary color */
export const Subheading: React.FC<Omit<TextProps, 'variant' | 'color'>> = (props) => (
  <Text variant="h4" color="secondary" {...props} />
);

/** Body text - body with primary color */
export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="body" {...props} />
);

/** Caption text - caption with tertiary color */
export const Caption: React.FC<Omit<TextProps, 'variant' | 'color'>> = (props) => (
  <Text variant="caption" color="tertiary" {...props} />
);

/** Label text - label with secondary color, uppercase */
export const Label: React.FC<Omit<TextProps, 'variant' | 'color'>> = (props) => (
  <Text variant="label" color="secondary" {...props} />
);

/** Error text - caption with error color */
export const ErrorText: React.FC<Omit<TextProps, 'variant' | 'color'>> = (props) => (
  <Text variant="caption" color="error" {...props} />
);

/** Success text - body with success color */
export const SuccessText: React.FC<Omit<TextProps, 'variant' | 'color'>> = (props) => (
  <Text variant="body" color="success" {...props} />
);

/** Amount text - for displaying monetary values */
export const AmountText: React.FC<
  Omit<TextProps, 'variant' | 'color'> & {
    type?: 'income' | 'expense' | 'neutral';
  }
> = ({ type = 'neutral', ...props }) => {
  const colorValue: TextColor = type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'balance';
  return <Text variant="bodyLarge" color={colorValue} weight="semibold" {...props} />;
};

export default Text;

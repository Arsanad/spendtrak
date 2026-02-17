/**
 * SpendTrak Divider Component
 * Visual separator for content sections
 *
 * @example
 * <ListItem title="Item 1" />
 * <Divider />
 * <ListItem title="Item 2" />
 *
 * <Divider spacing="lg" />
 * <Divider variant="glow" />
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderWidth } from '@/design/cinematic';

// ===== TYPES =====
export type DividerVariant = 'default' | 'subtle' | 'bright' | 'glow';
export type DividerSpacing = keyof typeof Spacing;

export interface DividerProps {
  /**
   * Visual variant of the divider
   * @default 'default'
   */
  variant?: DividerVariant;

  /**
   * Vertical spacing above and below
   * @default 'lg'
   */
  spacing?: DividerSpacing;

  /**
   * If true, creates a vertical divider
   * @default false
   */
  vertical?: boolean;

  /**
   * Horizontal inset (margin on left and right)
   */
  inset?: DividerSpacing;

  /**
   * Additional style
   */
  style?: ViewStyle;
}

// ===== VARIANT CONFIGS =====
const variantConfigs: Record<DividerVariant, { color: string; height: number }> = {
  default: {
    color: Colors.border.default,
    height: BorderWidth.thin,
  },
  subtle: {
    color: Colors.border.subtle,
    height: BorderWidth.hairline,
  },
  bright: {
    color: Colors.border.active,
    height: BorderWidth.thin,
  },
  glow: {
    color: Colors.neon,
    height: BorderWidth.thin,
  },
};

// ===== COMPONENT =====
export const Divider: React.FC<DividerProps> = memo(({
  variant = 'default',
  spacing = 'lg',
  vertical = false,
  inset,
  style,
}) => {
  const config = variantConfigs[variant];
  const spacingValue = Spacing[spacing];
  const insetValue = inset ? Spacing[inset] : 0;

  if (variant === 'glow') {
    // Gradient glow divider
    return (
      <View
        style={[
          vertical ? styles.verticalContainer : styles.horizontalContainer,
          vertical
            ? { marginHorizontal: spacingValue }
            : { marginVertical: spacingValue },
          inset && (vertical
            ? { marginTop: insetValue, marginBottom: insetValue }
            : { marginLeft: insetValue, marginRight: insetValue }),
          style,
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            Colors.transparent.neon30,
            Colors.neon,
            Colors.transparent.neon30,
            'transparent',
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={vertical ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
          end={vertical ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
          style={[
            vertical ? styles.verticalGradient : styles.horizontalGradient,
            vertical ? { width: config.height } : { height: config.height },
          ]}
        />
      </View>
    );
  }

  // Standard divider
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        {
          backgroundColor: config.color,
          [vertical ? 'width' : 'height']: config.height,
          [vertical ? 'marginHorizontal' : 'marginVertical']: spacingValue,
        },
        inset && (vertical
          ? { marginTop: insetValue, marginBottom: insetValue }
          : { marginLeft: insetValue, marginRight: insetValue }),
        style,
      ]}
    />
  );
});

Divider.displayName = 'Divider';

// ===== PRE-STYLED VARIANTS =====

/** Subtle divider - very light, for dense lists */
export const DividerSubtle: React.FC<Omit<DividerProps, 'variant'>> = memo((props) => (
  <Divider variant="subtle" spacing="sm" {...props} />
));
DividerSubtle.displayName = 'DividerSubtle';

/** Section divider - with more spacing */
export const DividerSection: React.FC<Omit<DividerProps, 'variant' | 'spacing'>> = memo((props) => (
  <Divider variant="default" spacing="xxl" {...props} />
));
DividerSection.displayName = 'DividerSection';

/** Glow divider - for emphasis */
export const DividerGlow: React.FC<Omit<DividerProps, 'variant'>> = memo((props) => (
  <Divider variant="glow" {...props} />
));
DividerGlow.displayName = 'DividerGlow';

/** List item divider - with inset */
export const ListDivider: React.FC<Omit<DividerProps, 'variant' | 'spacing' | 'inset'>> = memo((props) => (
  <Divider variant="subtle" spacing="none" inset="lg" {...props} />
));
ListDivider.displayName = 'ListDivider';

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
  horizontalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  verticalContainer: {
    height: '100%',
    justifyContent: 'center',
  },
  horizontalGradient: {
    width: '100%',
  },
  verticalGradient: {
    height: '100%',
  },
});

export default Divider;

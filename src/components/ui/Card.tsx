/**
 * SpendTrak Card Component
 * Simple card wrapper built on top of GlassCard
 *
 * This provides a simpler API for common card use cases.
 * For more advanced features, use GlassCard directly.
 *
 * @example
 * <Card>
 *   <Text>Content</Text>
 * </Card>
 *
 * <Card variant="elevated" padding="xl">
 *   <Text>Elevated content</Text>
 * </Card>
 */

import React, { memo } from 'react';
import { ViewStyle } from 'react-native';
import { GlassCard, CardVariant as GlassCardVariant, CardSize } from './GlassCard';
import { Spacing } from '@/design/cinematic';

// ===== TYPES =====
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
export type CardPadding = keyof typeof Spacing;

export interface CardProps {
  children: React.ReactNode;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Padding size
   * @default 'lg'
   */
  padding?: CardPadding;

  /**
   * Press handler (makes card interactive)
   */
  onPress?: () => void;

  /**
   * Long press handler
   */
  onLongPress?: () => void;

  /**
   * Disable the card
   */
  disabled?: boolean;

  /**
   * Additional style
   */
  style?: ViewStyle;
}

// Map our variant names to GlassCard variants
const variantMap: Record<CardVariant, GlassCardVariant> = {
  default: 'default',
  elevated: 'elevated',
  outlined: 'outlined',
  filled: 'filled',
  glass: 'glow', // 'glass' maps to 'glow' in GlassCard
};

// Map padding to size for GlassCard
const paddingToSize = (padding: CardPadding): CardSize => {
  if (padding === 'sm' || padding === 'xs' || padding === 'md') return 'compact';
  if (padding === 'xxl' || padding === 'xxxl' || padding === 'huge') return 'large';
  return 'default';
};

// ===== COMPONENT =====
export const Card: React.FC<CardProps> = memo(({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  onLongPress,
  disabled = false,
  style,
}) => {
  return (
    <GlassCard
      variant={variantMap[variant]}
      size={paddingToSize(padding)}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={style}
    >
      {children}
    </GlassCard>
  );
});

Card.displayName = 'Card';

// ===== PRE-STYLED VARIANTS =====

/** Elevated card with shadow */
export const ElevatedCard: React.FC<Omit<CardProps, 'variant'>> = memo((props) => (
  <Card variant="elevated" {...props} />
));
ElevatedCard.displayName = 'ElevatedCard';

/** Outlined card with border */
export const OutlinedCard: React.FC<Omit<CardProps, 'variant'>> = memo((props) => (
  <Card variant="outlined" {...props} />
));
OutlinedCard.displayName = 'OutlinedCard';

/** Glass card with glow effect */
export const GlassCardSimple: React.FC<Omit<CardProps, 'variant'>> = memo((props) => (
  <Card variant="glass" {...props} />
));
GlassCardSimple.displayName = 'GlassCardSimple';

/** Compact card with less padding */
export const CompactCard: React.FC<Omit<CardProps, 'padding'>> = memo((props) => (
  <Card padding="md" {...props} />
));
CompactCard.displayName = 'CompactCard';

export default Card;

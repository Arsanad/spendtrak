/**
 * SpendTrak Spacer Component
 * Provides consistent spacing between elements
 *
 * Use this instead of inline margin/padding styles.
 *
 * @example
 * <Text>Title</Text>
 * <Spacer size="lg" />
 * <Text>Description</Text>
 *
 * <View style={{ flexDirection: 'row' }}>
 *   <Button title="Cancel" />
 *   <Spacer size="md" horizontal />
 *   <Button title="Save" />
 * </View>
 */

import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Spacing } from '@/design/cinematic';

// ===== TYPES =====
export type SpacerSize = keyof typeof Spacing;

export interface SpacerProps {
  /**
   * Size of the spacer (uses theme spacing)
   * @default 'md'
   */
  size?: SpacerSize;

  /**
   * If true, creates horizontal space (width)
   * If false, creates vertical space (height)
   * @default false
   */
  horizontal?: boolean;

  /**
   * Flex value for the spacer
   * Use flex={1} to create flexible space that expands
   */
  flex?: number;

  /**
   * Additional style
   */
  style?: ViewStyle;
}

// ===== COMPONENT =====
export const Spacer: React.FC<SpacerProps> = memo(({
  size = 'md',
  horizontal = false,
  flex,
  style,
}) => {
  const dimension = Spacing[size];

  const spacerStyle: ViewStyle = flex !== undefined
    ? { flex }
    : horizontal
      ? { width: dimension }
      : { height: dimension };

  return <View style={[spacerStyle, style]} />;
});

Spacer.displayName = 'Spacer';

// ===== PRE-SIZED VARIANTS =====

/** Extra small spacer (4px) */
export const SpacerXS: React.FC<{ horizontal?: boolean }> = memo(({ horizontal }) => (
  <Spacer size="xs" horizontal={horizontal} />
));
SpacerXS.displayName = 'SpacerXS';

/** Small spacer (8px) */
export const SpacerSM: React.FC<{ horizontal?: boolean }> = memo(({ horizontal }) => (
  <Spacer size="sm" horizontal={horizontal} />
));
SpacerSM.displayName = 'SpacerSM';

/** Medium spacer (12px) - default */
export const SpacerMD: React.FC<{ horizontal?: boolean }> = memo(({ horizontal }) => (
  <Spacer size="md" horizontal={horizontal} />
));
SpacerMD.displayName = 'SpacerMD';

/** Large spacer (16px) */
export const SpacerLG: React.FC<{ horizontal?: boolean }> = memo(({ horizontal }) => (
  <Spacer size="lg" horizontal={horizontal} />
));
SpacerLG.displayName = 'SpacerLG';

/** Extra large spacer (20px) */
export const SpacerXL: React.FC<{ horizontal?: boolean }> = memo(({ horizontal }) => (
  <Spacer size="xl" horizontal={horizontal} />
));
SpacerXL.displayName = 'SpacerXL';

/** XXL spacer (24px) */
export const SpacerXXL: React.FC<{ horizontal?: boolean }> = memo(({ horizontal }) => (
  <Spacer size="xxl" horizontal={horizontal} />
));
SpacerXXL.displayName = 'SpacerXXL';

/** Flexible spacer that expands to fill available space */
export const FlexSpacer: React.FC = memo(() => <Spacer flex={1} />);
FlexSpacer.displayName = 'FlexSpacer';

export default Spacer;

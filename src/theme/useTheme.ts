/**
 * SpendTrak Theme Hook
 * Provides easy access to theme tokens with helper functions
 *
 * Usage:
 * ```tsx
 * import { useTheme, spacing, color } from '@/theme/useTheme';
 *
 * const MyComponent = () => {
 *   const theme = useTheme();
 *   return (
 *     <View style={{ padding: spacing('lg'), backgroundColor: color('background.primary') }}>
 *       ...
 *     </View>
 *   );
 * };
 * ```
 */

import { theme, Theme } from './index';
import { logger } from '@/utils/logger';

/**
 * Hook to access the theme object
 * Currently returns the static theme, but can be extended
 * to support dynamic theming (light/dark mode) in the future
 */
export const useTheme = (): typeof Theme => Theme;

/**
 * Get a spacing value by key
 * @param key - Spacing key (xs, sm, md, lg, xl, xxl, xxxl, huge, etc.)
 * @returns Spacing value in pixels
 *
 * @example
 * spacing('lg') // 16
 * spacing('xxl') // 24
 */
export const spacing = (key: keyof typeof theme.spacing): number => theme.spacing[key];

/**
 * Get a color value by dot-notation path
 * @param path - Dot-notation path to color (e.g., 'text.primary', 'background.card')
 * @returns Color string
 *
 * @example
 * color('primary') // '#00cc6a'
 * color('text.primary') // '#00e67a'
 * color('background.elevated') // '#002a17'
 */
export const color = (path: string): string => {
  const keys = path.split('.');
  let value: unknown = theme.colors;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      logger.theme.warn(`Color path not found: ${path}`);
      return '#ff00ff'; // Return magenta for missing colors (debugging)
    }
  }

  return typeof value === 'string' ? value : '#ff00ff';
};

/**
 * Get a font size by key
 * @param key - Font size key (xs, sm, md, lg, xl, xxl, xxxl, display1, etc.)
 * @returns Font size value in pixels
 *
 * @example
 * fontSize('body') // 14
 * fontSize('h1') // 32
 */
export const fontSize = (key: keyof typeof theme.typography.fontSize): number =>
  theme.typography.fontSize[key];

/**
 * Get a border radius by key
 * @param key - Border radius key (none, xs, sm, md, lg, xl, xxl, round, button, card, etc.)
 * @returns Border radius value in pixels
 *
 * @example
 * borderRadius('card') // 16
 * borderRadius('round') // 9999
 */
export const borderRadius = (key: keyof typeof theme.borderRadius): number =>
  theme.borderRadius[key];

/**
 * Get a shadow configuration by key
 * @param key - Shadow key (none, sm, md, lg, glow, glowStrong, card, button)
 * @returns Shadow style object
 *
 * @example
 * shadow('card') // { shadowColor: ..., shadowOffset: ..., etc. }
 */
export const shadow = (key: keyof typeof theme.shadows) => theme.shadows[key];

/**
 * Get a z-index value by key
 * @param key - Z-index key (base, content, sticky, header, navigation, overlay, modal, quantum, toast, tooltip)
 * @returns Z-index value
 *
 * @example
 * zIndex('modal') // 400
 * zIndex('quantum') // 500
 */
export const zIndex = (key: keyof typeof theme.zIndex): number => theme.zIndex[key];

/**
 * Get animation duration by key
 * @param key - Duration key (instant, fastest, fast, normal, moderate, slow, slower)
 * @returns Duration in milliseconds
 *
 * @example
 * duration('fast') // 150
 * duration('normal') // 200
 */
export const duration = (key: keyof typeof theme.animation): number =>
  theme.animation[key];

/**
 * Get a layout value by key
 * @param key - Layout key (screenPadding, cardPadding, headerHeight, etc.)
 * @returns Layout value
 *
 * @example
 * layout('screenPadding') // 16
 * layout('headerHeight') // 56
 */
export const layoutValue = <K extends keyof typeof Theme.layout>(key: K): typeof Theme.layout[K] =>
  Theme.layout[key];

/**
 * Get icon size by key
 * @param key - Icon size key (xs, sm, md, lg, xl, xxl, huge, navIcon, etc.)
 * @returns Icon size in pixels
 *
 * @example
 * iconSize('md') // 20
 * iconSize('navIcon') // 24
 */
export const iconSize = (key: keyof typeof Theme.iconSize): number => Theme.iconSize[key];

/**
 * Get component height by key
 * @param key - Component height key (button, buttonSmall, input, header, etc.)
 * @returns Component height in pixels
 *
 * @example
 * componentHeight('button') // 48
 * componentHeight('input') // 52
 */
export const componentHeight = (key: keyof typeof Theme.componentHeight): number =>
  Theme.componentHeight[key];

/**
 * Get spring configuration for animations
 * @param variant - Spring variant (snappy, gentle, bouncy)
 * @returns Spring configuration object for react-native-reanimated
 *
 * @example
 * spring('snappy') // { damping: 15, stiffness: 400, mass: 0.8 }
 */
export const spring = (variant: keyof typeof Theme.motion.spring) =>
  Theme.motion.spring[variant];

/**
 * Create a style object with common patterns
 * Helper for frequently used style combinations
 */
export const createStyles = {
  /**
   * Full screen container with background
   */
  screen: () => ({
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  }),

  /**
   * Screen content with standard padding
   */
  screenContent: () => ({
    padding: Theme.layout.screenPadding,
  }),

  /**
   * Card container
   */
  card: (variant: 'default' | 'elevated' = 'default') => ({
    backgroundColor: variant === 'elevated'
      ? theme.colors.background.elevated
      : theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.card,
    padding: Theme.layout.cardPadding,
  }),

  /**
   * Centered content
   */
  centered: () => ({
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),

  /**
   * Row layout
   */
  row: (gap?: keyof typeof theme.spacing) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    ...(gap ? { gap: theme.spacing[gap] } : {}),
  }),

  /**
   * Absolute fill
   */
  absoluteFill: () => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }),
};

// Export theme for direct access
export { theme };

export default useTheme;

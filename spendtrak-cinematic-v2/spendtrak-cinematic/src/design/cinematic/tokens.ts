// SPENDTRAK CINEMATIC EDITION - Design Tokens

import { Colors } from './colors';

export const Spacing = {
  none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40, massive: 48, giant: 64,
} as const;

export const BorderRadius = {
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, round: 9999,
  button: 12, card: 16, input: 12, badge: 8, modal: 24, chip: 20,
} as const;

export const Shadows = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor: Colors.neon, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: Colors.neon, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: Colors.neon, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  glow: { shadowColor: Colors.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  glowStrong: { shadowColor: Colors.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  glowSubtle: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  card: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  button: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
} as const;

export const BorderWidth = { none: 0, hairline: 0.5, thin: 1, medium: 1.5, thick: 2 } as const;

export const IconSize = {
  xs: 12, sm: 16, md: 20, lg: 24, xl: 28, xxl: 32, huge: 40, massive: 48, giant: 64,
  navIcon: 24, tabIcon: 22, buttonIcon: 20, cardIcon: 28, heroIcon: 64,
} as const;

export const ComponentHeight = {
  buttonSmall: 36, button: 48, buttonLarge: 56,
  input: 52, inputSmall: 44, header: 56, tabBar: 64, bottomNav: 72,
  listItem: 64, listItemSmall: 52, chip: 32, badge: 20, toggle: 28,
} as const;

export const Duration = { instant: 0, fastest: 100, fast: 150, normal: 200, moderate: 300, slow: 400, slower: 500 } as const;

export const Opacity = { disabled: 0.4, inactive: 0.5, hover: 0.8, pressed: 0.6, overlay: 0.7 } as const;

export const Layout = {
  screenPadding: Spacing.lg, cardPadding: Spacing.lg, sectionGap: Spacing.xxl,
  itemGap: Spacing.md, maxContentWidth: 500, tabBarHeight: 72, headerHeight: 56,
} as const;

export default { Spacing, BorderRadius, Shadows, BorderWidth, IconSize, ComponentHeight, Duration, Opacity, Layout };

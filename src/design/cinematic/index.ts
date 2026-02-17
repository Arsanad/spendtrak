// SPENDTRAK CINEMATIC EDITION - Design System Index

export { Colors, getChartColor, getCategoryColor, getTransactionColor, getBudgetStatusColor, getSeverityColor, getHealthScoreColor } from './colors';
export { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles } from './typography';
export { Spacing, BorderRadius, Shadows, BorderWidth, IconSize, ComponentHeight, Duration, Opacity, Layout, motion, animationValues, PREMIUM_TOKENS } from './tokens';

import { Colors } from './colors';
import { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles } from './typography';
import { Spacing, BorderRadius, Shadows, BorderWidth, IconSize, ComponentHeight, Duration, Opacity, Layout, motion, animationValues, PREMIUM_TOKENS } from './tokens';

export const Theme = {
  colors: Colors,
  fonts: { family: FontFamily, size: FontSize, lineHeight: LineHeight, letterSpacing: LetterSpacing, styles: TextStyles },
  spacing: Spacing, borderRadius: BorderRadius, shadows: Shadows, borderWidth: BorderWidth,
  iconSize: IconSize, componentHeight: ComponentHeight, duration: Duration, opacity: Opacity, layout: Layout,
  motion, animationValues,
} as const;

export default Theme;

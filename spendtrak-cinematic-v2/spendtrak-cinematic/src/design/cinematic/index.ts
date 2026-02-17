// SPENDTRAK CINEMATIC EDITION - Design System Index

export { Colors } from './colors';
export { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles } from './typography';
export { Spacing, BorderRadius, Shadows, BorderWidth, IconSize, ComponentHeight, Duration, Opacity, Layout } from './tokens';

import { Colors } from './colors';
import { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles } from './typography';
import { Spacing, BorderRadius, Shadows, BorderWidth, IconSize, ComponentHeight, Duration, Opacity, Layout } from './tokens';

export const Theme = {
  colors: Colors,
  fonts: { family: FontFamily, size: FontSize, lineHeight: LineHeight, letterSpacing: LetterSpacing, styles: TextStyles },
  spacing: Spacing, borderRadius: BorderRadius, shadows: Shadows, borderWidth: BorderWidth,
  iconSize: IconSize, componentHeight: ComponentHeight, duration: Duration, opacity: Opacity, layout: Layout,
} as const;

export default Theme;

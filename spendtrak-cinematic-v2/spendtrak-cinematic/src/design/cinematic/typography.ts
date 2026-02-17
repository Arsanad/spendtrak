// SPENDTRAK CINEMATIC EDITION - Typography
// Font: Cinzel (sophisticated serif)

import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Cinzel_400Regular',
  medium: 'Cinzel_500Medium',
  semiBold: 'Cinzel_600SemiBold',
  bold: 'Cinzel_700Bold',
  extraBold: 'Cinzel_800ExtraBold',
  black: 'Cinzel_900Black',
  fallback: 'System',
} as const;

export const FontSize = {
  display1: 48, display2: 42, display3: 36,
  h1: 32, h2: 28, h3: 24, h4: 20, h5: 18, h6: 16,
  bodyLarge: 16, body: 14, bodySmall: 13,
  caption: 12, label: 10, tiny: 9,
} as const;

export const LineHeight = {
  display1: 56, display2: 50, display3: 44,
  h1: 40, h2: 36, h3: 32, h4: 28, h5: 26, h6: 24,
  bodyLarge: 24, body: 22, bodySmall: 20,
  caption: 18, label: 16, tiny: 14,
} as const;

export const LetterSpacing = {
  tightest: -0.02, tight: -0.01, normal: 0,
  wide: 0.05, wider: 0.1, widest: 0.15, ultraWide: 0.2, spaced: 0.3,
} as const;

export const TextStyles: Record<string, TextStyle> = {
  display1: { fontFamily: FontFamily.bold, fontSize: FontSize.display1, lineHeight: LineHeight.display1, letterSpacing: LetterSpacing.tight },
  display2: { fontFamily: FontFamily.bold, fontSize: FontSize.display2, lineHeight: LineHeight.display2, letterSpacing: LetterSpacing.tight },
  h1: { fontFamily: FontFamily.bold, fontSize: FontSize.h1, lineHeight: LineHeight.h1 },
  h2: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h2, lineHeight: LineHeight.h2 },
  h3: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h3, lineHeight: LineHeight.h3, letterSpacing: LetterSpacing.wide },
  h4: { fontFamily: FontFamily.medium, fontSize: FontSize.h4, lineHeight: LineHeight.h4, letterSpacing: LetterSpacing.wide },
  h5: { fontFamily: FontFamily.medium, fontSize: FontSize.h5, lineHeight: LineHeight.h5, letterSpacing: LetterSpacing.wide },
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.body, lineHeight: LineHeight.body },
  bodySmall: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySmall, lineHeight: LineHeight.bodySmall },
  caption: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, lineHeight: LineHeight.caption, letterSpacing: LetterSpacing.wide },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.label, lineHeight: LineHeight.label, letterSpacing: LetterSpacing.spaced, textTransform: 'uppercase' },
  button: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body, letterSpacing: LetterSpacing.wider, textTransform: 'uppercase' },
  navLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.tiny, letterSpacing: LetterSpacing.wider, textTransform: 'uppercase' },
};

export default { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles };

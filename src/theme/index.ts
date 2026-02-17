// SPENDTRAK THEME - Unified exports from cinematic design system
// Re-exports the original design system with additional z-index tokens

import { Dimensions } from 'react-native';

// Re-export everything from the cinematic design system
export {
    Colors,
    getChartColor,
    getCategoryColor,
    getTransactionColor,
    getBudgetStatusColor,
    getSeverityColor,
    getAmountColor,
    getGainLossColor,
    getStatisticColor,
    getBalanceColor,
} from '../design/cinematic/colors';

export {
    FontFamily,
    FontSize,
    LineHeight,
    LetterSpacing,
    TextStyles,
} from '../design/cinematic/typography';

export {
    Spacing,
    BorderRadius,
    Shadows,
    BorderWidth,
    IconSize,
    ComponentHeight,
    Duration,
    Opacity,
    Layout,
    motion,
    animationValues,
    PREMIUM_TOKENS,
} from '../design/cinematic/tokens';

// Import for local use
import { Colors } from '../design/cinematic/colors';
import { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles } from '../design/cinematic/typography';
import { Spacing, BorderRadius, Shadows, BorderWidth, IconSize, ComponentHeight, Duration, Opacity, Layout, motion, animationValues } from '../design/cinematic/tokens';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Z-INDEX SYSTEM - Use these values consistently
export const zIndex = {
    base: 0,
    content: 10,
    sticky: 50,
    header: 100,
    navigation: 200,
    overlay: 300,
    drawer: 350,
    modal: 400,
    quantum: 500,
    toast: 600,
    tooltip: 700,
    devTools: 9999,
} as const;

// SCREEN DIMENSIONS
export const screen = {
    width: screenWidth,
    height: screenHeight,
    isSmall: screenWidth < 375,
    isMedium: screenWidth >= 375 && screenWidth < 414,
    isLarge: screenWidth >= 414,
} as const;

// Backward compatibility - theme object that maps to old structure
export const theme = {
    colors: {
        primary: Colors.primary,
        primaryDark: Colors.dark,
        primaryLight: Colors.bright,
        text: Colors.text,
        background: Colors.background,
        border: {
            primary: Colors.border.active,
            secondary: Colors.border.default,
            focus: Colors.border.bright,
        },
        overlay: {
            dark: Colors.transparent.black80,
            darker: Colors.transparent.black90,
            light: Colors.transparent.black50,
        },
        status: {
            success: Colors.semantic.success,
            warning: Colors.semantic.warning,
            error: Colors.semantic.error,
            info: Colors.semantic.info,
        },
        transaction: {
            income: Colors.semantic.income,
            expense: Colors.semantic.expense,
            transfer: Colors.semantic.transfer,
        },
        quantum: {
            glow: Colors.transparent.neon30,
            speechBg: Colors.transparent.darker80,
            speechBorder: Colors.transparent.neon40,
        },
    },
    typography: {
        fontFamily: FontFamily,
        fontSize: FontSize,
        lineHeight: LineHeight,
        letterSpacing: LetterSpacing,
        fontWeight: {
            regular: '400' as const,
            medium: '500' as const,
            semiBold: '600' as const,
            bold: '700' as const,
        },
    },
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    animation: Duration,
    screen,
    zIndex,
} as const;

// Full Theme export matching cinematic design system
export const Theme = {
    colors: Colors,
    fonts: {
        family: FontFamily,
        size: FontSize,
        lineHeight: LineHeight,
        letterSpacing: LetterSpacing,
        styles: TextStyles,
    },
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    borderWidth: BorderWidth,
    iconSize: IconSize,
    componentHeight: ComponentHeight,
    duration: Duration,
    opacity: Opacity,
    layout: Layout,
    motion,
    animationValues,
    zIndex,
    screen,
} as const;

export type ThemeType = typeof Theme;
export type ColorsType = typeof Colors;
export type ZIndexType = typeof zIndex;

export default theme;

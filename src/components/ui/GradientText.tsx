// SPENDTRAK CINEMATIC EDITION - GradientText Component

import React, { memo } from 'react';
import { Text, TextStyle, StyleSheet, View, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Colors, FontFamily, FontSize } from '../../design/cinematic';
import { useSettingsStore } from '../../stores/settingsStore';

export type GradientVariant =
  | 'luxury' | 'bright' | 'primary' | 'subtle' | 'muted' | 'label' | 'neon'
  | 'income' | 'expense' | 'silver' | 'balance' | 'bronze';

export interface GradientTextProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  testID?: string;
}

const gradientConfigs: Record<GradientVariant, { colors: string[]; locations?: number[] }> = {
  // Green brand gradients
  luxury: { colors: ['#ffffff', Colors.neon, Colors.primary, Colors.deep, Colors.dark], locations: [0, 0.2, 0.5, 0.8, 1] },
  bright: { colors: ['#ffffff', Colors.neon, Colors.primary, Colors.deep], locations: [0, 0.3, 0.7, 1] },
  primary: { colors: [Colors.neon, Colors.primary, Colors.deep], locations: [0, 0.5, 1] },
  neon: { colors: [Colors.neon, Colors.bright, Colors.primary], locations: [0, 0.5, 1] },
  subtle: { colors: [Colors.bright, Colors.primary, Colors.medium], locations: [0, 0.5, 1] },
  muted: { colors: [Colors.primary, Colors.deep, Colors.dark], locations: [0, 0.5, 1] },
  label: { colors: [Colors.deep, Colors.dark], locations: [0, 1] },

  // SEMANTIC FINANCIAL COLORS:
  // Income (Phosphorescent Green #39FF14) - money IN: salary, refunds, gains, savings
  income: { colors: ['#ffffff', '#39FF14', '#2ACC10', '#1F9A0C'], locations: [0, 0.3, 0.6, 1] },
  // Expense (Neon Red #ff3366) - money OUT: spending, bills, losses, debts
  expense: { colors: ['#ffffff', '#ff3366', '#cc2952', '#99203f'], locations: [0, 0.3, 0.6, 1] },
  // Bronze (Neutral #E6A756) - balance, totals, statistics, percentages
  bronze: { colors: ['#ffffff', '#F4C077', '#E6A756', '#C4894A'], locations: [0, 0.2, 0.5, 1] },
  // Balance (Bronze variant for main balance display)
  balance: { colors: ['#ffffff', '#F4C077', '#E6A756', '#C4894A', '#A06D3E'], locations: [0, 0.2, 0.4, 0.7, 1] },
  /** @deprecated Use 'bronze' instead. Kept for backward compatibility. */
  silver: { colors: ['#ffffff', '#F4C077', '#E6A756', '#C4894A'], locations: [0, 0.2, 0.5, 1] },
};

export const GradientText: React.FC<GradientTextProps> = memo(({ children, variant = 'primary', style, numberOfLines, testID }) => {
  const config = gradientConfigs[variant] || gradientConfigs.primary;
  const flatStyle = StyleSheet.flatten(style);

  return (
    <MaskedView testID={testID} maskElement={<Text style={[styles.baseText, flatStyle]} numberOfLines={numberOfLines}>{children}</Text>}>
      <LinearGradient colors={config.colors as [string, string, ...string[]]} locations={config.locations as [number, number, ...number[]] | undefined} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <Text style={[styles.baseText, flatStyle, styles.invisible]} numberOfLines={numberOfLines}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
});

GradientText.displayName = 'GradientText';

// Pre-styled variants
// Balance uses Bronze gradient (neutral total)
export const GradientBalance: React.FC<{ amount: string; currency?: string; style?: TextStyle }> = memo(({ amount, currency: propCurrency, style }) => {
  const { currency: storeCurrency } = useSettingsStore();
  const currency = propCurrency || storeCurrency;
  return (
    <View style={styles.balanceContainer}>
      <GradientText variant="bronze" style={styles.currency}>{currency}</GradientText>
      <GradientText variant="balance" style={[styles.balance, style]}>{amount}</GradientText>
    </View>
  );
});
GradientBalance.displayName = 'GradientBalance';

// Income amount uses Phosphorescent Green gradient
export const GradientIncome: React.FC<{ amount: string; currency?: string; style?: TextStyle }> = memo(({ amount, currency: propCurrency, style }) => {
  const { currency: storeCurrency } = useSettingsStore();
  const currency = propCurrency || storeCurrency;
  return (
    <View style={styles.balanceContainer}>
      <GradientText variant="income" style={styles.currency}>{currency}</GradientText>
      <GradientText variant="income" style={[styles.balance, style]}>+{amount}</GradientText>
    </View>
  );
});
GradientIncome.displayName = 'GradientIncome';

// Expense amount uses Neon Red gradient
export const GradientExpense: React.FC<{ amount: string; currency?: string; style?: TextStyle }> = memo(({ amount, currency: propCurrency, style }) => {
  const { currency: storeCurrency } = useSettingsStore();
  const currency = propCurrency || storeCurrency;
  return (
    <View style={styles.balanceContainer}>
      <GradientText variant="expense" style={styles.currency}>{currency}</GradientText>
      <GradientText variant="expense" style={[styles.balance, style]}>-{amount}</GradientText>
    </View>
  );
});
GradientExpense.displayName = 'GradientExpense';

// Statistic/neutral amount uses Bronze gradient
export const GradientStatistic: React.FC<{ value: string; style?: TextStyle }> = memo(({ value, style }) => (
  <GradientText variant="bronze" style={style}>{value}</GradientText>
));
GradientStatistic.displayName = 'GradientStatistic';

export const GradientTitle: React.FC<{ children: React.ReactNode; style?: TextStyle | TextStyle[] }> = memo(({ children, style }) => (
  <GradientText variant="luxury" style={[styles.title, StyleSheet.flatten(style)]}>{children}</GradientText>
));
GradientTitle.displayName = 'GradientTitle';

export const GradientHeading: React.FC<{ children: React.ReactNode; style?: TextStyle | TextStyle[] }> = memo(({ children, style }) => (
  <GradientText variant="bright" style={[styles.heading, StyleSheet.flatten(style)]}>{children}</GradientText>
));
GradientHeading.displayName = 'GradientHeading';

export const GradientLabel: React.FC<{ children: React.ReactNode; style?: TextStyle }> = memo(({ children, style }) => (
  <GradientText variant="muted" style={[styles.label, style]}>{children}</GradientText>
));
GradientLabel.displayName = 'GradientLabel';

export const GradientBody: React.FC<{ children: React.ReactNode; style?: TextStyle; numberOfLines?: number }> = memo(({ children, style, numberOfLines }) => (
  <GradientText variant="subtle" style={[styles.body, style]} numberOfLines={numberOfLines}>{children}</GradientText>
));
GradientBody.displayName = 'GradientBody';

export const GradientCardTitle: React.FC<{ children: React.ReactNode; style?: TextStyle }> = memo(({ children, style }) => (
  <GradientText variant="bright" style={[styles.cardTitle, style]}>{children}</GradientText>
));
GradientCardTitle.displayName = 'GradientCardTitle';

export const GradientNavLabel: React.FC<{ children: React.ReactNode; active?: boolean; style?: TextStyle }> = memo(({ children, active = false, style }) => (
  <GradientText variant={active ? 'primary' : 'label'} style={[styles.navLabel, style]}>{children}</GradientText>
));
GradientNavLabel.displayName = 'GradientNavLabel';

const styles = StyleSheet.create({
  baseText: { fontFamily: FontFamily.regular, fontSize: FontSize.body, color: Colors.bright },
  invisible: { opacity: 0 },
  balanceContainer: { alignItems: 'center' },
  currency: { fontFamily: FontFamily.medium, fontSize: FontSize.caption, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  balance: { fontFamily: FontFamily.bold, fontSize: 42, letterSpacing: -1 },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h2, letterSpacing: 1 },
  heading: { fontFamily: FontFamily.medium, fontSize: FontSize.h4, letterSpacing: 0.5 },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.label, letterSpacing: 3, textTransform: 'uppercase' },
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.body },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h5 },
  navLabel: { fontFamily: FontFamily.medium, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
});

export default GradientText;

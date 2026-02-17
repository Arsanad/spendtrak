// SPENDTRAK CINEMATIC EDITION - GradientText Component

import React from 'react';
import { Text, TextStyle, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Colors, FontFamily, FontSize } from '../../design/cinematic';

export type GradientVariant = 'luxury' | 'bright' | 'primary' | 'subtle' | 'muted' | 'label';

export interface GradientTextProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

const gradientConfigs: Record<GradientVariant, { colors: string[]; locations?: number[] }> = {
  luxury: { colors: ['#ffffff', Colors.neon, Colors.primary, Colors.deep, Colors.dark], locations: [0, 0.2, 0.5, 0.8, 1] },
  bright: { colors: ['#ffffff', Colors.neon, Colors.primary, Colors.deep], locations: [0, 0.3, 0.7, 1] },
  primary: { colors: [Colors.neon, Colors.primary, Colors.deep], locations: [0, 0.5, 1] },
  subtle: { colors: [Colors.bright, Colors.primary, Colors.medium], locations: [0, 0.5, 1] },
  muted: { colors: [Colors.primary, Colors.deep, Colors.dark], locations: [0, 0.5, 1] },
  label: { colors: [Colors.deep, Colors.dark], locations: [0, 1] },
};

export const GradientText: React.FC<GradientTextProps> = ({ children, variant = 'primary', style, numberOfLines }) => {
  const config = gradientConfigs[variant];
  const flatStyle = StyleSheet.flatten(style);

  return (
    <MaskedView maskElement={<Text style={[styles.baseText, flatStyle]} numberOfLines={numberOfLines}>{children}</Text>}>
      <LinearGradient colors={config.colors} locations={config.locations} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <Text style={[styles.baseText, flatStyle, styles.invisible]} numberOfLines={numberOfLines}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

// Pre-styled variants
export const GradientBalance: React.FC<{ amount: string; currency?: string; style?: TextStyle }> = ({ amount, currency = 'USD', style }) => (
  <View style={styles.balanceContainer}>
    <GradientText variant="muted" style={styles.currency}>{currency}</GradientText>
    <GradientText variant="luxury" style={[styles.balance, style]}>{amount}</GradientText>
  </View>
);

export const GradientTitle: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <GradientText variant="luxury" style={[styles.title, style]}>{children}</GradientText>
);

export const GradientHeading: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <GradientText variant="bright" style={[styles.heading, style]}>{children}</GradientText>
);

export const GradientLabel: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <GradientText variant="muted" style={[styles.label, style]}>{children}</GradientText>
);

export const GradientBody: React.FC<{ children: React.ReactNode; style?: TextStyle; numberOfLines?: number }> = ({ children, style, numberOfLines }) => (
  <GradientText variant="subtle" style={[styles.body, style]} numberOfLines={numberOfLines}>{children}</GradientText>
);

export const GradientCardTitle: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <GradientText variant="bright" style={[styles.cardTitle, style]}>{children}</GradientText>
);

export const GradientNavLabel: React.FC<{ children: React.ReactNode; active?: boolean; style?: TextStyle }> = ({ children, active = false, style }) => (
  <GradientText variant={active ? 'primary' : 'label'} style={[styles.navLabel, style]}>{children}</GradientText>
);

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

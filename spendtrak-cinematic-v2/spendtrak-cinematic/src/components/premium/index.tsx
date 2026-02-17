// SPENDTRAK CINEMATIC EDITION - Premium Components
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, withSpring, Easing, runOnJS } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows, BorderWidth } from '../../design/cinematic';
import { GradientText, GradientLabel, GradientBody } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { ChevronRightIcon } from '../icons';

// ==========================================
// PROGRESS RING
// ==========================================

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size = 100, strokeWidth = 8, children }) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100), { duration: 1000, easing: Easing.out(Easing.ease) });
  }, [progress]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * animatedProgress.value) / 100,
  }));

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.neon} />
            <Stop offset="100%" stopColor={Colors.primary} />
          </LinearGradient>
        </Defs>
        {/* Background */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.darker} strokeWidth={strokeWidth} fill="none" />
        {/* Progress */}
        <AnimatedCircle
          animatedProps={circleProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressRingContent}>{children}</View>
    </View>
  );
};

// ==========================================
// TRANSACTION ITEM
// ==========================================

export interface TransactionItemProps {
  merchantName: string;
  category?: string;
  amount: number;
  currency?: string;
  date: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  merchantName, category, amount, currency = 'AED', date, icon, onPress, style,
}) => {
  const isExpense = amount < 0;
  const formattedAmount = `${isExpense ? '-' : '+'}${Math.abs(amount).toFixed(2)}`;

  return (
    <GlassCard variant="default" size="compact" onPress={onPress} style={[styles.transactionItem, style]}>
      <View style={styles.transactionLeft}>
        {icon && <View style={styles.transactionIcon}>{icon}</View>}
        <View style={styles.transactionInfo}>
          <GradientText variant="subtle" style={styles.merchantName} numberOfLines={1}>{merchantName}</GradientText>
          {category && <Text style={styles.transactionCategory}>{category}</Text>}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <GradientText variant={isExpense ? 'muted' : 'bright'} style={styles.transactionAmount}>
          {currency} {formattedAmount}
        </GradientText>
        <Text style={styles.transactionDate}>{date}</Text>
      </View>
    </GlassCard>
  );
};

// ==========================================
// SUBSCRIPTION CARD
// ==========================================

export interface SubscriptionCardProps {
  name: string;
  amount: number;
  currency?: string;
  frequency: string;
  nextBillingDate?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  name, amount, currency = 'AED', frequency, nextBillingDate, icon, onPress, style,
}) => (
  <GlassCard variant="elevated" onPress={onPress} style={style}>
    <View style={styles.subscriptionHeader}>
      {icon && <View style={styles.subscriptionIcon}>{icon}</View>}
      <View style={styles.subscriptionInfo}>
        <GradientText variant="bright" style={styles.subscriptionName}>{name}</GradientText>
        <Text style={styles.subscriptionFrequency}>{frequency}</Text>
      </View>
      <View style={styles.subscriptionAmount}>
        <GradientText variant="luxury" style={styles.subscriptionPrice}>{currency} {amount.toFixed(2)}</GradientText>
      </View>
    </View>
    {nextBillingDate && (
      <View style={styles.subscriptionFooter}>
        <Text style={styles.subscriptionBilling}>Next billing: {nextBillingDate}</Text>
      </View>
    )}
  </GlassCard>
);

// ==========================================
// SETTINGS ITEM
// ==========================================

export interface SettingsItemProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon, label, value, onPress, showArrow = true, rightElement, style,
}) => (
  <Pressable onPress={onPress} style={[styles.settingsItem, style]}>
    {icon && <View style={styles.settingsIcon}>{icon}</View>}
    <View style={styles.settingsContent}>
      <GradientText variant="subtle" style={styles.settingsLabel}>{label}</GradientText>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
    </View>
    {rightElement || (showArrow && <ChevronRightIcon size={20} color={Colors.text.tertiary} />)}
  </Pressable>
);

// ==========================================
// ANIMATED NUMBER
// ==========================================

export interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: any;
  variant?: 'luxury' | 'bright' | 'primary' | 'subtle' | 'muted';
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value, prefix = '', suffix = '', decimals = 2, duration = 1000, style, variant = 'luxury',
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(setDisplayValue)(value);
    });
  }, [value]);

  // Simple approach: update on animation end
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(Math.round(animatedValue.value * Math.pow(10, decimals)) / Math.pow(10, decimals));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <GradientText variant={variant} style={style}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </GradientText>
  );
};

// ==========================================
// EMPTY STATE
// ==========================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, style }) => (
  <View style={[styles.emptyState, style]}>
    {icon && <View style={styles.emptyStateIcon}>{icon}</View>}
    <GradientText variant="muted" style={styles.emptyStateTitle}>{title}</GradientText>
    {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
    {action && <View style={styles.emptyStateAction}>{action}</View>}
  </View>
);

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Progress Ring
  progressRingContainer: { alignItems: 'center', justifyContent: 'center' },
  progressRingContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  // Transaction Item
  transactionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.transparent.deep20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  transactionInfo: { flex: 1 },
  merchantName: { fontFamily: FontFamily.medium, fontSize: FontSize.body },
  transactionCategory: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  transactionDate: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: 2 },

  // Subscription Card
  subscriptionHeader: { flexDirection: 'row', alignItems: 'center' },
  subscriptionIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.transparent.deep20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  subscriptionInfo: { flex: 1 },
  subscriptionName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h5 },
  subscriptionFrequency: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: 2 },
  subscriptionAmount: { alignItems: 'flex-end' },
  subscriptionPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.h4 },
  subscriptionFooter: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
  subscriptionBilling: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary },

  // Settings Item
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, backgroundColor: Colors.transparent.dark20, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  settingsIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.transparent.deep20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  settingsContent: { flex: 1 },
  settingsLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.body },
  settingsValue: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: 2 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyStateIcon: { marginBottom: Spacing.lg },
  emptyStateTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h4, textAlign: 'center' },
  emptyStateDescription: { fontFamily: FontFamily.regular, fontSize: FontSize.body, color: Colors.text.tertiary, textAlign: 'center', marginTop: Spacing.sm },
  emptyStateAction: { marginTop: Spacing.lg },
});

export { ProgressRing, TransactionItem, SubscriptionCard, SettingsItem, AnimatedNumber, EmptyState };

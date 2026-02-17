// SPENDTRAK CINEMATIC EDITION - Premium Components
// Updated to use CurrencyContext for global currency conversion
import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, withSpring, Easing, runOnJS } from 'react-native-reanimated';
import { easeOutQuad } from '../../config/easingFunctions';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows, BorderWidth } from '../../design/cinematic';
import { GradientText, GradientLabel, GradientBody } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { ChevronRightIcon } from '../icons';
import { useCurrency } from '../../context/CurrencyContext';
import { lightTap } from '../../utils/haptics';

// Re-export FeatureDrawer
export { FeatureDrawer } from './FeatureDrawer';
export type { FeatureDrawerProps } from './FeatureDrawer';

// Re-export Feature Gating components
export { FeatureGate, UsageLimitGate } from './FeatureGate';
export type { FeatureGateVariant } from './FeatureGate';
export { UpgradePrompt, useUpgradePrompt } from './UpgradePrompt';

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

/**
 * Get budget progress color based on percentage
 * Uses traffic light system: green (safe), orange (warning), red (danger/over)
 */
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return Colors.semantic.budgetDanger;   // Red - over budget
  if (percentage >= 80) return Colors.semantic.budgetWarning;    // Orange - approaching limit
  return Colors.semantic.budgetSafe;                              // Green - safe
};

export const ProgressRing: React.FC<ProgressRingProps> = memo(({ progress, size = 100, strokeWidth = 8, children }) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Get traffic light color based on progress percentage
  const progressColor = getProgressColor(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100), { duration: 1000, easing: easeOutQuad });
  }, [progress]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * animatedProgress.value) / 100,
  }));

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.darker} strokeWidth={strokeWidth} fill="none" />
        {/* Progress - uses traffic light color based on percentage */}
        <AnimatedCircle
          animatedProps={circleProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
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
});

ProgressRing.displayName = 'ProgressRing';

// ==========================================
// TRANSACTION ITEM
// ==========================================

export interface TransactionItemProps {
  merchantName: string;
  category?: string;
  /** Amount already in user's display currency (signed: negative = expense) */
  amount: number;
  /** Optional override currency - if not provided, uses global currency */
  currency?: string;
  date: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = memo(({
  merchantName, category, amount, currency: propCurrency, date, icon, onPress, style, accessibilityLabel,
}) => {
  const { format, currencySymbol } = useCurrency();

  // Amount is already in user's display currency (converted by the caller)
  const isExpense = amount < 0;
  const formattedAmount = `${isExpense ? '-' : '+'}${format(Math.abs(amount), { showSymbol: false })}`;
  // Use semantic colors: red for expenses, green for income
  const amountColor = isExpense ? Colors.semantic.expense : Colors.semantic.income;

  // Generate descriptive accessibility label
  const a11yLabel = accessibilityLabel || `${merchantName}, ${isExpense ? 'expense' : 'income'} of ${currencySymbol}${format(Math.abs(amount), { showSymbol: false })}, ${category || ''}, ${date}`;

  return (
    <GlassCard
      variant="default"
      size="compact"
      onPress={onPress}
      style={style}
      accessibilityLabel={a11yLabel}
      accessibilityHint={onPress ? "Tap to view transaction details" : undefined}
    >
      {/* Row container for horizontal layout inside GlassCard's contentWrapper */}
      <View style={styles.transactionRow}>
        <View style={styles.transactionLeft}>
          {icon && <View style={styles.transactionIcon}>{icon}</View>}
          <View style={styles.transactionInfo}>
            <GradientText variant="subtle" style={styles.merchantName} numberOfLines={1}>{merchantName}</GradientText>
            {category && <Text style={styles.transactionCategory}>{category}</Text>}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {currencySymbol} {formattedAmount}
          </Text>
          <Text style={styles.transactionDate}>{date}</Text>
        </View>
      </View>
    </GlassCard>
  );
});

TransactionItem.displayName = 'TransactionItem';

// ==========================================
// SUBSCRIPTION CARD
// ==========================================

export interface SubscriptionCardProps {
  name: string;
  /** Amount in base currency (USD) */
  amount: number;
  /** Optional override currency - if not provided, uses global currency */
  currency?: string;
  frequency: string;
  nextBillingDate?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = memo(({
  name, amount, currency: propCurrency, frequency, nextBillingDate, icon, onPress, style,
}) => {
  const { format } = useCurrency();

  // Amount should be pre-converted to user's display currency by the caller
  const convertedAmount = amount;

  return (
  <GlassCard variant="elevated" onPress={onPress} style={style}>
    <View style={styles.subscriptionContent}>
      <View style={styles.subscriptionHeader}>
        {icon && <View style={styles.subscriptionIcon}>{icon}</View>}
        <View style={styles.subscriptionInfo}>
          <GradientText variant="bright" style={styles.subscriptionName}>{name}</GradientText>
          <Text style={styles.subscriptionFrequency}>{frequency}</Text>
        </View>
        <View style={styles.subscriptionAmount}>
          {/* Subscriptions are expenses - use Neon Red */}
          <GradientText variant="expense" style={styles.subscriptionPrice}>{format(convertedAmount)}</GradientText>
        </View>
      </View>
      {nextBillingDate && (
        <View style={styles.subscriptionFooter}>
          <Text style={styles.subscriptionBilling}>Next billing: {nextBillingDate}</Text>
        </View>
      )}
    </View>
  </GlassCard>
);
});

SubscriptionCard.displayName = 'SubscriptionCard';

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
  labelColor?: string;
  accessibilityHint?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = memo(({
  icon, label, value, onPress, showArrow = true, rightElement, style, labelColor, accessibilityHint,
}) => (
  <Pressable
    onPress={() => {
      if (onPress) {
        lightTap();
        onPress();
      }
    }}
    style={[styles.settingsItem, style]}
    accessible={true}
    accessibilityRole={onPress ? "button" : "text"}
    accessibilityLabel={value ? `${label}, ${value}` : label}
    accessibilityHint={accessibilityHint}
  >
    {icon && <View style={styles.settingsIcon}>{icon}</View>}
    <View style={styles.settingsContent}>
      {labelColor ? (
        <Text style={[styles.settingsLabel, { color: labelColor, fontFamily: FontFamily.medium }]}>{label}</Text>
      ) : (
        <GradientText variant="subtle" style={styles.settingsLabel}>{label}</GradientText>
      )}
      {value && <Text style={styles.settingsValue}>{value}</Text>}
    </View>
    {rightElement || (showArrow && <ChevronRightIcon size={20} color={Colors.text.tertiary} />)}
  </Pressable>
));

SettingsItem.displayName = 'SettingsItem';

// ==========================================
// ANIMATED NUMBER
// ==========================================

export interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  variant?: 'luxury' | 'bright' | 'primary' | 'subtle' | 'muted';
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = memo(({
  value, prefix = '', suffix = '', decimals = 2, duration = 1000, style, variant = 'luxury',
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;
    const startValue = displayValue;
    const multiplier = Math.pow(10, decimals);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const currentValue = Math.round((startValue + (value - startValue) * easedProgress) * multiplier) / multiplier;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, decimals]);

  return (
    <GradientText variant={variant} style={style}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </GradientText>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';

// ==========================================
// BUDGET PROGRESS BAR (Traffic Light Colors)
// ==========================================

export interface BudgetProgressBarProps {
  /** Amount spent in base currency (USD) */
  spent: number;
  /** Budget amount in base currency (USD) */
  budget: number;
  showAmount?: boolean;
  /** Optional override currency - if not provided, uses global currency */
  currency?: string;
  height?: number;
  style?: ViewStyle;
}

/**
 * Get budget status color based on spending percentage
 * Uses traffic light system: green (safe), orange (warning), red (danger/over)
 */
export const getBudgetStatusColor = (spent: number, budget: number): string => {
  if (budget <= 0) return Colors.text.tertiary;
  const percentage = (spent / budget) * 100;
  if (percentage >= 100) return Colors.semantic.budgetDanger;   // Red - over budget
  if (percentage >= 80) return Colors.semantic.budgetWarning;    // Orange - approaching limit
  return Colors.semantic.budgetSafe;                              // Green - safe
};

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = memo(({
  spent, budget, showAmount = true, currency: propCurrency, height = 4, style,
}) => {
  const { format } = useCurrency();

  // Amounts should be pre-converted to user's display currency by the caller
  const convertedSpent = spent;
  const convertedBudget = budget;

  const percentage = convertedBudget > 0 ? Math.min((convertedSpent / convertedBudget) * 100, 100) : 0;
  const progressColor = getBudgetStatusColor(convertedSpent, convertedBudget);
  const isOverBudget = convertedSpent > convertedBudget;

  return (
    <View style={style}>
      <View style={[budgetProgressStyles.bar, { height }]}>
        <View
          style={[
            budgetProgressStyles.fill,
            { width: `${percentage}%`, backgroundColor: progressColor },
          ]}
        />
      </View>
      {showAmount && (
        <View style={budgetProgressStyles.amountRow}>
          <Text style={[budgetProgressStyles.spent, isOverBudget && { color: Colors.semantic.budgetDanger }]}>
            {format(convertedSpent)}
          </Text>
          <Text style={budgetProgressStyles.budget}>
            / {format(convertedBudget)}
          </Text>
        </View>
      )}
    </View>
  );
});

BudgetProgressBar.displayName = 'BudgetProgressBar';

const budgetProgressStyles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.darker,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  amountRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  spent: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.text.primary,
  },
  budget: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
});

// ==========================================
// EMPTY STATE
// ==========================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({ icon, title, description, action, actionLabel, onAction, style }) => (
  <View style={[styles.emptyState, style]}>
    {icon && <View style={styles.emptyStateIcon}>{icon}</View>}
    <GradientText variant="muted" style={styles.emptyStateTitle}>{title}</GradientText>
    {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
    {action && <View style={styles.emptyStateAction}>{action}</View>}
    {actionLabel && onAction && (
      <TouchableOpacity onPress={onAction} style={styles.emptyStateActionButton}>
        <Text style={styles.emptyStateActionLabel}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
));

EmptyState.displayName = 'EmptyState';

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Progress Ring
  progressRingContainer: { alignItems: 'center', justifyContent: 'center' },
  progressRingContent: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  // Transaction Item - proper layout to prevent text truncation
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.md },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.transparent.deep20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  transactionInfo: { flex: 1, minWidth: 0 },
  merchantName: { fontFamily: FontFamily.medium, fontSize: FontSize.body },
  transactionCategory: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', flexShrink: 0 },
  transactionAmount: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  transactionDate: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginTop: 2 },

  // Subscription Card
  subscriptionContent: { width: '100%' },
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
  emptyStateActionButton: { marginTop: Spacing.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, backgroundColor: Colors.transparent.neon20, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.neon },
  emptyStateActionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body, color: Colors.neon },
});

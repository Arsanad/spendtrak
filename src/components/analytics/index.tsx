// SPENDTRAK CINEMATIC EDITION - Analytics Components
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../design/cinematic';
import { easeOutCubic } from '../../config/easingFunctions';
import { GradientText } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { TrendUpIcon, TrendDownIcon } from '../icons';
import { useTranslation } from '../../context/LanguageContext';

// ==========================================
// KPI CARD
// ==========================================

export interface KPICardProps {
  label: string;
  value: number;
  currency?: string;
  change?: number; // Percentage change
  type: 'income' | 'expense' | 'net';
  style?: ViewStyle;
}

// Animated counter hook for KPI values
const useAnimatedCounter = (targetValue: number, duration: number = 1200) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(targetValue, {
      duration,
      easing: easeOutCubic,
    });

    // Update display value during animation
    const interval = setInterval(() => {
      setDisplayValue(Math.round(animatedValue.value));
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValue(Math.abs(targetValue));
    }, duration + 100);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [targetValue, duration]);

  return displayValue;
};

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  currency = 'AED',
  change,
  type,
  style,
}) => {
  const displayValue = useAnimatedCounter(Math.abs(value));

  // Value color: income=green, expense=red, net=dynamic
  const getValueColor = () => {
    if (type === 'income') return Colors.semantic.income;
    if (type === 'expense') return Colors.semantic.expense;
    // Net: green if positive, red if negative, neutral if zero
    if (value > 0) return Colors.semantic.income;
    if (value < 0) return Colors.semantic.expense;
    return Colors.semantic.neutral;
  };

  // Label color matches the type
  const getLabelColor = () => {
    if (type === 'income') return Colors.semantic.income;
    if (type === 'expense') return Colors.semantic.expense;
    // Net label: neutral/bronze
    return Colors.semantic.neutral;
  };

  // Change color: 0% = neutral, positive/negative depends on context
  const getChangeColor = () => {
    if (change === undefined) return Colors.text.tertiary;
    // 0% change = neutral
    if (change === 0) return Colors.semantic.neutral;

    if (type === 'expense') {
      // For expenses: decrease (negative) is GOOD (green), increase (positive) is BAD (red)
      return change < 0 ? Colors.semantic.income : Colors.semantic.expense;
    }
    // For income/net: increase (positive) is GOOD (green), decrease (negative) is BAD (red)
    return change > 0 ? Colors.semantic.income : Colors.semantic.expense;
  };

  const valueColor = getValueColor();
  const labelColor = getLabelColor();
  const changeColor = getChangeColor();

  return (
    <GlassCard variant="default" size="compact" style={style ? [kpiStyles.card, style] : kpiStyles.card}>
      <Text style={[kpiStyles.label, { color: labelColor }]}>{label}</Text>

      {change !== undefined && (
        <View style={kpiStyles.changeContainer}>
          {change === 0 ? null : change > 0 ? (
            <TrendUpIcon size={12} color={changeColor} />
          ) : (
            <TrendDownIcon size={12} color={changeColor} />
          )}
          <Text style={[kpiStyles.change, { color: changeColor }]}>
            {change > 0 ? '+' : ''}{change.toFixed(0)}%
          </Text>
        </View>
      )}

      <Text style={[kpiStyles.value, { color: valueColor }]}>
        {displayValue.toLocaleString()}
      </Text>
      <Text style={[kpiStyles.currency, { color: valueColor }]}>{currency}</Text>
    </GlassCard>
  );
};

const kpiStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 2,
  },
  change: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  currency: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    marginTop: 2,
  },
});

// ==========================================
// MERCHANT LEADERBOARD
// ==========================================

export interface MerchantItem {
  rank: number;
  merchant: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MerchantLeaderboardProps {
  merchants: MerchantItem[];
  currency?: string;
  style?: ViewStyle;
  onViewAll?: () => void;
}

// Animated Bar Component for Merchant
const AnimatedBar: React.FC<{ percentage: number; delay: number }> = ({ percentage, delay }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(percentage, {
      duration: 800,
      easing: easeOutCubic,
    }));
  }, [percentage, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Animated.View style={[merchantStyles.bar, animatedStyle]} />
  );
};

export const MerchantLeaderboard: React.FC<MerchantLeaderboardProps> = ({
  merchants,
  currency = 'AED',
  style,
  onViewAll,
}) => {
  const { t } = useTranslation();
  const maxAmount = Math.max(...merchants.map(m => m.amount), 1);

  return (
    <View style={[merchantStyles.container, style]}>
      {merchants.map((merchant, index) => (
        <View key={merchant.rank} style={merchantStyles.item}>
          <View style={merchantStyles.rankContainer}>
            <Text style={merchantStyles.rank}>{merchant.rank}.</Text>
          </View>

          <View style={merchantStyles.info}>
            <View style={merchantStyles.header}>
              <Text style={merchantStyles.name} numberOfLines={1}>
                {merchant.merchant}
              </Text>
              <Text style={merchantStyles.count}>{merchant.count}x</Text>
            </View>

            <View style={merchantStyles.barContainer}>
              <AnimatedBar
                percentage={(merchant.amount / maxAmount) * 100}
                delay={index * 100}
              />
            </View>

            <Text style={merchantStyles.amount}>
              {currency} {merchant.amount.toLocaleString()}
            </Text>
          </View>
        </View>
      ))}

      {onViewAll && (
        <Pressable style={merchantStyles.viewAll} onPress={onViewAll}>
          <Text style={merchantStyles.viewAllText}>{t('common.viewAll')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.neon} />
        </Pressable>
      )}
    </View>
  );
};

const merchantStyles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rankContainer: {
    width: 24,
    marginRight: Spacing.sm,
  },
  rank: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body,
    color: Colors.neon,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    flex: 1,
  },
  count: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.semantic.neutral,
    marginLeft: Spacing.sm,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.darker,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.semantic.expense,
    borderRadius: 3,
  },
  amount: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.semantic.expense,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  viewAllText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    marginRight: 4,
  },
});

// ==========================================
// BURN RATE GAUGE
// ==========================================

export interface BurnRateGaugeProps {
  dailyRate: number;
  projectedMonthEnd: number;
  vsBudget: number;
  currency?: string;
  style?: ViewStyle;
}

export const BurnRateGauge: React.FC<BurnRateGaugeProps> = ({
  dailyRate,
  projectedMonthEnd,
  vsBudget,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const animatedRate = useAnimatedCounter(dailyRate, 1500);
  const animatedProjection = useAnimatedCounter(projectedMonthEnd, 1800);
  const isOverBudget = vsBudget > 0;
  // Over budget = red, under budget = green, exactly on budget = neutral
  const statusColor = vsBudget === 0 ? Colors.semantic.neutral : (vsBudget > 0 ? Colors.semantic.expense : Colors.semantic.income);

  // Scale animation for the rate
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[burnRateStyles.container, style]}>
      <Animated.View style={[burnRateStyles.rateContainer, animatedStyle]}>
        <Text style={burnRateStyles.rate}>{animatedRate}</Text>
        <Text style={[burnRateStyles.rateLabel, { color: Colors.semantic.expense }]}>{currency}{t('analytics.perDay')}</Text>
      </Animated.View>

      <View style={burnRateStyles.projection}>
        <Text style={[burnRateStyles.projectionLabel, { color: Colors.semantic.expense }]}>{t('analytics.atThisPace')}</Text>
        <View style={[burnRateStyles.projectionCard, { borderColor: statusColor }]}>
          <Text style={[burnRateStyles.projectionAmount, { color: Colors.semantic.expense }]}>
            {currency} {animatedProjection.toLocaleString()}
          </Text>
          <Text style={[burnRateStyles.projectionSub, { color: Colors.semantic.expense }]}>{t('analytics.byMonthEnd')}</Text>
          {vsBudget !== 0 && (
            <Text style={[burnRateStyles.vsBudget, { color: statusColor }]}>
              {t(isOverBudget ? 'analytics.overBudgetLabel' : 'analytics.underBudgetLabel', { amount: `${isOverBudget ? '+' : ''}${vsBudget.toFixed(0)}` })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const burnRateStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  rateContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  rate: {
    fontFamily: FontFamily.bold,
    fontSize: 48,
    color: Colors.semantic.expense,
    letterSpacing: -1,
  },
  rateLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  projection: {
    width: '100%',
  },
  projectionLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  projectionCard: {
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  projectionAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
  },
  projectionSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  vsBudget: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    marginTop: Spacing.sm,
  },
});

// ==========================================
// SUBSCRIPTION BURN SECTION
// ==========================================

export interface SubscriptionBurnProps {
  monthlyTotal: number;
  yearlyTotal: number;
  unusedSubscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    lastUsedDays: number;
  }>;
  upcomingRenewals: Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
  }>;
  currency?: string;
  style?: ViewStyle;
  onViewAll?: () => void;
}

export const SubscriptionBurn: React.FC<SubscriptionBurnProps> = ({
  monthlyTotal,
  yearlyTotal,
  unusedSubscriptions,
  upcomingRenewals,
  currency = 'AED',
  style,
  onViewAll,
}) => {
  const { t, languageCode } = useTranslation();
  return (
    <View style={[subBurnStyles.container, style]}>
      {/* Totals */}
      <View style={subBurnStyles.totals}>
        <View style={subBurnStyles.totalCard}>
          <Text style={[subBurnStyles.totalLabel, { color: Colors.semantic.expense }]}>{t('analytics.monthlyCost')}</Text>
          <Text style={subBurnStyles.totalValue}>
            {currency} {monthlyTotal.toLocaleString()}
          </Text>
          <Text style={[subBurnStyles.totalSub, { color: Colors.semantic.expense }]}>{t('analytics.perMonth')}</Text>
        </View>

        <View style={subBurnStyles.totalCard}>
          <Text style={[subBurnStyles.totalLabel, { color: Colors.semantic.expense }]}>{t('analytics.yearlyImpact')}</Text>
          <Text style={subBurnStyles.totalValue}>
            {currency} {yearlyTotal.toLocaleString()}
          </Text>
          <Text style={[subBurnStyles.totalSub, { color: Colors.semantic.expense }]}>{t('analytics.perYear')}</Text>
        </View>
      </View>

      {/* Unused Subscriptions Warning */}
      {unusedSubscriptions.length > 0 && (
        <View style={subBurnStyles.warningSection}>
          <View style={subBurnStyles.warningHeader}>
            <Ionicons name="warning" size={16} color={Colors.semantic.warning} />
            <Text style={subBurnStyles.warningTitle}>{t('analytics.unusedSubscriptions')}</Text>
          </View>
          {unusedSubscriptions.slice(0, 2).map((sub) => (
            <View key={sub.id} style={subBurnStyles.warningItem}>
              <Text style={subBurnStyles.warningName}>{sub.name}</Text>
              <Text style={subBurnStyles.warningDetail}>
                {t('analytics.notUsedInDays', { days: sub.lastUsedDays })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming Renewals */}
      {upcomingRenewals.length > 0 && (
        <View style={subBurnStyles.upcomingSection}>
          <Text style={subBurnStyles.upcomingTitle}>{t('analytics.upcomingRenewals')}</Text>
          {upcomingRenewals.slice(0, 3).map((sub) => (
            <View key={sub.id} style={subBurnStyles.upcomingItem}>
              <Text style={subBurnStyles.upcomingName}>{sub.name}</Text>
              <View style={subBurnStyles.upcomingRight}>
                <Text style={subBurnStyles.upcomingDate}>
                  {new Date(sub.date).toLocaleDateString(languageCode, { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={subBurnStyles.upcomingAmount}>
                  {currency} {sub.amount}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {onViewAll && (
        <Pressable style={subBurnStyles.viewAll} onPress={onViewAll}>
          <Text style={subBurnStyles.viewAllText}>{t('analytics.viewAllSubscriptions')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.neon} />
        </Pressable>
      )}
    </View>
  );
};

const subBurnStyles = StyleSheet.create({
  container: {},
  totals: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  totalCard: {
    flex: 1,
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  totalValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.semantic.expense,
  },
  totalSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
  },
  warningSection: {
    backgroundColor: `${Colors.semantic.warning}10`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.semantic.warning}30`,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  warningTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.semantic.warning,
  },
  warningItem: {
    marginTop: Spacing.xs,
  },
  warningName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  warningDetail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  upcomingSection: {
    marginBottom: Spacing.md,
  },
  upcomingTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  upcomingName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  upcomingRight: {
    alignItems: 'flex-end',
  },
  upcomingDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  upcomingAmount: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.semantic.expense,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  viewAllText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    marginRight: 4,
  },
});

// ==========================================
// DEBT OVERVIEW SECTION
// ==========================================

export interface DebtOverviewProps {
  totalDebt: number;
  monthlyInterest: number;
  payoffProgress: number;
  currency?: string;
  style?: ViewStyle;
  onViewDetails?: () => void;
}

export const DebtOverview: React.FC<DebtOverviewProps> = ({
  totalDebt,
  monthlyInterest,
  payoffProgress,
  currency = 'AED',
  style,
  onViewDetails,
}) => {
  const { t } = useTranslation();
  if (totalDebt === 0) {
    return (
      <View style={[debtStyles.container, style]}>
        <View style={debtStyles.emptyState}>
          <Ionicons name="checkmark-circle" size={40} color={Colors.semantic.income} />
          <Text style={debtStyles.emptyText}>{t('analytics.debtFree')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[debtStyles.container, style]}>
      <View style={debtStyles.totals}>
        <View style={debtStyles.totalCard}>
          <Text style={[debtStyles.totalLabel, { color: Colors.semantic.expense }]}>{t('analytics.totalDebt')}</Text>
          <Text style={debtStyles.totalValue}>
            {currency} {totalDebt.toLocaleString()}
          </Text>
        </View>

        <View style={debtStyles.totalCard}>
          <Text style={[debtStyles.totalLabel, { color: Colors.semantic.expense }]}>{t('analytics.interestCost')}</Text>
          <Text style={debtStyles.totalValue}>
            {currency} {monthlyInterest.toFixed(0)}
          </Text>
          <Text style={[debtStyles.totalSub, { color: Colors.semantic.expense }]}>{t('analytics.perMonth')}</Text>
        </View>
      </View>

      {onViewDetails && (
        <Pressable style={debtStyles.viewDetails} onPress={onViewDetails}>
          <Text style={debtStyles.viewDetailsText}>{t('analytics.viewDebtDetails')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.neon} />
        </Pressable>
      )}
    </View>
  );
};

const debtStyles = StyleSheet.create({
  container: {},
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.semantic.income,
    marginTop: Spacing.sm,
  },
  totals: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  totalCard: {
    flex: 1,
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  totalValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.semantic.expense,
  },
  totalSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  viewDetailsText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    marginRight: 4,
  },
});

// ==========================================
// NET WORTH TRACKER
// ==========================================

export interface NetWorthTrackerProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  changePercentage: number;
  currency?: string;
  style?: ViewStyle;
  onViewBreakdown?: () => void;
}

export const NetWorthTracker: React.FC<NetWorthTrackerProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  changePercentage,
  currency = 'AED',
  style,
  onViewBreakdown,
}) => {
  const { t } = useTranslation();
  const animatedNetWorth = useAnimatedCounter(netWorth, 1500);
  const animatedAssets = useAnimatedCounter(totalAssets, 1200);
  const animatedLiabilities = useAnimatedCounter(totalLiabilities, 1200);
  // Net worth color: positive=green, negative=red, zero=neutral
  const netWorthColor = netWorth > 0 ? Colors.semantic.income : (netWorth < 0 ? Colors.semantic.expense : Colors.semantic.neutral);
  // Change color: positive=green, negative=red, zero=neutral
  const changeColor = changePercentage > 0 ? Colors.semantic.income : (changePercentage < 0 ? Colors.semantic.expense : Colors.semantic.neutral);

  // Scale animation for main value
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[netWorthStyles.container, style]}>
      <Animated.View style={[netWorthStyles.header, headerAnimatedStyle]}>
        <Text style={[netWorthStyles.value, { color: netWorthColor }]}>
          {currency} {animatedNetWorth.toLocaleString()}
        </Text>
        {changePercentage !== 0 && (
          <View style={netWorthStyles.change}>
            {changePercentage > 0 ? (
              <TrendUpIcon size={14} color={changeColor} />
            ) : (
              <TrendDownIcon size={14} color={changeColor} />
            )}
            <Text style={[netWorthStyles.changeText, { color: changeColor }]}>
              {changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={netWorthStyles.breakdown}>
        <View style={netWorthStyles.breakdownItem}>
          <Text style={[netWorthStyles.breakdownLabel, { color: Colors.semantic.income }]}>{t('analytics.assets')}</Text>
          <Text style={[netWorthStyles.breakdownValue, { color: Colors.semantic.income }]}>
            {currency} {animatedAssets.toLocaleString()}
          </Text>
        </View>

        <View style={netWorthStyles.breakdownItem}>
          <Text style={[netWorthStyles.breakdownLabel, { color: Colors.semantic.expense }]}>{t('analytics.liabilities')}</Text>
          <Text style={[netWorthStyles.breakdownValue, { color: Colors.semantic.expense }]}>
            {currency} {animatedLiabilities.toLocaleString()}
          </Text>
        </View>
      </View>

      {onViewBreakdown && (
        <Pressable style={netWorthStyles.viewBreakdown} onPress={onViewBreakdown}>
          <Text style={netWorthStyles.viewBreakdownText}>{t('analytics.viewFullBreakdown')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.neon} />
        </Pressable>
      )}
    </View>
  );
};

const netWorthStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  changeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  breakdown: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  breakdownValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  viewBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  viewBreakdownText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    marginRight: 4,
  },
});

// ==========================================
// GOALS PROGRESS
// ==========================================

export interface GoalProgressItem {
  id: string;
  name: string;
  icon: string;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  estimatedDate: string | null;
}

export interface GoalsProgressProps {
  goals: GoalProgressItem[];
  currency?: string;
  style?: ViewStyle;
  onViewAll?: () => void;
}

// Animated Progress Bar for Goals
const AnimatedGoalBar: React.FC<{ percentage: number; delay: number }> = ({ percentage, delay }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(Math.min(percentage, 100), {
      duration: 1000,
      easing: easeOutCubic,
    }));
  }, [percentage, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Animated.View style={[goalsStyles.progressFill, animatedStyle]} />
  );
};

export const GoalsProgress: React.FC<GoalsProgressProps> = ({
  goals,
  currency = 'AED',
  style,
  onViewAll,
}) => {
  const { t, languageCode } = useTranslation();
  if (goals.length === 0) {
    return (
      <View style={[goalsStyles.container, style]}>
        <View style={goalsStyles.emptyState}>
          <Ionicons name="flag-outline" size={32} color={Colors.text.tertiary} />
          <Text style={goalsStyles.emptyText}>{t('analytics.noGoalsSetYet')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[goalsStyles.container, style]}>
      {goals.slice(0, 3).map((goal, index) => (
        <View key={goal.id} style={goalsStyles.goalItem}>
          <View style={goalsStyles.goalHeader}>
            <Ionicons name={goal.icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.neon} />
            <Text style={goalsStyles.goalName} numberOfLines={1}>{goal.name}</Text>
          </View>

          <View style={goalsStyles.progressBar}>
            <AnimatedGoalBar
              percentage={goal.percentage}
              delay={index * 150}
            />
          </View>

          <View style={goalsStyles.goalFooter}>
            <Text style={goalsStyles.goalAmount}>
              <Text style={{ color: Colors.semantic.income }}>{currency} {goal.currentAmount.toLocaleString()}</Text>
              <Text style={{ color: Colors.semantic.neutral }}> / {goal.targetAmount.toLocaleString()}</Text>
            </Text>
            {goal.estimatedDate && (
              <Text style={goalsStyles.goalDate}>
                Est: {new Date(goal.estimatedDate).toLocaleDateString(languageCode, { month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
      ))}

      {onViewAll && goals.length > 3 && (
        <Pressable style={goalsStyles.viewAll} onPress={onViewAll}>
          <Text style={goalsStyles.viewAllText}>{t('analytics.viewAllGoals')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.neon} />
        </Pressable>
      )}
    </View>
  );
};

const goalsStyles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  goalItem: {
    marginBottom: Spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  goalName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.darker,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.neon,
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalAmount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.secondary,
  },
  goalDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  viewAllText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    marginRight: 4,
  },
});

// ==========================================
// DAILY BREAKDOWN CHART (WEEKLY VIEW)
// ==========================================

export interface DailyBreakdownData {
  day: string;
  shortDay: string;
  date: string;
  amount: number;
  count: number;
}

export interface DailyBreakdownChartProps {
  data: DailyBreakdownData[];
  highestDay: { day: string; amount: number };
  lowestDay: { day: string; amount: number };
  currency?: string;
  style?: ViewStyle;
}

const AnimatedDailyBar: React.FC<{ amount: number; maxAmount: number; delay: number }> = ({
  amount,
  maxAmount,
  delay,
}) => {
  const height = useSharedValue(0);
  const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

  useEffect(() => {
    height.value = withDelay(delay, withTiming(percentage, {
      duration: 800,
      easing: easeOutCubic,
    }));
  }, [percentage, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${height.value}%`,
  }));

  return <Animated.View style={[dailyBreakdownStyles.bar, animatedStyle]} />;
};

export const DailyBreakdownChart: React.FC<DailyBreakdownChartProps> = ({
  data,
  highestDay,
  lowestDay,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <View style={[dailyBreakdownStyles.container, style]}>
      <View style={dailyBreakdownStyles.chartContainer}>
        {data.map((day, index) => (
          <View key={day.date} style={dailyBreakdownStyles.barWrapper}>
            <View style={dailyBreakdownStyles.barContainer}>
              <AnimatedDailyBar
                amount={day.amount}
                maxAmount={maxAmount}
                delay={index * 80}
              />
            </View>
            <Text style={dailyBreakdownStyles.dayLabel}>{day.shortDay}</Text>
            {day.amount > 0 && (
              <Text style={dailyBreakdownStyles.amountLabel}>
                {day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount.toFixed(0)}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={dailyBreakdownStyles.insights}>
        {highestDay.amount > 0 && (
          <View style={dailyBreakdownStyles.insightRow}>
            <Text style={[dailyBreakdownStyles.insightLabel, { color: Colors.semantic.expense }]}>{t('analytics.highest')}</Text>
            <Text style={[dailyBreakdownStyles.insightValue, { color: Colors.semantic.expense }]}>
              {highestDay.day} ({currency} {highestDay.amount.toLocaleString()})
            </Text>
          </View>
        )}
        {lowestDay.amount > 0 && (
          <View style={dailyBreakdownStyles.insightRow}>
            <Text style={[dailyBreakdownStyles.insightLabel, { color: Colors.semantic.income }]}>{t('analytics.lowest')}</Text>
            <Text style={[dailyBreakdownStyles.insightValue, { color: Colors.semantic.income }]}>
              {lowestDay.day} ({currency} {lowestDay.amount.toLocaleString()})
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const dailyBreakdownStyles = StyleSheet.create({
  container: {},
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: Spacing.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barContainer: {
    flex: 1,
    width: 24,
    backgroundColor: Colors.transparent.dark40,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: Colors.semantic.expense,
    borderRadius: 4,
  },
  dayLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  amountLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  insights: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  insightValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.semantic.expense,
  },
});

// ==========================================
// WEEK COMPARISON CARD (WEEKLY VIEW)
// ==========================================

export interface WeekComparisonData {
  thisWeek: {
    total: number;
    dailyAvg: number;
    transactionCount: number;
  };
  lastWeek: {
    total: number;
    dailyAvg: number;
    transactionCount: number;
  };
  change: {
    totalPercent: number;
    dailyAvgPercent: number;
    transactionPercent: number;
  };
  insight: string;
}

export interface WeekComparisonCardProps {
  data: WeekComparisonData;
  currency?: string;
  style?: ViewStyle;
}

export const WeekComparisonCard: React.FC<WeekComparisonCardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const { thisWeek, lastWeek, change, insight } = data;
  const isSpendingLess = change.totalPercent < 0;

  // Helper to get spending change color: decrease=green, increase=red, 0=neutral
  const getSpendingChangeColor = (percent: number) => {
    if (percent === 0) return Colors.semantic.neutral;
    return percent < 0 ? Colors.semantic.income : Colors.semantic.expense;
  };

  return (
    <View style={[weekCompStyles.container, style]}>
      <View style={weekCompStyles.table}>
        <View style={weekCompStyles.headerRow}>
          <Text style={weekCompStyles.headerCell}></Text>
          <Text style={weekCompStyles.headerCell}>{t('analytics.thisWeek')}</Text>
          <Text style={weekCompStyles.headerCell}>{t('time.lastWeek')}</Text>
          <Text style={weekCompStyles.headerCell}>{t('analytics.change')}</Text>
        </View>

        <View style={weekCompStyles.dataRow}>
          <Text style={[weekCompStyles.labelCell, { color: Colors.semantic.expense }]}>{t('analytics.total')}</Text>
          <Text style={[weekCompStyles.valueCell, { color: Colors.semantic.expense }]}>
            {currency} {thisWeek.total.toLocaleString()}
          </Text>
          <Text style={[weekCompStyles.valueCell, { color: Colors.semantic.expense }]}>
            {currency} {lastWeek.total.toLocaleString()}
          </Text>
          <View style={weekCompStyles.changeCell}>
            {change.totalPercent === 0 ? null : change.totalPercent < 0 ? (
              <TrendDownIcon size={12} color={getSpendingChangeColor(change.totalPercent)} />
            ) : (
              <TrendUpIcon size={12} color={getSpendingChangeColor(change.totalPercent)} />
            )}
            <Text style={[weekCompStyles.changeText, { color: getSpendingChangeColor(change.totalPercent) }]}>
              {Math.abs(change.totalPercent).toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={weekCompStyles.dataRow}>
          <Text style={[weekCompStyles.labelCell, { color: Colors.semantic.expense }]}>{t('analytics.dailyAvg')}</Text>
          <Text style={[weekCompStyles.valueCell, { color: Colors.semantic.expense }]}>
            {currency} {thisWeek.dailyAvg.toFixed(0)}
          </Text>
          <Text style={[weekCompStyles.valueCell, { color: Colors.semantic.expense }]}>
            {currency} {lastWeek.dailyAvg.toFixed(0)}
          </Text>
          <View style={weekCompStyles.changeCell}>
            {change.dailyAvgPercent === 0 ? null : change.dailyAvgPercent < 0 ? (
              <TrendDownIcon size={12} color={getSpendingChangeColor(change.dailyAvgPercent)} />
            ) : (
              <TrendUpIcon size={12} color={getSpendingChangeColor(change.dailyAvgPercent)} />
            )}
            <Text style={[weekCompStyles.changeText, { color: getSpendingChangeColor(change.dailyAvgPercent) }]}>
              {Math.abs(change.dailyAvgPercent).toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={weekCompStyles.dataRow}>
          <Text style={[weekCompStyles.labelCell, { color: Colors.semantic.neutral }]}>{t('analytics.numTransactions')}</Text>
          <Text style={[weekCompStyles.valueCell, { color: Colors.semantic.neutral }]}>{thisWeek.transactionCount}</Text>
          <Text style={[weekCompStyles.valueCell, { color: Colors.semantic.neutral }]}>{lastWeek.transactionCount}</Text>
          <View style={weekCompStyles.changeCell}>
            {/* Transaction count change is neutral - it's just a statistic */}
            <Text style={[weekCompStyles.changeText, { color: Colors.semantic.neutral }]}>
              {change.transactionPercent > 0 ? '+' : ''}{change.transactionPercent.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={[
        weekCompStyles.insightBox,
        { borderColor: isSpendingLess ? Colors.semantic.income : Colors.semantic.warning }
      ]}>
        <Ionicons
          name={isSpendingLess ? 'checkmark-circle' : 'alert-circle'}
          size={16}
          color={isSpendingLess ? Colors.semantic.income : Colors.semantic.warning}
        />
        <Text style={[
          weekCompStyles.insightText,
          { color: isSpendingLess ? Colors.semantic.income : Colors.semantic.warning }
        ]}>
          {insight}
        </Text>
      </View>
    </View>
  );
};

const weekCompStyles = StyleSheet.create({
  container: {},
  table: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerCell: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    alignItems: 'center',
  },
  labelCell: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.secondary,
  },
  valueCell: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  changeCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  changeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  insightText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    flex: 1,
  },
});

// ==========================================
// WEEK PROJECTION CARD (WEEKLY VIEW)
// ==========================================

export interface WeekProjectionData {
  daysElapsed: number;
  daysRemaining: number;
  currentSpend: number;
  dailyAverage: number;
  projectedWeekTotal: number;
  vsLastWeek: number;
}

export interface WeekProjectionCardProps {
  data: WeekProjectionData;
  currency?: string;
  style?: ViewStyle;
}

export const WeekProjectionCard: React.FC<WeekProjectionCardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const { daysElapsed, daysRemaining, currentSpend, dailyAverage, projectedWeekTotal, vsLastWeek } = data;

  // For spending: increase=bad(red), decrease=good(green), 0=neutral
  const getVsLastWeekColor = () => {
    if (vsLastWeek === 0) return Colors.semantic.neutral;
    return vsLastWeek > 0 ? Colors.semantic.expense : Colors.semantic.income;
  };
  const vsColor = getVsLastWeekColor();

  return (
    <View style={[projectionStyles.container, style]}>
      <View style={projectionStyles.statsRow}>
        <View style={projectionStyles.stat}>
          <Text style={[projectionStyles.statLabel, { color: Colors.semantic.neutral }]}>{t('analytics.daysElapsed')}</Text>
          <Text style={[projectionStyles.statValue, { color: Colors.semantic.neutral }]}>{t('analytics.daysOfSeven', { days: daysElapsed })}</Text>
        </View>
        <View style={projectionStyles.stat}>
          <Text style={[projectionStyles.statLabel, { color: Colors.semantic.expense }]}>{t('analytics.currentSpend')}</Text>
          <Text style={[projectionStyles.statValue, { color: Colors.semantic.expense }]}>
            {currency} {currentSpend.toLocaleString()}
          </Text>
        </View>
        <View style={projectionStyles.stat}>
          <Text style={[projectionStyles.statLabel, { color: Colors.semantic.expense }]}>{t('analytics.dailyAverage')}</Text>
          <Text style={[projectionStyles.statValue, { color: Colors.semantic.expense }]}>
            {currency} {dailyAverage.toFixed(0)}
          </Text>
        </View>
      </View>

      <View style={projectionStyles.projectionBox}>
        <Text style={[projectionStyles.projectionLabel, { color: Colors.semantic.expense }]}>{t('analytics.projectedWeekTotal')}</Text>
        <Text style={projectionStyles.projectionValue}>
          {currency} {projectedWeekTotal.toLocaleString()}
        </Text>
        <View style={projectionStyles.vsLastWeek}>
          {vsLastWeek === 0 ? null : vsLastWeek > 0 ? (
            <TrendUpIcon size={14} color={vsColor} />
          ) : (
            <TrendDownIcon size={14} color={vsColor} />
          )}
          <Text style={[projectionStyles.vsLastWeekText, { color: vsColor }]}>
            {t('analytics.vsLastWeek', { percent: `${vsLastWeek > 0 ? '+' : ''}${vsLastWeek.toFixed(0)}` })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const projectionStyles = StyleSheet.create({
  container: {},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  projectionBox: {
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    alignItems: 'center',
  },
  projectionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  projectionValue: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.semantic.expense,
    letterSpacing: -0.5,
  },
  vsLastWeek: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  vsLastWeekText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
});

// ==========================================
// MONTH BY MONTH CHART (YEARLY VIEW)
// ==========================================

export interface MonthlyTrendData {
  month: string;
  fullMonth: string;
  amount: number;
  income: number;
  net: number;
}

export interface MonthByMonthChartProps {
  data: MonthlyTrendData[];
  highestMonth: { month: string; amount: number };
  lowestMonth: { month: string; amount: number };
  averageMonthly: number;
  currency?: string;
  style?: ViewStyle;
}

const AnimatedMonthBar: React.FC<{ amount: number; maxAmount: number; delay: number }> = ({
  amount,
  maxAmount,
  delay,
}) => {
  const height = useSharedValue(0);
  const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

  useEffect(() => {
    height.value = withDelay(delay, withTiming(percentage, {
      duration: 800,
      easing: easeOutCubic,
    }));
  }, [percentage, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${height.value}%`,
  }));

  return <Animated.View style={[monthByMonthStyles.bar, animatedStyle]} />;
};

export const MonthByMonthChart: React.FC<MonthByMonthChartProps> = ({
  data,
  highestMonth,
  lowestMonth,
  averageMonthly,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <View style={[monthByMonthStyles.container, style]}>
      <View style={monthByMonthStyles.chartContainer}>
        {data.map((month, index) => (
          <View key={month.month} style={monthByMonthStyles.barWrapper}>
            <View style={monthByMonthStyles.barContainer}>
              <AnimatedMonthBar
                amount={month.amount}
                maxAmount={maxAmount}
                delay={index * 50}
              />
            </View>
            <Text style={monthByMonthStyles.monthLabel}>{month.month}</Text>
          </View>
        ))}
      </View>

      <View style={monthByMonthStyles.insights}>
        <View style={monthByMonthStyles.insightRow}>
          <Text style={[monthByMonthStyles.insightLabel, { color: Colors.semantic.expense }]}>{t('analytics.highest')}</Text>
          <Text style={[monthByMonthStyles.insightValue, { color: Colors.semantic.expense }]}>
            {highestMonth.month} ({currency} {highestMonth.amount.toLocaleString()})
          </Text>
        </View>
        <View style={monthByMonthStyles.insightRow}>
          <Text style={[monthByMonthStyles.insightLabel, { color: Colors.semantic.income }]}>{t('analytics.lowest')}</Text>
          <Text style={[monthByMonthStyles.insightValue, { color: Colors.semantic.income }]}>
            {lowestMonth.month} ({currency} {lowestMonth.amount.toLocaleString()})
          </Text>
        </View>
        <View style={monthByMonthStyles.insightRow}>
          <Text style={[monthByMonthStyles.insightLabel, { color: Colors.semantic.neutral }]}>{t('analytics.average')}</Text>
          <Text style={[monthByMonthStyles.insightValue, { color: Colors.semantic.neutral }]}>
            {currency} {averageMonthly.toLocaleString()}{t('analytics.perMo')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const monthByMonthStyles = StyleSheet.create({
  container: {},
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingBottom: Spacing.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    marginHorizontal: 1,
  },
  barContainer: {
    flex: 1,
    width: '90%',
    maxWidth: 20,
    backgroundColor: Colors.transparent.dark40,
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: Colors.semantic.expense,
    borderRadius: 3,
  },
  monthLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  insights: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  insightValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.text.primary,
  },
});

// ==========================================
// YEAR OVER YEAR COMPARISON (YEARLY VIEW)
// ==========================================

export interface YearOverYearData {
  currentYear: {
    year: number;
    income: number;
    expenses: number;
    saved: number;
    savingsRate: number;
  };
  previousYear: {
    year: number;
    income: number;
    expenses: number;
    saved: number;
    savingsRate: number;
  };
  change: {
    incomePercent: number;
    expensesPercent: number;
    savedPercent: number;
    savingsRateChange: number;
  };
  insight: string;
}

export interface YearOverYearCardProps {
  data: YearOverYearData;
  currency?: string;
  style?: ViewStyle;
}

export const YearOverYearCard: React.FC<YearOverYearCardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const { currentYear, previousYear, change, insight } = data;

  // For income/savings: increase=good(green), decrease=bad(red), 0=neutral
  // For expenses: increase=bad(red), decrease=good(green), 0=neutral
  const getChangeColor = (val: number, isExpense: boolean = false) => {
    if (val === 0) return Colors.semantic.neutral;
    if (isExpense) {
      return val < 0 ? Colors.semantic.income : Colors.semantic.expense;
    }
    return val > 0 ? Colors.semantic.income : Colors.semantic.expense;
  };

  return (
    <View style={[yoyStyles.container, style]}>
      <View style={yoyStyles.table}>
        <View style={yoyStyles.headerRow}>
          <Text style={yoyStyles.headerCell}></Text>
          <Text style={yoyStyles.headerCell}>{currentYear.year}</Text>
          <Text style={yoyStyles.headerCell}>{previousYear.year}</Text>
          <Text style={yoyStyles.headerCell}>{t('analytics.change')}</Text>
        </View>

        <View style={yoyStyles.dataRow}>
          <Text style={[yoyStyles.labelCell, { color: Colors.semantic.income }]}>{t('analytics.income')}</Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.income }]}>
            {(currentYear.income / 1000).toFixed(0)}K
          </Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.income }]}>
            {(previousYear.income / 1000).toFixed(0)}K
          </Text>
          <View style={yoyStyles.changeCell}>
            <Text style={[yoyStyles.changeText, { color: getChangeColor(change.incomePercent) }]}>
              {change.incomePercent > 0 ? '+' : ''}{change.incomePercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={yoyStyles.dataRow}>
          <Text style={[yoyStyles.labelCell, { color: Colors.semantic.expense }]}>{t('analytics.expenses')}</Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.expense }]}>
            {(currentYear.expenses / 1000).toFixed(0)}K
          </Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.expense }]}>
            {(previousYear.expenses / 1000).toFixed(0)}K
          </Text>
          <View style={yoyStyles.changeCell}>
            <Text style={[yoyStyles.changeText, { color: getChangeColor(change.expensesPercent, true) }]}>
              {change.expensesPercent > 0 ? '+' : ''}{change.expensesPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={yoyStyles.dataRow}>
          <Text style={[yoyStyles.labelCell, { color: Colors.semantic.income }]}>{t('analytics.saved')}</Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.income }]}>
            {(currentYear.saved / 1000).toFixed(0)}K
          </Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.income }]}>
            {(previousYear.saved / 1000).toFixed(0)}K
          </Text>
          <View style={yoyStyles.changeCell}>
            <Text style={[yoyStyles.changeText, { color: getChangeColor(change.savedPercent) }]}>
              {change.savedPercent > 0 ? '+' : ''}{change.savedPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={yoyStyles.dataRow}>
          <Text style={[yoyStyles.labelCell, { color: Colors.semantic.neutral }]}>{t('analytics.savRate')}</Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.neutral }]}>{currentYear.savingsRate.toFixed(1)}%</Text>
          <Text style={[yoyStyles.valueCell, { color: Colors.semantic.neutral }]}>{previousYear.savingsRate.toFixed(1)}%</Text>
          <View style={yoyStyles.changeCell}>
            <Text style={[yoyStyles.changeText, { color: getChangeColor(change.savingsRateChange) }]}>
              {change.savingsRateChange > 0 ? '+' : ''}{change.savingsRateChange.toFixed(1)}pp
            </Text>
          </View>
        </View>
      </View>

      <View style={yoyStyles.insightBox}>
        <Ionicons name="sparkles" size={16} color={Colors.neon} />
        <Text style={yoyStyles.insightText}>{insight}</Text>
      </View>
    </View>
  );
};

const yoyStyles = StyleSheet.create({
  container: {},
  table: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerCell: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    alignItems: 'center',
  },
  labelCell: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.secondary,
  },
  valueCell: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  changeCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.transparent.neon05,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.transparent.neon20,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  insightText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
    flex: 1,
  },
});

// ==========================================
// ANNUAL SUBSCRIPTIONS CARD (YEARLY VIEW)
// ==========================================

export interface AnnualSubscriptionData {
  id: string;
  name: string;
  monthlyAmount: number;
  yearlyAmount: number;
  category: string;
}

export interface AnnualSubscriptionsCardProps {
  totalAnnual: number;
  percentOfExpenses: number;
  subscriptions: AnnualSubscriptionData[];
  currency?: string;
  style?: ViewStyle;
}

export const AnnualSubscriptionsCard: React.FC<AnnualSubscriptionsCardProps> = ({
  totalAnnual,
  percentOfExpenses,
  subscriptions,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  return (
    <View style={[annualSubStyles.container, style]}>
      <View style={annualSubStyles.totalCard}>
        <Text style={[annualSubStyles.totalLabel, { color: Colors.semantic.expense }]}>{t('analytics.annualSubscriptionCost')}</Text>
        <Text style={annualSubStyles.totalValue}>
          {currency} {totalAnnual.toLocaleString()}
        </Text>
        <Text style={[annualSubStyles.totalSub, { color: Colors.semantic.neutral }]}>
          {t('analytics.ofTotalExpenses', { percent: percentOfExpenses.toFixed(1) })}
        </Text>
      </View>

      <Text style={[annualSubStyles.sectionTitle, { color: Colors.semantic.expense }]}>{t('analytics.topSubscriptions')}</Text>
      {subscriptions.slice(0, 4).map((sub, index) => (
        <View key={sub.id} style={annualSubStyles.subItem}>
          <Text style={annualSubStyles.subRank}>{index + 1}.</Text>
          <Text style={annualSubStyles.subName}>{sub.name}</Text>
          <Text style={annualSubStyles.subAmount}>
            {currency} {sub.yearlyAmount.toLocaleString()}{t('analytics.perYr')}
          </Text>
        </View>
      ))}
    </View>
  );
};

const annualSubStyles = StyleSheet.create({
  container: {},
  totalCard: {
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  totalValue: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.semantic.expense,
    letterSpacing: -0.5,
  },
  totalSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  subRank: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.neon,
    width: 24,
  },
  subName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    flex: 1,
  },
  subAmount: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.semantic.expense,
  },
});

// ==========================================
// DEBT PROGRESS CARD (YEARLY VIEW)
// ==========================================

export interface DebtProgressData {
  startOfYearTotal: number;
  currentTotal: number;
  paidOff: number;
  paidOffPercent: number;
  remainingPercent: number;
  projectedPayoffDate: string | null;
}

export interface DebtProgressCardProps {
  data: DebtProgressData;
  currency?: string;
  style?: ViewStyle;
}

export const DebtProgressCard: React.FC<DebtProgressCardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const { startOfYearTotal, currentTotal, paidOff, paidOffPercent, remainingPercent, projectedPayoffDate } = data;

  // Animated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(paidOffPercent, {
      duration: 1200,
      easing: easeOutCubic,
    });
  }, [paidOffPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (startOfYearTotal === 0) {
    return (
      <View style={[debtProgressStyles.container, style]}>
        <View style={debtProgressStyles.debtFree}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.semantic.income} />
          <Text style={debtProgressStyles.debtFreeText}>{t('analytics.debtFree')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[debtProgressStyles.container, style]}>
      <View style={debtProgressStyles.statsRow}>
        <View style={debtProgressStyles.stat}>
          <Text style={[debtProgressStyles.statLabel, { color: Colors.semantic.neutral }]}>{t('analytics.startOfYear')}</Text>
          <Text style={[debtProgressStyles.statValue, { color: Colors.semantic.neutral }]}>
            {currency} {startOfYearTotal.toLocaleString()}
          </Text>
        </View>
        <View style={debtProgressStyles.stat}>
          <Text style={[debtProgressStyles.statLabel, { color: Colors.semantic.expense }]}>{t('analytics.current')}</Text>
          <Text style={[debtProgressStyles.statValue, { color: Colors.semantic.expense }]}>
            {currency} {currentTotal.toLocaleString()}
          </Text>
        </View>
        <View style={debtProgressStyles.stat}>
          <Text style={[debtProgressStyles.statLabel, { color: Colors.semantic.income }]}>{t('analytics.paidOff')}</Text>
          <Text style={[debtProgressStyles.statValue, { color: Colors.semantic.income }]}>
            {currency} {paidOff.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={debtProgressStyles.progressContainer}>
        <View style={debtProgressStyles.progressBar}>
          <Animated.View style={[debtProgressStyles.progressFill, progressStyle]} />
        </View>
        <View style={debtProgressStyles.progressLabels}>
          <Text style={debtProgressStyles.progressPercent}>
            {t('analytics.paidOffPercent', { percent: paidOffPercent.toFixed(0) })}
          </Text>
          <Text style={debtProgressStyles.progressRemaining}>
            {t('analytics.remainingPercent', { percent: remainingPercent.toFixed(0) })}
          </Text>
        </View>
      </View>

      {projectedPayoffDate && (
        <View style={debtProgressStyles.projectionBox}>
          <Ionicons name="flag" size={16} color={Colors.neon} />
          <Text style={debtProgressStyles.projectionText}>
            {t('analytics.debtFreeProjection', { date: projectedPayoffDate })}
          </Text>
        </View>
      )}
    </View>
  );
};

const debtProgressStyles = StyleSheet.create({
  container: {},
  debtFree: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  debtFreeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.semantic.income,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.transparent.red10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.semantic.income,
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  progressPercent: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: Colors.semantic.income,
  },
  progressRemaining: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.semantic.expense,
  },
  projectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.transparent.neon05,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.transparent.neon20,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  projectionText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.neon,
  },
});

// ==========================================
// YEARLY KPI CARD (4 KPIs for year view)
// ==========================================

export interface YearlyKPIData {
  income: number;
  expenses: number;
  saved: number;
  savingsRate: number;
}

export interface YearlyKPICardProps {
  data: YearlyKPIData;
  currency?: string;
  style?: ViewStyle;
}

export const YearlyKPICard: React.FC<YearlyKPICardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const animatedIncome = useAnimatedCounter(data.income, 1200);
  const animatedExpenses = useAnimatedCounter(data.expenses, 1200);
  const animatedSaved = useAnimatedCounter(data.saved, 1200);
  const animatedRate = useAnimatedCounter(data.savingsRate, 1200);

  return (
    <View style={[yearlyKPIStyles.container, style]}>
      <View style={yearlyKPIStyles.row}>
        <View style={yearlyKPIStyles.kpi}>
          <Text style={[yearlyKPIStyles.label, { color: Colors.semantic.income }]}>{t('analytics.income').toUpperCase()}</Text>
          <Text style={[yearlyKPIStyles.value, { color: Colors.semantic.income }]}>
            {(animatedIncome / 1000).toFixed(0)}K
          </Text>
          <Text style={[yearlyKPIStyles.currency, { color: Colors.semantic.income }]}>{currency}</Text>
        </View>

        <View style={yearlyKPIStyles.kpi}>
          <Text style={[yearlyKPIStyles.label, { color: Colors.semantic.expense }]}>{t('analytics.expenses').toUpperCase()}</Text>
          <Text style={[yearlyKPIStyles.value, { color: Colors.semantic.expense }]}>
            {(animatedExpenses / 1000).toFixed(0)}K
          </Text>
          <Text style={[yearlyKPIStyles.currency, { color: Colors.semantic.expense }]}>{currency}</Text>
        </View>

        <View style={yearlyKPIStyles.kpi}>
          <Text style={[yearlyKPIStyles.label, { color: Colors.semantic.income }]}>{t('analytics.saved').toUpperCase()}</Text>
          <Text style={[yearlyKPIStyles.value, { color: Colors.semantic.income }]}>
            {(animatedSaved / 1000).toFixed(0)}K
          </Text>
          <Text style={[yearlyKPIStyles.currency, { color: Colors.semantic.income }]}>{currency}</Text>
        </View>

        <View style={yearlyKPIStyles.kpi}>
          <Text style={[yearlyKPIStyles.label, { color: Colors.semantic.neutral }]}>{t('analytics.savRate').toUpperCase()}</Text>
          <Text style={[yearlyKPIStyles.value, { color: Colors.semantic.neutral }]}>
            {animatedRate.toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const yearlyKPIStyles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpi: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  currency: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});

// ==========================================
// GOALS ACHIEVED CARD (YEARLY VIEW)
// ==========================================

export interface GoalAchievedItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  status: 'active' | 'completed' | 'paused';
  completedDate?: string;
}

export interface GoalsAchievedData {
  completedGoals: GoalAchievedItem[];
  inProgressGoals: GoalAchievedItem[];
  totalSavedTowardsGoals: number;
}

export interface GoalsAchievedCardProps {
  data: GoalsAchievedData;
  currency?: string;
  style?: ViewStyle;
}

export const GoalsAchievedCard: React.FC<GoalsAchievedCardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const { completedGoals, inProgressGoals, totalSavedTowardsGoals } = data;

  return (
    <View style={[goalsAchievedStyles.container, style]}>
      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <View style={goalsAchievedStyles.section}>
          <View style={goalsAchievedStyles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.semantic.income} />
            <Text style={goalsAchievedStyles.sectionTitle}>{t('analytics.completedLabel')}</Text>
          </View>
          {completedGoals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={goalsAchievedStyles.goalItem}>
              <Text style={goalsAchievedStyles.goalName}>{goal.name}</Text>
              <View style={goalsAchievedStyles.goalRight}>
                <Text style={[goalsAchievedStyles.goalAmount, { color: Colors.semantic.income }]}>
                  {currency} {goal.targetAmount.toLocaleString()}
                </Text>
                {goal.completedDate && (
                  <Text style={goalsAchievedStyles.completedDate}>{goal.completedDate}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* In Progress Goals Section */}
      {inProgressGoals.length > 0 && (
        <View style={goalsAchievedStyles.section}>
          <View style={goalsAchievedStyles.sectionHeader}>
            <Ionicons name="sync-circle" size={18} color={Colors.semantic.warning} />
            <Text style={goalsAchievedStyles.sectionTitle}>{t('analytics.inProgressLabel')}</Text>
          </View>
          {inProgressGoals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={goalsAchievedStyles.goalItem}>
              <View style={goalsAchievedStyles.goalInfo}>
                <Text style={goalsAchievedStyles.goalName}>{goal.name}</Text>
                <View style={goalsAchievedStyles.progressBar}>
                  <View
                    style={[
                      goalsAchievedStyles.progressFill,
                      { width: `${Math.min(goal.percentage, 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={goalsAchievedStyles.goalPercentage}>{goal.percentage.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Total Saved Summary */}
      <View style={goalsAchievedStyles.totalBox}>
        <Text style={[goalsAchievedStyles.totalLabel, { color: Colors.semantic.income }]}>{t('analytics.totalSavedTowardGoals')}</Text>
        <Text style={goalsAchievedStyles.totalValue}>
          {currency} {totalSavedTowardsGoals.toLocaleString()}
        </Text>
      </View>

      {/* Empty State */}
      {completedGoals.length === 0 && inProgressGoals.length === 0 && (
        <View style={goalsAchievedStyles.emptyState}>
          <Ionicons name="flag-outline" size={32} color={Colors.text.tertiary} />
          <Text style={goalsAchievedStyles.emptyText}>{t('analytics.noGoalsSetYet')}</Text>
        </View>
      )}
    </View>
  );
};

const goalsAchievedStyles = StyleSheet.create({
  container: {},
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    letterSpacing: 1,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  goalInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  goalName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  goalRight: {
    alignItems: 'flex-end',
  },
  goalAmount: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  completedDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.transparent.dark40,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.semantic.warning,
    borderRadius: 2,
  },
  goalPercentage: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.semantic.warning,
    minWidth: 45,
    textAlign: 'right',
  },
  totalBox: {
    backgroundColor: Colors.transparent.neon05,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.transparent.neon20,
    padding: Spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  totalValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.semantic.income,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
});

// ==========================================
// NET WORTH YEARLY CARD (YEARLY VIEW)
// ==========================================

export interface NetWorthYearlyData {
  currentNetWorth: number;
  startOfYearNetWorth: number;
  growth: number;
  growthPercent: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface NetWorthYearlyCardProps {
  data: NetWorthYearlyData;
  currency?: string;
  style?: ViewStyle;
}

export const NetWorthYearlyCard: React.FC<NetWorthYearlyCardProps> = ({
  data,
  currency = 'AED',
  style,
}) => {
  const { t } = useTranslation();
  const { currentNetWorth, startOfYearNetWorth, growth, growthPercent, totalAssets, totalLiabilities } = data;

  // Growth color: positive=green, negative=red, zero=neutral
  const getGrowthColor = () => {
    if (growth === 0) return Colors.semantic.neutral;
    return growth > 0 ? Colors.semantic.income : Colors.semantic.expense;
  };
  const growthColor = getGrowthColor();

  return (
    <View style={[netWorthYearlyStyles.container, style]}>
      {/* Main Net Worth Display */}
      <View style={netWorthYearlyStyles.mainDisplay}>
        <Text style={netWorthYearlyStyles.mainValue}>
          {currency} {currentNetWorth.toLocaleString()}
        </Text>
        <View style={netWorthYearlyStyles.changeRow}>
          {growth === 0 ? null : growth > 0 ? (
            <TrendUpIcon size={16} color={growthColor} />
          ) : (
            <TrendDownIcon size={16} color={growthColor} />
          )}
          <Text style={[netWorthYearlyStyles.changeText, { color: growthColor }]}>
            {t('analytics.thisYearChange', { percent: `${growth > 0 ? '+' : ''}${growthPercent.toFixed(1)}` })}
          </Text>
        </View>
      </View>

      {/* Year Comparison */}
      <View style={netWorthYearlyStyles.comparisonRow}>
        <View style={netWorthYearlyStyles.comparisonItem}>
          <Text style={[netWorthYearlyStyles.comparisonLabel, { color: Colors.semantic.neutral }]}>{t('analytics.startOfYear')}</Text>
          <Text style={[netWorthYearlyStyles.comparisonValue, { color: Colors.semantic.neutral }]}>
            {currency} {startOfYearNetWorth.toLocaleString()}
          </Text>
        </View>
        <View style={netWorthYearlyStyles.comparisonItem}>
          <Text style={[netWorthYearlyStyles.comparisonLabel, { color: growthColor }]}>{t('analytics.growth')}</Text>
          <Text style={[netWorthYearlyStyles.comparisonValue, { color: growthColor }]}>
            {growth > 0 ? '+' : ''}{currency} {growth.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Assets vs Liabilities */}
      <View style={netWorthYearlyStyles.breakdownRow}>
        <View style={netWorthYearlyStyles.breakdownItem}>
          <View style={[netWorthYearlyStyles.dot, { backgroundColor: Colors.semantic.income }]} />
          <Text style={[netWorthYearlyStyles.breakdownLabel, { color: Colors.semantic.income }]}>{t('analytics.assets')}</Text>
          <Text style={[netWorthYearlyStyles.breakdownValue, { color: Colors.semantic.income }]}>
            {currency} {totalAssets.toLocaleString()}
          </Text>
        </View>
        <View style={netWorthYearlyStyles.breakdownItem}>
          <View style={[netWorthYearlyStyles.dot, { backgroundColor: Colors.semantic.expense }]} />
          <Text style={[netWorthYearlyStyles.breakdownLabel, { color: Colors.semantic.expense }]}>{t('analytics.liabilities')}</Text>
          <Text style={[netWorthYearlyStyles.breakdownValue, { color: Colors.semantic.expense }]}>
            {currency} {totalLiabilities.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const netWorthYearlyStyles = StyleSheet.create({
  container: {},
  mainDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainValue: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: Colors.semantic.bronze,
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  changeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  comparisonValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.transparent.dark20,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  breakdownValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
  },
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  KPICard,
  MerchantLeaderboard,
  BurnRateGauge,
  SubscriptionBurn,
  DebtOverview,
  NetWorthTracker,
  GoalsProgress,
  // Weekly Analytics
  DailyBreakdownChart,
  WeekComparisonCard,
  WeekProjectionCard,
  // Yearly Analytics
  MonthByMonthChart,
  YearOverYearCard,
  AnnualSubscriptionsCard,
  DebtProgressCard,
  YearlyKPICard,
  GoalsAchievedCard,
  NetWorthYearlyCard,
};

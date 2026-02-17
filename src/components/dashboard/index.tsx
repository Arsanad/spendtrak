// SPENDTRAK CINEMATIC EDITION - Dashboard Components
// Updated to use CurrencyContext for global currency conversion
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../design/cinematic';
import { GradientText, GradientBalance, GradientLabel } from '../ui/GradientText';
import { GlassCard, QuickActionCard } from '../ui/GlassCard';
import { ScanIcon, PlusIcon, TrendUpIcon, TrendDownIcon } from '../icons';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from '../../context/LanguageContext';

// ==========================================
// BALANCE CARD
// ==========================================

export interface BalanceCardProps {
  /** Balance amount already in user's display currency */
  balance: number;
  /** Optional override currency - if not provided, uses global currency */
  currency?: string;
  /** Income amount already in user's display currency */
  income?: number;
  /** Expenses amount already in user's display currency */
  expenses?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const BalanceCard: React.FC<BalanceCardProps> = memo(({
  balance, currency: propCurrency, income = 0, expenses = 0, onPress, style,
}) => {
  const { currencySymbol, format } = useCurrency();
  const { t } = useTranslation();

  // Amounts are already converted to user's display currency by the store
  const formattedBalance = format(balance, { showSymbol: false });

  return (
    <GlassCard variant="glow" onPress={onPress} style={style ? [styles.balanceCard, style] : styles.balanceCard}>
      {/* Top glow */}
      <LinearGradient
        colors={[Colors.transparent.neon10, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.balanceCardGlow}
      />

      <GradientLabel style={styles.balanceLabel}>{t('dashboard.currentBalance')}</GradientLabel>
      <GradientBalance amount={formattedBalance} currency={currencySymbol} style={styles.balanceAmount} />

      {/* Income / Expenses row - Phosphorescent Green for income, Neon Red for expense */}
      <View style={styles.balanceStatsRow}>
        <View style={styles.balanceStat}>
          <View style={[styles.balanceStatIcon, { backgroundColor: Colors.transparent.phosphor20 }]}>
            <TrendUpIcon size={16} color={Colors.semantic.income} />
          </View>
          <View>
            <Text style={[styles.balanceStatLabel, { color: Colors.semantic.income }]}>{t('dashboard.income')}</Text>
            <Text style={[styles.balanceStatValue, { color: Colors.semantic.income }]}>
              {format(income)}
            </Text>
          </View>
        </View>

        <View style={styles.balanceStatDivider} />

        <View style={styles.balanceStat}>
          <View style={[styles.balanceStatIcon, { backgroundColor: Colors.transparent.red20 }]}>
            <TrendDownIcon size={16} color={Colors.semantic.expense} />
          </View>
          <View>
            <Text style={[styles.balanceStatLabel, { color: Colors.semantic.expense }]}>{t('dashboard.expenses')}</Text>
            <Text style={[styles.balanceStatValue, { color: Colors.semantic.expense }]}>
              {format(expenses)}
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
});

BalanceCard.displayName = 'BalanceCard';

// ==========================================
// QUICK ACTIONS
// ==========================================

export interface QuickActionsProps {
  onScan?: () => void;
  onAdd?: () => void;
  style?: ViewStyle;
}

export const QuickActions: React.FC<QuickActionsProps> = memo(({
  onScan, onAdd, style,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.quickActionsContainer, style]}>
      <QuickActionButton icon={<ScanIcon size={24} color={Colors.neon} />} label={t('dashboard.scan')} onPress={onScan} />
      <QuickActionButton icon={<PlusIcon size={24} color={Colors.neon} />} label={t('common.add')} onPress={onAdd} />
    </View>
  );
});

QuickActions.displayName = 'QuickActions';

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}> = memo(({ icon, label, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.quickActionButton}
      >
        <View style={styles.quickActionIconContainer}>
          {icon}
        </View>
        <GradientLabel style={styles.quickActionLabel}>{label}</GradientLabel>
      </Pressable>
    </Animated.View>
  );
});

QuickActionButton.displayName = 'QuickActionButton';

// ==========================================
// SPENDING SUMMARY
// ==========================================

export interface SpendingSummaryProps {
  /** Today's spending in base currency (USD) */
  todaySpent: number;
  /** Weekly spending in base currency (USD) */
  weeklySpent: number;
  /** Monthly spending in base currency (USD) */
  monthlySpent: number;
  /** Optional override currency - if not provided, uses global currency */
  currency?: string;
  /** Safe to spend amount in base currency (USD) */
  safeToSpend?: number;
  /** Monthly budget in base currency (USD) for calculating status colors */
  monthlyBudget?: number;
  style?: ViewStyle;
}

/**
 * Get safe-to-spend status color based on remaining budget
 * Uses traffic light system: green (safe), orange (warning), red (danger)
 */
const getSafeToSpendColor = (safeAmount: number, budget?: number): string => {
  if (!budget || budget <= 0) {
    // No budget set - use neutral color
    return safeAmount >= 0 ? Colors.semantic.budgetSafe : Colors.semantic.budgetDanger;
  }
  const percentRemaining = (safeAmount / budget) * 100;
  if (percentRemaining > 30) {
    return Colors.semantic.budgetSafe;     // Green - more than 30% remaining
  } else if (percentRemaining > 10) {
    return Colors.semantic.budgetWarning;  // Orange - 10-30% remaining
  } else {
    return Colors.semantic.budgetDanger;   // Red - less than 10% or negative
  }
};

const getSafeToSpendBgColor = (safeAmount: number, budget?: number): string => {
  if (!budget || budget <= 0) {
    return safeAmount >= 0 ? Colors.transparent.neon10 : Colors.transparent.red10;
  }
  const percentRemaining = (safeAmount / budget) * 100;
  if (percentRemaining > 30) {
    return Colors.transparent.neon10;
  } else if (percentRemaining > 10) {
    return Colors.transparent.orange10;
  } else {
    return Colors.transparent.red10;
  }
};

export const SpendingSummary: React.FC<SpendingSummaryProps> = memo(({
  todaySpent, weeklySpent, monthlySpent, currency: propCurrency, safeToSpend, monthlyBudget, style,
}) => {
  const { format } = useCurrency();
  const { t } = useTranslation();

  // Amounts are already in user's display currency (converted by the store/service)
  const safeColor = safeToSpend !== undefined ? getSafeToSpendColor(safeToSpend, monthlyBudget) : Colors.neon;
  const safeBgColor = safeToSpend !== undefined ? getSafeToSpendBgColor(safeToSpend, monthlyBudget) : Colors.transparent.neon10;

  return (
    <GlassCard variant="default" style={style}>
      <GradientText variant="bright" style={styles.summaryTitle}>{t('dashboard.spendingSummary')}</GradientText>

      <View style={styles.summaryGrid}>
        <SummaryItemWithCurrency label={t('dashboard.today')} value={todaySpent} />
        <SummaryItemWithCurrency label={t('dashboard.thisWeek')} value={weeklySpent} />
        <SummaryItemWithCurrency label={t('dashboard.thisMonth')} value={monthlySpent} />
      </View>

      {safeToSpend !== undefined && (
        <View style={[styles.safeToSpendContainer, { backgroundColor: safeBgColor }]}>
          <View style={styles.safeToSpendContent}>
            <Text style={styles.safeToSpendLabel}>{t('dashboard.safeToSpend')}</Text>
            <Text style={[styles.safeToSpendValue, { color: safeColor }]}>
              {format(safeToSpend)}
            </Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
});

SpendingSummary.displayName = 'SpendingSummary';

const SummaryItemWithCurrency: React.FC<{ label: string; value: number }> = memo(({ label, value }) => {
  const { format } = useCurrency();

  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={[styles.summaryItemValue, { color: Colors.semantic.expense }]}>
        {format(value)}
      </Text>
    </View>
  );
});

SummaryItemWithCurrency.displayName = 'SummaryItemWithCurrency';

// ==========================================
// SECTION HEADER
// ==========================================

export interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = memo(({ title, action, onAction, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <GradientText variant="bright" style={styles.sectionTitle}>{title}</GradientText>
    {action && (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    )}
  </View>
));

SectionHeader.displayName = 'SectionHeader';

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Balance Card
  balanceCard: { paddingVertical: Spacing.xl, alignItems: 'center' },
  balanceCardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  balanceLabel: { marginBottom: Spacing.xs },
  balanceAmount: {},
  balanceStatsRow: { flexDirection: 'row', marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
  balanceStat: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  balanceStatIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  balanceStatLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary },
  balanceStatValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  balanceStatDivider: { width: 1, height: 32, backgroundColor: Colors.border.subtle, marginHorizontal: Spacing.lg },

  // Quick Actions
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xxl },
  quickActionButton: { alignItems: 'center', width: 80 },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.transparent.dark30,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionLabel: { marginTop: Spacing.xs },

  // Spending Summary
  summaryTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h5, marginBottom: Spacing.lg },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryItemLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.tertiary, marginBottom: Spacing.xs },
  summaryItemValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  safeToSpendContainer: { marginTop: Spacing.lg, borderRadius: BorderRadius.md, overflow: 'hidden' },
  safeToSpendBackground: { ...StyleSheet.absoluteFillObject },
  safeToSpendContent: { padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  safeToSpendLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.body, color: Colors.text.secondary },
  safeToSpendValue: { fontFamily: FontFamily.bold, fontSize: FontSize.h4 },

  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.h5 },
  sectionAction: { fontFamily: FontFamily.medium, fontSize: FontSize.body, color: Colors.neon },
});

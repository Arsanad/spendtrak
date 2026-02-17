// SPENDTRAK CINEMATIC EDITION - Dashboard Components
import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../design/cinematic';
import { GradientText, GradientBalance, GradientLabel } from '../ui/GradientText';
import { GlassCard, QuickActionCard } from '../ui/GlassCard';
import { ScanIcon, PlusIcon, WalletIcon, TargetIcon, TrendUpIcon, TrendDownIcon } from '../icons';

// ==========================================
// BALANCE CARD
// ==========================================

export interface BalanceCardProps {
  balance: number;
  currency?: string;
  income?: number;
  expenses?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance, currency = 'AED', income = 0, expenses = 0, onPress, style,
}) => {
  const formattedBalance = balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <GlassCard variant="glow" onPress={onPress} style={[styles.balanceCard, style]}>
      {/* Top glow */}
      <LinearGradient
        colors={[Colors.transparent.neon10, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.balanceCardGlow}
      />

      <GradientLabel style={styles.balanceLabel}>Current Balance</GradientLabel>
      <GradientBalance amount={formattedBalance} currency={currency} style={styles.balanceAmount} />

      {/* Income / Expenses row */}
      <View style={styles.balanceStatsRow}>
        <View style={styles.balanceStat}>
          <View style={[styles.balanceStatIcon, { backgroundColor: Colors.transparent.neon20 }]}>
            <TrendUpIcon size={16} color={Colors.neon} />
          </View>
          <View>
            <Text style={styles.balanceStatLabel}>Income</Text>
            <GradientText variant="bright" style={styles.balanceStatValue}>
              {currency} {income.toLocaleString()}
            </GradientText>
          </View>
        </View>

        <View style={styles.balanceStatDivider} />

        <View style={styles.balanceStat}>
          <View style={[styles.balanceStatIcon, { backgroundColor: Colors.transparent.primary20 }]}>
            <TrendDownIcon size={16} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.balanceStatLabel}>Expenses</Text>
            <GradientText variant="muted" style={styles.balanceStatValue}>
              {currency} {expenses.toLocaleString()}
            </GradientText>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

// ==========================================
// QUICK ACTIONS
// ==========================================

export interface QuickActionsProps {
  onScan?: () => void;
  onAdd?: () => void;
  onBudgets?: () => void;
  onGoals?: () => void;
  style?: ViewStyle;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onScan, onAdd, onBudgets, onGoals, style,
}) => (
  <View style={[styles.quickActionsContainer, style]}>
    <QuickActionButton icon={<ScanIcon size={24} color={Colors.neon} />} label="Scan" onPress={onScan} />
    <QuickActionButton icon={<PlusIcon size={24} color={Colors.neon} />} label="Add" onPress={onAdd} />
    <QuickActionButton icon={<WalletIcon size={24} color={Colors.neon} />} label="Budgets" onPress={onBudgets} />
    <QuickActionButton icon={<TargetIcon size={24} color={Colors.neon} />} label="Goals" onPress={onGoals} />
  </View>
);

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}> = ({ icon, label, onPress }) => {
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
};

// ==========================================
// SPENDING SUMMARY
// ==========================================

export interface SpendingSummaryProps {
  todaySpent: number;
  weeklySpent: number;
  monthlySpent: number;
  currency?: string;
  safeToSpend?: number;
  style?: ViewStyle;
}

export const SpendingSummary: React.FC<SpendingSummaryProps> = ({
  todaySpent, weeklySpent, monthlySpent, currency = 'AED', safeToSpend, style,
}) => (
  <GlassCard variant="default" style={style}>
    <GradientText variant="bright" style={styles.summaryTitle}>Spending Summary</GradientText>

    <View style={styles.summaryGrid}>
      <SummaryItem label="Today" value={todaySpent} currency={currency} />
      <SummaryItem label="This Week" value={weeklySpent} currency={currency} />
      <SummaryItem label="This Month" value={monthlySpent} currency={currency} />
    </View>

    {safeToSpend !== undefined && (
      <View style={styles.safeToSpendContainer}>
        <LinearGradient
          colors={[Colors.transparent.neon10, Colors.transparent.primary05]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.safeToSpendBackground}
        />
        <View style={styles.safeToSpendContent}>
          <Text style={styles.safeToSpendLabel}>Safe to Spend</Text>
          <GradientText variant="luxury" style={styles.safeToSpendValue}>
            {currency} {safeToSpend.toLocaleString()}
          </GradientText>
        </View>
      </View>
    )}
  </GlassCard>
);

const SummaryItem: React.FC<{ label: string; value: number; currency: string }> = ({ label, value, currency }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryItemLabel}>{label}</Text>
    <GradientText variant="subtle" style={styles.summaryItemValue}>
      {currency} {value.toLocaleString()}
    </GradientText>
  </View>
);

// ==========================================
// SECTION HEADER
// ==========================================

export interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, onAction, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <GradientText variant="bright" style={styles.sectionTitle}>{title}</GradientText>
    {action && (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    )}
  </View>
);

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
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm },
  quickActionButton: { alignItems: 'center', width: 72 },
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

export { BalanceCard, QuickActions, SpendingSummary, SectionHeader };

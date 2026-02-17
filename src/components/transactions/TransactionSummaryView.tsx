// SPENDTRAK CINEMATIC EDITION - Transaction Summary View
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../design/cinematic';
import { useCurrency } from '../../context/CurrencyContext';
import { GradientText, GradientBalance } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';

interface Transaction {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  source?: string;
}

interface TransactionSummaryViewProps {
  transactions: Transaction[];
}

export const TransactionSummaryView: React.FC<TransactionSummaryViewProps> = ({
  transactions,
}) => {
  const { format: formatCurrency, currencyCode } = useCurrency();

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let receiptCount = 0;
    let manualCount = 0;
    const merchants = new Set<string>();
    const categories = new Set<string>();

    transactions.forEach((tx) => {
      if (tx.amount > 0) {
        totalIncome += tx.amount;
      } else {
        totalExpenses += Math.abs(tx.amount);
      }

      if (tx.source === 'receipt') receiptCount++;
      else manualCount++;

      merchants.add(tx.merchantName);
      categories.add(tx.category);
    });

    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const avgTransaction = expenseTransactions.length > 0
      ? totalExpenses / expenseTransactions.length
      : 0;

    // Find top merchant
    const merchantCounts: Record<string, number> = {};
    transactions.forEach((tx) => {
      merchantCounts[tx.merchantName] = (merchantCounts[tx.merchantName] || 0) + 1;
    });
    const topMerchant = Object.entries(merchantCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      receiptCount,
      manualCount,
      uniqueMerchants: merchants.size,
      uniqueCategories: categories.size,
      avgTransaction,
      topMerchant,
    };
  }, [transactions]);

  const incomeRatio = stats.totalIncome + stats.totalExpenses > 0
    ? (stats.totalIncome / (stats.totalIncome + stats.totalExpenses)) * 100
    : 50;

  return (
    <View style={styles.container}>
      {/* Net Balance */}
      <GlassCard variant="glow" style={styles.balanceCard}>
        <GradientText variant="bronze" style={styles.balanceLabel}>Net Balance</GradientText>
        <GradientBalance amount={stats.netBalance.toLocaleString()} currency={currencyCode} />
      </GlassCard>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <GlassCard variant="default" size="compact" style={styles.statCard}>
          <GradientText variant="bronze" style={styles.statValue}>
            {stats.transactionCount}
          </GradientText>
          <GradientText variant="bronze" style={styles.statLabel}>Transactions</GradientText>
        </GlassCard>

        <GlassCard variant="default" size="compact" style={styles.statCard}>
          <GradientText variant="bronze" style={styles.statValue}>
            {stats.uniqueMerchants}
          </GradientText>
          <GradientText variant="bronze" style={styles.statLabel}>Merchants</GradientText>
        </GlassCard>

        <GlassCard variant="default" size="compact" style={styles.statCard}>
          <GradientText variant="bronze" style={styles.statValue}>
            {stats.receiptCount}
          </GradientText>
          <GradientText variant="bronze" style={styles.statLabel}>Receipts</GradientText>
        </GlassCard>

        <GlassCard variant="default" size="compact" style={styles.statCard}>
          <GradientText variant="bronze" style={styles.statValue}>
            {stats.manualCount}
          </GradientText>
          <GradientText variant="bronze" style={styles.statLabel}>Manual</GradientText>
        </GlassCard>
      </View>

      {/* Income vs Expenses */}
      <GlassCard variant="default" style={styles.comparisonCard}>
        <GradientText variant="bright" style={styles.sectionTitle}>Income vs Expenses</GradientText>

        {/* NEW COLORS: Blue for income, Red for expense */}
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <GradientText variant="income" style={styles.comparisonLabel}>Income</GradientText>
            <GradientText variant="income" style={styles.comparisonAmount}>
              {formatCurrency(stats.totalIncome)}
            </GradientText>
          </View>
          <View style={styles.comparisonItem}>
            <GradientText variant="expense" style={styles.comparisonLabel}>Expenses</GradientText>
            <GradientText variant="expense" style={styles.comparisonAmount}>
              {formatCurrency(stats.totalExpenses)}
            </GradientText>
          </View>
        </View>

        {/* Visual Bar */}
        <View style={styles.barContainer}>
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFillIncome,
                { width: `${incomeRatio}%` }
              ]}
            />
            <View
              style={[
                styles.barFillExpense,
                { width: `${100 - incomeRatio}%` }
              ]}
            />
          </View>
          <View style={styles.barLabels}>
            <GradientText variant="bright" style={styles.barPercent}>
              {incomeRatio.toFixed(0)}%
            </GradientText>
            <GradientText variant="primary" style={styles.barPercent}>
              {(100 - incomeRatio).toFixed(0)}%
            </GradientText>
          </View>
        </View>
      </GlassCard>

      {/* Additional Stats */}
      <View style={styles.additionalStats}>
        <GlassCard variant="default" size="compact" style={styles.additionalCard}>
          <GradientText variant="bronze" style={styles.additionalLabel}>Average Transaction</GradientText>
          <GradientText variant="bronze" style={styles.additionalAmount}>
            {formatCurrency(stats.avgTransaction)}
          </GradientText>
        </GlassCard>

        <GlassCard variant="default" size="compact" style={styles.additionalCard}>
          <GradientText variant="bronze" style={styles.additionalLabel}>Categories Used</GradientText>
          <GradientText variant="bronze" style={styles.additionalAmount}>
            {stats.uniqueCategories}
          </GradientText>
        </GlassCard>
      </View>

      {/* Top Merchant */}
      <GlassCard variant="default" size="compact" style={styles.topMerchantCard}>
        <GradientText variant="bright" style={styles.topMerchantLabel}>Most Visited</GradientText>
        <GradientText variant="bright" style={styles.topMerchantName}>
          {stats.topMerchant}
        </GradientText>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: FontSize.body,
    marginBottom: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
  },
  statLabel: {
    marginTop: Spacing.xs,
    fontSize: FontSize.caption,
  },
  comparisonCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },
  comparisonAmount: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
  barContainer: {
    marginTop: Spacing.sm,
  },
  barBackground: {
    height: 12,
    backgroundColor: Colors.darker,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barFillIncome: {
    height: '100%',
    backgroundColor: Colors.semantic.income,  // Blue
  },
  barFillExpense: {
    height: '100%',
    backgroundColor: Colors.semantic.expense,  // Red
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  barPercent: {
    fontSize: FontSize.caption,
  },
  additionalStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  additionalCard: {
    flex: 1,
    alignItems: 'center',
  },
  additionalLabel: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },
  additionalAmount: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
  topMerchantCard: {
    alignItems: 'center',
  },
  topMerchantLabel: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },
  topMerchantName: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
});

export default TransactionSummaryView;

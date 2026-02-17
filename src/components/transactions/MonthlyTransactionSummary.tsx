// SPENDTRAK CINEMATIC EDITION - Monthly Transaction Summary
// Updated to use CurrencyContext for global currency conversion
import React, { useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize } from '../../design/cinematic';
import { GradientText } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { DonutChart } from '../charts';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from '../../context/LanguageContext';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  category: string;
  currency?: string;
}

interface MonthlyTransactionSummaryProps {
  transactions: Transaction[];
}

// Category colors using diverse neon palette for visual distinction
const CATEGORY_COLORS = [
  Colors.categories.food,           // Orange #ff8800
  Colors.categories.transport,      // Blue #0088ff
  Colors.categories.shopping,       // Pink #ff00ff
  Colors.categories.entertainment,  // Purple #bf00ff
  Colors.categories.utilities,      // Cyan #00ffff
  Colors.categories.health,         // Green #00ff88
  Colors.categories.other,          // Deep Green #008545
];

// Map category names to specific colors for consistency
const getCategoryColor = (categoryName: string, fallbackIndex: number): string => {
  const normalized = categoryName.toLowerCase().trim();
  const categoryMap: Record<string, string> = {
    'groceries': Colors.categories.food,
    'food': Colors.categories.food,
    'food & dining': Colors.categories.food,
    'dining': Colors.categories.food,
    'transport': Colors.categories.transport,
    'transportation': Colors.categories.transport,
    'shopping': Colors.categories.shopping,
    'entertainment': Colors.categories.entertainment,
    'utilities': Colors.categories.utilities,
    'bills': Colors.neonFamily.red,
    'health': Colors.categories.health,
    'education': Colors.categories.education,
    'travel': Colors.categories.travel,
    'income': Colors.semantic.income,
    'salary': Colors.categories.salary,
  };
  return categoryMap[normalized] || CATEGORY_COLORS[fallbackIndex % CATEGORY_COLORS.length];
};

const MonthlyTransactionSummaryInner: React.FC<MonthlyTransactionSummaryProps> = ({
  transactions,
}) => {
  const { format, convert } = useCurrency();
  const { t } = useTranslation();

  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((tx) => {
      // Convert each transaction to user's display currency before summing
      const txCurrency = tx.currency || 'AED';
      const convertedAmount = convert(Math.abs(tx.amount), txCurrency);

      if (tx.amount > 0) {
        income += convertedAmount;
      } else {
        expenses += convertedAmount;
        const category = tx.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + convertedAmount;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        label: name,
        value,
        color: getCategoryColor(name, index),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      income,
      expenses,
      net: income - expenses,
      transactionCount: transactions.length,
      categoryBreakdown,
    };
  }, [transactions, convert]);

  // Amounts are already in user's display currency
  const convertedExpenses = summary.expenses;
  const dailyAverage = summary.expenses / 30;
  const perTransaction = summary.transactionCount > 0 ? summary.expenses / summary.transactionCount : 0;

  return (
    <View style={styles.container}>
      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <View style={styles.section}>
          <GradientText variant="bright" style={styles.sectionTitle}>
            {t('analytics.spendingByCategory')}
          </GradientText>

          <GlassCard variant="default" style={styles.chartCard}>
            <View style={styles.chartContainer}>
              <DonutChart
                segments={summary.categoryBreakdown}
                size={160}
                strokeWidth={18}
                centerContent={
                  <View style={styles.chartCenter}>
                    <GradientText variant="bronze" style={styles.chartCenterLabel}>{t('analytics.total')}</GradientText>
                    <GradientText variant="bronze" style={styles.chartCenterAmount}>
                      {format(convertedExpenses, { showSymbol: false })}
                    </GradientText>
                  </View>
                }
              />
            </View>

            <View style={styles.categoryList}>
              {summary.categoryBreakdown.map((cat) => (
                <View key={cat.label} style={styles.categoryItem}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <GradientText variant="subtle" style={styles.categoryName}>
                    {cat.label}
                  </GradientText>
                  <GradientText variant="expense" style={styles.categoryAmount}>
                    {format(cat.value)}
                  </GradientText>
                  <GradientText variant="bronze" style={styles.categoryPercent}>
                    {((cat.value / summary.expenses) * 100).toFixed(0)}%
                  </GradientText>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>
      )}

      {/* Daily Average */}
      <GlassCard variant="default" size="compact" style={styles.avgCard}>
        <View style={styles.avgRow}>
          <View style={styles.avgItem}>
            <GradientText variant="bronze" style={styles.avgLabel}>{t('analytics.dailyAverage')}</GradientText>
            <GradientText variant="bronze" style={styles.avgAmount}>
              {format(dailyAverage)}
            </GradientText>
          </View>
          <View style={styles.avgItem}>
            <GradientText variant="bronze" style={styles.avgLabel}>{t('analytics.perTransaction')}</GradientText>
            <GradientText variant="bronze" style={styles.avgAmount}>
              {format(perTransaction)}
            </GradientText>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
  chartCard: {
    padding: Spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartCenter: {
    alignItems: 'center',
  },
  chartCenterLabel: {
    fontSize: FontSize.caption,
  },
  chartCenterAmount: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
  categoryList: {
    marginTop: Spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  categoryName: {
    flex: 1,
    fontSize: FontSize.body,
  },
  categoryAmount: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    marginRight: Spacing.sm,
  },
  categoryPercent: {
    fontSize: FontSize.caption,
    width: 40,
    textAlign: 'right',
  },
  avgCard: {
    marginBottom: Spacing.lg,
  },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  avgItem: {
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },
  avgAmount: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
});

export const MonthlyTransactionSummary = memo(MonthlyTransactionSummaryInner);
export default MonthlyTransactionSummary;

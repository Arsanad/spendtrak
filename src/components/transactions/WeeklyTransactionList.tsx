// SPENDTRAK CINEMATIC EDITION - Weekly Transaction List
// Updated to use CurrencyContext for global currency conversion
import React, { useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize } from '../../design/cinematic';
import { GradientText } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { TransactionItem } from '../premium';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from '../../context/LanguageContext';

interface Transaction {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  icon?: React.ReactNode;
  source?: string;
}

interface WeeklyTransactionListProps {
  transactions: Transaction[];
  onTransactionPress: (id: string) => void;
}

// Helper function to get week start (Sunday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to get week end (Saturday)
const getWeekEnd = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
};

// Parse date from various formats
const parseDate = (dateStr: string): Date => {
  // Handle "Jan 17" format
  if (dateStr.match(/^[A-Za-z]+ \d+$/)) {
    const months: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const parts = dateStr.split(' ');
    const month = months[parts[0]] ?? 0;
    const day = parseInt(parts[1], 10) || 1;
    const year = new Date().getFullYear();
    return new Date(year, month, day);
  }
  // Handle ISO format or other valid date strings
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    // Return current date as fallback
    return new Date();
  }
  return parsed;
};

// Format date for display
const formatDate = (date: Date, locale: string = 'en'): string => {
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

// Format date range
const formatDateRange = (start: Date, end: Date, locale: string = 'en'): string => {
  const startStr = formatDate(start, locale);
  const endStr = formatDate(end, locale);
  const year = end.getFullYear();
  return `${startStr} - ${endStr}, ${year}`;
};

const WeeklyTransactionListInner: React.FC<WeeklyTransactionListProps> = ({
  transactions,
  onTransactionPress,
}) => {
  const { format } = useCurrency();
  const { t, languageCode } = useTranslation();

  // Group transactions by week
  const weeklyGroups = useMemo(() => {
    const groups: Record<string, {
      start: Date;
      end: Date;
      transactions: Transaction[];
      total: number;
      income: number;
      expense: number;
    }> = {};

    transactions.forEach((tx) => {
      const date = parseDate(tx.date);
      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!groups[weekKey]) {
        groups[weekKey] = {
          start: weekStart,
          end: weekEnd,
          transactions: [],
          total: 0,
          income: 0,
          expense: 0,
        };
      }

      groups[weekKey].transactions.push(tx);
      groups[weekKey].total += tx.amount;

      if (tx.amount > 0) {
        groups[weekKey].income += tx.amount;
      } else {
        groups[weekKey].expense += Math.abs(tx.amount);
      }
    });

    // Sort by week (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }));
  }, [transactions]);

  if (weeklyGroups.length === 0) {
    return (
      <GlassCard variant="default" style={styles.emptyCard}>
        <GradientText variant="muted" style={styles.emptyText}>
          {t('transactions.noTransactionsToDisplay')}
        </GradientText>
      </GlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {weeklyGroups.map((week) => (
        <View key={week.key} style={styles.weekGroup}>
          {/* Week Header */}
          <GlassCard variant="default" size="compact" style={styles.weekHeader}>
            <View style={styles.weekHeaderWrapper}>
              <View style={styles.weekHeaderContent}>
                <GradientText variant="bright" style={styles.weekRange}>
                  {formatDateRange(week.start, week.end, languageCode)}
                </GradientText>
                <GradientText variant="expense" style={styles.weekTotal}>
                  {format(week.expense)}
                </GradientText>
              </View>
              <View style={styles.weekStats}>
                <GradientText variant="muted" style={styles.transactionCount}>
                  {week.transactions.length} {t('transactions.transactions')}
                </GradientText>
                {week.income > 0 && (
                  <GradientText variant="income" style={styles.weekIncome}>
                    +{format(week.income, { showSymbol: false })}
                  </GradientText>
                )}
              </View>
            </View>
          </GlassCard>

          {/* Week Transactions */}
          {week.transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              merchantName={tx.merchantName}
              category={tx.category}
              amount={tx.amount}
              date={tx.date}
              icon={tx.icon}
              onPress={() => onTransactionPress(tx.id)}
              style={styles.transactionItem}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekGroup: {
    marginBottom: Spacing.lg,
  },
  weekHeader: {
    marginBottom: Spacing.sm,
  },
  weekHeaderWrapper: {
    width: '100%',
  },
  weekHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekRange: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  weekTotal: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  transactionCount: {
    fontSize: FontSize.caption,
  },
  weekIncome: {
    fontSize: FontSize.caption,
  },
  transactionItem: {
    marginBottom: Spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.body,
  },
});

export const WeeklyTransactionList = memo(WeeklyTransactionListInner);
export default WeeklyTransactionList;

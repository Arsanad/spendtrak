// SPENDTRAK CINEMATIC EDITION - Transaction Calendar
import React, { useState, useMemo, memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize } from '../../design/cinematic';
import { useTranslation } from '../../context/LanguageContext';
import { GradientText } from '../ui/GradientText';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { IconButton } from '../ui/Button';

interface Transaction {
  id: string;
  amount: number;
  transaction_date: string;
  transaction_type?: 'purchase' | 'payment' | 'refund' | 'transfer';
}

interface TransactionCalendarProps {
  transactions: Transaction[];
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

const TransactionCalendarInner: React.FC<TransactionCalendarProps> = ({
  transactions,
  onDateSelect,
  selectedDate,
}) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx) => {
      const date = tx.transaction_date.split('T')[0];
      if (!totals[date]) {
        totals[date] = { income: 0, expense: 0 };
      }
      if (tx.amount > 0 || tx.transaction_type === 'refund') {
        totals[date].income += Math.abs(tx.amount);
      } else {
        totals[date].expense += Math.abs(tx.amount);
      }
    });

    return totals;
  }, [transactions]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday

    const days: (number | null)[] = [];

    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth]);

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const monthNames = [
    t('time.january'), t('time.february'), t('time.march'), t('time.april'),
    t('time.may'), t('time.june'), t('time.july'), t('time.august'),
    t('time.september'), t('time.october'), t('time.november'), t('time.december'),
  ];
  const monthName = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeftIcon size={20} color={Colors.neon} />}
          onPress={() => navigateMonth('prev')}
          variant="ghost"
        />
        <GradientText variant="bright" style={styles.monthTitle}>{monthName}</GradientText>
        <IconButton
          icon={<ChevronRightIcon size={20} color={Colors.neon} />}
          onPress={() => navigateMonth('next')}
          variant="ghost"
        />
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {[t('time.sun'), t('time.mon'), t('time.tue'), t('time.wed'), t('time.thu'), t('time.fri'), t('time.sat')].map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <GradientText variant="muted" style={styles.weekdayText}>{day}</GradientText>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dateKey = formatDateKey(day);
          const dayData = dailyTotals[dateKey];
          const isSelected = selectedDate === dateKey;
          const hasTransactions = !!dayData;
          const isToday = new Date().toISOString().split('T')[0] === dateKey;

          return (
            <Pressable
              key={dateKey}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                hasTransactions && styles.dayCellWithData,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => onDateSelect(dateKey)}
            >
              <GradientText
                variant={isSelected ? 'luxury' : hasTransactions ? 'bright' : 'muted'}
                style={styles.dayNumber}
              >
                {day}
              </GradientText>

              {dayData && (() => {
                const net = dayData.income - dayData.expense;
                if (net === 0) return null;
                return (
                  <View style={styles.dayAmounts}>
                    <GradientText
                      variant={net > 0 ? 'income' : 'expense'}
                      style={styles.dayNet}
                    >
                      {net > 0 ? '+' : ''}{Math.round(net)}
                    </GradientText>
                  </View>
                );
              })()}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekdayText: {
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 2,
  },
  dayCellSelected: {
    backgroundColor: Colors.transparent.neon20,
    borderColor: Colors.neon,
  },
  dayCellWithData: {
    borderColor: Colors.border.default,
  },
  dayCellToday: {
    backgroundColor: Colors.transparent.neon10,
  },
  dayNumber: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  dayAmounts: {
    marginTop: 2,
    alignItems: 'center',
  },
  dayNet: {
    fontSize: 8,
  },
});

export const TransactionCalendar = memo(TransactionCalendarInner);
export default TransactionCalendar;

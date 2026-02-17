// SPENDTRAK CINEMATIC EDITION - Alerts Screen (Connected to Real App Data)
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, InteractionManager, AccessibilityInfo, LayoutAnimation, Platform } from 'react-native';
import { HapticTouchableOpacity } from '../../src/components/ui/HapticPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Badge } from '../../src/components/ui/Badge';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { EmptyState } from '../../src/components/premium';
import { SectionHeader } from '../../src/components/dashboard';
import { AlertsIcon, WarningIcon, InfoIcon, TrendUpIcon, CalendarIcon, TrashIcon } from '../../src/components/icons';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import {
  getDevBudgets,
  getDevGoals,
  getDevSubscriptions,
  getDevBills,
  getDevDebts,
  getDevTransactions,
} from '../../src/services/devStorage';
import { logger } from '../../src/utils/logger';

const DELETE_THRESHOLD = 100;

const STORAGE_KEYS = {
  DISMISSED_ALERTS: '@spendtrak_dismissed_alerts',
  READ_ALERTS: '@spendtrak_read_alerts',
};

// Severity types for alerts
type AlertSeverity = 'success' | 'warning' | 'error' | 'info';

interface AppAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  time: string;
  read: boolean;
  route?: string; // Navigation route for tapping
  createdAt: number; // Timestamp for sorting
}

// =============================================
// ALERT GENERATION FROM REAL APP DATA
// =============================================

async function generateBudgetAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  try {
    const budgets = await getDevBudgets();
    const transactions = await getDevTransactions();

    if (budgets.length === 0) return alerts;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();

    for (const budget of budgets) {
      if (!budget.is_active) continue;

      // Calculate spending for this category this month
      const categoryTxs = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate >= startOfMonth &&
               t.category_id === budget.category_id &&
               (t.transaction_type === 'purchase' || Number(t.amount) < 0);
      });

      const spent = categoryTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      const categoryName = budget.category?.name || 'Unknown';

      if (percentage >= 100) {
        const overBy = spent - budget.amount;
        alerts.push({
          id: `budget_exceeded_${budget.id}`,
          type: 'budget_exceeded',
          title: t('alerts.overBudget', { category: categoryName }),
          message: t('alerts.overBudgetMessage', { spent: formatCurrency(spent), budget: formatCurrency(budget.amount), over: formatCurrency(overBy) }),
          severity: 'error',
          time: t('alerts.thisMonth'),
          read: false,
          route: '/settings/budgets',
          createdAt: Date.now(),
        });
      } else if (percentage >= (budget.alert_threshold || 80)) {
        const remaining = budget.amount - spent;
        alerts.push({
          id: `budget_warning_${budget.id}`,
          type: 'budget_warning',
          title: t('alerts.budgetAlertTitle', { category: categoryName }),
          message: t('alerts.budgetAlertMessage', { percentage, remaining: formatCurrency(remaining), days: daysLeft }),
          severity: 'warning',
          time: t('alerts.thisMonth'),
          read: false,
          route: '/settings/budgets',
          createdAt: Date.now() - 1000,
        });
      }
    }
  } catch (error) {
    logger.general.error('Error generating budget alerts:', error);
  }

  return alerts;
}

async function generateGoalAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  try {
    const goals = await getDevGoals();

    for (const goal of goals) {
      if (goal.status !== 'active') continue;

      const percentage = goal.target_amount > 0
        ? Math.round((goal.current_amount / goal.target_amount) * 100)
        : 0;

      // Goal completed
      if (percentage >= 100) {
        alerts.push({
          id: `goal_complete_${goal.id}`,
          type: 'goal_milestone',
          title: t('alerts.goalReached'),
          message: t('alerts.goalReachedMessage', { name: goal.name, amount: formatCurrency(goal.target_amount) }),
          severity: 'success',
          time: t('alerts.recently'),
          read: false,
          route: '/settings/goals',
          createdAt: Date.now(),
        });
        continue;
      }

      // Milestone alerts (75%, 50%)
      if (percentage >= 75) {
        alerts.push({
          id: `goal_75_${goal.id}`,
          type: 'goal_milestone',
          title: t('alerts.almostThere'),
          message: t('alerts.almostThereMessage', { percentage, name: goal.name, remaining: formatCurrency(goal.target_amount - goal.current_amount) }),
          severity: 'success',
          time: t('alerts.inProgressTime'),
          read: false,
          route: '/settings/goals',
          createdAt: Date.now() - 5000,
        });
      } else if (percentage >= 50) {
        alerts.push({
          id: `goal_50_${goal.id}`,
          type: 'goal_milestone',
          title: t('alerts.halfwayThere'),
          message: t('alerts.halfwayThereMessage', { percentage, name: goal.name }),
          severity: 'info',
          time: t('alerts.inProgressTime'),
          read: false,
          route: '/settings/goals',
          createdAt: Date.now() - 10000,
        });
      }

      // Target date approaching and off-track
      if (goal.target_date) {
        const targetDate = new Date(goal.target_date);
        const daysRemaining = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 30 && daysRemaining > 0 && percentage < 80) {
          alerts.push({
            id: `goal_deadline_${goal.id}`,
            type: 'goal_milestone',
            title: t('alerts.goalDeadlineApproaching'),
            message: t('alerts.goalDeadlineMessage', { name: goal.name, days: daysRemaining, percentage }),
            severity: 'warning',
            time: t('alerts.daysLeft', { days: daysRemaining }),
            read: false,
            route: '/settings/goals',
            createdAt: Date.now() - 3000,
          });
        } else if (daysRemaining <= 0 && percentage < 100) {
          alerts.push({
            id: `goal_overdue_${goal.id}`,
            type: 'goal_milestone',
            title: t('alerts.goalOverdue'),
            message: t('alerts.goalOverdueMessage', { name: goal.name, percentage }),
            severity: 'error',
            time: t('alerts.overdue'),
            read: false,
            route: '/settings/goals',
            createdAt: Date.now() - 2000,
          });
        }
      }
    }
  } catch (error) {
    logger.general.error('Error generating goal alerts:', error);
  }

  return alerts;
}

async function generateSubscriptionAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  try {
    const subscriptions = await getDevSubscriptions('active');
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    for (const sub of subscriptions) {
      if (!sub.next_billing_date) continue;

      const billingDate = new Date(sub.next_billing_date);
      const daysUntil = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const displayName = sub.display_name || sub.merchant_name;

      if (daysUntil >= 0 && daysUntil <= 7) {
        alerts.push({
          id: `sub_renewal_${sub.id}`,
          type: 'subscription_renewal',
          title: t('alerts.renewing', { name: displayName }),
          message: daysUntil === 0
            ? t('alerts.renewsToday', { name: displayName, amount: formatCurrency(sub.amount) })
            : daysUntil === 1
            ? t('alerts.renewsTomorrow', { name: displayName, amount: formatCurrency(sub.amount) })
            : t('alerts.renewsInDays', { name: displayName, amount: formatCurrency(sub.amount), days: daysUntil }),
          severity: daysUntil <= 1 ? 'warning' : 'info',
          time: daysUntil === 0 ? t('alerts.todayTime') : t('alerts.daysLeft', { days: daysUntil }),
          read: false,
          route: '/(tabs)/transactions',
          createdAt: Date.now() - (daysUntil * 1000),
        });
      }
    }

    // Check for unused subscriptions (not used in 30+ days)
    for (const sub of subscriptions) {
      if (sub.last_used_at) {
        const lastUsed = new Date(sub.last_used_at);
        const daysSinceUsed = Math.ceil((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
        const displayName = sub.display_name || sub.merchant_name;

        if (daysSinceUsed >= 30) {
          alerts.push({
            id: `sub_unused_${sub.id}`,
            type: 'subscription_unused',
            title: t('alerts.unusedSubscription'),
            message: t('alerts.unusedSubMessage', { name: displayName, days: daysSinceUsed, amount: formatCurrency(sub.amount) }),
            severity: 'info',
            time: t('alerts.daysUnused', { days: daysSinceUsed }),
            read: false,
            route: '/(tabs)/transactions',
            createdAt: Date.now() - 50000,
          });
        }
      }
    }
  } catch (error) {
    logger.general.error('Error generating subscription alerts:', error);
  }

  return alerts;
}

async function generateBillAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  try {
    const bills = await getDevBills();
    const now = new Date();
    const currentDay = now.getDate();

    for (const bill of bills) {
      if (bill.is_paid) continue;

      const dueDay = bill.due_date;
      let daysUntilDue: number;

      if (dueDay >= currentDay) {
        daysUntilDue = dueDay - currentDay;
      } else {
        // Due date has passed this month
        daysUntilDue = -(currentDay - dueDay);
      }

      if (daysUntilDue < 0) {
        // Overdue
        alerts.push({
          id: `bill_overdue_${bill.id}`,
          type: 'bill_overdue',
          title: t('alerts.billOverdue', { name: bill.name }),
          message: t('alerts.billOverdueMessage', { name: bill.name, amount: formatCurrency(bill.amount), days: Math.abs(daysUntilDue) }),
          severity: 'error',
          time: t('alerts.daysOverdue', { days: Math.abs(daysUntilDue) }),
          read: false,
          route: '/settings/bills',
          createdAt: Date.now(),
        });
      } else if (daysUntilDue <= 7) {
        // Coming up
        alerts.push({
          id: `bill_upcoming_${bill.id}`,
          type: 'bill_upcoming',
          title: daysUntilDue === 0 ? t('alerts.billDueToday', { name: bill.name }) : t('alerts.billDueSoon', { name: bill.name }),
          message: daysUntilDue === 0
            ? t('alerts.billDueTodayMessage', { name: bill.name, amount: formatCurrency(bill.amount) })
            : daysUntilDue === 1
            ? t('alerts.billDueTomorrowMessage', { name: bill.name, amount: formatCurrency(bill.amount) })
            : t('alerts.billDueInDaysMessage', { name: bill.name, amount: formatCurrency(bill.amount), days: daysUntilDue }),
          severity: daysUntilDue <= 1 ? 'warning' : 'info',
          time: daysUntilDue === 0 ? t('alerts.todayTime') : t('alerts.daysLeft', { days: daysUntilDue }),
          read: false,
          route: '/settings/bills',
          createdAt: Date.now() - (daysUntilDue * 1000),
        });
      }
    }
  } catch (error) {
    logger.general.error('Error generating bill alerts:', error);
  }

  return alerts;
}

async function generateDebtAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  try {
    const debts = await getDevDebts();

    // High interest debt warning
    const highInterestDebts = debts.filter(d => d.interest_rate >= 15);
    if (highInterestDebts.length > 0) {
      const worst = highInterestDebts.sort((a, b) => b.interest_rate - a.interest_rate)[0];
      alerts.push({
        id: `debt_high_interest_${worst.id}`,
        type: 'debt_warning',
        title: t('alerts.highInterestDebt'),
        message: t('alerts.highInterestDebtMessage', { name: worst.name, rate: worst.interest_rate }),
        severity: 'warning',
        time: t('alerts.ongoing'),
        read: false,
        route: '/settings/debts',
        createdAt: Date.now() - 60000,
      });
    }

    // Total debt reminder
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
    if (debts.length > 0 && totalMinPayment > 0) {
      alerts.push({
        id: `debt_monthly_payments`,
        type: 'debt_reminder',
        title: t('alerts.monthlyDebtPayments'),
        message: t('alerts.monthlyDebtPaymentsMessage', { payment: formatCurrency(totalMinPayment), count: debts.length, total: formatCurrency(totalDebt) }),
        severity: 'info',
        time: t('subscriptions.monthly'),
        read: false,
        route: '/settings/debts',
        createdAt: Date.now() - 70000,
      });
    }
  } catch (error) {
    logger.general.error('Error generating debt alerts:', error);
  }

  return alerts;
}

async function generateSpendingAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  try {
    const transactions = await getDevTransactions();
    if (transactions.length === 0) return alerts;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get recent expense transactions
    const recentExpenses = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= sevenDaysAgo &&
             (t.transaction_type === 'purchase' || Number(t.amount) < 0);
    });

    // Get monthly average
    const monthExpenses = transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= thirtyDaysAgo &&
             (t.transaction_type === 'purchase' || Number(t.amount) < 0);
    });

    const monthlyTotal = monthExpenses.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const dailyAvg = monthlyTotal / 30;

    // Large transaction alert (> 3x daily average, min 100)
    const threshold = Math.max(dailyAvg * 3, 100);
    for (const tx of recentExpenses) {
      const amount = Math.abs(Number(tx.amount));
      if (amount >= threshold) {
        const daysAgo = Math.ceil((now.getTime() - new Date(tx.transaction_date).getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `large_tx_${tx.id}`,
          type: 'large_transaction',
          title: t('alerts.largeTransactionTitle'),
          message: t('alerts.largeTransactionMessage', { amount: formatCurrency(amount), merchant: tx.merchant_name || t('alerts.unknownMerchant'), daysAgo }),
          severity: 'info',
          time: daysAgo === 0 ? t('alerts.todayTime') : t('alerts.daysAgo', { days: daysAgo }),
          read: false,
          route: '/(tabs)/transactions',
          createdAt: new Date(tx.transaction_date).getTime(),
        });
        // Only show the top 3 large transactions
        if (alerts.filter(a => a.type === 'large_transaction').length >= 3) break;
      }
    }

    // Weekly spending summary
    const weeklyTotal = recentExpenses.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const weeklyAvg = dailyAvg * 7;
    if (weeklyTotal > 0 && weeklyAvg > 0) {
      const weeklyPercentage = Math.round((weeklyTotal / weeklyAvg) * 100);
      if (weeklyPercentage >= 120) {
        alerts.push({
          id: `spending_high_weekly`,
          type: 'unusual_spending',
          title: t('alerts.higherThanUsual'),
          message: t('alerts.higherThanUsualMessage', { amount: formatCurrency(weeklyTotal), percentage: weeklyPercentage - 100 }),
          severity: 'warning',
          time: t('alerts.thisWeekTime'),
          read: false,
          route: '/(tabs)/stats',
          createdAt: Date.now() - 40000,
        });
      }
    }
  } catch (error) {
    logger.general.error('Error generating spending alerts:', error);
  }

  return alerts;
}

/**
 * Generate all alerts from real app data
 */
async function generateAllAlerts(
  formatCurrency: (amount: number) => string,
  t: (key: string, params?: Record<string, any>) => string,
): Promise<AppAlert[]> {
  const [budgetAlerts, goalAlerts, subAlerts, billAlerts, debtAlerts, spendingAlerts] = await Promise.all([
    generateBudgetAlerts(formatCurrency, t),
    generateGoalAlerts(formatCurrency, t),
    generateSubscriptionAlerts(formatCurrency, t),
    generateBillAlerts(formatCurrency, t),
    generateDebtAlerts(formatCurrency, t),
    generateSpendingAlerts(formatCurrency, t),
  ]);

  const all = [
    ...budgetAlerts,
    ...goalAlerts,
    ...subAlerts,
    ...billAlerts,
    ...debtAlerts,
    ...spendingAlerts,
  ];

  // Sort: errors first, then warnings, then info, then success — and by createdAt
  const severityOrder: Record<AlertSeverity, number> = { error: 0, warning: 1, info: 2, success: 3 };
  all.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    return b.createdAt - a.createdAt;
  });

  return all;
}

// =============================================
// PERSISTENCE HELPERS
// =============================================

async function getDismissedAlertIds(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_ALERTS);
    return new Set(data ? JSON.parse(data) : []);
  } catch {
    return new Set();
  }
}

async function saveDismissedAlertIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DISMISSED_ALERTS, JSON.stringify([...ids]));
  } catch {
    // Silent fail
  }
}

async function getReadAlertIds(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.READ_ALERTS);
    return new Set(data ? JSON.parse(data) : []);
  } catch {
    return new Set();
  }
}

async function saveReadAlertIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.READ_ALERTS, JSON.stringify([...ids]));
  } catch {
    // Silent fail
  }
}

// =============================================
// UI HELPERS
// =============================================

const getSeverityColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case 'success': return Colors.semantic.success;
    case 'warning': return Colors.semantic.warning;
    case 'error': return Colors.semantic.error;
    case 'info': return Colors.semantic.info;
    default: return Colors.primary;
  }
};

const getSeverityBgColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case 'success': return Colors.transparent.neon10;
    case 'warning': return Colors.transparent.orange10;
    case 'error': return Colors.transparent.red10;
    case 'info': return Colors.transparent.blue10;
    default: return Colors.transparent.deep20;
  }
};

// =============================================
// SWIPEABLE ALERT CARD
// =============================================

interface SwipeableAlertCardProps {
  alert: AppAlert;
  onDeleteRequest: () => void;
  onPress: () => void;
  isRead: boolean;
  getAlertIcon: (type: string, severity: AlertSeverity) => React.ReactNode;
  resetSwipe?: boolean;
  deleteLabel?: string;
}

const SwipeableAlertCard: React.FC<SwipeableAlertCardProps> = memo(({
  alert,
  onDeleteRequest,
  onPress,
  isRead,
  getAlertIcon,
  resetSwipe,
  deleteLabel = 'Delete',
}) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(110);
  const opacity = useSharedValue(1);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // Detect screen reader for accessibility
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (resetSwipe) {
      translateX.value = withSpring(0);
      setShowDeleteButton(false);
    }
  }, [resetSwipe]);

  // Long press handler to show delete button (keyboard/accessibility alternative)
  const handleLongPress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDeleteButton((prev) => !prev);
  }, []);

  // Hide delete button after action
  const handleDeletePress = useCallback(() => {
    setShowDeleteButton(false);
    onDeleteRequest();
  }, [onDeleteRequest]);

  const panGesture = Gesture.Pan()
    .enabled(!isScreenReaderEnabled) // Disable swipe for screen readers
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > DELETE_THRESHOLD) {
        runOnJS(onDeleteRequest)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => {
    const deleteOpacity = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity: deleteOpacity };
  });

  const deleteIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD / 2, DELETE_THRESHOLD],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    marginBottom: itemHeight.value > 0 ? Spacing.sm : 0,
    overflow: 'hidden',
  }));

  // Accessibility label for screen readers
  const accessibilityLabel = `${alert.title}. ${alert.message}. ${alert.severity} alert. ${alert.time}`;
  const accessibilityHint = isScreenReaderEnabled
    ? 'Double tap to view details. Delete button available below.'
    : 'Double tap to view details. Swipe right or long press for delete option.';

  return (
    <Animated.View style={[styles.swipeContainer, containerStyle]}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <Animated.View style={[styles.deleteIconContainer, deleteIconStyle]}>
          <TrashIcon size={24} color={Colors.void} />
          <Text style={styles.deleteText}>{deleteLabel}</Text>
        </Animated.View>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <HapticTouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            accessible={true}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityRole="button"
          >
            <GlassCard
              variant={isRead ? "default" : "outlined"}
              size="compact"
              style={isRead ? styles.readAlert : undefined}
              contentStyle={styles.alertCardContent}
            >
              <View style={[styles.alertIcon, { backgroundColor: getSeverityBgColor(alert.severity) }]}>
                {getAlertIcon(alert.type, alert.severity)}
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertTitle, isRead && styles.alertTitleRead]} numberOfLines={1}>
                    {alert.title}
                  </Text>
                  <Badge variant={alert.severity} size="small">{alert.severity}</Badge>
                </View>
                <Text style={[styles.alertMessage, isRead && styles.alertMessageRead]} numberOfLines={2}>
                  {alert.message}
                </Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </GlassCard>
          </HapticTouchableOpacity>
        </Animated.View>
      </GestureDetector>

      {/* Accessible delete button - shown for screen readers or on long press */}
      {(isScreenReaderEnabled || showDeleteButton) && (
        <View style={styles.accessibleDeleteRow}>
          <HapticTouchableOpacity
            style={styles.accessibleDeleteButton}
            onPress={handleDeletePress}
            accessibilityLabel={`${deleteLabel} ${alert.title}`}
            accessibilityRole="button"
          >
            <TrashIcon size={18} color={Colors.void} />
            <Text style={styles.accessibleDeleteText}>{deleteLabel}</Text>
          </HapticTouchableOpacity>
          {!isScreenReaderEnabled && (
            <HapticTouchableOpacity
              style={styles.accessibleCancelButton}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowDeleteButton(false);
              }}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.accessibleCancelText}>Cancel</Text>
            </HapticTouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
});

// =============================================
// MAIN ALERTS SCREEN
// =============================================

function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<AppAlert | null>(null);
  const [resetSwipeId, setResetSwipeId] = useState<string | null>(null);

  // Load alerts from real data
  const loadAlerts = useCallback(async () => {
    try {
      const [generated, dismissedIds, readIds] = await Promise.all([
        generateAllAlerts(formatCurrency, t),
        getDismissedAlertIds(),
        getReadAlertIds(),
      ]);

      // Filter out dismissed alerts and apply read state
      const filtered = generated
        .filter(a => !dismissedIds.has(a.id))
        .map(a => ({ ...a, read: readIds.has(a.id) }));

      setAlerts(filtered);
    } catch (error) {
      logger.general.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formatCurrency, t]);

  // Refresh on focus - defer until navigation animations complete
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadAlerts();
      });
      return () => task.cancel();
    }, [loadAlerts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [loadAlerts]);

  // Memoize filtered arrays
  const unreadAlerts = useMemo(() => alerts.filter(a => !a.read), [alerts]);
  const readAlerts = useMemo(() => alerts.filter(a => a.read), [alerts]);

  const getAlertIcon = useCallback((type: string, severity: AlertSeverity) => {
    const color = getSeverityColor(severity);
    switch (type) {
      case 'budget_warning':
      case 'budget_exceeded':
      case 'debt_warning':
        return <WarningIcon size={20} color={color} />;
      case 'subscription_renewal':
      case 'subscription_unused':
      case 'bill_upcoming':
      case 'bill_overdue':
        return <CalendarIcon size={20} color={color} />;
      case 'unusual_spending':
      case 'large_transaction':
        return <TrendUpIcon size={20} color={color} />;
      case 'goal_milestone':
        return <TrendUpIcon size={20} color={color} />;
      case 'debt_reminder':
        return <InfoIcon size={20} color={color} />;
      default:
        return <InfoIcon size={20} color={color} />;
    }
  }, []);

  // Handle alert tap — navigate and mark as read
  const handleAlertPress = useCallback(async (alert: AppAlert) => {
    // Mark as read
    const readIds = await getReadAlertIds();
    readIds.add(alert.id);
    await saveReadAlertIds(readIds);

    setAlerts(prev => prev.map(a =>
      a.id === alert.id ? { ...a, read: true } : a
    ));

    // Navigate to relevant page
    if (alert.route) {
      triggerBlackout(() => router.push(alert.route as any));
    }
  }, [router, triggerBlackout]);

  // Delete alert (dismiss permanently)
  const handleDeleteRequest = useCallback((alert: AppAlert) => {
    setAlertToDelete(alert);
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (alertToDelete) {
      setResetSwipeId(alertToDelete.id);
      setTimeout(() => setResetSwipeId(null), 100);
    }
    setDeleteModalVisible(false);
    setAlertToDelete(null);
  }, [alertToDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!alertToDelete) return;

    // Persist dismissal
    const dismissedIds = await getDismissedAlertIds();
    dismissedIds.add(alertToDelete.id);
    await saveDismissedAlertIds(dismissedIds);

    setAlerts(prev => prev.filter(a => a.id !== alertToDelete.id));
    setDeleteModalVisible(false);
    setAlertToDelete(null);
  }, [alertToDelete]);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    const readIds = await getReadAlertIds();
    alerts.forEach(a => readIds.add(a.id));
    await saveReadAlertIds(readIds);

    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, [alerts]);

  // Clear all alerts
  const handleClearAll = useCallback(() => {
    setShowClearModal(true);
  }, []);

  const confirmClearAll = useCallback(async () => {
    // Dismiss all current alerts
    const dismissedIds = await getDismissedAlertIds();
    alerts.forEach(a => dismissedIds.add(a.id));
    await saveDismissedAlertIds(dismissedIds);

    setAlerts([]);
    setShowClearModal(false);
  }, [alerts]);

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.neon}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <GradientTitle>{t('alerts.title')}</GradientTitle>
          <View style={styles.headerActions}>
            {unreadAlerts.length > 0 && (
              <Badge variant="success" size="medium">{unreadAlerts.length} {t('common.new')}</Badge>
            )}
            {alerts.length > 0 && (
              <HapticTouchableOpacity
                onPress={handleClearAll}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>{t('common.clearAll')}</Text>
              </HapticTouchableOpacity>
            )}
          </View>
        </View>

        {/* Swipe hint */}
        {alerts.length > 0 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>{t('alerts.swipeHint')}</Text>
          </View>
        )}

        {alerts.length > 0 ? (
          <>
            {/* Unread Alerts */}
            {unreadAlerts.length > 0 && (
              <View style={styles.section} accessibilityLiveRegion="polite">
                <View style={styles.sectionHeaderRow}>
                  <SectionHeader title={t('common.new')} />
                  {unreadAlerts.length > 0 && (
                    <HapticTouchableOpacity onPress={handleMarkAllRead} style={styles.markReadButton}>
                      <Text style={styles.markReadText}>{t('common.markAllRead')}</Text>
                    </HapticTouchableOpacity>
                  )}
                </View>
                {unreadAlerts.map((alert) => (
                  <SwipeableAlertCard
                    key={alert.id}
                    alert={alert}
                    onDeleteRequest={() => handleDeleteRequest(alert)}
                    onPress={() => handleAlertPress(alert)}
                    isRead={false}
                    getAlertIcon={getAlertIcon}
                    resetSwipe={resetSwipeId === alert.id}
                    deleteLabel={t('common.delete')}
                  />
                ))}
              </View>
            )}

            {/* Read Alerts */}
            {readAlerts.length > 0 && (
              <View style={styles.section} accessibilityLiveRegion="polite">
                <SectionHeader title={t('common.earlier')} />
                {readAlerts.map((alert) => (
                  <SwipeableAlertCard
                    key={alert.id}
                    alert={alert}
                    onDeleteRequest={() => handleDeleteRequest(alert)}
                    onPress={() => handleAlertPress(alert)}
                    isRead={true}
                    getAlertIcon={getAlertIcon}
                    resetSwipe={resetSwipeId === alert.id}
                    deleteLabel={t('common.delete')}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<AlertsIcon size={48} color={Colors.text.tertiary} />}
            title={t('alerts.noAlerts')}
            description={t('alerts.noAlertsDescription')}
          />
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Delete Single Alert Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('alerts.dismissAlert')}
        message={t('alerts.dismissAlertMessage')}
        confirmText={t('common.dismiss')}
        cancelText={t('common.cancel')}
        variant="danger"
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        visible={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearAll}
        title={t('alerts.clearAllAlerts')}
        message={t('alerts.clearAllMessage')}
        confirmText={t('common.clearAll')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.semantic.error}50`,
    backgroundColor: 'transparent',
  },
  clearButtonText: {
    color: Colors.semantic.error,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swipeHint: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  swipeHintText: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markReadButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markReadText: {
    color: Colors.neon,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  // Swipeable Container
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DELETE_THRESHOLD + 20,
    backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    paddingLeft: Spacing.lg,
  },
  deleteIconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteText: {
    color: Colors.void,
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
  },

  // Accessible delete button (for screen readers and long press)
  accessibleDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    backgroundColor: Colors.transparent.dark40,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    marginTop: -Spacing.xs,
  },
  accessibleDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.semantic.error,
    gap: Spacing.xs,
  },
  accessibleDeleteText: {
    color: Colors.void,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accessibleCancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  accessibleCancelText: {
    color: Colors.text.tertiary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
  },

  // Alert Card Content
  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  readAlert: {
    opacity: 0.7,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  alertTitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: '#ffffff',
    flexShrink: 1,
  },
  alertTitleRead: {
    color: Colors.text.secondary,
  },
  alertMessage: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: '#cccccc',
    marginBottom: Spacing.xs,
  },
  alertMessageRead: {
    color: Colors.text.tertiary,
  },
  alertTime: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.text.tertiary,
  },
});

export default memo(AlertsScreen);

/**
 * SpendTrak Behavioral Engine v2.0
 * Behavioral Moment Detection
 *
 * Detects when user is in autopilot mode and open to reflection
 */

import { THRESHOLDS, isComfortCategory } from '../config/behavioralConstants';
import { detectRelapse } from './winDetection';
import type { TransactionWithCategory, UserBehavioralProfile } from '../types';

export type BehavioralMomentType =
  | 'REPEAT_PURCHASE'
  | 'HABITUAL_TIME'
  | 'LATE_NIGHT_COMFORT'
  | 'POST_WORK_RELEASE'
  | 'STRESS_CLUSTER'
  | 'FIRST_BREACH'
  | 'COLLAPSE_START'
  | 'RELAPSE_AFTER_IMPROVEMENT'
  // FIX #4: Extended moment types for edge cases
  | 'WEEKEND_SPLURGE'       // Higher spending on weekends
  | 'PAYDAY_SURGE'          // Spending spike after income deposit
  | 'IMPULSE_CHAIN'         // Multiple quick purchases in succession
  | 'BOREDOM_BROWSE'        // Low-value scattered purchases during idle hours
  | 'SEASONAL_TRIGGER'      // Holiday/seasonal spending pattern
  | 'BUDGET_NEAR_LIMIT'     // Approaching budget threshold
  | 'CATEGORY_BINGE';       // Multiple purchases in same category rapidly

export interface BehavioralMomentResult {
  isBehavioralMoment: boolean;
  momentType: BehavioralMomentType | null;
  confidence: number;
  reason: string;
}

export function detectBehavioralMoment(
  transaction: TransactionWithCategory,
  profile: UserBehavioralProfile,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  const activeBehavior = profile.active_behavior;

  if (!activeBehavior) {
    return notAMoment('No active behavior');
  }

  // Check for relapse first - this takes priority
  const relapseResult = detectRelapse(profile, activeBehavior, recentTransactions);
  if (relapseResult.isRelapse && relapseResult.severity !== 'mild') {
    // Only trigger for moderate/severe relapses to avoid over-notifying
    return {
      isBehavioralMoment: true,
      momentType: 'RELAPSE_AFTER_IMPROVEMENT',
      confidence: relapseResult.severity === 'severe' ? 0.95 : 0.85,
      reason: `Relapse detected: ${relapseResult.increasePercent}% increase (${relapseResult.severity})`,
    };
  }

  switch (activeBehavior) {
    case 'small_recurring':
      return detectSmallRecurringMoment(transaction, recentTransactions);
    case 'stress_spending':
      return detectStressSpendingMoment(transaction, recentTransactions);
    case 'end_of_month':
      return detectEndOfMonthMoment(transaction, profile);
    default:
      return notAMoment('Unknown behavior');
  }
}

function detectSmallRecurringMoment(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  if (transaction.amount > THRESHOLDS.SMALL_TRANSACTION_MAX) {
    return notAMoment('Transaction too large');
  }

  const sameCategory = recentTransactions.filter(t =>
    t.category_id === transaction.category_id &&
    t.amount <= THRESHOLDS.SMALL_TRANSACTION_MAX
  );

  if (sameCategory.length < 2) {
    return notAMoment('Not enough previous transactions');
  }

  // Check habitual time
  const currentHour = new Date(transaction.transaction_date).getHours();
  const sameHourCount = sameCategory.filter(t =>
    Math.abs(new Date(t.transaction_date).getHours() - currentHour) <= 1
  ).length;

  if (sameHourCount >= 2) {
    return {
      isBehavioralMoment: true,
      momentType: 'HABITUAL_TIME',
      confidence: 0.9,
      reason: `Same category at habitual hour (${currentHour}:00)`,
    };
  }

  return {
    isBehavioralMoment: true,
    momentType: 'REPEAT_PURCHASE',
    confidence: 0.75,
    reason: `Repeat purchase #${sameCategory.length + 1}`,
  };
}

function detectStressSpendingMoment(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  const hour = new Date(transaction.transaction_date).getHours();
  const categoryId = transaction.category_id || '';

  if (!isComfortCategory(categoryId)) {
    return notAMoment('Not a comfort category');
  }

  const isLateNight = hour >= THRESHOLDS.STRESS_LATE_NIGHT_START || hour <= THRESHOLDS.STRESS_LATE_NIGHT_END;
  const isPostWork = hour >= THRESHOLDS.STRESS_POST_WORK_START && hour <= THRESHOLDS.STRESS_POST_WORK_END;

  if (!isLateNight && !isPostWork) {
    return notAMoment('Not in stress time window');
  }

  // Check for cluster
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const recentCluster = recentTransactions.filter(t =>
    new Date(t.transaction_date) >= twoHoursAgo &&
    isComfortCategory(t.category_id || '')
  );

  if (recentCluster.length >= 1) {
    return {
      isBehavioralMoment: true,
      momentType: 'STRESS_CLUSTER',
      confidence: 0.95,
      reason: `Stress cluster: ${recentCluster.length + 1} in 2 hours`,
    };
  }

  if (isLateNight) {
    return {
      isBehavioralMoment: true,
      momentType: 'LATE_NIGHT_COMFORT',
      confidence: 0.85,
      reason: `Late night at ${hour}:00`,
    };
  }

  return {
    isBehavioralMoment: true,
    momentType: 'POST_WORK_RELEASE',
    confidence: 0.80,
    reason: `Post-work at ${hour}:00`,
  };
}

function detectEndOfMonthMoment(
  transaction: TransactionWithCategory,
  profile: UserBehavioralProfile
): BehavioralMomentResult {
  const dayOfMonth = new Date(transaction.transaction_date).getDate();

  if (dayOfMonth < THRESHOLDS.END_OF_MONTH_START_DAY) {
    return notAMoment('Not end of month period');
  }

  const wasAdherent = (profile.budget_adherence_early_month ?? 0) >= 0.8;
  const currentAdherence = profile.budget_adherence_current ?? 1;

  if (wasAdherent && currentAdherence < 0.7) {
    return {
      isBehavioralMoment: true,
      momentType: 'FIRST_BREACH',
      confidence: 0.90,
      reason: 'First breach after adherence',
    };
  }

  if (currentAdherence < 0.5) {
    return {
      isBehavioralMoment: true,
      momentType: 'COLLAPSE_START',
      confidence: 0.85,
      reason: 'Collapse detected',
    };
  }

  return notAMoment('No end-of-month moment');
}

function notAMoment(reason: string): BehavioralMomentResult {
  return {
    isBehavioralMoment: false,
    momentType: null,
    confidence: 0,
    reason,
  };
}

// ============================================
// FIX #4: Extended Moment Detection Functions
// ============================================

/**
 * Detect weekend splurge moment
 */
export function detectWeekendSplurge(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  const transactionDate = new Date(transaction.transaction_date);
  const dayOfWeek = transactionDate.getDay();

  // Only trigger on weekends (0 = Sunday, 6 = Saturday)
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    return notAMoment('Not a weekend');
  }

  // Check if spending is higher than weekday average
  const weekdayTxns = recentTransactions.filter(t => {
    const d = new Date(t.transaction_date).getDay();
    return d !== 0 && d !== 6 && t.amount < 0;
  });

  const weekendTxns = recentTransactions.filter(t => {
    const d = new Date(t.transaction_date).getDay();
    return (d === 0 || d === 6) && t.amount < 0;
  });

  if (weekdayTxns.length < 5 || weekendTxns.length < 2) {
    return notAMoment('Insufficient data');
  }

  const avgWeekday = weekdayTxns.reduce((s, t) => s + Math.abs(t.amount), 0) / weekdayTxns.length;
  const avgWeekend = weekendTxns.reduce((s, t) => s + Math.abs(t.amount), 0) / weekendTxns.length;

  if (avgWeekend > avgWeekday * 1.5) {
    return {
      isBehavioralMoment: true,
      momentType: 'WEEKEND_SPLURGE',
      confidence: 0.80,
      reason: `Weekend spending ${Math.round((avgWeekend / avgWeekday - 1) * 100)}% higher than weekdays`,
    };
  }

  return notAMoment('Weekend spending within normal range');
}

/**
 * Detect impulse chain - multiple quick purchases
 */
export function detectImpulseChain(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  const now = new Date(transaction.transaction_date);
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Find transactions in last 30 minutes
  const recentCluster = recentTransactions.filter(t =>
    new Date(t.transaction_date) >= thirtyMinutesAgo &&
    new Date(t.transaction_date) < now &&
    t.amount < 0
  );

  if (recentCluster.length >= 2) {
    return {
      isBehavioralMoment: true,
      momentType: 'IMPULSE_CHAIN',
      confidence: 0.90,
      reason: `${recentCluster.length + 1} purchases in 30 minutes`,
    };
  }

  return notAMoment('No impulse chain detected');
}

/**
 * Detect boredom browsing - scattered low-value purchases
 */
export function detectBoredomBrowse(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  const hour = new Date(transaction.transaction_date).getHours();

  // Idle hours: 10am-4pm or 8pm-10pm
  const isIdleHour = (hour >= 10 && hour <= 16) || (hour >= 20 && hour <= 22);
  if (!isIdleHour) return notAMoment('Not idle hours');

  // Check for scattered small purchases
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const recentSmall = recentTransactions.filter(t =>
    new Date(t.transaction_date) >= twoHoursAgo &&
    Math.abs(t.amount) < 20 &&
    t.amount < 0
  );

  // Multiple categories = browsing behavior
  const categories = new Set(recentSmall.map(t => t.category_id));

  if (recentSmall.length >= 2 && categories.size >= 2) {
    return {
      isBehavioralMoment: true,
      momentType: 'BOREDOM_BROWSE',
      confidence: 0.75,
      reason: `${recentSmall.length} small purchases across ${categories.size} categories`,
    };
  }

  return notAMoment('No boredom browsing pattern');
}

/**
 * Detect category binge - multiple purchases in same category rapidly
 */
export function detectCategoryBinge(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  const category = transaction.category_id;
  if (!category) return notAMoment('No category');

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const sameCategoryRecent = recentTransactions.filter(t =>
    t.category_id === category &&
    new Date(t.transaction_date) >= oneHourAgo &&
    t.amount < 0
  );

  if (sameCategoryRecent.length >= 2) {
    return {
      isBehavioralMoment: true,
      momentType: 'CATEGORY_BINGE',
      confidence: 0.85,
      reason: `${sameCategoryRecent.length + 1} ${category} purchases in one hour`,
    };
  }

  return notAMoment('No category binge');
}

/**
 * Detect payday surge - spending spike after income
 */
export function detectPaydaySurge(
  transaction: TransactionWithCategory,
  recentTransactions: TransactionWithCategory[]
): BehavioralMomentResult {
  // Find recent income (positive amounts)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const recentIncome = recentTransactions.filter(t =>
    new Date(t.transaction_date) >= threeDaysAgo &&
    t.amount > 0 &&
    t.amount >= 500 // Significant income threshold
  );

  if (recentIncome.length === 0) return notAMoment('No recent income');

  // Count expenses since income
  const lastIncomeDate = new Date(Math.max(...recentIncome.map(t => new Date(t.transaction_date).getTime())));
  const expensesSinceIncome = recentTransactions.filter(t =>
    new Date(t.transaction_date) > lastIncomeDate &&
    t.amount < 0
  );

  if (expensesSinceIncome.length >= 3) {
    const totalSpent = expensesSinceIncome.reduce((s, t) => s + Math.abs(t.amount), 0);
    return {
      isBehavioralMoment: true,
      momentType: 'PAYDAY_SURGE',
      confidence: 0.80,
      reason: `$${totalSpent.toFixed(0)} spent across ${expensesSinceIncome.length} purchases since payday`,
    };
  }

  return notAMoment('No payday surge');
}

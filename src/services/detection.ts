/**
 * SpendTrak Behavioral Engine v2.0
 * Detection Layer - Rule-based pattern detection (NO AI)
 */

import { THRESHOLDS, isComfortCategory } from '../config/behavioralConstants';
import type { TransactionWithCategory } from '../types';
import type { SeasonalFactors } from '../types/behavior';
import { DEFAULT_SEASONAL_FACTORS } from '../types/behavior';

export interface BehavioralSignal {
  type: string;
  strength: number;
  signal_strength: number;
  timestamp: Date;
  transactionId: string;
  transaction_id: string;
  reason: string;
  detection_reason: string;
  time_context?: 'late_night' | 'post_work' | 'end_of_month' | 'daytime';
  category_id?: string;
}

export interface DetectionMetadata {
  algorithm_version: string;
  transactions_analyzed: number;
  run_timestamp: string;
  time_range_days?: number;
  [key: string]: unknown;
}

export interface DetectionResult {
  detected: boolean;
  confidence: number;
  signals: BehavioralSignal[];
  metadata: DetectionMetadata;
}

export interface AllDetectionResults {
  small_recurring: DetectionResult;
  stress_spending: DetectionResult;
  end_of_month: DetectionResult;
}

// Saving Habit Detection Result
export interface SavingHabitResult {
  hasSavingHabit: boolean;
  consistency: number; // 0-1, how consistent the saving is
  averageSavingsRate: number; // percentage of income saved
  trend: 'improving' | 'stable' | 'declining' | 'none';
  streakWeeks: number;
  message: string;
}

// Trend Analysis Result
export interface TrendAnalysisResult {
  weeklyTrend: {
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
    weekOverWeekData: { week: string; total: number }[];
  };
  monthlyTrend: {
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
    monthOverMonthData: { month: string; total: number }[];
  };
  categoryTrends: {
    category: string;
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
  }[];
  insights: string[];
}

export function runAllDetection(
  transactions: TransactionWithCategory[],
  existingConfidences: { small_recurring: number; stress_spending: number; end_of_month: number }
): AllDetectionResults {

  return {
    small_recurring: detectSmallRecurring(transactions, existingConfidences.small_recurring),
    stress_spending: detectStressSpending(transactions, existingConfidences.stress_spending),
    end_of_month: detectEndOfMonthCollapse(transactions, existingConfidences.end_of_month),
  };
}

export function detectSmallRecurring(
  transactions: TransactionWithCategory[],
  existingConfidence: number = 0
): DetectionResult {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - THRESHOLDS.SMALL_RECURRING_DAYS);

  const recentSmall = transactions.filter(t =>
    new Date(t.transaction_date) >= cutoffDate &&
    Math.abs(t.amount) <= THRESHOLDS.SMALL_TRANSACTION_MAX &&
    t.amount < 0  // Expenses are negative amounts
  );


  if (recentSmall.length < THRESHOLDS.SMALL_RECURRING_MIN_COUNT) {
    return createNoDetection(existingConfidence, { reason: 'Not enough small transactions' }, transactions.length);
  }

  // Group by category
  const byCategory: Record<string, TransactionWithCategory[]> = {};
  recentSmall.forEach(t => {
    const cat = t.category_id || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(t);
  });


  // Find dominant category
  const categoryStats = Object.entries(byCategory)
    .map(([category, txns]) => ({
      category,
      count: txns.length,
      total: txns.reduce((sum, t) => sum + t.amount, 0),
      transactions: txns,
    }))
    .sort((a, b) => b.count - a.count);

  const dominant = categoryStats[0];


  if (!dominant || dominant.count < THRESHOLDS.SMALL_RECURRING_CATEGORY_MIN) {
    return createNoDetection(existingConfidence, { reason: 'No category with enough frequency' }, transactions.length);
  }

  // Calculate confidence (use absolute values since amounts are negative for expenses)
  const frequencyScore = Math.min(1, (dominant.count - 3) / 7);
  const amountScore = Math.min(1, Math.abs(dominant.total) / 100);

  const hours = dominant.transactions.map(t => new Date(t.transaction_date).getHours());
  const hourCounts: Record<number, number> = {};
  hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const habitualityScore = Math.min(1, Math.max(...Object.values(hourCounts)) / 3);

  const rawConfidence = frequencyScore * 0.40 + amountScore * 0.30 + habitualityScore * 0.30;

  const smoothedConfidence = existingConfidence > 0
    ? existingConfidence * THRESHOLDS.CONFIDENCE_SMOOTHING_FACTOR + rawConfidence * (1 - THRESHOLDS.CONFIDENCE_SMOOTHING_FACTOR)
    : rawConfidence;

  const signalStrength = 1 - (Math.abs(dominant.transactions[0]?.amount || 0) / THRESHOLDS.SMALL_TRANSACTION_MAX);
  return {
    detected: true,
    confidence: smoothedConfidence,
    signals: dominant.transactions.slice(-5).map(t => {
      const strength = 1 - (Math.abs(t.amount) / THRESHOLDS.SMALL_TRANSACTION_MAX);
      const reason = `$${Math.abs(t.amount).toFixed(2)} at ${dominant.category}`;
      return {
        type: 'small_recurring_purchase',
        strength,
        signal_strength: strength,
        timestamp: new Date(t.transaction_date),
        transactionId: t.id,
        transaction_id: t.id,
        reason,
        detection_reason: reason,
        time_context: 'daytime' as const,
        category_id: t.category_id || undefined,
      };
    }),
    metadata: {
      algorithm_version: '1.0.0',
      transactions_analyzed: transactions.length,
      run_timestamp: new Date().toISOString(),
      time_range_days: 30,
      dominantCategory: dominant.category,
      count: dominant.count,
      total: dominant.total,
    },
  };
}

export function detectStressSpending(
  transactions: TransactionWithCategory[],
  existingConfidence: number = 0
): DetectionResult {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - THRESHOLDS.STRESS_LOOKBACK_DAYS);

  const recent = transactions.filter(t =>
    new Date(t.transaction_date) >= cutoffDate && t.amount < 0  // Expenses are negative amounts
  );

  const stressSignals: BehavioralSignal[] = [];

  recent.forEach(t => {
    const hour = new Date(t.transaction_date).getHours();
    const categoryId = t.category_id || '';

    if (!isComfortCategory(categoryId)) return;

    const isLateNight = hour >= THRESHOLDS.STRESS_LATE_NIGHT_START || hour <= THRESHOLDS.STRESS_LATE_NIGHT_END;
    const isPostWork = hour >= THRESHOLDS.STRESS_POST_WORK_START && hour <= THRESHOLDS.STRESS_POST_WORK_END;

    if (isLateNight) {
      const reason = `Late night ${categoryId} at ${hour}:00`;
      stressSignals.push({
        type: 'late_night_comfort',
        strength: 0.9,
        signal_strength: 0.9,
        timestamp: new Date(t.transaction_date),
        transactionId: t.id,
        transaction_id: t.id,
        reason,
        detection_reason: reason,
        time_context: 'late_night' as const,
        category_id: categoryId || undefined,
      });
    } else if (isPostWork) {
      const reason = `Post-work ${categoryId} at ${hour}:00`;
      stressSignals.push({
        type: 'post_work_comfort',
        strength: 0.7,
        signal_strength: 0.7,
        timestamp: new Date(t.transaction_date),
        transactionId: t.id,
        transaction_id: t.id,
        reason,
        detection_reason: reason,
        time_context: 'post_work' as const,
        category_id: categoryId || undefined,
      });
    }
  });

  if (stressSignals.length < THRESHOLDS.STRESS_MIN_OCCURRENCES) {
    return createNoDetection(existingConfidence, { reason: 'Not enough stress signals' }, transactions.length);
  }

  // Check clustering
  let clusterCount = 0;
  const sorted = [...stressSignals].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()) / (1000 * 60 * 60) <= THRESHOLDS.STRESS_CLUSTER_WINDOW_HOURS) {
      clusterCount++;
    }
  }

  const frequencyScore = Math.min(1, stressSignals.length / 8);
  const clusterScore = Math.min(1, clusterCount / 3);
  const avgStrength = stressSignals.reduce((s, sig) => s + sig.strength, 0) / stressSignals.length;

  const rawConfidence = frequencyScore * 0.35 + clusterScore * 0.30 + avgStrength * 0.35;

  const smoothedConfidence = existingConfidence > 0
    ? existingConfidence * THRESHOLDS.CONFIDENCE_SMOOTHING_FACTOR + rawConfidence * (1 - THRESHOLDS.CONFIDENCE_SMOOTHING_FACTOR)
    : rawConfidence;

  return {
    detected: true,
    confidence: smoothedConfidence,
    signals: stressSignals.slice(-5),
    metadata: {
      algorithm_version: '1.0.0',
      transactions_analyzed: transactions.length,
      run_timestamp: new Date().toISOString(),
      time_range_days: 30,
      totalSignals: stressSignals.length,
      lateNightCount: stressSignals.filter(s => s.type === 'late_night_comfort').length,
      postWorkCount: stressSignals.filter(s => s.type === 'post_work_comfort').length,
      clusterCount,
    },
  };
}

export function detectEndOfMonthCollapse(
  transactions: TransactionWithCategory[],
  existingConfidence: number = 0
): DetectionResult {
  const now = new Date();
  const dayOfMonth = now.getDate();

  if (dayOfMonth < THRESHOLDS.END_OF_MONTH_START_DAY) {
    return createNoDetection(existingConfidence * 0.98, { reason: 'Not end of month period' }, transactions.length);
  }

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTxns = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.amount < 0;  // Expenses are negative
  });

  if (monthTxns.length < 5) {
    return createNoDetection(existingConfidence, { reason: 'Not enough transactions' }, transactions.length);
  }

  const earlyTxns = monthTxns.filter(t => new Date(t.transaction_date).getDate() <= 20);
  const lateTxns = monthTxns.filter(t => new Date(t.transaction_date).getDate() >= 21);

  if (lateTxns.length === 0) {
    return createNoDetection(existingConfidence, { reason: 'No late period transactions' }, transactions.length);
  }

  // Use absolute values since expenses are negative
  const earlyTotal = earlyTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lateTotal = lateTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  const earlyDays = Math.min(20, dayOfMonth);
  const lateDays = dayOfMonth - 20;

  const earlyDailyRate = earlyDays > 0 ? earlyTotal / earlyDays : 0;
  const lateDailyRate = lateDays > 0 ? lateTotal / lateDays : 0;

  const spikeRatio = earlyDailyRate > 0 ? lateDailyRate / earlyDailyRate : 0;

  if (spikeRatio < THRESHOLDS.END_OF_MONTH_SPIKE_RATIO) {
    return createNoDetection(existingConfidence, { reason: 'No spending spike' }, transactions.length);
  }

  const spikeScore = Math.min(1, (spikeRatio - 1) / 2);
  const volumeScore = Math.min(1, lateTxns.length / 10);
  const dayScore = Math.min(1, (dayOfMonth - 20) / 10);

  const rawConfidence = spikeScore * 0.50 + volumeScore * 0.30 + dayScore * 0.20;

  const smoothedConfidence = existingConfidence > 0
    ? existingConfidence * 0.6 + rawConfidence * 0.4
    : rawConfidence;

  return {
    detected: true,
    confidence: smoothedConfidence,
    signals: lateTxns.slice(-5).map(t => {
      const strength = Math.min(1, Math.abs(t.amount) / 50);
      const reason = `$${Math.abs(t.amount).toFixed(2)} on day ${new Date(t.transaction_date).getDate()}`;
      return {
        type: 'end_of_month_spend',
        strength,
        signal_strength: strength,
        timestamp: new Date(t.transaction_date),
        transactionId: t.id,
        transaction_id: t.id,
        reason,
        detection_reason: reason,
        time_context: 'end_of_month' as const,
        category_id: t.category_id || undefined,
      };
    }),
    metadata: {
      algorithm_version: '1.0.0',
      transactions_analyzed: transactions.length,
      run_timestamp: new Date().toISOString(),
      time_range_days: 30,
      spikeRatio,
      earlyTotal,
      lateTotal,
      dayOfMonth,
    },
  };
}

function createNoDetection(existingConfidence: number, extraMetadata: Record<string, unknown>, transactionCount: number = 0): DetectionResult {
  return {
    detected: false,
    confidence: Math.max(0, existingConfidence - THRESHOLDS.CONFIDENCE_DECAY_DAILY),
    signals: [],
    metadata: {
      algorithm_version: '1.0.0',
      transactions_analyzed: transactionCount,
      run_timestamp: new Date().toISOString(),
      time_range_days: 30,
      ...extraMetadata,
    },
  };
}

/**
 * FIX 6: Saving Habit Detection
 * Detects positive saving patterns - income > expenses consistently
 */
export function detectSavingHabit(transactions: TransactionWithCategory[]): SavingHabitResult {
  if (!transactions || transactions.length < 14) {
    return {
      hasSavingHabit: false,
      consistency: 0,
      averageSavingsRate: 0,
      trend: 'none',
      streakWeeks: 0,
      message: '',
    };
  }

  // Analyze last 4 weeks
  const now = new Date();
  const weeklyData: { income: number; expenses: number; netSavings: number }[] = [];

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    const weekTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= weekStart && date < weekEnd;
    });

    const income = weekTransactions
      .filter(t => t.amount > 0)  // Income is positive
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = weekTransactions
      .filter(t => t.amount < 0)  // Expenses are negative
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    weeklyData.push({
      income,
      expenses,
      netSavings: income - expenses,
    });
  }

  // Calculate consistency (how many weeks had positive savings)
  const weeksWithSavings = weeklyData.filter(w => w.netSavings > 0).length;
  const consistency = weeksWithSavings / 4;

  // Calculate average savings rate
  const totalIncome = weeklyData.reduce((sum, w) => sum + w.income, 0);
  const totalExpenses = weeklyData.reduce((sum, w) => sum + w.expenses, 0);
  const averageSavingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Calculate streak (consecutive weeks of savings)
  let streakWeeks = 0;
  for (const week of weeklyData) {
    if (week.netSavings > 0) {
      streakWeeks++;
    } else {
      break;
    }
  }

  // Determine trend (comparing recent vs older weeks)
  const recentWeeks = weeklyData.slice(0, 2);
  const olderWeeks = weeklyData.slice(2, 4);

  const recentAvg = recentWeeks.reduce((s, w) => s + w.netSavings, 0) / 2;
  const olderAvg = olderWeeks.reduce((s, w) => s + w.netSavings, 0) / 2;

  let trend: 'improving' | 'stable' | 'declining' | 'none' = 'none';
  if (olderAvg === 0 && recentAvg === 0) {
    trend = 'none';
  } else if (recentAvg > olderAvg * 1.1) {
    trend = 'improving';
  } else if (recentAvg < olderAvg * 0.9) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  // Determine if they have a saving habit (consistency >= 50% and positive average)
  const hasSavingHabit = consistency >= 0.5 && averageSavingsRate > 0;

  // Generate message
  let message = '';
  if (hasSavingHabit) {
    if (streakWeeks >= 4) {
      message = `Amazing! You've saved money for ${streakWeeks} weeks straight!`;
    } else if (streakWeeks >= 2) {
      message = `Great job! ${streakWeeks} weeks of saving in a row.`;
    } else if (consistency >= 0.75) {
      message = 'You have a strong saving habit. Keep it up!';
    } else {
      message = 'You\'re building a saving habit. Stay consistent!';
    }
  } else if (averageSavingsRate > 0) {
    message = 'You saved overall, but consistency could improve.';
  }

  return {
    hasSavingHabit,
    consistency,
    averageSavingsRate: Math.round(averageSavingsRate * 10) / 10,
    trend,
    streakWeeks,
    message,
  };
}

/**
 * FIX 8: Weekly/Monthly Trend Analysis
 * Analyzes spending trends over time
 */
export function analyzeTrends(transactions: TransactionWithCategory[]): TrendAnalysisResult {
  const noTrend: TrendAnalysisResult = {
    weeklyTrend: { direction: 'stable', percentChange: 0, weekOverWeekData: [] },
    monthlyTrend: { direction: 'stable', percentChange: 0, monthOverMonthData: [] },
    categoryTrends: [],
    insights: [],
  };

  if (!transactions || transactions.length < 7) {
    return noTrend;
  }

  const now = new Date();
  const expenses = transactions.filter(t => t.amount < 0);  // Expenses are negative

  // Weekly trend analysis (last 4 weeks)
  const weeklyData: { week: string; total: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    const weekTotal = expenses
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date >= weekStart && date < weekEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const weekLabel = `Week ${4 - i}`;
    weeklyData.unshift({ week: weekLabel, total: weekTotal });
  }

  // Calculate weekly trend
  const recentWeekTotal = weeklyData[weeklyData.length - 1]?.total || 0;
  const previousWeekTotal = weeklyData[weeklyData.length - 2]?.total || 0;
  const weeklyPercentChange = previousWeekTotal > 0
    ? Math.round(((recentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)
    : 0;
  const weeklyDirection = weeklyPercentChange > 10 ? 'up' : weeklyPercentChange < -10 ? 'down' : 'stable';

  // Monthly trend analysis (last 3 months)
  const monthlyData: { month: string; total: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthTotal = expenses
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthLabel = monthStart.toLocaleString('default', { month: 'short' });
    monthlyData.unshift({ month: monthLabel, total: monthTotal });
  }

  // Calculate monthly trend
  const recentMonthTotal = monthlyData[monthlyData.length - 1]?.total || 0;
  const previousMonthTotal = monthlyData[monthlyData.length - 2]?.total || 0;
  const monthlyPercentChange = previousMonthTotal > 0
    ? Math.round(((recentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
    : 0;
  const monthlyDirection = monthlyPercentChange > 10 ? 'up' : monthlyPercentChange < -10 ? 'down' : 'stable';

  // Category trends (last 2 weeks vs previous 2 weeks)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const recentByCategory: Record<string, number> = {};
  const olderByCategory: Record<string, number> = {};

  expenses.forEach(t => {
    const date = new Date(t.transaction_date);
    const category = t.category_id || 'uncategorized';

    if (date >= twoWeeksAgo) {
      recentByCategory[category] = (recentByCategory[category] || 0) + t.amount;
    } else if (date >= fourWeeksAgo) {
      olderByCategory[category] = (olderByCategory[category] || 0) + t.amount;
    }
  });

  const categoryTrends = Object.keys({ ...recentByCategory, ...olderByCategory })
    .map(category => {
      const recent = recentByCategory[category] || 0;
      const older = olderByCategory[category] || 0;
      const percentChange = older > 0 ? Math.round(((recent - older) / older) * 100) : (recent > 0 ? 100 : 0);
      const direction = percentChange > 20 ? 'up' : percentChange < -20 ? 'down' : 'stable';

      return { category, direction: direction as 'up' | 'down' | 'stable', percentChange };
    })
    .filter(ct => Math.abs(ct.percentChange) > 10) // Only significant changes
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 5); // Top 5 changes

  // Generate insights
  const insights: string[] = [];

  if (weeklyDirection === 'down' && weeklyPercentChange <= -20) {
    insights.push(`Great job! Spending down ${Math.abs(weeklyPercentChange)}% this week.`);
  } else if (weeklyDirection === 'up' && weeklyPercentChange >= 30) {
    insights.push(`Heads up: Spending up ${weeklyPercentChange}% this week.`);
  }

  if (monthlyDirection === 'down' && monthlyPercentChange <= -15) {
    insights.push(`Strong month! ${Math.abs(monthlyPercentChange)}% less than last month.`);
  } else if (monthlyDirection === 'up' && monthlyPercentChange >= 25) {
    insights.push(`This month's spending is ${monthlyPercentChange}% higher than usual.`);
  }

  categoryTrends.slice(0, 2).forEach(ct => {
    if (ct.direction === 'up') {
      insights.push(`${ct.category} spending up ${ct.percentChange}%.`);
    } else if (ct.direction === 'down') {
      insights.push(`${ct.category} spending down ${Math.abs(ct.percentChange)}%.`);
    }
  });

  return {
    weeklyTrend: {
      direction: weeklyDirection,
      percentChange: weeklyPercentChange,
      weekOverWeekData: weeklyData,
    },
    monthlyTrend: {
      direction: monthlyDirection,
      percentChange: monthlyPercentChange,
      monthOverMonthData: monthlyData,
    },
    categoryTrends,
    insights,
  };
}

// ============================================
// FIX #9: Confidence Ceiling
// ============================================

/**
 * Clamp confidence to prevent over-confidence
 * Soft ceiling at 0.95 to prevent 100% certainty
 */
export function clampConfidence(confidence: number): number {
  return Math.max(
    THRESHOLDS.CONFIDENCE_DECAY_MIN,
    Math.min(THRESHOLDS.CONFIDENCE_CEILING, confidence)
  );
}

// ============================================
// FIX #3: Seasonal Drift Detection
// ============================================

/**
 * Get current seasonal adjustment factor
 */
export function getSeasonalFactor(
  seasonalFactors: SeasonalFactors = DEFAULT_SEASONAL_FACTORS
): number {
  const now = new Date();
  const month = now.getMonth();
  const dayOfWeek = now.getDay();

  const monthFactor = seasonalFactors.monthly_factors[month] ?? 1.0;
  const dayFactor = seasonalFactors.day_of_week_factors[dayOfWeek] ?? 1.0;

  // Holiday period gets additional boost
  const holidayBoost = seasonalFactors.is_holiday_period ? 1.2 : 1.0;

  return monthFactor * dayFactor * holidayBoost;
}

/**
 * Apply seasonal adjustment to confidence score
 * Higher seasonal factor = less confident in detection (spending is expected)
 */
export function applySeasonalAdjustment(
  rawConfidence: number,
  seasonalFactors: SeasonalFactors = DEFAULT_SEASONAL_FACTORS
): number {
  const seasonalFactor = getSeasonalFactor(seasonalFactors);

  // If seasonal factor > 1.0, reduce confidence (spending is expected)
  // If seasonal factor < 1.0, increase confidence (spending is unusual)
  const adjustedConfidence = rawConfidence / seasonalFactor;

  return clampConfidence(adjustedConfidence);
}

/**
 * Calibrate seasonal factors based on historical data
 */
export function calibrateSeasonalFactors(
  transactions: TransactionWithCategory[],
  existingFactors: SeasonalFactors = DEFAULT_SEASONAL_FACTORS
): SeasonalFactors {
  if (transactions.length < 90) {
    // Not enough data to calibrate
    return existingFactors;
  }

  // Calculate actual spending patterns by month and day
  const monthlySpending: Record<number, number[]> = {};
  const dayOfWeekSpending: Record<number, number[]> = {};

  transactions.forEach(t => {
    if (t.amount >= 0) return; // Only expenses

    const date = new Date(t.transaction_date);
    const month = date.getMonth();
    const day = date.getDay();

    if (!monthlySpending[month]) monthlySpending[month] = [];
    if (!dayOfWeekSpending[day]) dayOfWeekSpending[day] = [];

    monthlySpending[month].push(Math.abs(t.amount));
    dayOfWeekSpending[day].push(Math.abs(t.amount));
  });

  // Calculate average spending per period
  const avgMonthly: Record<number, number> = {};
  const avgDayOfWeek: Record<number, number> = {};

  Object.entries(monthlySpending).forEach(([month, amounts]) => {
    avgMonthly[Number(month)] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  });

  Object.entries(dayOfWeekSpending).forEach(([day, amounts]) => {
    avgDayOfWeek[Number(day)] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  });

  // Calculate overall averages
  const overallMonthlyAvg = Object.values(avgMonthly).reduce((a, b) => a + b, 0) / Object.values(avgMonthly).length;
  const overallDayAvg = Object.values(avgDayOfWeek).reduce((a, b) => a + b, 0) / Object.values(avgDayOfWeek).length;

  // Create new factors relative to average
  const newMonthlyFactors: Record<number, number> = {};
  const newDayFactors: Record<number, number> = {};

  for (let m = 0; m < 12; m++) {
    newMonthlyFactors[m] = avgMonthly[m] ? avgMonthly[m] / overallMonthlyAvg : existingFactors.monthly_factors[m];
    // Clamp to reasonable range
    newMonthlyFactors[m] = Math.max(0.7, Math.min(1.5, newMonthlyFactors[m]));
  }

  for (let d = 0; d < 7; d++) {
    newDayFactors[d] = avgDayOfWeek[d] ? avgDayOfWeek[d] / overallDayAvg : existingFactors.day_of_week_factors[d];
    // Clamp to reasonable range
    newDayFactors[d] = Math.max(0.8, Math.min(1.4, newDayFactors[d]));
  }

  // Detect if we're in a holiday period (Nov 15 - Jan 5)
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const isHolidayPeriod = (month === 10 && day >= 15) || month === 11 || (month === 0 && day <= 5);

  return {
    monthly_factors: newMonthlyFactors,
    day_of_week_factors: newDayFactors,
    is_holiday_period: isHolidayPeriod,
    last_calibrated_at: new Date().toISOString(),
  };
}

/**
 * Run all detection with seasonal adjustment
 */
export function runAllDetectionWithSeasonal(
  transactions: TransactionWithCategory[],
  existingConfidences: { small_recurring: number; stress_spending: number; end_of_month: number },
  seasonalFactors: SeasonalFactors = DEFAULT_SEASONAL_FACTORS
): AllDetectionResults {
  const baseResults = runAllDetection(transactions, existingConfidences);

  // Apply seasonal adjustment and confidence ceiling to all results
  return {
    small_recurring: {
      ...baseResults.small_recurring,
      confidence: clampConfidence(
        applySeasonalAdjustment(baseResults.small_recurring.confidence, seasonalFactors)
      ),
    },
    stress_spending: {
      ...baseResults.stress_spending,
      confidence: clampConfidence(
        applySeasonalAdjustment(baseResults.stress_spending.confidence, seasonalFactors)
      ),
    },
    end_of_month: {
      ...baseResults.end_of_month,
      confidence: clampConfidence(
        applySeasonalAdjustment(baseResults.end_of_month.confidence, seasonalFactors)
      ),
    },
  };
}

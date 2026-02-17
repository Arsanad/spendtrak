/**
 * SpendTrak Behavioral Engine v2.0
 * Win Detection - Detects positive behavior changes
 */

import { THRESHOLDS, isComfortCategory, type BehaviorType } from '../config/behavioralConstants';
import { selectWinMessage } from '../config/interventionMessages';
import type { TransactionWithCategory } from '../types';
import type { UserBehavioralProfile, StreakBreakReason, StreakBreakEvent } from '../types/behavior';

export type WinType = 'pattern_break' | 'improvement' | 'streak_milestone' | 'silent_win';

export interface WinResult {
  hasWin: boolean;
  winType: WinType | null;
  message: string;
  shouldCelebrate: boolean;
  metadata?: Record<string, unknown>;
}

export interface RelapseResult {
  isRelapse: boolean;
  severity: 'mild' | 'moderate' | 'severe' | null;
  increasePercent: number;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function detectWin(
  userId: string,
  profile: UserBehavioralProfile,
  transactions: TransactionWithCategory[]
): Promise<WinResult> {
  // Safety check: ensure transactions is valid array
  if (!transactions || !Array.isArray(transactions)) {
    return noWin();
  }

  const activeBehavior = profile.active_behavior;
  if (!activeBehavior) return noWin();

  // 1. Pattern Break
  const patternBreak = await checkPatternBreak(profile, activeBehavior, transactions);
  if (patternBreak.hasWin) return patternBreak;

  // 2. Streak Milestone
  const streakWin = checkStreakMilestone(profile);
  if (streakWin.hasWin) return streakWin;

  // 3. Improvement
  const improvement = await checkImprovement(userId, activeBehavior, transactions);
  if (improvement.hasWin) return improvement;

  return noWin();
}

function checkStreakMilestone(profile: UserBehavioralProfile): WinResult {
  const streak = profile.current_streak || 0;
  if ((THRESHOLDS.WIN_STREAK_MILESTONES as readonly number[]).includes(streak)) {
    return {
      hasWin: true,
      winType: 'streak_milestone',
      message: selectWinMessage('streak_milestone', streak),
      shouldCelebrate: true,
      metadata: { streakDays: streak },
    };
  }
  return noWin();
}

async function checkImprovement(
  userId: string,
  behavior: BehaviorType,
  transactions: TransactionWithCategory[]
): Promise<WinResult> {
  // Safety check
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return noWin();
  }

  const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekCount = transactions.filter(t =>
    new Date(t.transaction_date) >= thisWeekStart && matchesBehavior(t, behavior)
  ).length;

  const lastWeekCount = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d >= lastWeekStart && d < thisWeekStart && matchesBehavior(t, behavior);
  }).length;

  if (lastWeekCount < 3) return noWin();

  const reduction = (lastWeekCount - thisWeekCount) / lastWeekCount;

  if (reduction >= THRESHOLDS.WIN_IMPROVEMENT_THRESHOLD) {
    return {
      hasWin: true,
      winType: 'improvement',
      message: selectWinMessage('improvement'),
      shouldCelebrate: true,
      metadata: { improvementPercentage: Math.round(reduction * 100) },
    };
  }

  if (reduction >= 0.1) {
    return { hasWin: true, winType: 'silent_win', message: '', shouldCelebrate: false };
  }

  return noWin();
}

function matchesBehavior(transaction: TransactionWithCategory, behavior: BehaviorType): boolean {
  switch (behavior) {
    case 'small_recurring':
      return transaction.amount <= THRESHOLDS.SMALL_TRANSACTION_MAX;
    case 'stress_spending': {
      const hour = new Date(transaction.transaction_date).getHours();
      const isStressTime = hour >= THRESHOLDS.STRESS_LATE_NIGHT_START || hour <= THRESHOLDS.STRESS_LATE_NIGHT_END ||
        (hour >= THRESHOLDS.STRESS_POST_WORK_START && hour <= THRESHOLDS.STRESS_POST_WORK_END);
      return isStressTime && isComfortCategory(transaction.category_id || '');
    }
    case 'end_of_month':
      return new Date(transaction.transaction_date).getDate() >= 21;
    default:
      return false;
  }
}

function noWin(): WinResult {
  return { hasWin: false, winType: null, message: '', shouldCelebrate: false };
}

async function checkPatternBreak(
  profile: UserBehavioralProfile,
  behavior: BehaviorType,
  transactions: TransactionWithCategory[]
): Promise<WinResult> {
  // Safety check - need at least 2 weeks of data
  if (!transactions || !Array.isArray(transactions) || transactions.length < 14) {
    return noWin();
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get transactions for each week
  const thisWeekTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= oneWeekAgo && t.amount < 0;
  });

  const lastWeekTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= twoWeeksAgo && date < oneWeekAgo && t.amount < 0;
  });

  // Count transactions matching the behavior pattern
  const thisWeekCount = thisWeekTransactions.filter(t => matchesBehavior(t, behavior)).length;
  const lastWeekCount = lastWeekTransactions.filter(t => matchesBehavior(t, behavior)).length;

  // Need meaningful data from last week (at least 3 pattern matches)
  if (lastWeekCount < 3) {
    return noWin();
  }

  // Calculate reduction percentage
  const reduction = (lastWeekCount - thisWeekCount) / lastWeekCount;

  // Pattern is considered "broken" if 50%+ reduction
  if (reduction >= 0.5) {
    const reductionPercent = Math.round(reduction * 100);
    const message = getPatternBreakMessage(behavior, reductionPercent);

    return {
      hasWin: true,
      winType: 'pattern_break',
      message,
      shouldCelebrate: true,
      metadata: {
        previousCount: lastWeekCount,
        currentCount: thisWeekCount,
        reductionPercent,
        behavior,
      },
    };
  }

  // 30-50% reduction is a silent win (progress noted but no celebration)
  if (reduction >= 0.3) {
    return {
      hasWin: true,
      winType: 'silent_win',
      message: '',
      shouldCelebrate: false,
      metadata: {
        previousCount: lastWeekCount,
        currentCount: thisWeekCount,
        reductionPercent: Math.round(reduction * 100),
      },
    };
  }

  return noWin();
}

/**
 * Get a celebratory message for pattern break
 */
function getPatternBreakMessage(behavior: BehaviorType, reductionPercent: number): string {
  const messages: Record<BehaviorType, string[]> = {
    small_recurring: [
      `${reductionPercent}% fewer small purchases this week!`,
      'Those little purchases are under control!',
      'Small wins add up - great job!',
    ],
    stress_spending: [
      `${reductionPercent}% less stress spending!`,
      'Managing stress without spending!',
      'Finding better ways to unwind!',
    ],
    end_of_month: [
      `${reductionPercent}% more controlled end-of-month!`,
      'Keeping it steady through month end!',
      'No more end-of-month splurge!',
    ],
  };

  const behaviorMessages = messages[behavior] || ['Breaking the pattern! Keep it up!'];
  return behaviorMessages[Math.floor(Math.random() * behaviorMessages.length)];
}

/**
 * Detect relapse - when user was improving but reverted to old behavior
 * @param profile User's behavioral profile
 * @param behavior The behavior being tracked
 * @param transactions Recent transactions to analyze
 * @returns RelapseResult indicating if a relapse occurred
 */
export function detectRelapse(
  profile: UserBehavioralProfile,
  behavior: BehaviorType,
  transactions: TransactionWithCategory[]
): RelapseResult {
  // Safety check - need sufficient data
  if (!transactions || !Array.isArray(transactions) || transactions.length < 14) {
    return noRelapse();
  }

  // Must have had a recent win to qualify for relapse
  const lastWinAt = profile.last_win_at;
  if (!lastWinAt) {
    return noRelapse();
  }

  const lastWinDate = new Date(lastWinAt);
  const daysSinceWin = Math.floor((Date.now() - lastWinDate.getTime()) / (24 * 60 * 60 * 1000));

  // Only check for relapse within 30 days of last win
  if (daysSinceWin > 30) {
    return noRelapse();
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get transactions for each week
  const thisWeekTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= oneWeekAgo && t.amount < 0;
  });

  const lastWeekTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date >= twoWeeksAgo && date < oneWeekAgo && t.amount < 0;
  });

  // Count transactions matching the behavior pattern
  const thisWeekCount = thisWeekTransactions.filter(t => matchesBehavior(t, behavior)).length;
  const lastWeekCount = lastWeekTransactions.filter(t => matchesBehavior(t, behavior)).length;

  // Need at least some data from last week
  if (lastWeekCount === 0 && thisWeekCount === 0) {
    return noRelapse();
  }

  // Calculate increase - relapse is when this week is significantly MORE than last week
  // (opposite of pattern break)
  let increasePercent = 0;
  if (lastWeekCount > 0) {
    increasePercent = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
  } else if (thisWeekCount >= 3) {
    // If last week was 0 but this week has 3+, that's a relapse
    increasePercent = 100;
  }

  // Determine severity
  // Mild: 30-50% increase
  // Moderate: 50-100% increase
  // Severe: >100% increase
  if (increasePercent >= 100) {
    return {
      isRelapse: true,
      severity: 'severe',
      increasePercent,
      message: getRelapseMessage(behavior, 'severe'),
      metadata: {
        previousCount: lastWeekCount,
        currentCount: thisWeekCount,
        increasePercent,
        daysSinceWin,
      },
    };
  }

  if (increasePercent >= 50) {
    return {
      isRelapse: true,
      severity: 'moderate',
      increasePercent,
      message: getRelapseMessage(behavior, 'moderate'),
      metadata: {
        previousCount: lastWeekCount,
        currentCount: thisWeekCount,
        increasePercent,
        daysSinceWin,
      },
    };
  }

  if (increasePercent >= 30) {
    return {
      isRelapse: true,
      severity: 'mild',
      increasePercent,
      message: getRelapseMessage(behavior, 'mild'),
      metadata: {
        previousCount: lastWeekCount,
        currentCount: thisWeekCount,
        increasePercent,
        daysSinceWin,
      },
    };
  }

  return noRelapse();
}

function noRelapse(): RelapseResult {
  return {
    isRelapse: false,
    severity: null,
    increasePercent: 0,
    message: '',
  };
}

/**
 * Get a supportive message for relapse (not punishing, encouraging)
 */
function getRelapseMessage(behavior: BehaviorType, severity: 'mild' | 'moderate' | 'severe'): string {
  const messages: Record<BehaviorType, Record<string, string[]>> = {
    small_recurring: {
      mild: [
        'A few extra small purchases crept in.',
        'Those little things are adding up again.',
      ],
      moderate: [
        'Small purchases are picking up again.',
        'Old habits are trying to return.',
      ],
      severe: [
        'Lots of small purchases this week.',
        'The pattern is back - you can break it again!',
      ],
    },
    stress_spending: {
      mild: [
        'A bit more comfort spending lately.',
        'Stress might be driving some purchases.',
      ],
      moderate: [
        'Stress spending is creeping back.',
        'Finding comfort in spending again?',
      ],
      severe: [
        'Stress spending is back in full swing.',
        'You beat this before, you can do it again!',
      ],
    },
    end_of_month: {
      mild: [
        'Month-end spending picked up a bit.',
        'End of month splurge starting.',
      ],
      moderate: [
        'Month-end pattern returning.',
        'The end-of-month habit is back.',
      ],
      severe: [
        'Big end-of-month spending this time.',
        'You controlled this before - try again!',
      ],
    },
  };

  const behaviorMessages = messages[behavior]?.[severity] || ['Old patterns are returning.'];
  return behaviorMessages[Math.floor(Math.random() * behaviorMessages.length)];
}

// ============================================
// FIX #7: STREAK BREAKING LOGIC
// ============================================

/**
 * Check if streak should be broken based on various conditions
 *
 * Streak Breaking Rules (DOCUMENTED):
 * 1. BEHAVIOR_RELAPSE: Moderate or severe relapse (50%+ increase) breaks streak
 * 2. INACTIVITY: No behavioral transactions for 7+ days breaks streak
 * 3. USER_RESET: Manual profile reset breaks streak
 * 4. SEVERE_REGRESSION: >100% increase in behavioral pattern breaks streak
 * 5. WITHDRAWAL_TRIGGERED: User triggered withdrawal state (too many dismissals)
 */
export function checkStreakBreak(
  profile: UserBehavioralProfile,
  transactions: TransactionWithCategory[],
  relapseResult?: RelapseResult
): StreakBreakEvent | null {
  // No streak to break
  if ((profile.current_streak || 0) === 0) {
    return null;
  }

  const now = new Date();
  const activeBehavior = profile.active_behavior;

  // Rule 1 & 4: Check relapse severity
  if (relapseResult?.isRelapse) {
    if (relapseResult.severity === 'severe') {
      return {
        broken_at: now.toISOString(),
        reason: 'severe_regression',
        streak_length: profile.current_streak,
        behavior_type: activeBehavior,
        metadata: {
          increasePercent: relapseResult.increasePercent,
          severity: relapseResult.severity,
        },
      };
    }
    if (relapseResult.severity === 'moderate') {
      return {
        broken_at: now.toISOString(),
        reason: 'behavior_relapse',
        streak_length: profile.current_streak,
        behavior_type: activeBehavior,
        metadata: {
          increasePercent: relapseResult.increasePercent,
          severity: relapseResult.severity,
        },
      };
    }
  }

  // Rule 2: Check inactivity
  if (activeBehavior && transactions.length > 0) {
    const lastBehavioralTransaction = transactions
      .filter(t => matchesBehavior(t, activeBehavior))
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];

    if (lastBehavioralTransaction) {
      const daysSinceLastBehavior = Math.floor(
        (now.getTime() - new Date(lastBehavioralTransaction.transaction_date).getTime()) /
        (24 * 60 * 60 * 1000)
      );

      if (daysSinceLastBehavior >= THRESHOLDS.STREAK_BREAK_INACTIVITY_DAYS) {
        return {
          broken_at: now.toISOString(),
          reason: 'inactivity',
          streak_length: profile.current_streak,
          behavior_type: activeBehavior,
          metadata: {
            daysSinceLastBehavior,
            threshold: THRESHOLDS.STREAK_BREAK_INACTIVITY_DAYS,
          },
        };
      }
    }
  }

  // Rule 5: Check withdrawal state
  if (profile.user_state === 'WITHDRAWN') {
    return {
      broken_at: now.toISOString(),
      reason: 'withdrawal_triggered',
      streak_length: profile.current_streak,
      behavior_type: activeBehavior,
      metadata: {
        ignored_count: profile.ignored_interventions,
        dismissed_count: profile.dismissed_count,
      },
    };
  }

  return null;
}

/**
 * Get message for streak break event
 */
export function getStreakBreakMessage(reason: StreakBreakReason, streakLength: number): string {
  const messages: Record<StreakBreakReason, string[]> = {
    behavior_relapse: [
      `${streakLength} day streak ended. Patterns returned.`,
      'Streak paused. Old habits crept back.',
    ],
    inactivity: [
      `${streakLength} day streak paused due to inactivity.`,
      'Streak reset. Been quiet lately.',
    ],
    user_reset: [
      'Profile reset. Fresh start.',
      'Starting over from zero.',
    ],
    severe_regression: [
      `${streakLength} day streak broken. Significant regression.`,
      'Big step back. You can rebuild.',
    ],
    withdrawal_triggered: [
      'Taking a break from feedback.',
      'Stepping back for now.',
    ],
  };

  const pool = messages[reason] || ['Streak ended.'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Detect win with streak break checking
 */
export async function detectWinWithStreakCheck(
  userId: string,
  profile: UserBehavioralProfile,
  transactions: TransactionWithCategory[]
): Promise<{ winResult: WinResult; streakBreak: StreakBreakEvent | null }> {
  // First check for relapse
  const relapseResult = profile.active_behavior
    ? detectRelapse(profile, profile.active_behavior, transactions)
    : noRelapse();

  // Check if streak should break
  const streakBreak = checkStreakBreak(profile, transactions, relapseResult);

  // Then check for wins
  const winResult = await detectWin(userId, profile, transactions);

  return { winResult, streakBreak };
}

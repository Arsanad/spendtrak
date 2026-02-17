/**
 * Win Detection Service Tests
 * Tests for detecting positive behavior changes
 */

import { detectWin, detectRelapse } from '../winDetection';
import type { TransactionWithCategory } from '../../types';
import type { UserBehavioralProfile } from '../../types/behavior';

// Mock behavioral constants
jest.mock('../../config/behavioralConstants', () => ({
  THRESHOLDS: {
    SMALL_TRANSACTION_MAX: 25,
    STRESS_LATE_NIGHT_START: 22,
    STRESS_LATE_NIGHT_END: 4,
    STRESS_POST_WORK_START: 17,
    STRESS_POST_WORK_END: 20,
    WIN_STREAK_MILESTONES: [3, 7, 14, 30],
    WIN_IMPROVEMENT_THRESHOLD: 0.3,
  },
  isComfortCategory: jest.fn((categoryId: string) =>
    ['food', 'entertainment', 'shopping'].includes(categoryId)
  ),
}));

// Mock intervention messages
jest.mock('../../config/interventionMessages', () => ({
  selectWinMessage: jest.fn((type: string, data?: any) => {
    if (type === 'streak_milestone') return `${data} day streak!`;
    if (type === 'improvement') return 'Great improvement!';
    return 'You did great!';
  }),
}));

// Helper to create mock transactions
function createTransaction(
  id: string,
  amount: number,
  categoryId: string,
  daysAgo: number = 0,
  hour: number = 12
): TransactionWithCategory {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);

  return {
    id,
    amount: -Math.abs(amount),
    category_id: categoryId,
    transaction_date: date.toISOString(),
    type: 'expense',
    description: `Test transaction ${id}`,
    user_id: 'test-user',
    created_at: date.toISOString(),
    updated_at: date.toISOString(),
  } as unknown as TransactionWithCategory;
}

function createProfile(overrides: Partial<UserBehavioralProfile> = {}): UserBehavioralProfile {
  return {
    id: 'profile-1',
    user_id: 'user-1',
    user_state: 'FOCUSED',
    active_behavior: 'small_recurring',
    active_behavior_intensity: 0,
    state_changed_at: new Date().toISOString(),
    confidence_small_recurring: 0.8,
    confidence_stress_spending: 0,
    confidence_end_of_month: 0,
    last_detected_small_recurring: null,
    last_detected_stress_spending: null,
    last_detected_end_of_month: null,
    last_intervention_at: null,
    cooldown_ends_at: null,
    withdrawal_ends_at: null,
    interventions_today: 0,
    interventions_this_week: 0,
    last_intervention_reset: new Date().toISOString(),
    ignored_interventions: 0,
    dismissed_count: 0,
    total_wins: 0,
    current_streak: 0,
    longest_streak: 0,
    last_win_at: null,
    budget_adherence_early_month: 0,
    budget_adherence_current: 0,
    intervention_enabled: true,
    last_evaluated_at: null,
    evaluation_count: 0,
    confidence_history: [],
    seasonal_factors: { monthly_factors: {}, day_of_week_factors: {}, is_holiday_period: false, last_calibrated_at: null },
    streak_broken_at: null,
    streak_break_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('winDetection', () => {
  describe('detectWin', () => {
    it('should return no win with null/undefined transactions', async () => {
      const profile = createProfile();

      const result = await detectWin('user-1', profile, null as any);

      expect(result.hasWin).toBe(false);
    });

    it('should return no win with empty transactions', async () => {
      const profile = createProfile();

      const result = await detectWin('user-1', profile, []);

      expect(result.hasWin).toBe(false);
    });

    it('should return no win when no active behavior', async () => {
      const profile = createProfile({ active_behavior: null });
      const transactions = [createTransaction('1', 10, 'food', 1)];

      const result = await detectWin('user-1', profile, transactions);

      expect(result.hasWin).toBe(false);
    });

    it('should detect streak milestone win', async () => {
      const profile = createProfile({ current_streak: 7 });
      const transactions = [createTransaction('1', 10, 'food', 1)];

      const result = await detectWin('user-1', profile, transactions);

      expect(result.hasWin).toBe(true);
      expect(result.winType).toBe('streak_milestone');
      expect(result.shouldCelebrate).toBe(true);
    });

    it('should detect pattern break win', async () => {
      const profile = createProfile({ active_behavior: 'small_recurring' });

      // Last week: lots of small purchases
      const lastWeekTransactions = Array.from({ length: 10 }, (_, i) =>
        createTransaction(`last-${i}`, 10, 'coffee', 10 + i)
      );

      // This week: very few
      const thisWeekTransactions = [
        createTransaction('this-1', 10, 'coffee', 1),
      ];

      const result = await detectWin('user-1', profile, [
        ...thisWeekTransactions,
        ...lastWeekTransactions,
      ]);

      // Should detect pattern break (50%+ reduction)
      expect(result.hasWin).toBe(true);
    });
  });

  describe('detectRelapse', () => {
    it('should return no relapse with insufficient data', () => {
      const profile = createProfile();
      const transactions: TransactionWithCategory[] = [];

      const result = detectRelapse(profile, 'small_recurring', transactions);

      expect(result.isRelapse).toBe(false);
    });

    it('should return no relapse when no previous win', () => {
      const profile = createProfile({ last_win_at: null });
      const transactions = Array.from({ length: 20 }, (_, i) =>
        createTransaction(`txn-${i}`, 10, 'food', i)
      );

      const result = detectRelapse(profile, 'small_recurring', transactions);

      expect(result.isRelapse).toBe(false);
    });

    it('should return no relapse when win was too long ago', () => {
      const oldWinDate = new Date();
      oldWinDate.setDate(oldWinDate.getDate() - 45); // 45 days ago

      const profile = createProfile({ last_win_at: oldWinDate.toISOString() });
      const transactions = Array.from({ length: 20 }, (_, i) =>
        createTransaction(`txn-${i}`, 10, 'food', i)
      );

      const result = detectRelapse(profile, 'small_recurring', transactions);

      expect(result.isRelapse).toBe(false);
    });

    it('should detect mild relapse (30-50% increase)', () => {
      const recentWinDate = new Date();
      recentWinDate.setDate(recentWinDate.getDate() - 5);

      const profile = createProfile({ last_win_at: recentWinDate.toISOString() });

      // Last week: 5 small purchases
      const lastWeekTransactions = Array.from({ length: 5 }, (_, i) =>
        createTransaction(`last-${i}`, 10, 'coffee', 10 + i)
      );

      // This week: 7 small purchases (40% increase)
      const thisWeekTransactions = Array.from({ length: 7 }, (_, i) =>
        createTransaction(`this-${i}`, 10, 'coffee', i)
      );

      const result = detectRelapse(profile, 'small_recurring', [
        ...thisWeekTransactions,
        ...lastWeekTransactions,
      ]);

      expect(result.isRelapse).toBe(true);
      expect(result.severity).toBe('mild');
    });

    it('should detect moderate relapse (50-100% increase)', () => {
      const recentWinDate = new Date();
      recentWinDate.setDate(recentWinDate.getDate() - 5);

      const profile = createProfile({ last_win_at: recentWinDate.toISOString() });

      // Last week: 4 small purchases
      const lastWeekTransactions = Array.from({ length: 4 }, (_, i) =>
        createTransaction(`last-${i}`, 10, 'coffee', 10 + i)
      );

      // This week: 7 small purchases (75% increase)
      const thisWeekTransactions = Array.from({ length: 7 }, (_, i) =>
        createTransaction(`this-${i}`, 10, 'coffee', i)
      );

      const result = detectRelapse(profile, 'small_recurring', [
        ...thisWeekTransactions,
        ...lastWeekTransactions,
      ]);

      expect(result.isRelapse).toBe(true);
      expect(result.severity).toBe('moderate');
    });

    it('should detect severe relapse (>100% increase)', () => {
      const recentWinDate = new Date();
      recentWinDate.setDate(recentWinDate.getDate() - 5);

      const profile = createProfile({ last_win_at: recentWinDate.toISOString() });

      // Last week: 3 small purchases
      const lastWeekTransactions = Array.from({ length: 3 }, (_, i) =>
        createTransaction(`last-${i}`, 10, 'coffee', 10 + i)
      );

      // This week: 10 small purchases (233% increase)
      const thisWeekTransactions = Array.from({ length: 10 }, (_, i) =>
        createTransaction(`this-${i}`, 10, 'coffee', i)
      );

      const result = detectRelapse(profile, 'small_recurring', [
        ...thisWeekTransactions,
        ...lastWeekTransactions,
      ]);

      expect(result.isRelapse).toBe(true);
      expect(result.severity).toBe('severe');
    });

    it('should return supportive message on relapse', () => {
      const recentWinDate = new Date();
      recentWinDate.setDate(recentWinDate.getDate() - 5);

      const profile = createProfile({ last_win_at: recentWinDate.toISOString() });

      const lastWeekTransactions = Array.from({ length: 3 }, (_, i) =>
        createTransaction(`last-${i}`, 10, 'coffee', 10 + i)
      );

      const thisWeekTransactions = Array.from({ length: 10 }, (_, i) =>
        createTransaction(`this-${i}`, 10, 'coffee', i)
      );

      const result = detectRelapse(profile, 'small_recurring', [
        ...thisWeekTransactions,
        ...lastWeekTransactions,
      ]);

      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});

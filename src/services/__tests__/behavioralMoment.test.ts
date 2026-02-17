/**
 * Behavioral Moment Service Tests
 * Tests for detecting behavioral moments (autopilot mode)
 */

import { detectBehavioralMoment } from '../behavioralMoment';
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
    END_OF_MONTH_START_DAY: 21,
  },
  isComfortCategory: jest.fn((categoryId: string) =>
    ['food', 'entertainment', 'shopping'].includes(categoryId)
  ),
}));

// Mock winDetection
jest.mock('../winDetection', () => ({
  detectRelapse: jest.fn().mockReturnValue({
    isRelapse: false,
    severity: null,
    increasePercent: 0,
    message: '',
  }),
}));

// Helper to create mock transaction
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
    budget_adherence_early_month: 0.9,
    budget_adherence_current: 0.85,
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

describe('behavioralMoment', () => {
  describe('detectBehavioralMoment', () => {
    it('should return not a moment when no active behavior', () => {
      const transaction = createTransaction('1', 10, 'food');
      const profile = createProfile({ active_behavior: null });

      const result = detectBehavioralMoment(transaction, profile, []);

      expect(result.isBehavioralMoment).toBe(false);
      expect(result.reason).toBe('No active behavior');
    });

    describe('small_recurring behavior', () => {
      it('should detect repeat purchase moment', () => {
        const transaction = createTransaction('new', 10, 'coffee', 0, 10);
        const profile = createProfile({ active_behavior: 'small_recurring' });
        const recentTransactions = [
          createTransaction('1', 8, 'coffee', 1, 9),
          createTransaction('2', 12, 'coffee', 2, 11),
          createTransaction('3', 10, 'coffee', 3, 10),
        ];

        const result = detectBehavioralMoment(transaction, profile, recentTransactions);

        expect(result.isBehavioralMoment).toBe(true);
        expect(['REPEAT_PURCHASE', 'HABITUAL_TIME']).toContain(result.momentType);
      });

      it('should detect habitual time moment', () => {
        const transaction = createTransaction('new', 10, 'coffee', 0, 8);
        const profile = createProfile({ active_behavior: 'small_recurring' });
        const recentTransactions = [
          createTransaction('1', 8, 'coffee', 1, 8),
          createTransaction('2', 12, 'coffee', 2, 8),
          createTransaction('3', 10, 'coffee', 3, 8),
        ];

        const result = detectBehavioralMoment(transaction, profile, recentTransactions);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('HABITUAL_TIME');
        expect(result.confidence).toBe(0.9);
      });

      it('should not detect moment for large transactions', () => {
        const transaction = createTransaction('1', 100, 'food', 0);
        const profile = createProfile({ active_behavior: 'small_recurring' });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(false);
        expect(result.reason).toBe('Transaction too large');
      });

      it('should not detect moment with insufficient history', () => {
        const transaction = createTransaction('1', 10, 'coffee', 0);
        const profile = createProfile({ active_behavior: 'small_recurring' });
        const recentTransactions = [
          createTransaction('2', 10, 'coffee', 1),
        ];

        const result = detectBehavioralMoment(transaction, profile, recentTransactions);

        expect(result.isBehavioralMoment).toBe(false);
        expect(result.reason).toBe('Not enough previous transactions');
      });
    });

    describe('stress_spending behavior', () => {
      it('should detect late night comfort spending', () => {
        const transaction = createTransaction('1', 15, 'food', 0, 23);
        const profile = createProfile({ active_behavior: 'stress_spending' });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('LATE_NIGHT_COMFORT');
      });

      it('should detect post-work comfort spending', () => {
        const transaction = createTransaction('1', 15, 'entertainment', 0, 18);
        const profile = createProfile({ active_behavior: 'stress_spending' });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('POST_WORK_RELEASE');
      });

      it('should detect stress cluster', () => {
        const transaction = createTransaction('new', 15, 'food', 0, 23);
        const profile = createProfile({ active_behavior: 'stress_spending' });

        // Create recent cluster (within 2 hours)
        const now = new Date();
        const recentTransaction: TransactionWithCategory = {
          id: 'recent',
          amount: -20,
          category_id: 'food',
          transaction_date: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          type: 'expense',
          description: 'Recent',
          user_id: 'test-user',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        } as unknown as TransactionWithCategory;

        const result = detectBehavioralMoment(transaction, profile, [recentTransaction]);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('STRESS_CLUSTER');
        expect(result.confidence).toBe(0.95);
      });

      it('should not detect moment for non-comfort categories', () => {
        const transaction = createTransaction('1', 50, 'utilities', 0, 23);
        const profile = createProfile({ active_behavior: 'stress_spending' });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(false);
        expect(result.reason).toBe('Not a comfort category');
      });

      it('should not detect moment during daytime', () => {
        const transaction = createTransaction('1', 15, 'food', 0, 12);
        const profile = createProfile({ active_behavior: 'stress_spending' });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(false);
        expect(result.reason).toBe('Not in stress time window');
      });
    });

    describe('end_of_month behavior', () => {
      it('should detect first breach after adherence', () => {
        // Create transaction on day 25
        const date = new Date();
        date.setDate(25);
        const transaction: TransactionWithCategory = {
          id: '1',
          amount: -100,
          category_id: 'shopping',
          transaction_date: date.toISOString(),
          type: 'expense',
          description: 'Test',
          user_id: 'test-user',
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
        } as unknown as TransactionWithCategory;

        const profile = createProfile({
          active_behavior: 'end_of_month',
          budget_adherence_early_month: 0.9,
          budget_adherence_current: 0.6,
        });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('FIRST_BREACH');
      });

      it('should detect collapse start', () => {
        const date = new Date();
        date.setDate(25);
        const transaction: TransactionWithCategory = {
          id: '1',
          amount: -100,
          category_id: 'shopping',
          transaction_date: date.toISOString(),
          type: 'expense',
          description: 'Test',
          user_id: 'test-user',
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
        } as unknown as TransactionWithCategory;

        const profile = createProfile({
          active_behavior: 'end_of_month',
          budget_adherence_early_month: 0.5,
          budget_adherence_current: 0.4,
        });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('COLLAPSE_START');
      });

      it('should not detect moment early in month', () => {
        const date = new Date();
        date.setDate(10);
        const transaction: TransactionWithCategory = {
          id: '1',
          amount: -100,
          category_id: 'shopping',
          transaction_date: date.toISOString(),
          type: 'expense',
          description: 'Test',
          user_id: 'test-user',
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
        } as unknown as TransactionWithCategory;

        const profile = createProfile({ active_behavior: 'end_of_month' });

        const result = detectBehavioralMoment(transaction, profile, []);

        expect(result.isBehavioralMoment).toBe(false);
        expect(result.reason).toBe('Not end of month period');
      });
    });

    describe('relapse detection priority', () => {
      it('should prioritize relapse detection', () => {
        const { detectRelapse } = require('../winDetection');
        detectRelapse.mockReturnValueOnce({
          isRelapse: true,
          severity: 'severe',
          increasePercent: 150,
          message: 'Severe relapse detected',
        });

        const transaction = createTransaction('1', 10, 'coffee', 0);
        const profile = createProfile();
        const recentTransactions = Array.from({ length: 20 }, (_, i) =>
          createTransaction(`${i}`, 10, 'coffee', i)
        );

        const result = detectBehavioralMoment(transaction, profile, recentTransactions);

        expect(result.isBehavioralMoment).toBe(true);
        expect(result.momentType).toBe('RELAPSE_AFTER_IMPROVEMENT');
        expect(result.confidence).toBe(0.95);
      });

      it('should not trigger for mild relapses', () => {
        const { detectRelapse } = require('../winDetection');
        detectRelapse.mockReturnValueOnce({
          isRelapse: true,
          severity: 'mild',
          increasePercent: 35,
          message: 'Mild relapse',
        });

        const transaction = createTransaction('new', 10, 'coffee', 0, 10);
        const profile = createProfile();
        const recentTransactions = [
          createTransaction('1', 10, 'coffee', 1, 9),
          createTransaction('2', 10, 'coffee', 2, 10),
          createTransaction('3', 10, 'coffee', 3, 10),
        ];

        const result = detectBehavioralMoment(transaction, profile, recentTransactions);

        // Should fall through to regular detection
        expect(result.momentType).not.toBe('RELAPSE_AFTER_IMPROVEMENT');
      });
    });
  });
});

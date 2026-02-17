/**
 * Detection Service Tests
 * Tests for behavioral pattern detection
 */

import {
  runAllDetection,
  detectSmallRecurring,
  detectStressSpending,
  detectEndOfMonthCollapse,
  detectSavingHabit,
  analyzeTrends,
} from '../detection';
import type { TransactionWithCategory } from '../../types';

// Mock behavioral constants
jest.mock('../../config/behavioralConstants', () => ({
  THRESHOLDS: {
    SMALL_RECURRING_DAYS: 30,
    SMALL_TRANSACTION_MAX: 25,
    SMALL_RECURRING_MIN_COUNT: 5,
    SMALL_RECURRING_CATEGORY_MIN: 3,
    CONFIDENCE_SMOOTHING_FACTOR: 0.7,
    CONFIDENCE_DECAY_DAILY: 0.01,
    STRESS_LOOKBACK_DAYS: 14,
    STRESS_LATE_NIGHT_START: 22,
    STRESS_LATE_NIGHT_END: 4,
    STRESS_POST_WORK_START: 17,
    STRESS_POST_WORK_END: 20,
    STRESS_MIN_OCCURRENCES: 2,
    STRESS_CLUSTER_WINDOW_HOURS: 3,
    END_OF_MONTH_START_DAY: 21,
    END_OF_MONTH_SPIKE_RATIO: 1.5,
  },
  isComfortCategory: jest.fn((categoryId: string) =>
    ['food', 'entertainment', 'shopping'].includes(categoryId)
  ),
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
    amount: -Math.abs(amount), // Expenses are negative
    category_id: categoryId,
    transaction_date: date.toISOString(),
    type: 'expense',
    description: `Test transaction ${id}`,
    user_id: 'test-user',
    created_at: date.toISOString(),
    updated_at: date.toISOString(),
  } as unknown as TransactionWithCategory;
}

describe('detection', () => {
  describe('runAllDetection', () => {
    it('should run all detection algorithms', () => {
      const transactions: TransactionWithCategory[] = [];
      const existingConfidences = {
        small_recurring: 0,
        stress_spending: 0,
        end_of_month: 0,
      };

      const results = runAllDetection(transactions, existingConfidences);

      expect(results).toHaveProperty('small_recurring');
      expect(results).toHaveProperty('stress_spending');
      expect(results).toHaveProperty('end_of_month');
    });
  });

  describe('detectSmallRecurring', () => {
    it('should detect no pattern with insufficient transactions', () => {
      const transactions = [
        createTransaction('1', 5, 'food', 1),
        createTransaction('2', 7, 'food', 2),
      ];

      const result = detectSmallRecurring(transactions, 0);

      expect(result.detected).toBe(false);
      expect(result.metadata.reason).toBe('Not enough small transactions');
    });

    it('should detect pattern with frequent small purchases', () => {
      const transactions = [
        createTransaction('1', 5, 'coffee', 1, 8),
        createTransaction('2', 5, 'coffee', 2, 8),
        createTransaction('3', 6, 'coffee', 3, 9),
        createTransaction('4', 5, 'coffee', 4, 8),
        createTransaction('5', 7, 'coffee', 5, 8),
        createTransaction('6', 5, 'coffee', 6, 8),
      ];

      const result = detectSmallRecurring(transactions, 0);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.signals.length).toBeGreaterThan(0);
    });

    it('should not detect large transactions', () => {
      const transactions = [
        createTransaction('1', 50, 'food', 1),
        createTransaction('2', 75, 'food', 2),
        createTransaction('3', 100, 'food', 3),
      ];

      const result = detectSmallRecurring(transactions, 0);

      expect(result.detected).toBe(false);
    });

    it('should use confidence smoothing when existing confidence exists', () => {
      const transactions = [
        createTransaction('1', 5, 'coffee', 1),
        createTransaction('2', 5, 'coffee', 2),
        createTransaction('3', 5, 'coffee', 3),
        createTransaction('4', 5, 'coffee', 4),
        createTransaction('5', 5, 'coffee', 5),
        createTransaction('6', 5, 'coffee', 6),
      ];

      const result = detectSmallRecurring(transactions, 0.8);

      // Confidence should be smoothed between old and new
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('detectStressSpending', () => {
    it('should not detect stress spending without comfort categories', () => {
      const transactions = [
        createTransaction('1', 50, 'utilities', 1, 23),
        createTransaction('2', 30, 'utilities', 2, 23),
      ];

      const result = detectStressSpending(transactions, 0);

      expect(result.detected).toBe(false);
    });

    it('should detect late night comfort spending', () => {
      const transactions = [
        createTransaction('1', 15, 'food', 1, 23),
        createTransaction('2', 12, 'food', 2, 23),
        createTransaction('3', 20, 'entertainment', 3, 0),
      ];

      const result = detectStressSpending(transactions, 0);

      expect(result.detected).toBe(true);
      expect(result.signals.some(s => s.type === 'late_night_comfort')).toBe(true);
    });

    it('should detect post-work comfort spending', () => {
      const transactions = [
        createTransaction('1', 15, 'food', 1, 18),
        createTransaction('2', 12, 'shopping', 2, 17),
        createTransaction('3', 20, 'entertainment', 3, 19),
      ];

      const result = detectStressSpending(transactions, 0);

      expect(result.detected).toBe(true);
      expect(result.signals.some(s => s.type === 'post_work_comfort')).toBe(true);
    });
  });

  describe('detectEndOfMonthCollapse', () => {
    it('should not detect before end of month period', () => {
      // Mock Date to be early in the month
      const mockDate = new Date();
      mockDate.setDate(10);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const transactions: TransactionWithCategory[] = [];

      const result = detectEndOfMonthCollapse(transactions, 0);

      expect(result.detected).toBe(false);

      jest.restoreAllMocks();
    });
  });

  describe('detectSavingHabit', () => {
    it('should return no habit with insufficient data', () => {
      const transactions: TransactionWithCategory[] = [];

      const result = detectSavingHabit(transactions);

      expect(result.hasSavingHabit).toBe(false);
      expect(result.consistency).toBe(0);
    });

    it('should detect consistent saving habit', () => {
      const transactions: TransactionWithCategory[] = [];

      // Create 4 weeks of data with income > expenses
      for (let week = 0; week < 4; week++) {
        // Add income
        transactions.push({
          id: `income-${week}`,
          amount: 1000, // Positive = income
          category_id: 'salary',
          transaction_date: new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'income',
          description: 'Salary',
          user_id: 'test-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as TransactionWithCategory);

        // Add expenses less than income
        transactions.push({
          id: `expense-${week}`,
          amount: -600, // Negative = expense
          category_id: 'bills',
          transaction_date: new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'expense',
          description: 'Bills',
          user_id: 'test-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as TransactionWithCategory);
      }

      const result = detectSavingHabit(transactions);

      expect(result.hasSavingHabit).toBe(true);
      expect(result.consistency).toBeGreaterThan(0);
      expect(result.averageSavingsRate).toBeGreaterThan(0);
    });
  });

  describe('analyzeTrends', () => {
    it('should return empty trends with insufficient data', () => {
      const transactions: TransactionWithCategory[] = [];

      const result = analyzeTrends(transactions);

      expect(result.weeklyTrend.weekOverWeekData).toHaveLength(0);
    });

    it('should analyze weekly and monthly trends', () => {
      const transactions: TransactionWithCategory[] = [];

      // Create 4 weeks of expense data
      for (let day = 0; day < 30; day++) {
        transactions.push(createTransaction(`txn-${day}`, 50, 'food', day));
      }

      const result = analyzeTrends(transactions);

      expect(result.weeklyTrend).toBeDefined();
      expect(result.monthlyTrend).toBeDefined();
      expect(result.categoryTrends).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });
  });
});

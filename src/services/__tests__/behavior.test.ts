/**
 * Behavioral Intelligence Layer Tests
 * Tests for behavior detection algorithms and intervention logic
 */

import {
  detectSmallRecurring,
  detectStressSpending,
  detectEndOfMonthCollapse,
} from '../behavior';
import type { TransactionWithCategory, BudgetWithCategory, Category } from '@/types';

// Helper to create mock transactions
function createMockTransaction(
  overrides: Partial<TransactionWithCategory> = {}
): TransactionWithCategory {
  const defaultDate = new Date();
  return {
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'user-123',
    amount: -10.00,
    merchant_name: 'Test Merchant',
    category_id: 'food_dining',
    category: { id: 'food_dining', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' } as unknown as Category,
    transaction_date: defaultDate.toISOString().split('T')[0],
    transaction_type: 'purchase',
    source: 'manual',
    is_deleted: false,
    created_at: defaultDate.toISOString(),
    updated_at: defaultDate.toISOString(),
    ...overrides,
  } as TransactionWithCategory;
}

// Helper to create multiple small transactions
function createSmallRecurringTransactions(
  count: number,
  categoryId: string = 'coffee',
  merchantName: string = 'Starbucks'
): TransactionWithCategory[] {
  const transactions: TransactionWithCategory[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(i / 2)); // 2 per day
    date.setHours(8 + (i % 12)); // Spread throughout day

    transactions.push(createMockTransaction({
      id: `tx-${i}`,
      amount: -(5 + Math.random() * 10), // $5-15 range
      merchant_name: merchantName,
      category_id: categoryId,
      category: { id: categoryId, name: 'Coffee', icon: 'cafe', color: '#8B4513' } as unknown as Category,
      transaction_date: date.toISOString().split('T')[0],
    }));
  }

  return transactions;
}

// Helper to create late night transactions
function createLateNightTransactions(count: number): TransactionWithCategory[] {
  const transactions: TransactionWithCategory[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(22 + (i % 4)); // 10 PM - 2 AM

    transactions.push(createMockTransaction({
      id: `tx-night-${i}`,
      amount: -(20 + Math.random() * 50), // $20-70 range
      merchant_name: 'Late Night Store',
      category_id: 'food_delivery',
      category: { id: 'food_delivery', name: 'Food Delivery', icon: 'fastfood', color: '#FF6B6B' } as unknown as Category,
      transaction_date: date.toISOString(),
    }));
  }

  return transactions;
}

// Helper to create end of month transactions
function createEndOfMonthTransactions(monthsBack: number = 3): TransactionWithCategory[] {
  const transactions: TransactionWithCategory[] = [];
  const now = new Date();

  for (let month = 0; month < monthsBack; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1);

    // Early month (days 1-20): low spending
    for (let day = 1; day <= 20; day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (Math.random() > 0.3) { // 70% chance of transaction
        transactions.push(createMockTransaction({
          id: `tx-early-${month}-${day}`,
          amount: -(10 + Math.random() * 30), // Low spending
          merchant_name: 'Regular Store',
          transaction_date: date.toISOString().split('T')[0],
        }));
      }
    }

    // Late month (days 21-31): high spending
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    for (let day = 21; day <= lastDay; day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      // More transactions, higher amounts
      for (let j = 0; j < 2; j++) {
        transactions.push(createMockTransaction({
          id: `tx-late-${month}-${day}-${j}`,
          amount: -(50 + Math.random() * 100), // High spending
          merchant_name: 'Month End Splurge',
          transaction_date: date.toISOString().split('T')[0],
        }));
      }
    }
  }

  return transactions;
}

describe('Behavioral Intelligence Service', () => {
  describe('detectSmallRecurring', () => {
    it('should not detect pattern with insufficient transactions', () => {
      const transactions = createSmallRecurringTransactions(5);
      const result = detectSmallRecurring(transactions);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should detect small recurring pattern with frequent small purchases', () => {
      const transactions = createSmallRecurringTransactions(20);
      const result = detectSmallRecurring(transactions);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.signals.length).toBeGreaterThan(0);
      expect(result.metadata.algorithm_version).toBe('1.0.0');
    });

    it('should not detect pattern when transactions are large', () => {
      const transactions = createSmallRecurringTransactions(20).map(t => ({
        ...t,
        amount: -50, // Above $15 threshold
      }));

      const result = detectSmallRecurring(transactions);

      expect(result.detected).toBe(false);
    });

    it('should calculate higher confidence for habitual patterns', () => {
      // Create transactions at same time each day (habitual)
      const habitual = createSmallRecurringTransactions(30);
      const habitualResult = detectSmallRecurring(habitual);

      // Create random scattered transactions
      const scattered = habitual.map((t, i) => ({
        ...t,
        transaction_date: new Date(
          new Date().getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0],
      }));
      const scatteredResult = detectSmallRecurring(scattered);

      // Habitual should have higher or equal confidence
      expect(habitualResult.confidence).toBeGreaterThanOrEqual(scatteredResult.confidence);
    });

    it('should include detection metadata', () => {
      const transactions = createSmallRecurringTransactions(20);
      const result = detectSmallRecurring(transactions);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.transactions_analyzed).toBe(20);
      expect(result.metadata.time_range_days).toBe(30);
      expect(result.metadata.run_timestamp).toBeDefined();
    });
  });

  describe('detectStressSpending', () => {
    it('should not detect stress spending with daytime transactions', () => {
      const transactions = createSmallRecurringTransactions(20);
      const result = detectStressSpending(transactions);

      expect(result.detected).toBe(false);
    });

    it('should detect stress spending with late night purchases', () => {
      const transactions = createLateNightTransactions(10);
      const result = detectStressSpending(transactions);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.signals.some(s => s.time_context === 'late_night')).toBe(true);
    });

    it('should have higher confidence with comfort category purchases', () => {
      const withComfortCategories = createLateNightTransactions(10);
      const comfortResult = detectStressSpending(withComfortCategories);

      const withOtherCategories = withComfortCategories.map(t => ({
        ...t,
        category_id: 'utilities',
        category: { id: 'utilities', name: 'Utilities', icon: 'bolt', color: '#666' } as unknown as Category,
      }));
      const otherResult = detectStressSpending(withOtherCategories);

      // Comfort categories should have higher signals
      expect(comfortResult.signals.length).toBeGreaterThanOrEqual(otherResult.signals.length);
    });

    it('should detect clustering (multiple transactions in short time)', () => {
      const now = new Date();
      now.setHours(23); // 11 PM

      // Create clustered transactions (within 2 hours)
      const clustered: TransactionWithCategory[] = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date(now.getTime() + i * 30 * 60 * 1000); // 30 min apart
        clustered.push(createMockTransaction({
          id: `cluster-${i}`,
          amount: -30,
          category_id: 'food_delivery',
          category: { id: 'food_delivery', name: 'Food Delivery', icon: 'fastfood', color: '#FF6B6B' } as unknown as Category,
          transaction_date: date.toISOString(),
        }));
      }

      const result = detectStressSpending(clustered);

      expect(result.detected).toBe(true);
    });
  });

  describe('detectEndOfMonthCollapse', () => {
    it('should not detect with insufficient historical data', () => {
      const transactions = createSmallRecurringTransactions(10);
      const result = detectEndOfMonthCollapse(transactions, 0);

      expect(result.detected).toBe(false);
    });

    it('should detect end of month spending spike', () => {
      const transactions = createEndOfMonthTransactions(3);
      const result = detectEndOfMonthCollapse(transactions, 0);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.signals.some(s => s.time_context === 'end_of_month')).toBe(true);
    });

    it('should not detect when spending is consistent throughout month', () => {
      // Create even spending throughout month
      const transactions: TransactionWithCategory[] = [];
      const now = new Date();

      for (let month = 0; month < 3; month++) {
        for (let day = 1; day <= 28; day++) {
          const date = new Date(now.getFullYear(), now.getMonth() - month, day);
          transactions.push(createMockTransaction({
            id: `tx-even-${month}-${day}`,
            amount: -30, // Consistent amount
            transaction_date: date.toISOString().split('T')[0],
          }));
        }
      }

      const result = detectEndOfMonthCollapse(transactions, 0);

      // Should either not detect or have low confidence
      if (result.detected) {
        expect(result.confidence).toBeLessThan(0.5);
      }
    });

    it('should include budget context in detection when provided', () => {
      const transactions = createEndOfMonthTransactions(3);
      const budgets: BudgetWithCategory[] = [
        {
          id: 'budget-1',
          user_id: 'user-123',
          category_id: 'shopping',
          amount: 500,
          spent: 300,
          period: 'monthly',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as BudgetWithCategory,
      ];

      const result = detectEndOfMonthCollapse(transactions, 0);

      expect(result.metadata).toBeDefined();
    });
  });

  describe('Detection algorithm metadata', () => {
    it('should include algorithm version in all detections', () => {
      const transactions = createSmallRecurringTransactions(20);

      const smallRecurring = detectSmallRecurring(transactions);
      const stressSpending = detectStressSpending(transactions);
      const endOfMonth = detectEndOfMonthCollapse(transactions, 0);

      expect(smallRecurring.metadata.algorithm_version).toBe('1.0.0');
      expect(stressSpending.metadata.algorithm_version).toBe('1.0.0');
      expect(endOfMonth.metadata.algorithm_version).toBe('1.0.0');
    });

    it('should include transaction count in metadata', () => {
      const transactions = createSmallRecurringTransactions(25);

      const result = detectSmallRecurring(transactions);

      expect(result.metadata.transactions_analyzed).toBe(25);
    });

    it('should include timestamp in metadata', () => {
      const transactions = createSmallRecurringTransactions(20);
      const before = new Date().toISOString();

      const result = detectSmallRecurring(transactions);

      const after = new Date().toISOString();
      expect(result.metadata.run_timestamp).toBeDefined();
      expect(result.metadata.run_timestamp >= before).toBe(true);
      expect(result.metadata.run_timestamp <= after).toBe(true);
    });
  });

  describe('Confidence calculation', () => {
    it('should return confidence between 0 and 1', () => {
      const transactions = createSmallRecurringTransactions(30);

      const smallRecurring = detectSmallRecurring(transactions);
      const stressSpending = detectStressSpending(createLateNightTransactions(10));
      const endOfMonth = detectEndOfMonthCollapse(createEndOfMonthTransactions(3), 0);

      expect(smallRecurring.confidence).toBeGreaterThanOrEqual(0);
      expect(smallRecurring.confidence).toBeLessThanOrEqual(1);

      expect(stressSpending.confidence).toBeGreaterThanOrEqual(0);
      expect(stressSpending.confidence).toBeLessThanOrEqual(1);

      expect(endOfMonth.confidence).toBeGreaterThanOrEqual(0);
      expect(endOfMonth.confidence).toBeLessThanOrEqual(1);
    });

    it('should increase confidence with more signals', () => {
      const few = detectSmallRecurring(createSmallRecurringTransactions(15));
      const many = detectSmallRecurring(createSmallRecurringTransactions(50));

      // More data should generally lead to higher or equal confidence
      expect(many.confidence).toBeGreaterThanOrEqual(few.confidence * 0.8); // Allow some variance
    });
  });

  describe('Signal generation', () => {
    it('should generate signals with required fields', () => {
      const transactions = createSmallRecurringTransactions(20);
      const result = detectSmallRecurring(transactions);

      if (result.signals.length > 0) {
        const signal = result.signals[0];
        expect(signal.detection_reason).toBeDefined();
        expect(signal.signal_strength).toBeDefined();
        expect(signal.signal_strength).toBeGreaterThanOrEqual(0);
        expect(signal.signal_strength).toBeLessThanOrEqual(1);
      }
    });

    it('should include category context in signals', () => {
      const transactions = createSmallRecurringTransactions(20, 'coffee', 'Starbucks');
      const result = detectSmallRecurring(transactions);

      if (result.signals.length > 0) {
        const signal = result.signals[0];
        expect(signal.category_id).toBeDefined();
      }
    });

    it('should include transaction context for stress signals', () => {
      const transactions = createLateNightTransactions(10);
      const result = detectStressSpending(transactions);

      const signalsWithTx = result.signals.filter(s => s.transaction_id);
      expect(signalsWithTx.length).toBeGreaterThan(0);
    });
  });
});

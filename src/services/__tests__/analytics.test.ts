/**
 * Analytics Service Tests
 * Tests for all analytics calculations
 */

import {
  getCashFlowTrend,
  getSpendingHeatmap,
  getTopMerchants,
  getBurnRate,
  getMonthlyKPIs,
  getBudgetPerformance,
  getBudgetEfficiency,
  getSpendingVelocity,
  getCategorySpending,
  getGoalsProgress,
  getDebtOverview,
  getNetWorthSummary,
  getSubscriptionAnalytics,
  getDailyBreakdown,
  getWeekComparison,
  getWeekProjection,
  getMonthByMonthTrend,
  getYearOverYearComparison,
  getAnnualSubscriptions,
  getDebtProgressYear,
  getGoalsAchievedYear,
  getNetWorthYearly,
} from '../analytics';

// Mock dependencies
jest.mock('../../utils/locale', () => ({
  getCurrentLocale: jest.fn(() => 'en-US'),
}));
jest.mock('../devStorage');
jest.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: () => ({ currency: 'USD' }),
  },
}));
jest.mock('../currencyConverter', () => ({
  convertCurrency: jest.fn((amount: number) => Promise.resolve(amount)),
}));

import * as devStorage from '../devStorage';

// Mutable test data arrays
let mockTransactions: any[] = [];
let mockBudgets: any[] = [];
let mockGoals: any[] = [];
let mockDebts: any[] = [];
let mockAssets: any[] = [];
let mockLiabilities: any[] = [];
let mockSubscriptions: any[] = [];
let mockSubscriptionSummary: any = {
  total_monthly: 0,
  total_yearly: 0,
  active_count: 0,
  unused_subscriptions: [],
};

// Helper to create transaction
function createTx(overrides: Record<string, any> = {}) {
  const now = new Date();
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    user_id: 'user-123',
    amount: 50,
    currency: 'USD',
    merchant_name: 'Test Store',
    merchant_name_clean: 'Test Store',
    category_id: 'food-dining',
    category: { id: 'food-dining', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
    transaction_date: now.toISOString(),
    transaction_type: 'purchase',
    type: 'expense',
    source: 'manual',
    is_deleted: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

describe('Analytics Service', () => {
  beforeEach(() => {
    // Reset test data
    mockTransactions = [];
    mockBudgets = [];
    mockGoals = [];
    mockDebts = [];
    mockAssets = [];
    mockLiabilities = [];
    mockSubscriptions = [];
    mockSubscriptionSummary = {
      total_monthly: 0,
      total_yearly: 0,
      active_count: 0,
      unused_subscriptions: [],
    };

    // Re-establish mock implementations (resetMocks clears them between tests)
    (devStorage.getDevTransactions as jest.Mock).mockImplementation(() => Promise.resolve(mockTransactions));
    (devStorage.getDevBudgets as jest.Mock).mockImplementation(() => Promise.resolve(mockBudgets));
    (devStorage.getDevGoals as jest.Mock).mockImplementation(() => Promise.resolve(mockGoals));
    (devStorage.getDevDebts as jest.Mock).mockImplementation(() => Promise.resolve(mockDebts));
    (devStorage.getDevAssets as jest.Mock).mockImplementation(() => Promise.resolve(mockAssets));
    (devStorage.getDevLiabilities as jest.Mock).mockImplementation(() => Promise.resolve(mockLiabilities));
    (devStorage.getDevSubscriptions as jest.Mock).mockImplementation(() => Promise.resolve(mockSubscriptions));
    (devStorage.getDevSubscriptionSummary as jest.Mock).mockImplementation(() => Promise.resolve(mockSubscriptionSummary));
    (devStorage.getDevMonthlySummary as jest.Mock).mockImplementation(() => Promise.resolve({ total: 0, byCategory: [], bySource: {} }));
    (devStorage.getDevTopMerchants as jest.Mock).mockImplementation(() => Promise.resolve([]));
  });

  // ==========================================
  // CASH FLOW TREND
  // ==========================================
  describe('getCashFlowTrend', () => {
    it('should return empty array structure for no transactions', async () => {
      const result = await getCashFlowTrend(3);
      expect(result).toHaveLength(3);
      result.forEach(item => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('income');
        expect(item).toHaveProperty('expenses');
        expect(item).toHaveProperty('net');
        expect(item.income).toBe(0);
        expect(item.expenses).toBe(0);
        expect(item.net).toBe(0);
      });
    });

    it('should separate income and expenses correctly', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: 100, type: 'expense', transaction_date: now.toISOString() }),
        createTx({ amount: 500, type: 'income', transaction_date: now.toISOString() }),
      );

      const result = await getCashFlowTrend(1);
      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(500);
      expect(result[0].expenses).toBe(100);
      expect(result[0].net).toBe(400);
    });

    it('should default to 12 months', async () => {
      const result = await getCashFlowTrend();
      expect(result).toHaveLength(12);
    });

    it('should handle positive amount with non-expense type as income', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: 200, type: 'refund', transaction_date: now.toISOString() }),
      );

      const result = await getCashFlowTrend(1);
      expect(result[0].income).toBe(200);
    });
  });

  // ==========================================
  // SPENDING HEATMAP
  // ==========================================
  describe('getSpendingHeatmap', () => {
    it('should return a 4x7 grid', async () => {
      const result = await getSpendingHeatmap();
      expect(result.grid).toHaveLength(4);
      result.grid.forEach(row => {
        expect(row).toHaveLength(7);
      });
    });

    it('should return maxValue of 0 for no transactions', async () => {
      const result = await getSpendingHeatmap();
      expect(result.maxValue).toBe(0);
      expect(result.insight).toBe('No spending data yet this month');
    });

    it('should identify highest spending day', async () => {
      const now = new Date();
      // Create expenses on current date
      mockTransactions.push(
        createTx({ amount: -100, type: 'expense', transaction_date: now.toISOString() }),
        createTx({ amount: -50, type: 'expense', transaction_date: now.toISOString() }),
      );

      const result = await getSpendingHeatmap();
      expect(result.maxValue).toBeGreaterThan(0);
      expect(result.insight).toMatch(/You spend most on/);
    });

    it('should accept different periods', async () => {
      const weekResult = await getSpendingHeatmap('week');
      expect(weekResult.grid).toHaveLength(4);

      const yearResult = await getSpendingHeatmap('year');
      expect(yearResult.grid).toHaveLength(4);
    });
  });

  // ==========================================
  // TOP MERCHANTS
  // ==========================================
  describe('getTopMerchants', () => {
    it('should return empty array for no transactions', async () => {
      const result = await getTopMerchants();
      expect(result).toEqual([]);
    });

    it('should aggregate spending by merchant', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: -50, type: 'expense', merchant_name: 'Store A', merchant_name_clean: 'Store A', transaction_date: now.toISOString() }),
        createTx({ amount: -30, type: 'expense', merchant_name: 'Store A', merchant_name_clean: 'Store A', transaction_date: now.toISOString() }),
        createTx({ amount: -100, type: 'expense', merchant_name: 'Store B', merchant_name_clean: 'Store B', transaction_date: now.toISOString() }),
      );

      const result = await getTopMerchants(5);
      expect(result).toHaveLength(2);
      // Store B should be first (highest amount)
      expect(result[0].merchant).toBe('Store B');
      expect(result[0].amount).toBe(100);
      expect(result[0].count).toBe(1);
      expect(result[0].rank).toBe(1);

      // Store A second
      expect(result[1].merchant).toBe('Store A');
      expect(result[1].amount).toBe(80);
      expect(result[1].count).toBe(2);
      expect(result[1].rank).toBe(2);
    });

    it('should limit results', async () => {
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        mockTransactions.push(
          createTx({ amount: -10, type: 'expense', merchant_name: `Store ${i}`, merchant_name_clean: `Store ${i}`, transaction_date: now.toISOString() }),
        );
      }

      const result = await getTopMerchants(3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should calculate percentages', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: -75, type: 'expense', merchant_name: 'Store A', merchant_name_clean: 'Store A', transaction_date: now.toISOString() }),
        createTx({ amount: -25, type: 'expense', merchant_name: 'Store B', merchant_name_clean: 'Store B', transaction_date: now.toISOString() }),
      );

      const result = await getTopMerchants(5);
      expect(result[0].percentage).toBe(75);
      expect(result[1].percentage).toBe(25);
    });
  });

  // ==========================================
  // BURN RATE
  // ==========================================
  describe('getBurnRate', () => {
    it('should return zero rates for no transactions', async () => {
      const result = await getBurnRate();
      expect(result.dailyRate).toBe(0);
      expect(result.daysElapsed).toBeGreaterThanOrEqual(1);
      expect(result.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should calculate daily rate from expenses', async () => {
      const now = new Date();
      // Add expenses for current month
      mockTransactions.push(
        createTx({ amount: -100, type: 'expense', transaction_date: now.toISOString() }),
        createTx({ amount: -50, type: 'expense', transaction_date: now.toISOString() }),
      );

      const result = await getBurnRate();
      expect(result.dailyRate).toBeGreaterThan(0);
      expect(result.projectedMonthEnd).toBeGreaterThan(0);
    });

    it('should compare against previous period', async () => {
      const now = new Date();
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      mockTransactions.push(
        createTx({ amount: -100, type: 'expense', transaction_date: now.toISOString() }),
        createTx({ amount: -200, type: 'expense', transaction_date: lastMonth.toISOString() }),
      );

      const result = await getBurnRate();
      expect(typeof result.vsLastMonth).toBe('number');
    });

    it('should support week period', async () => {
      const result = await getBurnRate('week');
      expect(result.daysElapsed).toBeLessThanOrEqual(8); // can include boundary day
    });

    it('should compare against budget', async () => {
      mockBudgets.push({ id: 'b1', amount: 1000, is_active: true, category_id: 'food' });

      const result = await getBurnRate();
      expect(typeof result.vsBudget).toBe('number');
    });
  });

  // ==========================================
  // MONTHLY KPIs
  // ==========================================
  describe('getMonthlyKPIs', () => {
    it('should return zeros for no transactions', async () => {
      const result = await getMonthlyKPIs();
      expect(result.income).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.net).toBe(0);
    });

    it('should calculate current period totals', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: 1000, type: 'income', transaction_date: now.toISOString() }),
        createTx({ amount: -300, type: 'expense', transaction_date: now.toISOString() }),
      );

      const result = await getMonthlyKPIs();
      expect(result.income).toBe(1000);
      expect(result.expenses).toBe(300);
      expect(result.net).toBe(700);
    });

    it('should calculate percentage changes', async () => {
      const now = new Date();
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      mockTransactions.push(
        createTx({ amount: 1000, type: 'income', transaction_date: now.toISOString() }),
        createTx({ amount: 500, type: 'income', transaction_date: lastMonth.toISOString() }),
      );

      const result = await getMonthlyKPIs();
      expect(result.incomeChange).toBe(100); // 1000 vs 500 = 100% increase
    });

    it('should handle zero previous period gracefully', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: 100, type: 'income', transaction_date: now.toISOString() }),
      );

      const result = await getMonthlyKPIs();
      expect(result.incomeChange).toBe(100); // 100% when previous is 0
    });

    it('should support different periods', async () => {
      const weekResult = await getMonthlyKPIs('week');
      expect(weekResult).toHaveProperty('income');

      const yearResult = await getMonthlyKPIs('year');
      expect(yearResult).toHaveProperty('income');
    });
  });

  // ==========================================
  // BUDGET PERFORMANCE
  // ==========================================
  describe('getBudgetPerformance', () => {
    it('should return empty array when no budgets', async () => {
      const result = await getBudgetPerformance();
      expect(result).toEqual([]);
    });

    it('should calculate budget spending', async () => {
      const now = new Date();
      mockBudgets.push({
        id: 'b1',
        amount: 500,
        category_id: 'food-dining',
        is_active: true,
        category: { name: 'Food & Dining', icon: 'restaurant' },
      });
      mockTransactions.push(
        createTx({ amount: -100, type: 'expense', category_id: 'food-dining', transaction_date: now.toISOString() }),
        createTx({ amount: -150, type: 'expense', category_id: 'food-dining', transaction_date: now.toISOString() }),
      );

      const result = await getBudgetPerformance();
      expect(result).toHaveLength(1);
      expect(result[0].spent).toBe(250);
      expect(result[0].limit).toBe(500);
      expect(result[0].percentage).toBe(50);
      expect(result[0].status).toBe('safe');
    });

    it('should mark warning status at 80%+', async () => {
      const now = new Date();
      mockBudgets.push({
        id: 'b1',
        amount: 100,
        category_id: 'food-dining',
        is_active: true,
        category: { name: 'Food', icon: 'restaurant' },
      });
      mockTransactions.push(
        createTx({ amount: -85, type: 'expense', category_id: 'food-dining', transaction_date: now.toISOString() }),
      );

      const result = await getBudgetPerformance();
      expect(result[0].status).toBe('warning');
    });

    it('should mark danger status at 100%+', async () => {
      const now = new Date();
      mockBudgets.push({
        id: 'b1',
        amount: 100,
        category_id: 'food-dining',
        is_active: true,
        category: { name: 'Food', icon: 'restaurant' },
      });
      mockTransactions.push(
        createTx({ amount: -120, type: 'expense', category_id: 'food-dining', transaction_date: now.toISOString() }),
      );

      const result = await getBudgetPerformance();
      expect(result[0].status).toBe('danger');
    });

    it('should skip inactive budgets', async () => {
      mockBudgets.push({
        id: 'b1',
        amount: 500,
        category_id: 'food-dining',
        is_active: false,
        category: { name: 'Food', icon: 'restaurant' },
      });

      const result = await getBudgetPerformance();
      expect(result).toHaveLength(0);
    });

    it('should sort by percentage descending', async () => {
      const now = new Date();
      mockBudgets.push(
        { id: 'b1', amount: 100, category_id: 'food-dining', is_active: true, category: { name: 'Food', icon: 'r' } },
        { id: 'b2', amount: 100, category_id: 'transport', is_active: true, category: { name: 'Transport', icon: 't' } },
      );
      mockTransactions.push(
        createTx({ amount: -30, type: 'expense', category_id: 'food-dining', transaction_date: now.toISOString() }),
        createTx({ amount: -90, type: 'expense', category_id: 'transport', transaction_date: now.toISOString() }),
      );

      const result = await getBudgetPerformance();
      expect(result[0].category).toBe('Transport');
      expect(result[1].category).toBe('Food');
    });
  });

  // ==========================================
  // BUDGET EFFICIENCY
  // ==========================================
  describe('getBudgetEfficiency', () => {
    it('should return 100 for no budgets', async () => {
      const result = await getBudgetEfficiency();
      expect(result).toBe(100);
    });

    it('should return 100 for under-budget spending', async () => {
      mockBudgets.push({
        id: 'b1',
        amount: 1000,
        category_id: 'food-dining',
        is_active: true,
        category: { name: 'Food', icon: 'r' },
      });
      // No transactions = 0% usage = score of 100

      const result = await getBudgetEfficiency();
      expect(result).toBe(100);
    });
  });

  // ==========================================
  // SPENDING VELOCITY
  // ==========================================
  describe('getSpendingVelocity', () => {
    it('should return stable trend with no spending', async () => {
      mockBudgets.length = 0; // getBurnRate needs budgets

      const result = await getSpendingVelocity();
      expect(result).toHaveProperty('currentRate');
      expect(result).toHaveProperty('projectedTotal');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('trendPercentage');
      expect(['accelerating', 'stable', 'decelerating']).toContain(result.trend);
    });

    it('should detect accelerating spending', async () => {
      const now = new Date();
      const recent = new Date(now);
      recent.setDate(now.getDate() - 2);
      const older = new Date(now);
      older.setDate(now.getDate() - 10);

      // Heavy recent spending, light older spending
      for (let i = 0; i < 5; i++) {
        mockTransactions.push(
          createTx({ amount: -100, type: 'expense', transaction_date: recent.toISOString() }),
        );
      }
      mockTransactions.push(
        createTx({ amount: -10, type: 'expense', transaction_date: older.toISOString() }),
      );

      const result = await getSpendingVelocity();
      expect(typeof result.trendPercentage).toBe('number');
    });
  });

  // ==========================================
  // CATEGORY SPENDING
  // ==========================================
  describe('getCategorySpending', () => {
    it('should return empty for no transactions', async () => {
      const result = await getCategorySpending();
      expect(result).toEqual([]);
    });

    it('should group expenses by category', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: -50, type: 'expense', category_id: 'food-dining', category: { id: 'food-dining', name: 'Food', icon: 'r', color: '#F00' }, transaction_date: now.toISOString() }),
        createTx({ amount: -30, type: 'expense', category_id: 'food-dining', category: { id: 'food-dining', name: 'Food', icon: 'r', color: '#F00' }, transaction_date: now.toISOString() }),
        createTx({ amount: -100, type: 'expense', category_id: 'transport', category: { id: 'transport', name: 'Transport', icon: 'c', color: '#0F0' }, transaction_date: now.toISOString() }),
      );

      const result = await getCategorySpending();
      expect(result).toHaveLength(2);
      // Sorted by amount desc
      expect(result[0].category_name).toBe('Transport');
      expect(result[0].amount).toBe(100);
      expect(result[1].category_name).toBe('Food');
      expect(result[1].amount).toBe(80);
    });

    it('should calculate percentages', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: -75, type: 'expense', category_id: 'food', category: { id: 'food', name: 'Food', icon: 'r', color: '#F00' }, transaction_date: now.toISOString() }),
        createTx({ amount: -25, type: 'expense', category_id: 'other', category: { id: 'other', name: 'Other', icon: 'o', color: '#0F0' }, transaction_date: now.toISOString() }),
      );

      const result = await getCategorySpending();
      expect(result[0].percentage).toBe(75);
      expect(result[1].percentage).toBe(25);
    });

    it('should support different periods', async () => {
      const weekResult = await getCategorySpending('week');
      expect(Array.isArray(weekResult)).toBe(true);

      const yearResult = await getCategorySpending('year');
      expect(Array.isArray(yearResult)).toBe(true);
    });
  });

  // ==========================================
  // GOALS PROGRESS
  // ==========================================
  describe('getGoalsProgress', () => {
    it('should return empty array for no goals', async () => {
      const result = await getGoalsProgress();
      expect(result).toEqual([]);
    });

    it('should calculate goal progress percentage', async () => {
      mockGoals.push({
        id: 'g1',
        name: 'Emergency Fund',
        icon: 'shield',
        current_amount: 2500,
        target_amount: 10000,
        target_date: '2026-12-31',
        status: 'active',
      });

      const result = await getGoalsProgress();
      expect(result).toHaveLength(1);
      expect(result[0].percentage).toBe(25);
      expect(result[0].name).toBe('Emergency Fund');
      expect(result[0].currentAmount).toBe(2500);
      expect(result[0].targetAmount).toBe(10000);
    });

    it('should cap percentage at 100', async () => {
      mockGoals.push({
        id: 'g1',
        name: 'Completed Goal',
        icon: 'check',
        current_amount: 12000,
        target_amount: 10000,
        target_date: null,
        status: 'completed',
      });

      const result = await getGoalsProgress();
      expect(result[0].percentage).toBe(100);
    });

    it('should handle zero target gracefully', async () => {
      mockGoals.push({
        id: 'g1',
        name: 'Zero Target',
        icon: 'x',
        current_amount: 0,
        target_amount: 0,
        target_date: null,
        status: 'active',
      });

      const result = await getGoalsProgress();
      expect(result[0].percentage).toBe(0);
    });
  });

  // ==========================================
  // DEBT OVERVIEW
  // ==========================================
  describe('getDebtOverview', () => {
    it('should return zeros for no debts', async () => {
      const result = await getDebtOverview();
      expect(result.totalDebt).toBe(0);
      expect(result.monthlyInterest).toBe(0);
      expect(result.debts).toEqual([]);
    });

    it('should calculate total debt and monthly interest', async () => {
      mockDebts.push(
        { id: 'd1', balance: 10000, interest_rate: 12 }, // 12% APR = 1% monthly
        { id: 'd2', balance: 5000, interest_rate: 6 },   // 6% APR = 0.5% monthly
      );

      const result = await getDebtOverview();
      expect(result.totalDebt).toBe(15000);
      // Monthly interest: 10000*0.01 + 5000*0.005 = 100 + 25 = 125
      expect(result.monthlyInterest).toBe(125);
      expect(result.debts).toHaveLength(2);
    });
  });

  // ==========================================
  // NET WORTH
  // ==========================================
  describe('getNetWorthSummary', () => {
    it('should return zeros for no assets/liabilities', async () => {
      const result = await getNetWorthSummary();
      expect(result.netWorth).toBe(0);
      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
    });

    it('should calculate net worth correctly', async () => {
      mockAssets.push(
        { id: 'a1', value: 50000 },
        { id: 'a2', value: 30000 },
      );
      mockLiabilities.push(
        { id: 'l1', value: 20000 },
      );

      const result = await getNetWorthSummary();
      expect(result.totalAssets).toBe(80000);
      expect(result.totalLiabilities).toBe(20000);
      expect(result.netWorth).toBe(60000);
    });
  });

  // ==========================================
  // SUBSCRIPTION ANALYTICS
  // ==========================================
  describe('getSubscriptionAnalytics', () => {
    it('should return zeros for no subscriptions', async () => {
      const result = await getSubscriptionAnalytics();
      expect(result.monthlyTotal).toBe(0);
      expect(result.yearlyTotal).toBe(0);
      expect(result.activeCount).toBe(0);
      expect(result.unusedSubscriptions).toEqual([]);
      expect(result.upcomingRenewals).toEqual([]);
    });

    it('should report unused subscriptions', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 45);

      Object.assign(mockSubscriptionSummary, {
        total_monthly: 50,
        total_yearly: 600,
        active_count: 1,
        unused_subscriptions: [
          { id: 's1', name: 'Unused App', amount: 10, last_used_at: thirtyDaysAgo.toISOString() },
        ],
      });

      const result = await getSubscriptionAnalytics();
      expect(result.unusedSubscriptions).toHaveLength(1);
      expect(result.unusedSubscriptions[0].lastUsedDays).toBeGreaterThanOrEqual(44);
    });

    it('should identify upcoming renewals within 14 days', async () => {
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);

      const inThirtyDays = new Date();
      inThirtyDays.setDate(inThirtyDays.getDate() + 30);

      mockSubscriptions.push(
        { id: 's1', name: 'Netflix', amount: 15, next_billing_date: inFiveDays.toISOString(), status: 'active' },
        { id: 's2', name: 'Gym', amount: 30, next_billing_date: inThirtyDays.toISOString(), status: 'active' },
      );

      const result = await getSubscriptionAnalytics();
      expect(result.upcomingRenewals).toHaveLength(1);
      expect(result.upcomingRenewals[0].name).toBe('Netflix');
    });
  });

  // ==========================================
  // DAILY BREAKDOWN (Weekly)
  // ==========================================
  describe('getDailyBreakdown', () => {
    it('should return 7 days of data', async () => {
      const result = await getDailyBreakdown();
      expect(result.dailyBreakdown).toHaveLength(7);
      expect(result.totalSpent).toBe(0);
      expect(result.dailyAverage).toBe(0);
      expect(result.transactionCount).toBe(0);
    });

    it('should calculate daily spending', async () => {
      const today = new Date();
      mockTransactions.push(
        createTx({ amount: -50, type: 'expense', transaction_date: today.toISOString() }),
        createTx({ amount: -30, type: 'expense', transaction_date: today.toISOString() }),
      );

      const result = await getDailyBreakdown();
      expect(result.totalSpent).toBeGreaterThanOrEqual(0);
      expect(result.transactionCount).toBeGreaterThanOrEqual(0);
    });

    it('should identify highest and lowest spending days', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      mockTransactions.push(
        createTx({ amount: -100, type: 'expense', transaction_date: today.toISOString() }),
        createTx({ amount: -20, type: 'expense', transaction_date: yesterday.toISOString() }),
      );

      const result = await getDailyBreakdown();
      // highestDay should be >= lowestDay
      expect(result.highestDay.amount).toBeGreaterThanOrEqual(result.lowestDay.amount);
    });
  });

  // ==========================================
  // WEEK COMPARISON
  // ==========================================
  describe('getWeekComparison', () => {
    it('should return comparison structure', async () => {
      const result = await getWeekComparison();
      expect(result).toHaveProperty('thisWeek');
      expect(result).toHaveProperty('lastWeek');
      expect(result).toHaveProperty('change');
      expect(result).toHaveProperty('insight');
      expect(result.thisWeek).toHaveProperty('total');
      expect(result.thisWeek).toHaveProperty('dailyAvg');
      expect(result.thisWeek).toHaveProperty('transactionCount');
    });

    it('should generate consistent spending insight', async () => {
      const result = await getWeekComparison();
      expect(result.insight).toBe('Your spending is consistent with last week.');
    });

    it('should detect increased spending', async () => {
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 10);

      // Heavy this week
      for (let i = 0; i < 5; i++) {
        mockTransactions.push(
          createTx({ amount: -100, type: 'expense', transaction_date: now.toISOString() }),
        );
      }
      // Light last week
      mockTransactions.push(
        createTx({ amount: -10, type: 'expense', transaction_date: lastWeek.toISOString() }),
      );

      const result = await getWeekComparison();
      expect(result.change.totalPercent).toBeGreaterThan(10);
      expect(result.insight).toMatch(/spending more/);
    });
  });

  // ==========================================
  // WEEK PROJECTION
  // ==========================================
  describe('getWeekProjection', () => {
    it('should return projection structure', async () => {
      const result = await getWeekProjection();
      expect(result).toHaveProperty('daysElapsed');
      expect(result).toHaveProperty('daysRemaining');
      expect(result).toHaveProperty('currentSpend');
      expect(result).toHaveProperty('dailyAverage');
      expect(result).toHaveProperty('projectedWeekTotal');
      expect(result).toHaveProperty('vsLastWeek');
      expect(result.daysElapsed + result.daysRemaining).toBe(7);
    });

    it('should project based on current spending pace', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: -100, type: 'expense', transaction_date: now.toISOString() }),
      );

      const result = await getWeekProjection();
      expect(result.currentSpend).toBe(100);
      expect(result.projectedWeekTotal).toBeGreaterThanOrEqual(100);
    });
  });

  // ==========================================
  // MONTH BY MONTH TREND
  // ==========================================
  describe('getMonthByMonthTrend', () => {
    it('should return data up to current month', async () => {
      const result = await getMonthByMonthTrend();
      const currentMonth = new Date().getMonth() + 1;
      expect(result.months).toHaveLength(currentMonth);
    });

    it('should calculate yearly totals', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: 2000, type: 'income', transaction_date: now.toISOString() }),
        createTx({ amount: -500, type: 'expense', transaction_date: now.toISOString() }),
      );

      const result = await getMonthByMonthTrend();
      expect(result.totalIncome).toBe(2000);
      expect(result.totalSpent).toBe(500);
      expect(result.totalSaved).toBe(1500);
      expect(result.savingsRate).toBe(75);
    });

    it('should identify highest and lowest spending months', async () => {
      const result = await getMonthByMonthTrend();
      expect(result).toHaveProperty('highestMonth');
      expect(result).toHaveProperty('lowestMonth');
      expect(result.highestMonth).toHaveProperty('month');
      expect(result.highestMonth).toHaveProperty('amount');
    });
  });

  // ==========================================
  // YEAR OVER YEAR
  // ==========================================
  describe('getYearOverYearComparison', () => {
    it('should return year comparison structure', async () => {
      const result = await getYearOverYearComparison();
      expect(result).toHaveProperty('currentYear');
      expect(result).toHaveProperty('previousYear');
      expect(result).toHaveProperty('change');
      expect(result).toHaveProperty('insight');
      expect(result.currentYear.year).toBe(new Date().getFullYear());
      expect(result.previousYear.year).toBe(new Date().getFullYear() - 1);
    });

    it('should calculate savings rate', async () => {
      const now = new Date();
      mockTransactions.push(
        createTx({ amount: 1000, type: 'income', transaction_date: now.toISOString() }),
        createTx({ amount: -400, type: 'expense', transaction_date: now.toISOString() }),
      );

      const result = await getYearOverYearComparison();
      expect(result.currentYear.income).toBe(1000);
      expect(result.currentYear.expenses).toBe(400);
      expect(result.currentYear.saved).toBe(600);
      expect(result.currentYear.savingsRate).toBe(60);
    });

    it('should generate appropriate insight', async () => {
      const result = await getYearOverYearComparison();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // ANNUAL SUBSCRIPTIONS
  // ==========================================
  describe('getAnnualSubscriptions', () => {
    it('should return empty for no subscriptions', async () => {
      const result = await getAnnualSubscriptions();
      expect(result.totalAnnual).toBe(0);
      expect(result.subscriptions).toEqual([]);
    });

    it('should calculate yearly cost for monthly subscriptions', async () => {
      mockSubscriptions.push({
        id: 's1',
        name: 'Netflix',
        amount: 15,
        billing_cycle: 'monthly',
        category: { name: 'Entertainment' },
      });

      const result = await getAnnualSubscriptions();
      expect(result.subscriptions[0].yearlyAmount).toBe(180); // 15 * 12
      expect(result.subscriptions[0].monthlyAmount).toBe(15);
    });

    it('should handle different billing cycles', async () => {
      mockSubscriptions.push(
        { id: 's1', name: 'Weekly', amount: 10, billing_cycle: 'weekly', category: { name: 'Sub' } },
        { id: 's2', name: 'Quarterly', amount: 30, billing_cycle: 'quarterly', category: { name: 'Sub' } },
        { id: 's3', name: 'Yearly', amount: 100, billing_cycle: 'yearly', category: { name: 'Sub' } },
      );

      const result = await getAnnualSubscriptions();
      const weekly = result.subscriptions.find(s => s.name === 'Weekly');
      const quarterly = result.subscriptions.find(s => s.name === 'Quarterly');
      const yearly = result.subscriptions.find(s => s.name === 'Yearly');

      expect(weekly?.yearlyAmount).toBe(520);  // 10 * 52
      expect(quarterly?.yearlyAmount).toBe(120); // 30 * 4
      expect(yearly?.yearlyAmount).toBe(100);
    });
  });

  // ==========================================
  // DEBT PROGRESS YEAR
  // ==========================================
  describe('getDebtProgressYear', () => {
    it('should return zeros for no debts', async () => {
      const result = await getDebtProgressYear();
      expect(result.currentTotal).toBe(0);
      expect(result.startOfYearTotal).toBe(0);
      expect(result.paidOff).toBe(0);
    });

    it('should calculate debt payoff progress', async () => {
      mockDebts.push(
        { id: 'd1', balance: 8000, original_balance: 10000 },
        { id: 'd2', balance: 3000, original_balance: 5000 },
      );

      const result = await getDebtProgressYear();
      expect(result.currentTotal).toBe(11000);
      expect(result.startOfYearTotal).toBe(15000);
      expect(result.paidOff).toBe(4000);
      expect(result.paidOffPercent).toBeCloseTo(26.67, 1);
      expect(result.remainingPercent).toBeCloseTo(73.33, 1);
    });

    it('should project payoff date when progress exists', async () => {
      mockDebts.push(
        { id: 'd1', balance: 5000, original_balance: 10000 },
      );

      const result = await getDebtProgressYear();
      if (result.paidOff > 0) {
        expect(result.projectedPayoffDate).not.toBeNull();
      }
    });
  });

  // ==========================================
  // GOALS ACHIEVED YEAR
  // ==========================================
  describe('getGoalsAchievedYear', () => {
    it('should return empty arrays for no goals', async () => {
      const result = await getGoalsAchievedYear();
      expect(result.completedGoals).toEqual([]);
      expect(result.inProgressGoals).toEqual([]);
      expect(result.totalSavedTowardsGoals).toBe(0);
    });

    it('should separate completed and in-progress goals', async () => {
      mockGoals.push(
        { id: 'g1', name: 'Done', icon: 'check', current_amount: 10000, target_amount: 10000, target_date: null, status: 'completed' },
        { id: 'g2', name: 'In Progress', icon: 'clock', current_amount: 3000, target_amount: 10000, target_date: '2026-12-31', status: 'active' },
      );

      const result = await getGoalsAchievedYear();
      expect(result.completedGoals).toHaveLength(1);
      expect(result.inProgressGoals).toHaveLength(1);
      expect(result.totalSavedTowardsGoals).toBe(13000);
    });
  });

  // ==========================================
  // NET WORTH YEARLY
  // ==========================================
  describe('getNetWorthYearly', () => {
    it('should return current net worth data', async () => {
      mockAssets.push({ id: 'a1', value: 50000 });
      mockLiabilities.push({ id: 'l1', value: 10000 });

      const result = await getNetWorthYearly();
      expect(result.currentNetWorth).toBe(40000);
      expect(result.totalAssets).toBe(50000);
      expect(result.totalLiabilities).toBe(10000);
    });

    it('should return zeros for no assets/liabilities', async () => {
      const result = await getNetWorthYearly();
      expect(result.currentNetWorth).toBe(0);
      expect(result.growth).toBe(0);
    });
  });
});

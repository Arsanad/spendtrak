/**
 * Income Tracking Service Tests
 */

import {
  getIncome,
  getCashFlowForPeriod,
  getIncomeBySource,
  getTotalRecurringMonthlyIncome,
} from '../incomeTracking';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Helper to create chainable mock query
function createMockQuery(resolvedData: any) {
  const mockQuery: any = {
    select: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    order: jest.fn(() => Promise.resolve({ data: resolvedData, error: null })),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error: null })),
  };
  // Make the query thenable for await
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error: null });
    return mockQuery;
  };
  return mockQuery;
}

describe('Income Tracking Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getIncome', () => {
    it('should fetch income entries for authenticated user', async () => {
      const mockIncome = [
        {
          id: 'income-1',
          user_id: 'user-123',
          amount: 5000,
          source: 'salary',
          income_date: '2024-01-15',
          is_recurring: true,
          frequency: 'monthly',
          category: null,
        },
        {
          id: 'income-2',
          user_id: 'user-123',
          amount: 500,
          source: 'freelance',
          income_date: '2024-01-20',
          is_recurring: false,
          frequency: null,
          category: null,
        },
      ];

      const mockQuery = createMockQuery(mockIncome);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getIncome();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('income');
      expect(result).toEqual(mockIncome);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getIncome()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getCashFlowForPeriod', () => {
    it('should calculate correct cash flow', async () => {
      const mockIncomeData = [
        { amount: 5000 },
        { amount: 500 },
      ];

      const mockExpenseData = [
        { amount: 1500 },
        { amount: 800 },
        { amount: 200 },
      ];

      const mockIncomeQuery = createMockQuery(mockIncomeData);
      const mockExpenseQuery = createMockQuery(mockExpenseData);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockIncomeQuery)
        .mockReturnValueOnce(mockExpenseQuery);

      const result = await getCashFlowForPeriod('2024-01-01', '2024-01-31');

      expect(result.total_income).toBe(5500); // 5000 + 500
      expect(result.total_expenses).toBe(2500); // 1500 + 800 + 200
      expect(result.net_cash_flow).toBe(3000); // 5500 - 2500
      // Savings rate: (3000 / 5500) * 100 = 54.54%
      expect(result.savings_rate).toBeCloseTo(54.55, 1);
    });

    it('should handle zero income correctly', async () => {
      const mockIncomeQuery = createMockQuery([]);
      const mockExpenseQuery = createMockQuery([{ amount: 500 }]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockIncomeQuery)
        .mockReturnValueOnce(mockExpenseQuery);

      const result = await getCashFlowForPeriod('2024-01-01', '2024-01-31');

      expect(result.total_income).toBe(0);
      expect(result.total_expenses).toBe(500);
      expect(result.net_cash_flow).toBe(-500);
      expect(result.savings_rate).toBe(0); // Can't calculate rate with 0 income
    });
  });

  describe('getIncomeBySource', () => {
    it('should aggregate income by source correctly', async () => {
      const mockIncomeData = [
        { source: 'salary', amount: 5000 },
        { source: 'salary', amount: 5000 },
        { source: 'freelance', amount: 1000 },
        { source: 'investment', amount: 500 },
      ];

      const mockQuery = createMockQuery(mockIncomeData);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getIncomeBySource();

      expect(result.length).toBe(3);

      // Find salary entry
      const salaryEntry = result.find(r => r.source === 'salary');
      expect(salaryEntry?.total_amount).toBe(10000);
      expect(salaryEntry?.transaction_count).toBe(2);

      // Find freelance entry
      const freelanceEntry = result.find(r => r.source === 'freelance');
      expect(freelanceEntry?.total_amount).toBe(1000);

      // Total is 11500, so salary should be ~87% and freelance ~8.7%
      expect(salaryEntry?.percentage).toBeCloseTo(86.96, 1);
    });
  });

  describe('getTotalRecurringMonthlyIncome', () => {
    it('should calculate monthly equivalent of recurring income', async () => {
      const mockRecurring = [
        { amount: 5000, frequency: 'monthly', is_recurring: true },
        { amount: 1000, frequency: 'biweekly', is_recurring: true }, // ~2167/month
        { amount: 12000, frequency: 'yearly', is_recurring: true }, // 1000/month
      ];

      const mockQuery = createMockQuery(mockRecurring);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTotalRecurringMonthlyIncome();

      // 5000 + (1000 * 26/12) + (12000/12) = 5000 + 2166.67 + 1000 = 8166.67
      expect(result).toBeCloseTo(8166.67, 0);
    });

    it('should return 0 when no recurring income', async () => {
      const mockQuery = createMockQuery([]);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTotalRecurringMonthlyIncome();

      expect(result).toBe(0);
    });
  });
});

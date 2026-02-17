/**
 * Zero-Based Budgeting Service Tests
 */

import {
  getZeroBasedPeriods,
  getCurrentPeriod,
  createMonthlyPeriod,
  getAllocations,
  createAllocation,
  getBudgetSummary,
} from '../zeroBased';
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
function createMockQuery(resolvedData: any, error: any = null) {
  const mockQuery: any = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
    upsert: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error })),
  };
  // Make the query thenable for await
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error });
    return mockQuery;
  };
  return mockQuery;
}

describe('Zero-Based Budgeting Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getZeroBasedPeriods', () => {
    it('should fetch active budget periods', async () => {
      const mockPeriods = [
        {
          id: 'period-1',
          user_id: 'user-123',
          period_name: 'January 2024',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          total_income: 5000,
          total_allocated: 5000,
          is_balanced: true,
          is_active: true,
        },
        {
          id: 'period-2',
          user_id: 'user-123',
          period_name: 'February 2024',
          start_date: '2024-02-01',
          end_date: '2024-02-29',
          total_income: 5000,
          total_allocated: 4500,
          is_balanced: false,
          is_active: true,
        },
      ];

      const mockQuery = createMockQuery(mockPeriods);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getZeroBasedPeriods(true);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('zero_based_periods');
      expect(result).toEqual(mockPeriods);
      expect(result.length).toBe(2);
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getZeroBasedPeriods()).rejects.toThrow('Not authenticated');
    });
  });

  describe('createMonthlyPeriod', () => {
    it('should create a monthly budget period with correct dates', async () => {
      const createdPeriod = {
        id: 'period-new',
        user_id: 'user-123',
        period_name: 'March 2024',
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        total_income: 6000,
        total_allocated: 0,
        is_balanced: false,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const mockQuery = createMockQuery(createdPeriod);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await createMonthlyPeriod(2024, 3, 6000);

      expect(result.period_name).toBe('March 2024');
      expect(result.start_date).toBe('2024-03-01');
      expect(result.end_date).toBe('2024-03-31');
      expect(result.total_income).toBe(6000);
    });
  });

  describe('getAllocations', () => {
    it('should fetch allocations with categories and calculate remaining', async () => {
      const mockAllocations = [
        {
          id: 'alloc-1',
          period_id: 'period-1',
          name: 'Rent',
          allocated_amount: 1500,
          spent_amount: 1500,
          is_essential: true,
          priority: 1,
          category: { id: 'cat-1', name: 'Housing', icon: 'home' },
        },
        {
          id: 'alloc-2',
          period_id: 'period-1',
          name: 'Groceries',
          allocated_amount: 500,
          spent_amount: 300,
          is_essential: true,
          priority: 2,
          category: { id: 'cat-2', name: 'Food', icon: 'food' },
        },
        {
          id: 'alloc-3',
          period_id: 'period-1',
          name: 'Entertainment',
          allocated_amount: 200,
          spent_amount: 250,
          is_essential: false,
          priority: 3,
          category: { id: 'cat-3', name: 'Fun', icon: 'movie' },
        },
      ];

      const mockQuery = createMockQuery(mockAllocations);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getAllocations('period-1');

      expect(result.length).toBe(3);

      // Check remaining calculations
      expect(result[0].remaining).toBe(0); // 1500 - 1500
      expect(result[1].remaining).toBe(200); // 500 - 300
      expect(result[2].remaining).toBe(-50); // 200 - 250 (over budget)

      // Check percentage calculations
      expect(result[0].percentage_spent).toBe(100);
      expect(result[1].percentage_spent).toBe(60);
      expect(result[2].percentage_spent).toBeCloseTo(100); // Capped at 100
    });
  });

  describe('createAllocation', () => {
    it('should create a new allocation', async () => {
      const newAllocation = {
        period_id: 'period-1',
        category_id: 'cat-1',
        name: 'Utilities',
        allocated_amount: 200,
        spent_amount: 0,
        priority: 5,
        is_essential: true,
        notes: null,
      };

      const createdAllocation = {
        id: 'alloc-new',
        user_id: 'user-123',
        ...newAllocation,
        created_at: new Date().toISOString(),
      };

      // Mock for create
      const insertQuery = createMockQuery(createdAllocation);

      // Mock for recalculatePeriodTotals (sum allocations)
      const sumQuery = createMockQuery([{ allocated_amount: 200 }]);

      // Mock for period update
      const periodQuery = createMockQuery({ total_income: 5000 });
      const updateQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(insertQuery) // insert allocation
        .mockReturnValueOnce(sumQuery) // get allocations for sum
        .mockReturnValueOnce(periodQuery) // get period
        .mockReturnValueOnce(updateQuery); // update period

      const result = await createAllocation(newAllocation);

      expect(result.id).toBe('alloc-new');
      expect(result.name).toBe('Utilities');
      expect(result.allocated_amount).toBe(200);
    });
  });

  describe('getBudgetSummary', () => {
    it('should calculate correct budget summary', async () => {
      const mockPeriod = {
        id: 'period-1',
        period_name: 'January 2024',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        total_income: 5000,
        total_allocated: 4800,
        is_balanced: false,
        is_active: true,
      };

      const mockAllocations = [
        {
          id: 'alloc-1',
          allocated_amount: 1500,
          spent_amount: 1500,
          is_essential: true,
          category: null,
        },
        {
          id: 'alloc-2',
          allocated_amount: 500,
          spent_amount: 300,
          is_essential: true,
          category: null,
        },
        {
          id: 'alloc-3',
          allocated_amount: 2800,
          spent_amount: 2500,
          is_essential: false,
          category: null,
        },
      ];

      const mockIncomeSources = [
        { expected_amount: 4000 },
        { expected_amount: 1000 },
      ];

      const mockTransactions: any[] = [];

      const periodQuery = createMockQuery(mockPeriod);
      const allocQuery = createMockQuery(mockAllocations);
      const incomeQuery = createMockQuery(mockIncomeSources);
      const transQuery = createMockQuery(mockTransactions);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(periodQuery) // getPeriodWithDetails - period
        .mockReturnValueOnce(allocQuery) // getPeriodWithDetails - allocations
        .mockReturnValueOnce(incomeQuery) // getPeriodWithDetails - income sources
        .mockReturnValueOnce(transQuery) // transactions for alloc 1
        .mockReturnValueOnce(transQuery) // transactions for alloc 2
        .mockReturnValueOnce(transQuery); // transactions for alloc 3

      const result = await getBudgetSummary('period-1');

      expect(result.is_balanced).toBe(false);
      expect(result.total_income).toBe(5000);
      expect(result.total_allocated).toBe(4800);
      expect(result.unallocated).toBe(200); // 5000 - 4800

      // Essential: 1500 + 500 = 2000
      expect(result.essential_allocated).toBe(2000);

      // Non-essential: 2800
      expect(result.non_essential_allocated).toBe(2800);
    });
  });

  describe('budget balance detection', () => {
    it('should detect when budget is balanced', async () => {
      const mockPeriod = {
        id: 'period-1',
        period_name: 'January 2024',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        total_income: 5000,
        total_allocated: 5000, // Exactly equal
        is_balanced: true,
        is_active: true,
      };

      const mockAllocations = [
        {
          id: 'alloc-1',
          allocated_amount: 5000,
          spent_amount: 0,
          is_essential: true,
          category: null,
        },
      ];

      const periodQuery = createMockQuery(mockPeriod);
      const allocQuery = createMockQuery(mockAllocations);
      const incomeQuery = createMockQuery([]);
      const transQuery = createMockQuery([]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(periodQuery)
        .mockReturnValueOnce(allocQuery)
        .mockReturnValueOnce(incomeQuery)
        .mockReturnValueOnce(transQuery);

      const result = await getBudgetSummary('period-1');

      expect(result.is_balanced).toBe(true);
      expect(result.unallocated).toBe(0);
    });

    it('should count categories over budget', async () => {
      const mockPeriod = {
        id: 'period-1',
        period_name: 'January 2024',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        total_income: 5000,
        total_allocated: 5000,
        is_balanced: true,
        is_active: true,
      };

      const mockAllocations = [
        {
          id: 'alloc-1',
          allocated_amount: 1000,
          spent_amount: 1200, // Over
          is_essential: true,
          category: null,
        },
        {
          id: 'alloc-2',
          allocated_amount: 1000,
          spent_amount: 800, // Under
          is_essential: true,
          category: null,
        },
        {
          id: 'alloc-3',
          allocated_amount: 500,
          spent_amount: 600, // Over
          is_essential: false,
          category: null,
        },
      ];

      const periodQuery = createMockQuery(mockPeriod);
      const allocQuery = createMockQuery(mockAllocations);
      const incomeQuery = createMockQuery([]);
      const transQuery = createMockQuery([]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(periodQuery)
        .mockReturnValueOnce(allocQuery)
        .mockReturnValueOnce(incomeQuery)
        .mockReturnValueOnce(transQuery)
        .mockReturnValueOnce(transQuery)
        .mockReturnValueOnce(transQuery);

      const result = await getBudgetSummary('period-1');

      expect(result.categories_over_budget).toBe(2); // alloc-1 and alloc-3
    });
  });
});

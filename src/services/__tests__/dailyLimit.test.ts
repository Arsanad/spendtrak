/**
 * Daily Limit Service Tests
 */

import {
  getDailyLimit,
  setDailyLimit,
  getSafeToSpend,
} from '../dailyLimit';
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

describe('Daily Limit Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getDailyLimit', () => {
    it('should fetch daily limit for authenticated user', async () => {
      const mockLimit = {
        id: 'limit-1',
        user_id: 'user-123',
        daily_limit: 50.00,
        currency: 'USD',
        exclude_categories: [],
        exclude_recurring: true,
        is_active: true,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLimit, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDailyLimit();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_spending_limits');
      expect(result).toEqual(mockLimit);
    });

    it('should return null when no limit is set', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // No rows found
        }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDailyLimit();

      expect(result).toBeNull();
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getDailyLimit()).rejects.toThrow('Not authenticated');
    });
  });

  describe('setDailyLimit', () => {
    it('should create new daily limit when none exists', async () => {
      const mockLimit = {
        id: 'limit-1',
        user_id: 'user-123',
        daily_limit: 100.00,
        currency: 'USD',
        exclude_categories: [],
        exclude_recurring: true,
        is_active: true,
      };

      // Mock getDailyLimit returning null (no existing limit)
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        }),
      };

      // Mock insert
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLimit, error: null }),
      };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await setDailyLimit(100);

      expect(result).toEqual(mockLimit);
    });

    it('should update existing daily limit', async () => {
      const existingLimit = {
        id: 'limit-1',
        user_id: 'user-123',
        daily_limit: 50.00,
        currency: 'USD',
        exclude_categories: [],
        exclude_recurring: true,
        is_active: true,
      };

      const updatedLimit = {
        ...existingLimit,
        daily_limit: 100.00,
      };

      // Mock getDailyLimit returning existing limit
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingLimit, error: null }),
      };

      // Mock update
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedLimit, error: null }),
      };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const result = await setDailyLimit(100);

      expect(result.daily_limit).toBe(100);
    });
  });

  describe('getSafeToSpend', () => {
    it('should calculate remaining daily budget correctly', async () => {
      const mockLimit = {
        id: 'limit-1',
        user_id: 'user-123',
        daily_limit: 100.00,
        currency: 'USD',
        exclude_categories: [],
        exclude_recurring: true,
        is_active: true,
      };

      const mockTransactions = [
        { amount: 25.00, category_id: 'food', is_recurring: false },
        { amount: 15.00, category_id: 'transport', is_recurring: false },
      ];

      // Mock getDailyLimit
      const mockLimitQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLimit, error: null }),
      };

      // Mock transactions query - must support chained .eq() calls
      const mockTransactionsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation(() => mockTransactionsQuery),
      };
      // After all eq() calls, resolve with the transactions data
      (mockTransactionsQuery as any).then = (resolve: any) => {
        resolve({ data: mockTransactions, error: null });
        return mockTransactionsQuery;
      };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockLimitQuery)
        .mockReturnValueOnce(mockTransactionsQuery);

      const result = await getSafeToSpend();

      expect(result).not.toBeNull();
      expect(result!.daily_limit).toBe(100);
      expect(result!.spent_today).toBe(40); // 25 + 15
      expect(result!.remaining).toBe(60); // 100 - 40
      expect(result!.percentage_used).toBe(40); // 40%
      expect(result!.is_over_limit).toBe(false);
    });

    it('should return null when no daily limit is configured', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getSafeToSpend();

      expect(result).toBeNull();
    });

    it('should return null when daily limit is inactive', async () => {
      const mockLimit = {
        id: 'limit-1',
        user_id: 'user-123',
        daily_limit: 50.00,
        currency: 'USD',
        exclude_categories: [],
        exclude_recurring: true,
        is_active: false, // Inactive
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLimit, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getSafeToSpend();

      expect(result).toBeNull();
    });

    it('should indicate over limit when spending exceeds limit', async () => {
      const mockLimit = {
        id: 'limit-1',
        user_id: 'user-123',
        daily_limit: 50.00,
        currency: 'USD',
        exclude_categories: [],
        exclude_recurring: true,
        is_active: true,
      };

      const mockTransactions = [
        { amount: 40.00, category_id: 'food', is_recurring: false },
        { amount: 30.00, category_id: 'transport', is_recurring: false },
      ];

      const mockLimitQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLimit, error: null }),
      };

      // Mock transactions query with proper chaining
      const mockTransactionsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation(() => mockTransactionsQuery),
      };
      (mockTransactionsQuery as any).then = (resolve: any) => {
        resolve({ data: mockTransactions, error: null });
        return mockTransactionsQuery;
      };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockLimitQuery)
        .mockReturnValueOnce(mockTransactionsQuery);

      const result = await getSafeToSpend();

      expect(result).not.toBeNull();
      expect(result!.spent_today).toBe(70); // 40 + 30
      expect(result!.remaining).toBe(0); // Clamped to 0
      expect(result!.is_over_limit).toBe(true);
    });
  });
});

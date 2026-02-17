/**
 * Transactions Service Tests
 */

import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  searchTransactions,
  getTopMerchants,
} from '../transactions';
import { supabase } from '../supabase';
import { mockTransactions, mockTransaction, mockTransactionWithCategory } from '@/__mocks__/mockData';

// Create mock implementations
const createQueryBuilder = () => {
  const qb: any = {
    select: jest.fn(() => qb),
    insert: jest.fn(() => qb),
    update: jest.fn(() => qb),
    delete: jest.fn(() => qb),
    eq: jest.fn(() => qb),
    neq: jest.fn(() => qb),
    gte: jest.fn(() => qb),
    lte: jest.fn(() => qb),
    ilike: jest.fn(() => qb),
    order: jest.fn(() => qb),
    limit: jest.fn(() => qb),
    range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return qb;
};

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

describe('Transactions Service', () => {
  beforeEach(() => {
    // Reset and setup default mock behavior
    (supabase.from as jest.Mock).mockReturnValue(createQueryBuilder());
    // Mock all auth methods - default: no authenticated user
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  describe('getTransactions', () => {
    it('should fetch paginated transactions', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
          count: mockTransactions.length,
        }),
      });

      const result = await getTransactions({ page: 1, pageSize: 10 });

      expect(mockFrom).toHaveBeenCalledWith('transactions');
      expect(result.data).toEqual(mockTransactions);
      expect(result.total).toBe(mockTransactions.length);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should apply date filters', async () => {
      const mockGte = jest.fn().mockReturnThis();
      const mockLte = jest.fn().mockReturnThis();

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: mockGte,
        lte: mockLte,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await getTransactions({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockGte).toHaveBeenCalledWith('transaction_date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('transaction_date', '2024-01-31');
    });

    it('should apply category filter', async () => {
      const mockEq = jest.fn().mockReturnThis();

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await getTransactions({ categoryId: 'food-dining' });

      expect(mockEq).toHaveBeenCalledWith('category_id', 'food-dining');
    });

    it('should apply search query', async () => {
      const mockIlike = jest.fn().mockReturnThis();

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: mockIlike,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await getTransactions({ searchQuery: 'coffee' });

      expect(mockIlike).toHaveBeenCalledWith('merchant_name', '%coffee%');
    });

    it('should throw on database error', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.order = jest.fn(() => qb);
      qb.range = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await getTransactions();
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Database error');
      }
    });
  });

  describe('getTransaction', () => {
    it('should fetch single transaction by ID', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransactionWithCategory,
          error: null,
        }),
      });

      const result = await getTransaction('tx-001');

      expect(result).toEqual(mockTransactionWithCategory);
    });

    it('should throw for non-existent transaction', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await getTransaction('non-existent');
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Not found');
      }
    });
  });

  describe('createTransaction', () => {
    beforeEach(() => {
      // Mock authenticated user for all auth methods
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should create new transaction', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      });

      const newTransaction = {
        amount: 45.99,
        currency: 'USD',
        merchant_name: 'Starbucks',
        merchant_name_clean: null,
        category_id: null,
        transaction_date: '2024-01-15',
        transaction_time: null,
        transaction_type: 'purchase' as const,
        source: 'manual' as const,
        card_last_four: null,
        bank_name: null,
        receipt_image_url: null,
        notes: null,
        is_recurring: false,
        is_reviewed: false,
        is_deleted: false,
        deleted_at: null,
        metadata: {},
      };

      const result = await createTransaction(newTransaction);

      expect(result).toBeDefined();
      expect(mockFrom).toHaveBeenCalledWith('transactions');
    });

    it('should throw when not authenticated', async () => {
      // Reset all auth mocks to return no user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        createTransaction({
          amount: 10,
          currency: 'USD',
          merchant_name: 'Test',
          merchant_name_clean: null,
          category_id: null,
          transaction_date: '2024-01-01',
          transaction_time: null,
          transaction_type: 'purchase',
          source: 'manual',
          card_last_four: null,
          bank_name: null,
          receipt_image_url: null,
          notes: null,
          is_recurring: false,
          is_reviewed: false,
          is_deleted: false,
          deleted_at: null,
          metadata: {},
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockTransaction, amount: 100 },
          error: null,
        }),
      });

      const result = await updateTransaction('tx-001', { amount: 100 });

      expect(result.amount).toBe(100);
    });

    it('should throw on update error', async () => {
      const qb: any = {};
      qb.update = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.select = jest.fn(() => qb);
      qb.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await updateTransaction('tx-001', { amount: 100 });
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Update failed');
      }
    });
  });

  describe('deleteTransaction', () => {
    it('should soft delete transaction', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await deleteTransaction('tx-001');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: true,
        })
      );
    });

    it('should throw on delete error', async () => {
      const qb: any = {};
      qb.update = jest.fn(() => qb);
      qb.eq = jest.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await deleteTransaction('tx-001');
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Delete failed');
      }
    });
  });

  describe('getMonthlySummary', () => {
    it('should return monthly spending summary', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      });

      const result = await getMonthlySummary(new Date('2024-01-15'));

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('bySource');
      expect(typeof result.total).toBe('number');
    });

    it('should calculate correct totals', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [
            { amount: 100, source: 'email', category: null },
            { amount: 50, source: 'manual', category: null },
          ],
          error: null,
        }),
      });

      const result = await getMonthlySummary();

      expect(result.total).toBe(150);
      expect(result.transactionCount).toBe(2);
    });
  });

  describe('searchTransactions', () => {
    it('should search transactions by merchant name', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockTransactions.slice(0, 2),
          error: null,
        }),
      });

      const result = await searchTransactions('Amazon');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit results', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: mockLimit,
      });

      await searchTransactions('test', 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('getTopMerchants', () => {
    it('should return top merchants by spending', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { merchant_name: 'Amazon', amount: 300 },
            { merchant_name: 'Amazon', amount: 200 },
            { merchant_name: 'Starbucks', amount: 50 },
          ],
          error: null,
        }),
      });

      const result = await getTopMerchants(5);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should aggregate amounts by merchant', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { merchant_name: 'Amazon', amount: 100 },
            { merchant_name: 'Amazon', amount: 100 },
          ],
          error: null,
        }),
      });

      const result = await getTopMerchants(5);

      expect(result[0]?.amount).toBe(200);
      expect(result[0]?.count).toBe(2);
    });
  });
});

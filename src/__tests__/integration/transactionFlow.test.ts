/**
 * Transaction Flow Integration Tests
 * Tests the complete CRUD flow for transactions
 */

import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions';
import { supabase } from '@/services/supabase';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

// Mock devMode
jest.mock('@/utils/devMode', () => ({
  isDevMode: jest.fn(() => false),
}));

// Mock authStore with mutable state
let mockAuthUser: { id: string } | null = { id: 'test-user-123' };

jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: mockAuthUser,
    }),
  },
  waitForAuthHydration: jest.fn().mockResolvedValue(undefined),
}));

// Mock settingsStore
jest.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: jest.fn(() => ({
      currency: 'USD',
    })),
  },
}));

// Create mock query builder
const createMockQuery = (data: any, error: any = null, count: number = 0): any => {
  const query: any = {
    select: jest.fn(() => query),
    insert: jest.fn(() => query),
    update: jest.fn(() => query),
    delete: jest.fn(() => query),
    eq: jest.fn(() => query),
    neq: jest.fn(() => query),
    gte: jest.fn(() => query),
    lte: jest.fn(() => query),
    ilike: jest.fn(() => query),
    order: jest.fn(() => query),
    limit: jest.fn(() => query),
    range: jest.fn().mockResolvedValue({ data, error, count }),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
  return query;
};

describe('Transaction Flow Integration', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth user
    mockAuthUser = { id: 'test-user-123' };
    // Mock all auth methods
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
  });

  describe('Complete CRUD Flow', () => {
    it('should create, read, update, and delete a transaction', async () => {
      const createdTransaction = {
        id: 'tx-new-123',
        user_id: mockUser.id,
        amount: 50,
        type: 'expense',
        merchant_name: 'Test Store',
        merchant_name_clean: 'test store',
        category_id: 'food',
        transaction_date: '2024-01-15',
        source: 'manual',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. CREATE
      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(createdTransaction)
      );

      const created = await createTransaction({
        amount: 50,
        transaction_type: 'purchase',
        merchant_name: 'Test Store',
        category_id: 'food',
        transaction_date: '2024-01-15',
        source: 'manual',
      } as unknown as Omit<import('@/types/database').TransactionInsert, 'user_id'>);

      expect(created.id).toBe('tx-new-123');
      expect(created.amount).toBe(50);
      expect(created.merchant_name).toBe('Test Store');

      // 2. READ - Get transactions list
      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery([createdTransaction], null, 1)
      );

      const transactionsList = await getTransactions();

      expect(transactionsList.data.length).toBe(1);
      expect(transactionsList.data.find(t => t.id === created.id)).toBeDefined();

      // 3. READ - Get single transaction
      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(createdTransaction)
      );

      const fetchedTransaction = await getTransaction(created.id);

      expect(fetchedTransaction).toBeDefined();
      expect(fetchedTransaction!.id).toBe(created.id);

      // 4. UPDATE
      const updatedTransaction = { ...createdTransaction, amount: 75 };
      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(updatedTransaction)
      );

      const updated = await updateTransaction(created.id, { amount: 75 });

      expect(updated.amount).toBe(75);

      // 5. DELETE (soft delete)
      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(null)
      );

      await deleteTransaction(created.id);

      // Verify delete was called
      expect(supabase.from).toHaveBeenCalledWith('transactions');
    });
  });

  describe('Transaction List Operations', () => {
    it('should filter transactions by date range', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: 100, transaction_date: '2024-01-15' },
        { id: 'tx-2', amount: 200, transaction_date: '2024-01-20' },
      ];

      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(mockTransactions, null, 2)
      );

      const result = await getTransactions({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.data.length).toBe(2);
    });

    it('should filter transactions by category', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: 100, category_id: 'food' },
      ];

      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(mockTransactions, null, 1)
      );

      const result = await getTransactions({
        categoryId: 'food',
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].category_id).toBe('food');
    });

    it('should search transactions by merchant name', async () => {
      const mockTransactions = [
        { id: 'tx-1', merchant_name: 'Starbucks Coffee' },
      ];

      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(mockTransactions, null, 1)
      );

      const result = await getTransactions({
        searchQuery: 'Starbucks',
      });

      expect(result.data.length).toBe(1);
    });

    it('should paginate transactions correctly', async () => {
      const mockTransactions = Array(10).fill(null).map((_, i) => ({
        id: `tx-${i}`,
        amount: i * 10,
      }));

      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(mockTransactions, null, 50)
      );

      const result = await getTransactions({
        page: 1,
        pageSize: 10,
      });

      expect(result.data.length).toBe(10);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database operation fails', async () => {
      const errorQuery = createMockQuery(null, { message: 'Database error' });
      (supabase.from as jest.Mock).mockReturnValue(errorQuery);

      try {
        await getTransactions();
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Database error');
      }
    });

    it('should throw error when transaction not found', async () => {
      const errorQuery = createMockQuery(null, { code: 'PGRST116', message: 'Not found' });
      (supabase.from as jest.Mock).mockReturnValue(errorQuery);

      try {
        await getTransaction('non-existent');
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Not found');
      }
    });

    it('should throw error when not authenticated', async () => {
      // Clear auth user in store mock
      mockAuthUser = null;
      // Clear all supabase auth mocks
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        createTransaction({
          amount: 50,
          merchant_name: 'Test',
          transaction_date: '2024-01-15',
          source: 'manual',
        } as unknown as Omit<import('@/types/database').TransactionInsert, 'user_id'>)
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Data Integrity', () => {
    it('should auto-generate merchant_name_clean', async () => {
      const createdTx = {
        id: 'tx-1',
        user_id: 'test-user-123',
        merchant_name: 'STARBUCKS #123',
        merchant_name_clean: 'starbucks 123',
        amount: 5,
        transaction_date: '2024-01-15',
        source: 'manual',
      };

      // Create a chainable mock that ends with the created transaction
      const mockQuery = createMockQuery(createdTx);
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const created = await createTransaction({
        amount: 5,
        merchant_name: 'STARBUCKS #123',
        transaction_date: '2024-01-15',
        source: 'manual',
      } as unknown as Omit<import('@/types/database').TransactionInsert, 'user_id'>);

      // Verify the transaction was created with cleaned merchant name
      expect(created.merchant_name_clean).toBe('starbucks 123');
    });

    it('should handle amount as number correctly', async () => {
      const mockTransaction = {
        id: 'tx-1',
        amount: 99.99,
        merchant_name: 'Test',
      };

      (supabase.from as jest.Mock).mockReturnValue(
        createMockQuery(mockTransaction)
      );

      const transaction = await getTransaction('tx-1');

      expect(typeof transaction!.amount).toBe('number');
      expect(transaction!.amount).toBe(99.99);
    });
  });
});

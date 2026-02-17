/**
 * Transaction Splits Service Tests
 */

import {
  getTransactionSplits,
  splitTransaction,
  unsplitTransaction,
} from '../transactionSplits';
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

describe('Transaction Splits Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactionSplits', () => {
    it('should fetch splits for a transaction', async () => {
      const mockSplits = [
        {
          id: 'split-1',
          transaction_id: 'tx-1',
          category_id: 'food',
          amount: 30.00,
          notes: 'Groceries',
          category: { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
        },
        {
          id: 'split-2',
          transaction_id: 'tx-1',
          category_id: 'household',
          amount: 20.00,
          notes: 'Cleaning supplies',
          category: { id: 'household', name: 'Household', icon: 'home', color: '#4ECDC4' },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockSplits, error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTransactionSplits('tx-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('transaction_splits');
      expect(mockQuery.eq).toHaveBeenCalledWith('transaction_id', 'tx-1');
      expect(result).toEqual(mockSplits);
    });

    it('should return empty array when no splits exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTransactionSplits('tx-1');

      expect(result).toEqual([]);
    });

    it('should throw error on database error', async () => {
      const dbError = { message: 'DB Error' };
      const mockQuery: any = {
        select: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery),
        order: jest.fn(() => Promise.resolve({ data: null, error: dbError })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(getTransactionSplits('tx-1')).rejects.toEqual(dbError);
    });
  });

  describe('splitTransaction', () => {
    it('should validate split amounts equal transaction amount', async () => {
      const mockTransactionQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { amount: 100.00 },
          error: null
        }),
      };

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'split-1', transaction_id: 'tx-1', category_id: 'food', amount: 60 },
            { id: 'split-2', transaction_id: 'tx-1', category_id: 'shopping', amount: 40 },
          ],
          error: null
        }),
      };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockTransactionQuery)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const splits = [
        { category_id: 'food', amount: 60 },
        { category_id: 'shopping', amount: 40 },
      ];

      const result = await splitTransaction('tx-1', splits);

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(60);
      expect(result[1].amount).toBe(40);
    });

    it('should reject splits that exceed transaction amount', async () => {
      const mockTransactionQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { amount: 100.00 },
          error: null
        }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockTransactionQuery);

      const splits = [
        { category_id: 'food', amount: 80 },
        { category_id: 'shopping', amount: 50 },
      ];

      await expect(splitTransaction('tx-1', splits)).rejects.toThrow(
        'Split amounts (130.00) must equal transaction amount (100.00)'
      );
    });

    it('should reject splits that are less than transaction amount', async () => {
      const mockTransactionQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { amount: 100.00 },
          error: null
        }),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockTransactionQuery);

      const splits = [
        { category_id: 'food', amount: 40 },
        { category_id: 'shopping', amount: 30 },
      ];

      await expect(splitTransaction('tx-1', splits)).rejects.toThrow(
        'Split amounts (70.00) must equal transaction amount (100.00)'
      );
    });
  });

  describe('unsplitTransaction', () => {
    it('should delete all splits for a transaction', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      await unsplitTransaction('tx-1', 'food');

      expect(mockSupabase.from).toHaveBeenCalledWith('transaction_splits');
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('transaction_id', 'tx-1');
    });
  });
});

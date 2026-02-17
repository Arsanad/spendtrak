/**
 * Transaction Store Tests
 */

import { act } from '@testing-library/react-native';
import { useTransactionStore } from '../transactionStore';
import * as transactionService from '@/services/transactions';
import { mockTransactions } from '../../__mocks__/mockData';

// Mock transaction service
jest.mock('@/services/transactions', () => ({
  getTransactions: jest.fn(),
  getTransaction: jest.fn(),
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  getMonthlySummary: jest.fn(),
  getSpendingTrend: jest.fn(),
}));

const mockTransactionResponse = {
  data: mockTransactions,
  page: 1,
  pageSize: 20,
  total: mockTransactions.length,
  hasMore: false,
};

describe('Transaction Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useTransactionStore.setState({
      transactions: [],
      currentTransaction: null,
      monthlySummary: null,
      spendingTrend: [],
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
      filters: { page: 1, pageSize: 20, sortBy: 'transaction_date', sortOrder: 'desc' },
      isLoading: false,
      isLoadingMore: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTransactionStore.getState();

      expect(state.transactions).toEqual([]);
      expect(state.currentTransaction).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchTransactions', () => {
    it('should fetch transactions successfully', async () => {
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(
        mockTransactionResponse
      );

      await act(async () => {
        await useTransactionStore.getState().fetchTransactions();
      });

      const state = useTransactionStore.getState();
      expect(state.transactions).toEqual(mockTransactions);
      expect(state.pagination.total).toBe(mockTransactions.length);
      expect(state.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      (transactionService.getTransactions as jest.Mock).mockRejectedValue(
        new Error('Fetch failed')
      );

      await act(async () => {
        await useTransactionStore.getState().fetchTransactions();
      });

      const state = useTransactionStore.getState();
      expect(state.error).toBe('Fetch failed');
      expect(state.isLoading).toBe(false);
    });

    it('should merge filters with params', async () => {
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(
        mockTransactionResponse
      );

      await act(async () => {
        await useTransactionStore.getState().fetchTransactions({ categoryId: 'cat-1' });
      });

      expect(transactionService.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' })
      );
    });
  });

  describe('fetchMoreTransactions', () => {
    it('should fetch more transactions when hasMore is true', async () => {
      useTransactionStore.setState({
        transactions: mockTransactions,
        pagination: { page: 1, pageSize: 20, total: 50, hasMore: true },
      });

      (transactionService.getTransactions as jest.Mock).mockResolvedValue({
        data: mockTransactions,
        page: 2,
        pageSize: 20,
        total: 50,
        hasMore: true,
      });

      await act(async () => {
        await useTransactionStore.getState().fetchMoreTransactions();
      });

      const state = useTransactionStore.getState();
      expect(state.transactions.length).toBe(mockTransactions.length * 2);
      expect(state.pagination.page).toBe(2);
    });

    it('should not fetch when hasMore is false', async () => {
      useTransactionStore.setState({
        pagination: { page: 1, pageSize: 20, total: 10, hasMore: false },
      });

      await act(async () => {
        await useTransactionStore.getState().fetchMoreTransactions();
      });

      expect(transactionService.getTransactions).not.toHaveBeenCalled();
    });

    it('should not fetch when already loading', async () => {
      useTransactionStore.setState({
        isLoadingMore: true,
        pagination: { page: 1, pageSize: 20, total: 50, hasMore: true },
      });

      await act(async () => {
        await useTransactionStore.getState().fetchMoreTransactions();
      });

      expect(transactionService.getTransactions).not.toHaveBeenCalled();
    });
  });

  describe('fetchTransaction', () => {
    it('should fetch single transaction successfully', async () => {
      const mockTransaction = mockTransactions[0];
      (transactionService.getTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      await act(async () => {
        await useTransactionStore.getState().fetchTransaction('tx-1');
      });

      const state = useTransactionStore.getState();
      expect(state.currentTransaction).toEqual(mockTransaction);
    });

    it('should handle fetch error', async () => {
      (transactionService.getTransaction as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      await act(async () => {
        await useTransactionStore.getState().fetchTransaction('invalid-id');
      });

      const state = useTransactionStore.getState();
      expect(state.error).toBe('Not found');
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const newTransaction = { ...mockTransactions[0], id: 'new-tx' };
      (transactionService.createTransaction as jest.Mock).mockResolvedValue(newTransaction);
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(mockTransactionResponse);
      (transactionService.getMonthlySummary as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        const result = await useTransactionStore.getState().createTransaction({
          merchant_name: 'Test Merchant',
          amount: 100,
        });
        expect(result).toEqual(newTransaction);
      });
    });

    it('should handle create error', async () => {
      (transactionService.createTransaction as jest.Mock).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(
        act(async () => {
          await useTransactionStore.getState().createTransaction({
            merchant_name: 'Test',
          });
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction successfully', async () => {
      useTransactionStore.setState({ transactions: mockTransactions });
      (transactionService.updateTransaction as jest.Mock).mockResolvedValue(undefined);
      (transactionService.getMonthlySummary as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        await useTransactionStore.getState().updateTransaction(mockTransactions[0].id, {
          merchant_name: 'Updated Merchant',
        });
      });

      const state = useTransactionStore.getState();
      const updated = state.transactions.find((t) => t.id === mockTransactions[0].id);
      expect(updated?.merchant_name).toBe('Updated Merchant');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      useTransactionStore.setState({ transactions: mockTransactions });
      (transactionService.deleteTransaction as jest.Mock).mockResolvedValue(undefined);
      (transactionService.getMonthlySummary as jest.Mock).mockResolvedValue(null);

      const initialLength = mockTransactions.length;

      await act(async () => {
        await useTransactionStore.getState().deleteTransaction(mockTransactions[0].id);
      });

      const state = useTransactionStore.getState();
      expect(state.transactions.length).toBe(initialLength - 1);
      expect(state.transactions.find((t) => t.id === mockTransactions[0].id)).toBeUndefined();
    });
  });

  describe('fetchMonthlySummary', () => {
    it('should fetch monthly summary successfully', async () => {
      const mockSummary = {
        total: 1500,
        byCategory: [],
        bySource: { email: 0, receipt: 0, manual: 0, import: 0 },
        transactionCount: 10,
      };
      (transactionService.getMonthlySummary as jest.Mock).mockResolvedValue(mockSummary);

      await act(async () => {
        await useTransactionStore.getState().fetchMonthlySummary();
      });

      const state = useTransactionStore.getState();
      expect(state.monthlySummary).toEqual(mockSummary);
    });
  });

  describe('setFilters', () => {
    it('should set filters and fetch transactions', async () => {
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(
        mockTransactionResponse
      );

      await act(async () => {
        useTransactionStore.getState().setFilters({ categoryId: 'cat-1' });
      });

      const state = useTransactionStore.getState();
      expect(state.filters.categoryId).toBe('cat-1');
      expect(transactionService.getTransactions).toHaveBeenCalled();
    });
  });

  describe('clearFilters', () => {
    it('should reset filters to defaults', async () => {
      useTransactionStore.setState({
        filters: { categoryId: 'cat-1', page: 3 },
      });
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(
        mockTransactionResponse
      );

      await act(async () => {
        useTransactionStore.getState().clearFilters();
      });

      const state = useTransactionStore.getState();
      expect(state.filters.categoryId).toBeUndefined();
      expect(state.filters.page).toBe(1);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useTransactionStore.setState({ error: 'Some error' });

      act(() => {
        useTransactionStore.getState().clearError();
      });

      expect(useTransactionStore.getState().error).toBeNull();
    });
  });
});

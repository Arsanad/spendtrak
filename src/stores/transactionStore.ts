/**
 * Transaction Store
 * Manages transactions and spending data
 * SINGLE SOURCE OF TRUTH for all transaction data in the app
 */

import { create } from 'zustand';
import { InteractionManager } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '@/utils/logger';
import * as transactionService from '@/services/transactions';
import { useBehaviorStore } from './behaviorStore';
import { eventBus } from '@/services/eventBus';
import { useSettingsStore } from './settingsStore';
import { offlineQueue } from '@/services/offlineQueue';
import {
  convertCurrency as convertAmountSync,
  getFallbackRates,
} from '@/services/exchangeRates';
import type {
  Transaction,
  TransactionWithCategory,
  TransactionListParams,
  CategorySpending,
} from '@/types';

// Maximum number of transactions to keep in memory cache
const MAX_CACHED_TRANSACTIONS = 500;

// Computed summary type
interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

// Category totals type
interface CategoryTotal {
  total: number;
  count: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

// Monthly data type
interface MonthlyData {
  income: number;
  expenses: number;
  transactionCount: number;
}

interface TransactionState {
  // State
  transactions: TransactionWithCategory[];
  currentTransaction: TransactionWithCategory | null;

  // Computed summaries (recalculated on every change)
  summary: TransactionSummary;
  recentTransactions: TransactionWithCategory[];
  categoryTotals: Record<string, CategoryTotal>;
  monthlyData: Record<string, MonthlyData>;

  // Legacy monthly summary (from service - for current month details)
  monthlySummary: {
    total: number;
    byCategory: CategorySpending[];
    bySource: { email: number; receipt: number; manual: number; import: number };
    transactionCount: number;
  } | null;
  spendingTrend: { month: string; amount: number; transactionCount: number }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  filters: TransactionListParams;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchTransactions: (params?: TransactionListParams) => Promise<void>;
  fetchMoreTransactions: () => Promise<void>;
  fetchTransaction: (id: string) => Promise<void>;
  createTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchMonthlySummary: (month?: Date) => Promise<void>;
  fetchSpendingTrend: () => Promise<void>;
  setFilters: (filters: TransactionListParams) => void;
  clearFilters: () => void;
  clearError: () => void;

  // Internal: recalculate all summaries from transactions
  _recalculateSummaries: () => void;
}

const DEFAULT_FILTERS: TransactionListParams = {
  page: 1,
  pageSize: 20,
  sortBy: 'transaction_date',
  sortOrder: 'desc',
};

// Initial empty summary
const EMPTY_SUMMARY: TransactionSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  balance: 0,
  transactionCount: 0,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  // Initial state
  transactions: [],
  currentTransaction: null,
  summary: EMPTY_SUMMARY,
  recentTransactions: [],
  categoryTotals: {},
  monthlyData: {},
  monthlySummary: null,
  spendingTrend: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  },
  filters: DEFAULT_FILTERS,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  // Internal: Recalculate all computed values from transactions
  // All amounts are converted to the user's display currency before aggregating
  _recalculateSummaries: () => {
    const { transactions } = get();

    // Get user's display currency and exchange rates for proper conversion
    const userCurrency = useSettingsStore.getState().currency || 'AED';
    const rates = getFallbackRates();

    // Helper: convert a transaction's amount to the user's display currency
    const toUserCurrency = (amount: number, txCurrency: string): number => {
      const absAmount = Math.abs(amount);
      if (!txCurrency || txCurrency === userCurrency) return absAmount;
      return convertAmountSync(absAmount, txCurrency, userCurrency, rates);
    };

    // Calculate summary totals
    let totalIncome = 0;
    let totalExpenses = 0;

    // Get current month for filtering
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Calculate by category (current month only)
    const categoryTotals: Record<string, CategoryTotal> = {};

    // Calculate by month
    const monthlyData: Record<string, MonthlyData> = {};

    transactions.forEach((t) => {
      const txCurrency = t.currency || userCurrency;
      const amount = toUserCurrency(Number(t.amount), txCurrency);
      const isIncome = t.transaction_type === 'refund' || Number(t.amount) > 0;
      const monthKey = t.transaction_date.substring(0, 7); // "2025-01"

      // Overall totals (current month)
      if (monthKey === currentMonthKey) {
        if (isIncome) {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
        }

        // Category totals (current month expenses only)
        if (!isIncome && t.category_id) {
          if (!categoryTotals[t.category_id]) {
            categoryTotals[t.category_id] = {
              total: 0,
              count: 0,
              categoryName: t.category?.name || 'Unknown',
              categoryIcon: t.category?.icon || 'ellipsis-horizontal-outline',
              categoryColor: t.category?.color || '#888888',
            };
          }
          categoryTotals[t.category_id].total += amount;
          categoryTotals[t.category_id].count += 1;
        }
      }

      // Monthly data (all time)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, transactionCount: 0 };
      }
      if (isIncome) {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
      monthlyData[monthKey].transactionCount += 1;
    });

    // Recent transactions (last 20)
    const recentTransactions = transactions.slice(0, 20);

    set({
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: transactions.filter(
          (t) => t.transaction_date.substring(0, 7) === currentMonthKey
        ).length,
      },
      recentTransactions,
      categoryTotals,
      monthlyData,
    });
  },

  // Fetch transactions
  fetchTransactions: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const mergedParams = { ...get().filters, ...params };
      const response = await transactionService.getTransactions(mergedParams);

      set({
        transactions: response.data.slice(0, MAX_CACHED_TRANSACTIONS),
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          hasMore: response.hasMore,
        },
        filters: mergedParams,
        isLoading: false,
      });

      // Recalculate summaries after fetching
      get()._recalculateSummaries();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch more (pagination)
  fetchMoreTransactions: async () => {
    const { pagination, filters, transactions, isLoadingMore } = get();

    if (isLoadingMore || !pagination.hasMore) return;

    try {
      set({ isLoadingMore: true });

      const response = await transactionService.getTransactions({
        ...filters,
        page: pagination.page + 1,
      });

      set({
        transactions: [...transactions, ...response.data].slice(0, MAX_CACHED_TRANSACTIONS),
        pagination: {
          ...pagination,
          page: response.page,
          hasMore: response.hasMore && (transactions.length + response.data.length) < MAX_CACHED_TRANSACTIONS,
        },
        isLoadingMore: false,
      });

      // Recalculate summaries after fetching more
      get()._recalculateSummaries();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingMore: false,
      });
    }
  },

  // Fetch single transaction
  fetchTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const transaction = await transactionService.getTransaction(id);
      set({ currentTransaction: transaction, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Create transaction (with offline support)
  createTransaction: async (data) => {
    try {
      set({ isLoading: true, error: null });

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;

      let transaction: Transaction;

      if (!isOnline) {
        // Offline: create optimistic local transaction and queue for sync
        const optimisticId = `offline-txn-${Date.now()}`;
        const userCurrency = useSettingsStore.getState().currency || 'AED';

        transaction = {
          id: optimisticId,
          user_id: 'pending', // Will be set when synced
          amount: data.amount || 0,
          currency: data.currency || userCurrency,
          transaction_type: data.transaction_type || 'purchase',
          merchant_name: data.merchant_name || 'Unknown',
          merchant_name_clean: (data.merchant_name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
          category_id: data.category_id || null,
          transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
          transaction_time: null,
          source: data.source || 'manual',
          card_last_four: null,
          bank_name: null,
          receipt_image_url: null,
          notes: data.notes || null,
          is_recurring: false,
          is_reviewed: false,
          is_deleted: false,
          deleted_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add to local state optimistically
        const { transactions } = get();
        set({
          transactions: [transaction as TransactionWithCategory, ...transactions].slice(0, MAX_CACHED_TRANSACTIONS),
          isLoading: false,
        });
        get()._recalculateSummaries();

        // Queue for sync when online
        await offlineQueue.add({
          type: 'CREATE',
          endpoint: 'transactions',
          data: data,
          metadata: { optimisticId },
        });

        logger.transaction.info('Transaction queued for offline sync:', optimisticId);
      } else {
        // Online: create normally
        transaction = await transactionService.createTransaction(data as Parameters<typeof transactionService.createTransaction>[0]);

        // Refresh list and summaries
        await get().fetchTransactions();
        await get().fetchMonthlySummary();
      }

      // Get updated transactions list
      const { transactions } = get();

      // Set loading false immediately so UI is responsive
      set({ isLoading: false });

      // Emit event for Quantum Alive Experience
      eventBus.emit('transaction:created', {
        amount: Math.abs(Number(transaction.amount)),
        category: transaction.category_id ?? undefined,
        merchant: transaction.merchant_name ?? undefined,
        source: transaction.source ?? undefined,
      });

      // Defer behavioral processing to avoid blocking UI
      // Use InteractionManager to run after animations complete
      InteractionManager.runAfterInteractions(() => {
        const behaviorStore = useBehaviorStore.getState();

        // QUANTUM Acknowledgment - show on transaction (but non-blocking)
        behaviorStore.triggerAcknowledgment(transaction as TransactionWithCategory);

        // Run behavior evaluation in background (only if enough transactions)
        if (transactions.length >= 10) {
          // Process transaction for behavioral moments (non-blocking)
          behaviorStore.processTransaction(
            transaction as TransactionWithCategory,
            transactions.slice(0, 20) // Reduced context for performance
          ).catch((err) => {
            logger.transaction.warn('Behavioral processing failed:', err);
          });
        }
      });
      return transaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.transaction.error('Failed to create transaction:', {
        error: errorMessage,
        data,
        stack: error instanceof Error ? error.stack : undefined,
      });
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw new Error(`Failed to create transaction: ${errorMessage}`);
    }
  },

  // Update transaction
  updateTransaction: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      await transactionService.updateTransaction(id, data);

      // Update in list
      const { transactions } = get();
      set({
        transactions: transactions.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
        isLoading: false,
      });

      // Recalculate summaries after update
      get()._recalculateSummaries();
      await get().fetchMonthlySummary();

      // Emit event for Quantum Alive Experience
      eventBus.emit('transaction:updated', { id, changes: Object.keys(data) });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await transactionService.deleteTransaction(id);

      const { transactions } = get();
      set({
        transactions: transactions.filter((t) => t.id !== id),
        isLoading: false,
      });

      // Recalculate summaries after delete
      get()._recalculateSummaries();
      await get().fetchMonthlySummary();

      // Emit event for Quantum Alive Experience
      eventBus.emit('transaction:deleted', { id });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch monthly summary (detailed - from service)
  fetchMonthlySummary: async (month) => {
    try {
      const summary = await transactionService.getMonthlySummary(month);
      set({ monthlySummary: summary });
    } catch (error) {
      // Silent fail for summary
    }
  },

  // Fetch spending trend
  fetchSpendingTrend: async () => {
    try {
      const trend = await transactionService.getSpendingTrend();
      set({ spendingTrend: trend });
    } catch (error) {
      // Silent fail
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters, page: 1 } });
    get().fetchTransactions();
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    get().fetchTransactions();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

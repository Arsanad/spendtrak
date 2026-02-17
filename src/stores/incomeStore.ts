/**
 * Income Tracking Store
 * Zustand store for income and cash flow state management
 */

import { create } from 'zustand';
import type {
  Income,
  IncomeWithCategory,
  CashFlowSummary,
  IncomeBySource,
  IncomeInsert,
  IncomeUpdate,
} from '@/types';
import incomeService from '@/services/incomeTracking';

interface IncomeState {
  // Data
  income: IncomeWithCategory[];
  selectedIncome: IncomeWithCategory | null;
  cashFlowSummary: CashFlowSummary | null;
  incomeBySource: IncomeBySource[];
  monthlyTotals: Array<{ month: string; total: number }>;
  recurringMonthly: number;
  prediction: {
    predicted_total: number;
    recurring_portion: number;
    variable_portion: number;
    confidence: 'high' | 'medium' | 'low';
  } | null;

  // Filters
  dateRange: {
    startDate: string | undefined;
    endDate: string | undefined;
  };

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchIncome: () => Promise<void>;
  fetchIncomeDetails: (incomeId: string) => Promise<void>;
  createIncome: (income: Omit<IncomeInsert, 'user_id'>) => Promise<Income>;
  updateIncome: (incomeId: string, updates: IncomeUpdate) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  fetchCashFlowSummary: () => Promise<void>;
  fetchIncomeBySource: () => Promise<void>;
  fetchMonthlyTotals: (months?: number) => Promise<void>;
  fetchPrediction: () => Promise<void>;
  setDateRange: (startDate?: string, endDate?: string) => void;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useIncomeStore = create<IncomeState>((set, get) => ({
  // Initial state
  income: [],
  selectedIncome: null,
  cashFlowSummary: null,
  incomeBySource: [],
  monthlyTotals: [],
  recurringMonthly: 0,
  prediction: null,
  dateRange: {
    startDate: undefined,
    endDate: undefined,
  },
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch income entries
  fetchIncome: async () => {
    set({ isLoading: true, error: null });
    try {
      const { dateRange } = get();
      const income = await incomeService.getIncome(
        dateRange.startDate,
        dateRange.endDate
      );
      set({ income, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch income',
        isLoading: false,
      });
    }
  },

  // Fetch income details
  fetchIncomeDetails: async (incomeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const selectedIncome = await incomeService.getIncomeById(incomeId);
      set({ selectedIncome, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch income details',
        isLoading: false,
      });
    }
  },

  // Create new income
  createIncome: async (income) => {
    set({ isLoading: true, error: null });
    try {
      const newIncome = await incomeService.createIncome(income);

      // Fetch updated income list
      await get().fetchIncome();

      set({ isLoading: false });
      return newIncome;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create income',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update income
  updateIncome: async (incomeId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await incomeService.updateIncome(incomeId, updates);

      // Fetch updated income list
      await get().fetchIncome();

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update income',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete income
  deleteIncome: async (incomeId) => {
    set({ isLoading: true, error: null });
    try {
      await incomeService.deleteIncome(incomeId);
      const { income, selectedIncome } = get();

      set({
        income: income.filter(i => i.id !== incomeId),
        selectedIncome: selectedIncome?.id === incomeId ? null : selectedIncome,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete income',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch cash flow summary
  fetchCashFlowSummary: async () => {
    try {
      const cashFlowSummary = await incomeService.getCashFlowSummary();
      set({ cashFlowSummary });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch cash flow',
      });
    }
  },

  // Fetch income by source
  fetchIncomeBySource: async () => {
    try {
      const { dateRange } = get();
      const incomeBySource = await incomeService.getIncomeBySource(
        dateRange.startDate,
        dateRange.endDate
      );
      set({ incomeBySource });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch income by source',
      });
    }
  },

  // Fetch monthly totals
  fetchMonthlyTotals: async (months = 12) => {
    try {
      const monthlyTotals = await incomeService.getMonthlyIncomeTotals(months);
      set({ monthlyTotals });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch monthly totals',
      });
    }
  },

  // Fetch prediction
  fetchPrediction: async () => {
    try {
      const [prediction, recurringMonthly] = await Promise.all([
        incomeService.predictNextMonthIncome(),
        incomeService.getTotalRecurringMonthlyIncome(),
      ]);
      set({ prediction, recurringMonthly });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch prediction',
      });
    }
  },

  // Set date range filter
  setDateRange: (startDate, endDate) => {
    set({
      dateRange: { startDate, endDate },
    });
    // Refetch data with new range
    get().fetchIncome();
    get().fetchIncomeBySource();
  },

  // Refresh all data
  refreshAll: async () => {
    set({ isRefreshing: true });
    try {
      await Promise.all([
        get().fetchIncome(),
        get().fetchCashFlowSummary(),
        get().fetchIncomeBySource(),
        get().fetchMonthlyTotals(),
        get().fetchPrediction(),
      ]);
      set({ isRefreshing: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh data',
        isRefreshing: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useIncomeStore;

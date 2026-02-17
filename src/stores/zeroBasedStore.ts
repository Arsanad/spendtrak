/**
 * Zero-Based Budgeting Store
 * Zustand store for zero-based budgeting state management
 */

import { create } from 'zustand';
import type {
  ZeroBasedPeriod,
  ZeroBasedPeriodWithDetails,
  ZeroBasedAllocation,
  ZeroBasedAllocationWithCategory,
  ZeroBasedIncomeSource,
  ZeroBasedSummary,
} from '@/types';
import * as zeroBasedService from '@/services/zeroBased';

interface ZeroBasedState {
  // Data
  periods: ZeroBasedPeriod[];
  currentPeriod: ZeroBasedPeriodWithDetails | null;
  selectedPeriod: ZeroBasedPeriodWithDetails | null;
  summary: ZeroBasedSummary | null;

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Period actions
  fetchPeriods: () => Promise<void>;
  fetchCurrentPeriod: () => Promise<void>;
  selectPeriod: (periodId: string | null) => Promise<void>;
  createPeriod: (year: number, month: number, totalIncome: number) => Promise<ZeroBasedPeriod>;
  updatePeriod: (periodId: string, updates: Partial<ZeroBasedPeriod>) => Promise<void>;
  deletePeriod: (periodId: string) => Promise<void>;

  // Allocation actions
  createAllocation: (allocation: Omit<ZeroBasedAllocation, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<ZeroBasedAllocation>;
  updateAllocation: (allocationId: string, updates: Partial<ZeroBasedAllocation>) => Promise<void>;
  deleteAllocation: (allocationId: string) => Promise<void>;
  createFromCategories: (periodId: string, categories: Array<{ category_id: string; allocated_amount: number; is_essential: boolean }>) => Promise<void>;
  copyFromPeriod: (sourcePeriodId: string) => Promise<void>;
  autoDistribute: (prioritizeEssential?: boolean) => Promise<void>;

  // Income source actions
  createIncomeSource: (incomeSource: Omit<ZeroBasedIncomeSource, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<ZeroBasedIncomeSource>;
  updateIncomeSource: (incomeSourceId: string, updates: Partial<ZeroBasedIncomeSource>) => Promise<void>;
  deleteIncomeSource: (incomeSourceId: string) => Promise<void>;
  markIncomeReceived: (incomeSourceId: string, receivedAmount: number, receivedDate?: string) => Promise<void>;

  // Summary actions
  fetchSummary: () => Promise<void>;

  // General actions
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useZeroBasedStore = create<ZeroBasedState>((set, get) => ({
  // Initial state
  periods: [],
  currentPeriod: null,
  selectedPeriod: null,
  summary: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch all periods
  fetchPeriods: async () => {
    set({ isLoading: true, error: null });
    try {
      const periods = await zeroBasedService.getZeroBasedPeriods(true);
      set({ periods, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch periods',
        isLoading: false,
      });
    }
  },

  // Fetch current active period
  fetchCurrentPeriod: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentPeriod = await zeroBasedService.getCurrentPeriod();
      set({ currentPeriod, selectedPeriod: currentPeriod, isLoading: false });

      if (currentPeriod) {
        const summary = await zeroBasedService.getBudgetSummary(currentPeriod.id);
        set({ summary });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch current period',
        isLoading: false,
      });
    }
  },

  // Select a period
  selectPeriod: async (periodId) => {
    if (!periodId) {
      set({ selectedPeriod: null, summary: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const selectedPeriod = await zeroBasedService.getPeriodWithDetails(periodId);
      const summary = await zeroBasedService.getBudgetSummary(periodId);
      set({ selectedPeriod, summary, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch period',
        isLoading: false,
      });
    }
  },

  // Create a new monthly period
  createPeriod: async (year, month, totalIncome) => {
    set({ isLoading: true, error: null });
    try {
      const newPeriod = await zeroBasedService.createMonthlyPeriod(year, month, totalIncome);
      const { periods } = get();
      set({
        periods: [newPeriod, ...periods],
        isLoading: false,
      });

      // Select the new period
      await get().selectPeriod(newPeriod.id);

      return newPeriod;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create period',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update period
  updatePeriod: async (periodId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPeriod = await zeroBasedService.updatePeriod(periodId, updates);
      const { periods, currentPeriod, selectedPeriod } = get();

      set({
        periods: periods.map(p => p.id === periodId ? updatedPeriod : p),
        currentPeriod: currentPeriod?.id === periodId
          ? { ...currentPeriod, ...updatedPeriod }
          : currentPeriod,
        selectedPeriod: selectedPeriod?.id === periodId
          ? { ...selectedPeriod, ...updatedPeriod }
          : selectedPeriod,
        isLoading: false,
      });

      await get().fetchSummary();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update period',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete period
  deletePeriod: async (periodId) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.deletePeriod(periodId);
      const { periods, currentPeriod, selectedPeriod } = get();

      set({
        periods: periods.filter(p => p.id !== periodId),
        currentPeriod: currentPeriod?.id === periodId ? null : currentPeriod,
        selectedPeriod: selectedPeriod?.id === periodId ? null : selectedPeriod,
        summary: selectedPeriod?.id === periodId ? null : get().summary,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete period',
        isLoading: false,
      });
      throw error;
    }
  },

  // Create allocation
  createAllocation: async (allocation) => {
    set({ isLoading: true, error: null });
    try {
      const newAllocation = await zeroBasedService.createAllocation(allocation);

      // Refresh the selected period to get updated totals
      const { selectedPeriod } = get();
      if (selectedPeriod && selectedPeriod.id === allocation.period_id) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
      return newAllocation;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create allocation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update allocation
  updateAllocation: async (allocationId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.updateAllocation(allocationId, updates);

      // Refresh the selected period
      const { selectedPeriod } = get();
      if (selectedPeriod) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update allocation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete allocation
  deleteAllocation: async (allocationId) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.deleteAllocation(allocationId);

      // Refresh the selected period
      const { selectedPeriod } = get();
      if (selectedPeriod) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete allocation',
        isLoading: false,
      });
      throw error;
    }
  },

  // Create allocations from categories
  createFromCategories: async (periodId, categories) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.createAllocationsFromCategories(periodId, categories);
      await get().selectPeriod(periodId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create allocations',
        isLoading: false,
      });
      throw error;
    }
  },

  // Copy allocations from another period
  copyFromPeriod: async (sourcePeriodId) => {
    const { selectedPeriod } = get();
    if (!selectedPeriod) {
      throw new Error('No period selected');
    }

    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.copyAllocationsFromPeriod(sourcePeriodId, selectedPeriod.id);
      await get().selectPeriod(selectedPeriod.id);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to copy allocations',
        isLoading: false,
      });
      throw error;
    }
  },

  // Auto-distribute remaining income
  autoDistribute: async (prioritizeEssential = true) => {
    const { selectedPeriod } = get();
    if (!selectedPeriod) {
      throw new Error('No period selected');
    }

    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.autoDistributeRemaining(selectedPeriod.id, prioritizeEssential);
      await get().selectPeriod(selectedPeriod.id);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to auto-distribute',
        isLoading: false,
      });
      throw error;
    }
  },

  // Create income source
  createIncomeSource: async (incomeSource) => {
    set({ isLoading: true, error: null });
    try {
      const newIncomeSource = await zeroBasedService.createIncomeSource(incomeSource);

      // Refresh the selected period
      const { selectedPeriod } = get();
      if (selectedPeriod && selectedPeriod.id === incomeSource.period_id) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
      return newIncomeSource;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create income source',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update income source
  updateIncomeSource: async (incomeSourceId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.updateIncomeSource(incomeSourceId, updates);

      // Refresh the selected period
      const { selectedPeriod } = get();
      if (selectedPeriod) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update income source',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete income source
  deleteIncomeSource: async (incomeSourceId) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.deleteIncomeSource(incomeSourceId);

      // Refresh the selected period
      const { selectedPeriod } = get();
      if (selectedPeriod) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete income source',
        isLoading: false,
      });
      throw error;
    }
  },

  // Mark income as received
  markIncomeReceived: async (incomeSourceId, receivedAmount, receivedDate) => {
    set({ isLoading: true, error: null });
    try {
      await zeroBasedService.markIncomeReceived(incomeSourceId, receivedAmount, receivedDate);

      // Refresh the selected period
      const { selectedPeriod } = get();
      if (selectedPeriod) {
        await get().selectPeriod(selectedPeriod.id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark income received',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch summary
  fetchSummary: async () => {
    const { selectedPeriod } = get();
    if (!selectedPeriod) return;

    try {
      const summary = await zeroBasedService.getBudgetSummary(selectedPeriod.id);
      set({ summary });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch summary',
      });
    }
  },

  // Refresh all data
  refreshAll: async () => {
    set({ isRefreshing: true });
    try {
      await get().fetchPeriods();
      await get().fetchCurrentPeriod();
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

export default useZeroBasedStore;

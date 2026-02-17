/**
 * Debt Management Store
 * Zustand store for debt tracking state management
 */

import { create } from 'zustand';
import type {
  Debt,
  DebtWithPayments,
  PayoffPlan,
  DebtSummary,
  PayoffStrategy,
  DebtInsert,
  DebtUpdate,
  DebtPaymentInsert,
} from '@/types';
import debtService from '@/services/debtManagement';
import { eventBus } from '@/services/eventBus';

interface DebtState {
  // Data
  debts: Debt[];
  selectedDebt: DebtWithPayments | null;
  payoffPlan: PayoffPlan[];
  summary: DebtSummary | null;
  preferredStrategy: PayoffStrategy;
  extraPayment: number;

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchDebts: () => Promise<void>;
  fetchDebtDetails: (debtId: string) => Promise<void>;
  createDebt: (debt: Omit<DebtInsert, 'user_id'>) => Promise<Debt>;
  updateDebt: (debtId: string, updates: DebtUpdate) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<void>;
  recordPayment: (payment: Omit<DebtPaymentInsert, 'user_id'>) => Promise<void>;
  calculatePayoffPlan: () => Promise<void>;
  setStrategy: (strategy: PayoffStrategy) => void;
  setExtraPayment: (amount: number) => void;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useDebtStore = create<DebtState>((set, get) => ({
  // Initial state
  debts: [],
  selectedDebt: null,
  payoffPlan: [],
  summary: null,
  preferredStrategy: 'avalanche',
  extraPayment: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch all debts
  fetchDebts: async () => {
    set({ isLoading: true, error: null });
    try {
      const [debts, summary] = await Promise.all([
        debtService.getDebts(true),
        debtService.getDebtSummary(),
      ]);
      set({ debts, summary, isLoading: false });

      // Also update payoff plan if debts exist
      if (debts.length > 0) {
        const { preferredStrategy, extraPayment } = get();
        const payoffPlan = await debtService.calculatePayoffPlan(
          preferredStrategy,
          extraPayment
        );
        set({ payoffPlan });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch debts',
        isLoading: false,
      });
    }
  },

  // Fetch debt details with payment history
  fetchDebtDetails: async (debtId: string) => {
    set({ isLoading: true, error: null });
    try {
      const selectedDebt = await debtService.getDebtWithPayments(debtId);
      set({ selectedDebt, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch debt details',
        isLoading: false,
      });
    }
  },

  // Create new debt
  createDebt: async (debt) => {
    set({ isLoading: true, error: null });
    try {
      const newDebt = await debtService.createDebt(debt);
      const { debts } = get();
      set({
        debts: [newDebt, ...debts],
        isLoading: false,
      });

      // Refresh summary and payoff plan
      get().refreshAll();

      // Emit event for Quantum Alive Experience
      eventBus.emit('debt:created', { name: newDebt.name || 'Debt', amount: Number(newDebt.current_balance) || 0 });

      return newDebt;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create debt',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update debt
  updateDebt: async (debtId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDebt = await debtService.updateDebt(debtId, updates);
      const { debts, selectedDebt } = get();

      set({
        debts: debts.map(d => d.id === debtId ? updatedDebt : d),
        selectedDebt: selectedDebt?.id === debtId
          ? { ...selectedDebt, ...updatedDebt }
          : selectedDebt,
        isLoading: false,
      });

      // Refresh summary and payoff plan
      get().refreshAll();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update debt',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete debt
  deleteDebt: async (debtId) => {
    set({ isLoading: true, error: null });
    try {
      await debtService.deleteDebt(debtId);
      const { debts, selectedDebt } = get();

      set({
        debts: debts.filter(d => d.id !== debtId),
        selectedDebt: selectedDebt?.id === debtId ? null : selectedDebt,
        isLoading: false,
      });

      // Refresh summary and payoff plan
      get().refreshAll();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete debt',
        isLoading: false,
      });
      throw error;
    }
  },

  // Record payment
  recordPayment: async (payment) => {
    set({ isLoading: true, error: null });
    try {
      await debtService.recordPayment(payment);

      // Refresh the debt details if viewing
      const { selectedDebt } = get();
      if (selectedDebt && selectedDebt.id === payment.debt_id) {
        await get().fetchDebtDetails(payment.debt_id);
      }

      // Refresh debts list and summary
      await get().refreshAll();

      set({ isLoading: false });

      // Emit event for Quantum Alive Experience
      const updatedDebt = get().debts.find(d => d.id === payment.debt_id);
      const remaining = Number(updatedDebt?.current_balance) || 0;
      eventBus.emit('debt:payment', {
        name: updatedDebt?.name || 'Debt',
        amount: Number(payment.amount) || 0,
        remaining,
      });
      if (remaining <= 0) {
        eventBus.emit('debt:paid_off', { name: updatedDebt?.name || 'Debt' });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to record payment',
        isLoading: false,
      });
      throw error;
    }
  },

  // Calculate payoff plan
  calculatePayoffPlan: async () => {
    const { preferredStrategy, extraPayment } = get();
    try {
      const payoffPlan = await debtService.calculatePayoffPlan(
        preferredStrategy,
        extraPayment
      );
      set({ payoffPlan });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to calculate payoff plan',
      });
    }
  },

  // Set preferred strategy
  setStrategy: (strategy) => {
    set({ preferredStrategy: strategy });
    get().calculatePayoffPlan();
  },

  // Set extra payment amount
  setExtraPayment: (amount) => {
    set({ extraPayment: amount });
    get().calculatePayoffPlan();
  },

  // Refresh all data
  refreshAll: async () => {
    set({ isRefreshing: true });
    try {
      const { preferredStrategy, extraPayment } = get();

      const [debts, summary, payoffPlan] = await Promise.all([
        debtService.getDebts(true),
        debtService.getDebtSummary(),
        debtService.calculatePayoffPlan(preferredStrategy, extraPayment),
      ]);

      set({
        debts,
        summary,
        payoffPlan,
        isRefreshing: false,
      });
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

export default useDebtStore;

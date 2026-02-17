/**
 * Bill Calendar Store
 * Zustand store for bill tracking state management
 */

import { create } from 'zustand';
import type {
  Bill,
  BillInsert,
  BillUpdate,
  BillWithCategory,
  BillPayment,
  BillOccurrence,
  BillCalendarMonth,
  BillSummary,
} from '@/types';
import * as billService from '@/services/billCalendar';
import { eventBus } from '@/services/eventBus';

interface BillState {
  // Data
  bills: BillWithCategory[];
  selectedBill: BillWithCategory | null;
  calendarData: BillCalendarMonth | null;
  upcomingBills: BillOccurrence[];
  overdueBills: BillOccurrence[];
  summary: BillSummary | null;

  // Calendar navigation
  currentYear: number;
  currentMonth: number;

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Bill actions
  fetchBills: () => Promise<void>;
  selectBill: (billId: string | null) => Promise<void>;
  createBill: (bill: Omit<BillInsert, 'user_id'>) => Promise<Bill>;
  updateBill: (billId: string, updates: BillUpdate) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;

  // Payment actions
  markBillPaid: (paymentId: string, options?: {
    amountPaid?: number;
    paidDate?: string;
    transactionId?: string;
    notes?: string;
  }) => Promise<void>;

  // Calendar actions
  fetchCalendarMonth: (year?: number, month?: number) => Promise<void>;
  navigateMonth: (direction: 'prev' | 'next') => Promise<void>;
  goToToday: () => Promise<void>;

  // Summary actions
  fetchSummary: () => Promise<void>;
  fetchUpcoming: (days?: number) => Promise<void>;
  fetchOverdue: () => Promise<void>;

  // General actions
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useBillStore = create<BillState>((set, get) => {
  const today = new Date();

  return {
    // Initial state
    bills: [],
    selectedBill: null,
    calendarData: null,
    upcomingBills: [],
    overdueBills: [],
    summary: null,
    currentYear: today.getFullYear(),
    currentMonth: today.getMonth() + 1,
    isLoading: false,
    isRefreshing: false,
    error: null,

    // Fetch all bills
    fetchBills: async () => {
      set({ isLoading: true, error: null });
      try {
        const bills = await billService.getBills(true);
        set({ bills, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch bills',
          isLoading: false,
        });
      }
    },

    // Select a bill
    selectBill: async (billId) => {
      if (!billId) {
        set({ selectedBill: null });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const selectedBill = await billService.getBill(billId);
        set({ selectedBill, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch bill',
          isLoading: false,
        });
      }
    },

    // Create bill
    createBill: async (bill) => {
      set({ isLoading: true, error: null });
      try {
        const newBill = await billService.createBill(bill);
        await get().fetchBills();
        await get().fetchCalendarMonth();
        await get().fetchSummary();
        set({ isLoading: false });

        // Emit event for Quantum Alive Experience
        eventBus.emit('bill:created', { name: bill.name || 'Bill', amount: Number(bill.amount) || 0 });

        return newBill;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create bill',
          isLoading: false,
        });
        throw error;
      }
    },

    // Update bill
    updateBill: async (billId, updates) => {
      set({ isLoading: true, error: null });
      try {
        const updatedBill = await billService.updateBill(billId, updates);
        const { bills, selectedBill } = get();
        set({
          bills: bills.map(b => b.id === billId ? { ...b, ...updatedBill } : b),
          selectedBill: selectedBill?.id === billId ? { ...selectedBill, ...updatedBill } : selectedBill,
          isLoading: false,
        });
        await get().fetchCalendarMonth();
        await get().fetchSummary();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update bill',
          isLoading: false,
        });
        throw error;
      }
    },

    // Delete bill
    deleteBill: async (billId) => {
      set({ isLoading: true, error: null });
      try {
        await billService.deleteBill(billId);
        const { bills, selectedBill } = get();
        set({
          bills: bills.filter(b => b.id !== billId),
          selectedBill: selectedBill?.id === billId ? null : selectedBill,
          isLoading: false,
        });
        await get().fetchCalendarMonth();
        await get().fetchSummary();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete bill',
          isLoading: false,
        });
        throw error;
      }
    },

    // Mark bill as paid
    markBillPaid: async (paymentId, options) => {
      set({ isLoading: true, error: null });
      try {
        await billService.markBillAsPaid(paymentId, options);
        await get().fetchCalendarMonth();
        await get().fetchSummary();
        await get().fetchUpcoming();
        await get().fetchOverdue();
        set({ isLoading: false });

        // Emit event for Quantum Alive Experience
        eventBus.emit('bill:paid', { name: 'Bill', amount: options?.amountPaid || 0 });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to mark bill as paid',
          isLoading: false,
        });
        throw error;
      }
    },

    // Fetch calendar month
    fetchCalendarMonth: async (year, month) => {
      const { currentYear, currentMonth } = get();
      const targetYear = year ?? currentYear;
      const targetMonth = month ?? currentMonth;

      set({ isLoading: true, error: null });
      try {
        const calendarData = await billService.getBillCalendarMonth(targetYear, targetMonth);
        set({
          calendarData,
          currentYear: targetYear,
          currentMonth: targetMonth,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch calendar',
          isLoading: false,
        });
      }
    },

    // Navigate month
    navigateMonth: async (direction) => {
      const { currentYear, currentMonth } = get();
      let newYear = currentYear;
      let newMonth = currentMonth;

      if (direction === 'prev') {
        newMonth--;
        if (newMonth < 1) {
          newMonth = 12;
          newYear--;
        }
      } else {
        newMonth++;
        if (newMonth > 12) {
          newMonth = 1;
          newYear++;
        }
      }

      await get().fetchCalendarMonth(newYear, newMonth);
    },

    // Go to today
    goToToday: async () => {
      const today = new Date();
      await get().fetchCalendarMonth(today.getFullYear(), today.getMonth() + 1);
    },

    // Fetch summary
    fetchSummary: async () => {
      try {
        const summary = await billService.getBillSummary();
        set({ summary });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch summary',
        });
      }
    },

    // Fetch upcoming bills
    fetchUpcoming: async (days = 30) => {
      try {
        const upcomingBills = await billService.getUpcomingBills(days);
        set({ upcomingBills });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch upcoming bills',
        });
      }
    },

    // Fetch overdue bills
    fetchOverdue: async () => {
      try {
        const overdueBills = await billService.getOverdueBills();
        set({ overdueBills });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch overdue bills',
        });
      }
    },

    // Refresh all
    refreshAll: async () => {
      set({ isRefreshing: true });
      try {
        await Promise.all([
          get().fetchBills(),
          get().fetchCalendarMonth(),
          get().fetchSummary(),
          get().fetchUpcoming(),
          get().fetchOverdue(),
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
  };
});

export default useBillStore;

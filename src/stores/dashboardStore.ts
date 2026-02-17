/**
 * Dashboard Store
 * Manages dashboard state and quick data
 */

import { create } from 'zustand';
import * as transactionService from '@/services/transactions';
import * as subscriptionService from '@/services/subscriptions';
import * as alertService from '@/services/alerts';
import type {
  SubscriptionSummary,
  Alert,
  CategorySpending,
} from '@/types';

interface DashboardState {
  // State
  summary: {
    totalSpent: number;
    transactionCount: number;
    byCategory: CategorySpending[];
    comparison: {
      previous: number;
      change: number;
      direction: 'up' | 'down' | 'same';
    };
  } | null;
  subscriptionSummary: SubscriptionSummary | null;
  criticalAlerts: Alert[];
  unreadAlertCount: number;
  totalSavings: number;
  isLoading: boolean;
  lastRefreshed: Date | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  summary: null,
  subscriptionSummary: null,
  criticalAlerts: [],
  unreadAlertCount: 0,
  totalSavings: 0,
  isLoading: false,
  lastRefreshed: null,

  // Fetch all dashboard data
  fetchDashboard: async () => {
    try {
      set({ isLoading: true });

      // Fetch all data in parallel
      const [
        monthlySummary,
        subscriptionSummary,
        criticalAlerts,
        unreadCount,
      ] = await Promise.all([
        transactionService.getMonthlySummary(),
        subscriptionService.getSubscriptionSummary(),
        alertService.getCriticalAlerts(),
        alertService.getUnreadCount(),
      ]);

      // Calculate comparison with previous month
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousSummary = await transactionService.getMonthlySummary(previousMonth);

      const change = monthlySummary.total - previousSummary.total;
      const changePercent = previousSummary.total > 0
        ? (change / previousSummary.total) * 100
        : 0;

      set({
        summary: {
          totalSpent: monthlySummary.total,
          transactionCount: monthlySummary.transactionCount,
          byCategory: monthlySummary.byCategory,
          comparison: {
            previous: previousSummary.total,
            change: changePercent,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
          },
        },
        subscriptionSummary,
        criticalAlerts,
        unreadAlertCount: unreadCount,
        isLoading: false,
        lastRefreshed: new Date(),
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  // Refresh dashboard
  refreshDashboard: async () => {
    await get().fetchDashboard();
  },
}));

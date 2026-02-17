/**
 * Dashboard Store Tests
 */

import { useDashboardStore } from '../dashboardStore';
import * as transactionService from '@/services/transactions';
import * as subscriptionService from '@/services/subscriptions';
import * as alertService from '@/services/alerts';

jest.mock('@/services/transactions', () => ({
  getMonthlySummary: jest.fn(),
}));

jest.mock('@/services/subscriptions', () => ({
  getSubscriptionSummary: jest.fn(),
}));

jest.mock('@/services/alerts', () => ({
  getCriticalAlerts: jest.fn(),
  getUnreadCount: jest.fn(),
}));

const mockMonthlySummary = {
  total: 1500,
  transactionCount: 25,
  byCategory: [
    { category_id: 'food', category_name: 'Food', amount: 500, percentage: 33 },
  ],
  bySource: { email: 10, receipt: 5, manual: 10, import: 0 },
};

const mockPreviousSummary = {
  total: 1200,
  transactionCount: 20,
  byCategory: [],
  bySource: { email: 0, receipt: 0, manual: 0, import: 0 },
};

const mockSubscriptionSummary = {
  total_monthly: 94.97,
  total_yearly: 1139.64,
  active_count: 3,
  potential_savings: 54.99,
  upcoming_renewals: 1,
};

const mockAlerts = [
  { id: 'alert-1', severity: 'critical', title: 'Budget exceeded' },
];

describe('Dashboard Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDashboardStore.setState({
      summary: null,
      subscriptionSummary: null,
      criticalAlerts: [],
      unreadAlertCount: 0,
      totalSavings: 0,
      isLoading: false,
      lastRefreshed: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useDashboardStore.getState();

      expect(state.summary).toBeNull();
      expect(state.subscriptionSummary).toBeNull();
      expect(state.criticalAlerts).toEqual([]);
      expect(state.unreadAlertCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.lastRefreshed).toBeNull();
    });
  });

  describe('fetchDashboard', () => {
    it('should fetch all dashboard data successfully', async () => {
      (transactionService.getMonthlySummary as jest.Mock)
        .mockResolvedValueOnce(mockMonthlySummary)
        .mockResolvedValueOnce(mockPreviousSummary);
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockResolvedValue(mockSubscriptionSummary);
      (alertService.getCriticalAlerts as jest.Mock)
        .mockResolvedValue(mockAlerts);
      (alertService.getUnreadCount as jest.Mock)
        .mockResolvedValue(2);

      await useDashboardStore.getState().fetchDashboard();

      const state = useDashboardStore.getState();
      expect(state.summary).toBeDefined();
      expect(state.summary?.totalSpent).toBe(1500);
      expect(state.summary?.transactionCount).toBe(25);
      expect(state.subscriptionSummary).toEqual(mockSubscriptionSummary);
      expect(state.criticalAlerts).toEqual(mockAlerts);
      expect(state.unreadAlertCount).toBe(2);
      expect(state.isLoading).toBe(false);
      expect(state.lastRefreshed).toBeInstanceOf(Date);
    });

    it('should calculate spending comparison correctly', async () => {
      (transactionService.getMonthlySummary as jest.Mock)
        .mockResolvedValueOnce(mockMonthlySummary)  // current
        .mockResolvedValueOnce(mockPreviousSummary); // previous
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockResolvedValue(mockSubscriptionSummary);
      (alertService.getCriticalAlerts as jest.Mock)
        .mockResolvedValue([]);
      (alertService.getUnreadCount as jest.Mock)
        .mockResolvedValue(0);

      await useDashboardStore.getState().fetchDashboard();

      const state = useDashboardStore.getState();
      expect(state.summary?.comparison.direction).toBe('up');
      // (1500 - 1200) / 1200 * 100 = 25%
      expect(state.summary?.comparison.change).toBe(25);
      expect(state.summary?.comparison.previous).toBe(1200);
    });

    it('should set direction to down when spending decreased', async () => {
      const lowerSummary = { ...mockMonthlySummary, total: 800 };
      (transactionService.getMonthlySummary as jest.Mock)
        .mockResolvedValueOnce(lowerSummary)
        .mockResolvedValueOnce(mockPreviousSummary);
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockResolvedValue(mockSubscriptionSummary);
      (alertService.getCriticalAlerts as jest.Mock)
        .mockResolvedValue([]);
      (alertService.getUnreadCount as jest.Mock)
        .mockResolvedValue(0);

      await useDashboardStore.getState().fetchDashboard();

      expect(useDashboardStore.getState().summary?.comparison.direction).toBe('down');
    });

    it('should set direction to same when spending unchanged', async () => {
      const sameSummary = { ...mockMonthlySummary, total: 1200 };
      (transactionService.getMonthlySummary as jest.Mock)
        .mockResolvedValueOnce(sameSummary)
        .mockResolvedValueOnce(mockPreviousSummary);
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockResolvedValue(mockSubscriptionSummary);
      (alertService.getCriticalAlerts as jest.Mock)
        .mockResolvedValue([]);
      (alertService.getUnreadCount as jest.Mock)
        .mockResolvedValue(0);

      await useDashboardStore.getState().fetchDashboard();

      expect(useDashboardStore.getState().summary?.comparison.direction).toBe('same');
    });

    it('should handle fetch error gracefully', async () => {
      (transactionService.getMonthlySummary as jest.Mock)
        .mockRejectedValue(new Error('Network error'));
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockRejectedValue(new Error('Network error'));
      (alertService.getCriticalAlerts as jest.Mock)
        .mockRejectedValue(new Error('Network error'));
      (alertService.getUnreadCount as jest.Mock)
        .mockRejectedValue(new Error('Network error'));

      await useDashboardStore.getState().fetchDashboard();

      const state = useDashboardStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.summary).toBeNull(); // unchanged
    });

    it('should handle zero previous month total', async () => {
      const zeroPrevious = { ...mockPreviousSummary, total: 0 };
      (transactionService.getMonthlySummary as jest.Mock)
        .mockResolvedValueOnce(mockMonthlySummary)
        .mockResolvedValueOnce(zeroPrevious);
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockResolvedValue(mockSubscriptionSummary);
      (alertService.getCriticalAlerts as jest.Mock)
        .mockResolvedValue([]);
      (alertService.getUnreadCount as jest.Mock)
        .mockResolvedValue(0);

      await useDashboardStore.getState().fetchDashboard();

      const state = useDashboardStore.getState();
      expect(state.summary?.comparison.change).toBe(0);
    });
  });

  describe('refreshDashboard', () => {
    it('should call fetchDashboard', async () => {
      (transactionService.getMonthlySummary as jest.Mock)
        .mockResolvedValue(mockMonthlySummary);
      (subscriptionService.getSubscriptionSummary as jest.Mock)
        .mockResolvedValue(mockSubscriptionSummary);
      (alertService.getCriticalAlerts as jest.Mock)
        .mockResolvedValue([]);
      (alertService.getUnreadCount as jest.Mock)
        .mockResolvedValue(0);

      await useDashboardStore.getState().refreshDashboard();

      expect(transactionService.getMonthlySummary).toHaveBeenCalled();
    });
  });
});

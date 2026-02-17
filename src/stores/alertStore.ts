/**
 * Alert Store
 * Manages smart alerts and notifications
 */

import { create } from 'zustand';
import * as alertService from '@/services/alerts';
import type { Alert, AlertListParams } from '@/types';

interface AlertState {
  // State
  alerts: Alert[];
  unreadCount: number;
  criticalAlerts: Alert[];
  filters: AlertListParams;
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAlerts: (params?: AlertListParams) => Promise<void>;
  fetchMoreAlerts: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchCriticalAlerts: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  markAsActioned: (id: string) => Promise<void>;
  setFilters: (filters: AlertListParams) => void;
  clearError: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  // Initial state
  alerts: [],
  unreadCount: 0,
  criticalAlerts: [],
  filters: {},
  pagination: {
    page: 1,
    total: 0,
    hasMore: false,
  },
  isLoading: false,
  error: null,

  // Fetch alerts
  fetchAlerts: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const mergedParams = { ...get().filters, ...params, page: 1 };
      const response = await alertService.getAlerts(mergedParams);

      set({
        alerts: response.data,
        pagination: {
          page: response.page,
          total: response.total,
          hasMore: response.hasMore,
        },
        filters: mergedParams,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch more alerts
  fetchMoreAlerts: async () => {
    const { pagination, filters, alerts, isLoading } = get();

    if (isLoading || !pagination.hasMore) return;

    try {
      set({ isLoading: true });

      const response = await alertService.getAlerts({
        ...filters,
        page: pagination.page + 1,
      });

      set({
        alerts: [...alerts, ...response.data],
        pagination: {
          ...pagination,
          page: response.page,
          hasMore: response.hasMore,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const count = await alertService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      // Silent fail
    }
  },

  // Fetch critical alerts
  fetchCriticalAlerts: async () => {
    try {
      const alerts = await alertService.getCriticalAlerts();
      set({ criticalAlerts: alerts });
    } catch (error) {
      // Silent fail
    }
  },

  // Mark as read
  markAsRead: async (id) => {
    try {
      await alertService.markAsRead(id);

      const { alerts, unreadCount } = get();
      const alert = alerts.find((a) => a.id === id);

      set({
        alerts: alerts.map((a) =>
          a.id === id ? { ...a, is_read: true, read_at: new Date().toISOString() } : a
        ),
        unreadCount: alert && !alert.is_read ? unreadCount - 1 : unreadCount,
      });
    } catch (error) {
      // Silent fail
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await alertService.markAllAsRead();

      const { alerts } = get();
      set({
        alerts: alerts.map((a) => ({
          ...a,
          is_read: true,
          read_at: a.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Dismiss alert
  dismissAlert: async (id) => {
    try {
      await alertService.dismissAlert(id);

      const { alerts, unreadCount } = get();
      const alert = alerts.find((a) => a.id === id);

      set({
        alerts: alerts.filter((a) => a.id !== id),
        unreadCount: alert && !alert.is_read ? unreadCount - 1 : unreadCount,
      });
    } catch (error) {
      // Silent fail
    }
  },

  // Mark as actioned
  markAsActioned: async (id) => {
    try {
      await alertService.markAsActioned(id);

      const { alerts } = get();
      set({
        alerts: alerts.map((a) =>
          a.id === id ? { ...a, is_actioned: true } : a
        ),
      });
    } catch (error) {
      // Silent fail
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchAlerts();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

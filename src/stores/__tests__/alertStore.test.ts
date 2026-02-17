/**
 * Alert Store Tests
 */

import { act } from '@testing-library/react-native';
import { useAlertStore } from '../alertStore';
import * as alertService from '@/services/alerts';
import { mockAlerts } from '../../__mocks__/mockData';

// Mock alert service
jest.mock('@/services/alerts', () => ({
  getAlerts: jest.fn(),
  getUnreadCount: jest.fn(),
  getCriticalAlerts: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  dismissAlert: jest.fn(),
  markAsActioned: jest.fn(),
}));

const mockAlertResponse = {
  data: mockAlerts,
  page: 1,
  total: mockAlerts.length,
  hasMore: false,
};

describe('Alert Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAlertStore.setState({
      alerts: [],
      unreadCount: 0,
      criticalAlerts: [],
      filters: {},
      pagination: { page: 1, total: 0, hasMore: false },
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAlertStore.getState();

      expect(state.alerts).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.criticalAlerts).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchAlerts', () => {
    it('should fetch alerts successfully', async () => {
      (alertService.getAlerts as jest.Mock).mockResolvedValue(mockAlertResponse);

      await act(async () => {
        await useAlertStore.getState().fetchAlerts();
      });

      const state = useAlertStore.getState();
      expect(state.alerts).toEqual(mockAlerts);
      expect(state.pagination.total).toBe(mockAlerts.length);
      expect(state.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      (alertService.getAlerts as jest.Mock).mockRejectedValue(
        new Error('Fetch failed')
      );

      await act(async () => {
        await useAlertStore.getState().fetchAlerts();
      });

      const state = useAlertStore.getState();
      expect(state.error).toBe('Fetch failed');
    });
  });

  describe('fetchMoreAlerts', () => {
    it('should fetch more alerts when hasMore is true', async () => {
      useAlertStore.setState({
        alerts: mockAlerts,
        pagination: { page: 1, total: 50, hasMore: true },
      });

      (alertService.getAlerts as jest.Mock).mockResolvedValue({
        data: mockAlerts,
        page: 2,
        total: 50,
        hasMore: true,
      });

      await act(async () => {
        await useAlertStore.getState().fetchMoreAlerts();
      });

      const state = useAlertStore.getState();
      expect(state.alerts.length).toBe(mockAlerts.length * 2);
      expect(state.pagination.page).toBe(2);
    });

    it('should not fetch when hasMore is false', async () => {
      useAlertStore.setState({
        pagination: { page: 1, total: 10, hasMore: false },
      });

      await act(async () => {
        await useAlertStore.getState().fetchMoreAlerts();
      });

      expect(alertService.getAlerts).not.toHaveBeenCalled();
    });
  });

  describe('fetchUnreadCount', () => {
    it('should fetch unread count successfully', async () => {
      (alertService.getUnreadCount as jest.Mock).mockResolvedValue(5);

      await act(async () => {
        await useAlertStore.getState().fetchUnreadCount();
      });

      const state = useAlertStore.getState();
      expect(state.unreadCount).toBe(5);
    });
  });

  describe('fetchCriticalAlerts', () => {
    it('should fetch critical alerts successfully', async () => {
      const criticalAlerts = mockAlerts.filter((a) => a.severity === 'critical');
      (alertService.getCriticalAlerts as jest.Mock).mockResolvedValue(criticalAlerts);

      await act(async () => {
        await useAlertStore.getState().fetchCriticalAlerts();
      });

      const state = useAlertStore.getState();
      expect(state.criticalAlerts).toEqual(criticalAlerts);
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      const unreadAlert = { ...mockAlerts[0], is_read: false };
      useAlertStore.setState({
        alerts: [unreadAlert],
        unreadCount: 1,
      });
      (alertService.markAsRead as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAlertStore.getState().markAsRead(unreadAlert.id);
      });

      const state = useAlertStore.getState();
      expect(state.alerts[0].is_read).toBe(true);
      expect(state.alerts[0].read_at).toBeDefined();
      expect(state.unreadCount).toBe(0);
    });

    it('should not decrement unread count for already read alert', async () => {
      const readAlert = { ...mockAlerts[0], is_read: true };
      useAlertStore.setState({
        alerts: [readAlert],
        unreadCount: 0,
      });
      (alertService.markAsRead as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAlertStore.getState().markAsRead(readAlert.id);
      });

      const state = useAlertStore.getState();
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read', async () => {
      const unreadAlerts = mockAlerts.map((a) => ({ ...a, is_read: false }));
      useAlertStore.setState({
        alerts: unreadAlerts,
        unreadCount: unreadAlerts.length,
      });
      (alertService.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAlertStore.getState().markAllAsRead();
      });

      const state = useAlertStore.getState();
      expect(state.alerts.every((a) => a.is_read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should handle error', async () => {
      (alertService.markAllAsRead as jest.Mock).mockRejectedValue(
        new Error('Mark all failed')
      );

      await act(async () => {
        await useAlertStore.getState().markAllAsRead();
      });

      const state = useAlertStore.getState();
      expect(state.error).toBe('Mark all failed');
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss alert and remove from list', async () => {
      useAlertStore.setState({
        alerts: mockAlerts,
        unreadCount: 1,
      });
      (alertService.dismissAlert as jest.Mock).mockResolvedValue(undefined);

      const alertToDismiss = mockAlerts[0];
      const initialLength = mockAlerts.length;

      await act(async () => {
        await useAlertStore.getState().dismissAlert(alertToDismiss.id);
      });

      const state = useAlertStore.getState();
      expect(state.alerts.length).toBe(initialLength - 1);
      expect(state.alerts.find((a) => a.id === alertToDismiss.id)).toBeUndefined();
    });

    it('should decrement unread count when dismissing unread alert', async () => {
      const unreadAlert = { ...mockAlerts[0], is_read: false };
      useAlertStore.setState({
        alerts: [unreadAlert],
        unreadCount: 1,
      });
      (alertService.dismissAlert as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAlertStore.getState().dismissAlert(unreadAlert.id);
      });

      const state = useAlertStore.getState();
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAsActioned', () => {
    it('should mark alert as actioned', async () => {
      useAlertStore.setState({
        alerts: mockAlerts.map((a) => ({ ...a, is_actioned: false })),
      });
      (alertService.markAsActioned as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useAlertStore.getState().markAsActioned(mockAlerts[0].id);
      });

      const state = useAlertStore.getState();
      const actioned = state.alerts.find((a) => a.id === mockAlerts[0].id);
      expect(actioned?.is_actioned).toBe(true);
    });
  });

  describe('setFilters', () => {
    it('should set filters and fetch alerts', async () => {
      (alertService.getAlerts as jest.Mock).mockResolvedValue(mockAlertResponse);

      await act(async () => {
        useAlertStore.getState().setFilters({ severity: 'critical' });
      });

      const state = useAlertStore.getState();
      expect(state.filters.severity).toBe('critical');
      expect(alertService.getAlerts).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useAlertStore.setState({ error: 'Some error' });

      act(() => {
        useAlertStore.getState().clearError();
      });

      expect(useAlertStore.getState().error).toBeNull();
    });
  });
});

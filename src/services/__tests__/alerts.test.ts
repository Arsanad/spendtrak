/**
 * Alerts Service Tests
 */

import {
  getAlerts,
  getUnreadCount,
  getCriticalAlerts,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  createAlert,
} from '../alerts';
import { supabase } from '../supabase';
import { mockAlerts, mockAlert } from '@/__mocks__/mockData';

// Create mock query builder
const createQueryBuilder = () => {
  const qb: any = {};
  qb.select = jest.fn(() => qb);
  qb.insert = jest.fn(() => qb);
  qb.update = jest.fn(() => qb);
  qb.eq = jest.fn(() => qb);
  qb.neq = jest.fn(() => qb);
  qb.order = jest.fn(() => qb);
  qb.range = jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
  qb.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  qb.then = (resolve: Function) => resolve({ data: [], error: null, count: 0 });
  return qb;
};

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('Alerts Service', () => {
  beforeEach(() => {
    // Reset mock to default behavior
    (supabase.from as jest.Mock).mockReturnValue(createQueryBuilder());
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  describe('getAlerts', () => {
    it('should fetch paginated alerts', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockAlerts,
          error: null,
          count: mockAlerts.length,
        }),
      });

      const result = await getAlerts({ page: 1, pageSize: 10 });

      expect(mockFrom).toHaveBeenCalledWith('alerts');
      expect(result.data).toEqual(mockAlerts);
      expect(result.total).toBe(mockAlerts.length);
    });

    it('should filter by type', async () => {
      const mockEq = jest.fn().mockReturnThis();

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockAlerts.filter(a => a.alert_type === 'unusual_spending'),
          error: null,
          count: 1,
        }),
      });

      await getAlerts({ type: 'unusual_spending' });

      expect(mockEq).toHaveBeenCalledWith('alert_type', 'unusual_spending');
    });

    it('should filter by severity', async () => {
      const mockEq = jest.fn().mockReturnThis();

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockAlerts.filter(a => a.severity === 'critical'),
          error: null,
          count: 1,
        }),
      });

      await getAlerts({ severity: 'critical' });

      expect(mockEq).toHaveBeenCalledWith('severity', 'critical');
    });

    it('should filter by read status', async () => {
      const mockEq = jest.fn().mockReturnThis();

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockAlerts.filter(a => !a.is_read),
          error: null,
          count: 2,
        }),
      });

      await getAlerts({ isRead: false });

      expect(mockEq).toHaveBeenCalledWith('is_read', false);
    });

    it('should throw on error', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.order = jest.fn(() => qb);
      qb.range = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await getAlerts();
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Database error');
      }
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread alerts', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.then = (resolve: Function) => resolve({ count: 5, error: null });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      const count = await getUnreadCount();

      expect(typeof count).toBe('number');
    });

    it('should throw on error', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.then = (resolve: Function) => resolve({ count: null, error: { message: 'Error' } });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await getUnreadCount();
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Error');
      }
    });
  });

  describe('getCriticalAlerts', () => {
    it('should return critical unread alerts', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockAlerts.filter(a => a.severity === 'critical'),
          error: null,
        }),
      });

      const result = await getCriticalAlerts();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit to 5 alerts', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: mockLimit,
      });

      await getCriticalAlerts();

      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('markAsRead', () => {
    it('should update alert as read', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await markAsRead('alert-001');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_read: true,
        })
      );
    });

    it('should throw on error', async () => {
      const qb: any = {};
      qb.update = jest.fn(() => qb);
      qb.eq = jest.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await markAsRead('alert-001');
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Update failed');
      }
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread alerts', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await markAllAsRead();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_read: true,
        })
      );
      expect(mockEq).toHaveBeenCalledWith('is_read', false);
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss alert', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await dismissAlert('alert-001');

      expect(mockUpdate).toHaveBeenCalledWith({ is_dismissed: true });
    });
  });

  describe('createAlert', () => {
    beforeEach(() => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.auth as any).getUser = mockGetUser;
    });

    it('should create new alert', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockAlert,
          error: null,
        }),
      });

      const newAlert = {
        alert_type: 'unusual_spending' as const,
        severity: 'warning' as const,
        title: 'Test Alert',
        message: 'Test message',
        action_url: null,
        action_label: null,
        related_entity_type: null,
        related_entity_id: null,
        data: {},
        is_read: false,
        is_dismissed: false,
        is_actioned: false,
        read_at: null,
        expires_at: null,
      };

      const result = await createAlert(newAlert);

      expect(result).toBeDefined();
      expect(result.alert_type).toBe('unusual_spending');
    });

    it('should throw when not authenticated', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
      });
      (supabase.auth as any).getUser = mockGetUser;

      await expect(
        createAlert({
          alert_type: 'unusual_spending',
          severity: 'warning',
          title: 'Test',
          message: 'Test',
          action_url: null,
          action_label: null,
          related_entity_type: null,
          related_entity_id: null,
          data: {},
          is_read: false,
          is_dismissed: false,
          is_actioned: false,
          read_at: null,
          expires_at: null,
        })
      ).rejects.toThrow('Not authenticated');
    });
  });
});

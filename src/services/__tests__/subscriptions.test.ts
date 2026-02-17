/**
 * Subscriptions Service Tests
 */

import {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionSummary,
  getUpcomingRenewals,
  getUnusedSubscriptions,
  markAsUsed,
  generateCancellationEmail,
} from '../subscriptions';
import { supabase } from '../supabase';
import { mockSubscription, mockSubscriptions } from '@/__mocks__/mockData';

// Create mock query builder
const createQueryBuilder = () => {
  const qb: any = {};
  qb.select = jest.fn(() => qb);
  qb.insert = jest.fn(() => qb);
  qb.update = jest.fn(() => qb);
  qb.delete = jest.fn(() => qb);
  qb.eq = jest.fn(() => qb);
  qb.neq = jest.fn(() => qb);
  qb.gte = jest.fn(() => qb);
  qb.lte = jest.fn(() => qb);
  qb.order = jest.fn(() => Promise.resolve({ data: [], error: null }));
  qb.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  return qb;
};

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

describe('Subscriptions Service', () => {
  beforeEach(() => {
    // Reset mock to default behavior
    (supabase.from as jest.Mock).mockReturnValue(createQueryBuilder());
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({ data: null, error: null });
    ((supabase as any).rpc as jest.Mock).mockResolvedValue({ data: null, error: null });
  });

  describe('getSubscriptions', () => {
    it('should fetch all subscriptions', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSubscriptions,
          error: null,
        }),
      });

      const result = await getSubscriptions();

      expect(mockFrom).toHaveBeenCalledWith('subscriptions');
      expect(result).toEqual(mockSubscriptions);
    });

    it('should filter by status', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.order = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      // Make the query awaitable with the expected result
      qb.then = (resolve: Function) => resolve({
        data: mockSubscriptions.filter(s => s.status === 'active'),
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      await getSubscriptions('active');

      expect(qb.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should throw on error', async () => {
      const qb: any = {};
      qb.select = jest.fn(() => qb);
      qb.order = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      try {
        await getSubscriptions();
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('Database error');
      }
    });
  });

  describe('getSubscription', () => {
    it('should fetch single subscription', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        }),
      });

      const result = await getSubscription('sub-001');

      expect(result).toEqual(mockSubscription);
    });
  });

  describe('createSubscription', () => {
    beforeEach(() => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.auth as any).getUser = mockGetUser;
    });

    it('should create new subscription', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        }),
      });

      const newSubscription = {
        merchant_name: 'Netflix',
        display_name: null,
        icon: null,
        category_id: null,
        amount: 22.99,
        currency: 'USD',
        frequency: 'monthly' as const,
        billing_day: null,
        next_billing_date: null,
        last_billing_date: null,
        status: 'active' as const,
        cancellation_url: null,
        cancellation_instructions: null,
        auto_detected: false,
        detection_confidence: null,
        last_used_at: null,
        usage_count: 0,
        notes: null,
        metadata: {},
      };

      const result = await createSubscription(newSubscription);

      expect(result).toBeDefined();
    });

    it('should throw when not authenticated', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
      });
      (supabase.auth as any).getUser = mockGetUser;

      await expect(
        createSubscription({
          merchant_name: 'Test',
          display_name: null,
          icon: null,
          category_id: null,
          amount: 10,
          currency: 'USD',
          frequency: 'monthly',
          billing_day: null,
          next_billing_date: null,
          last_billing_date: null,
          status: 'active',
          cancellation_url: null,
          cancellation_instructions: null,
          auto_detected: false,
          detection_confidence: null,
          last_used_at: null,
          usage_count: 0,
          notes: null,
          metadata: {},
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockSubscription, amount: 29.99 },
          error: null,
        }),
      });

      const result = await updateSubscription('sub-001', { amount: 29.99 });

      expect(result.amount).toBe(29.99);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription and log savings', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockImplementation((table) => {
        if (table === 'subscriptions') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockSubscription, status: 'cancelled' },
              error: null,
            }),
          };
        }
        if (table === 'savings_log') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await cancelSubscription('sub-001', 'Too expensive');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('getSubscriptionSummary', () => {
    it('should return subscription summary', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockSubscriptions,
          error: null,
        }),
      });

      const result = await getSubscriptionSummary();

      expect(result).toHaveProperty('total_monthly');
      expect(result).toHaveProperty('total_yearly');
      expect(result).toHaveProperty('active_count');
      expect(result).toHaveProperty('cancelled_count');
      expect(result).toHaveProperty('potential_savings');
    });

    it('should return zero values when no subscriptions', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const result = await getSubscriptionSummary();

      expect(result.total_monthly).toBe(0);
      expect(result.active_count).toBe(0);
    });

    it('should calculate monthly totals correctly', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { ...mockSubscription, amount: 10, frequency: 'monthly', status: 'active' },
            { ...mockSubscription, amount: 120, frequency: 'yearly', status: 'active' },
          ],
          error: null,
        }),
      });

      const result = await getSubscriptionSummary();

      // 10 + (120/12) = 20
      expect(result.total_monthly).toBe(20);
    });
  });

  describe('getUpcomingRenewals', () => {
    it('should return subscriptions renewing soon', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockSubscription],
          error: null,
        }),
      });

      const result = await getUpcomingRenewals(7);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUnusedSubscriptions', () => {
    it('should return unused subscriptions', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({
          data: [mockSubscriptions[2]], // Adobe - unused
          error: null,
        }),
      });

      const result = await getUnusedSubscriptions(30);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('markAsUsed', () => {
    it('should update last_used_at timestamp', async () => {
      const qb: any = {};
      qb.update = jest.fn(() => qb);
      qb.eq = jest.fn(() => qb);
      qb.select = jest.fn(() => qb);
      qb.single = jest.fn().mockResolvedValue({ data: { usage_count: 5 }, error: null });

      (supabase.from as jest.Mock).mockReturnValue(qb);

      await markAsUsed('sub-001');

      expect(qb.update).toHaveBeenCalled();
    });
  });

  describe('generateCancellationEmail', () => {
    it('should generate email template', () => {
      const email = generateCancellationEmail(mockSubscription);

      expect(email).toContain('Subject: Cancellation Request');
      expect(email).toContain('Netflix');
      expect(email).toContain('$22.99');
    });

    it('should use display name if available', () => {
      const email = generateCancellationEmail({
        ...mockSubscription,
        display_name: 'Netflix Premium',
      });

      expect(email).toContain('Netflix Premium');
    });
  });
});

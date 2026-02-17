/**
 * Subscription Store Tests
 */

import { act } from '@testing-library/react-native';
import { useSubscriptionStore } from '../subscriptionStore';
import * as subscriptionService from '@/services/subscriptions';
import { mockSubscriptions, mockSubscriptionSummary } from '../../__mocks__/mockData';

// Mock subscription service
jest.mock('@/services/subscriptions', () => ({
  getSubscriptions: jest.fn(),
  getSubscription: jest.fn(),
  getSubscriptionSummary: jest.fn(),
  getUpcomingRenewals: jest.fn(),
  createSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  markAsUsed: jest.fn(),
  generateCancellationEmail: jest.fn(),
}));

describe('Subscription Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useSubscriptionStore.setState({
      subscriptions: [],
      currentSubscription: null,
      summary: null,
      upcomingRenewals: [],
      filters: { status: 'active' },
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSubscriptionStore.getState();

      expect(state.subscriptions).toEqual([]);
      expect(state.currentSubscription).toBeNull();
      expect(state.summary).toBeNull();
      expect(state.filters.status).toBe('active');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchSubscriptions', () => {
    it('should fetch subscriptions successfully', async () => {
      (subscriptionService.getSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscriptions();
      });

      const state = useSubscriptionStore.getState();
      expect(state.subscriptions).toEqual(mockSubscriptions);
      expect(state.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      (subscriptionService.getSubscriptions as jest.Mock).mockRejectedValue(
        new Error('Fetch failed')
      );

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscriptions();
      });

      const state = useSubscriptionStore.getState();
      expect(state.error).toBe('Fetch failed');
    });

    it('should filter by status', async () => {
      (subscriptionService.getSubscriptions as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscriptions('cancelled');
      });

      expect(subscriptionService.getSubscriptions).toHaveBeenCalledWith('cancelled');
    });
  });

  describe('fetchSubscription', () => {
    it('should fetch single subscription successfully', async () => {
      const mockSubscription = mockSubscriptions[0];
      (subscriptionService.getSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      await act(async () => {
        await useSubscriptionStore.getState().fetchSubscription('sub-1');
      });

      const state = useSubscriptionStore.getState();
      expect(state.currentSubscription).toEqual(mockSubscription);
    });
  });

  describe('fetchSummary', () => {
    it('should fetch summary successfully', async () => {
      (subscriptionService.getSubscriptionSummary as jest.Mock).mockResolvedValue(
        mockSubscriptionSummary
      );

      await act(async () => {
        await useSubscriptionStore.getState().fetchSummary();
      });

      const state = useSubscriptionStore.getState();
      expect(state.summary).toEqual(mockSubscriptionSummary);
    });
  });

  describe('fetchUpcomingRenewals', () => {
    it('should fetch upcoming renewals successfully', async () => {
      const mockRenewals = [mockSubscriptions[0]];
      (subscriptionService.getUpcomingRenewals as jest.Mock).mockResolvedValue(mockRenewals);

      await act(async () => {
        await useSubscriptionStore.getState().fetchUpcomingRenewals();
      });

      const state = useSubscriptionStore.getState();
      expect(state.upcomingRenewals).toEqual(mockRenewals);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const newSubscription = { ...mockSubscriptions[0], id: 'new-sub' };
      (subscriptionService.createSubscription as jest.Mock).mockResolvedValue(newSubscription);
      (subscriptionService.getSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
      (subscriptionService.getSubscriptionSummary as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        const result = await useSubscriptionStore.getState().createSubscription({
          merchant_name: 'Netflix',
          amount: 15.99,
        });
        expect(result).toEqual(newSubscription);
      });
    });

    it('should handle create error', async () => {
      (subscriptionService.createSubscription as jest.Mock).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(
        act(async () => {
          await useSubscriptionStore.getState().createSubscription({
            merchant_name: 'Test',
          });
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      useSubscriptionStore.setState({ subscriptions: mockSubscriptions.map(s => ({ ...s, category: null })) });
      (subscriptionService.updateSubscription as jest.Mock).mockResolvedValue(undefined);
      (subscriptionService.getSubscriptionSummary as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        await useSubscriptionStore.getState().updateSubscription(mockSubscriptions[0].id, {
          display_name: 'Updated Name',
        });
      });

      const state = useSubscriptionStore.getState();
      const updated = state.subscriptions.find((s) => s.id === mockSubscriptions[0].id);
      expect(updated?.display_name).toBe('Updated Name');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      useSubscriptionStore.setState({ subscriptions: mockSubscriptions.map(s => ({ ...s, category: null })) });
      (subscriptionService.cancelSubscription as jest.Mock).mockResolvedValue(undefined);
      (subscriptionService.getSubscriptionSummary as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        await useSubscriptionStore.getState().cancelSubscription(
          mockSubscriptions[0].id,
          'Too expensive'
        );
      });

      const state = useSubscriptionStore.getState();
      const cancelled = state.subscriptions.find((s) => s.id === mockSubscriptions[0].id);
      expect(cancelled?.status).toBe('cancelled');
    });

    it('should handle cancel error', async () => {
      (subscriptionService.cancelSubscription as jest.Mock).mockRejectedValue(
        new Error('Cancel failed')
      );

      await expect(
        act(async () => {
          await useSubscriptionStore.getState().cancelSubscription('sub-1');
        })
      ).rejects.toThrow('Cancel failed');
    });
  });

  describe('markAsUsed', () => {
    it('should mark subscription as used', async () => {
      useSubscriptionStore.setState({
        subscriptions: mockSubscriptions.map((s) => ({ ...s, usage_count: 0, category: null })),
      });
      (subscriptionService.markAsUsed as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useSubscriptionStore.getState().markAsUsed(mockSubscriptions[0].id);
      });

      const state = useSubscriptionStore.getState();
      const marked = state.subscriptions.find((s) => s.id === mockSubscriptions[0].id);
      expect(marked?.usage_count).toBe(1);
      expect(marked?.last_used_at).toBeDefined();
    });
  });

  describe('setFilters', () => {
    it('should set filters and fetch subscriptions', async () => {
      (subscriptionService.getSubscriptions as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        useSubscriptionStore.getState().setFilters({ status: 'cancelled' });
      });

      const state = useSubscriptionStore.getState();
      expect(state.filters.status).toBe('cancelled');
      expect(subscriptionService.getSubscriptions).toHaveBeenCalled();
    });
  });

  describe('generateCancellationEmail', () => {
    it('should generate cancellation email', () => {
      const mockEmail = 'Dear Support, I would like to cancel...';
      (subscriptionService.generateCancellationEmail as jest.Mock).mockReturnValue(mockEmail);

      const result = useSubscriptionStore
        .getState()
        .generateCancellationEmail(mockSubscriptions[0] as any);

      expect(result).toBe(mockEmail);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useSubscriptionStore.setState({ error: 'Some error' });

      act(() => {
        useSubscriptionStore.getState().clearError();
      });

      expect(useSubscriptionStore.getState().error).toBeNull();
    });
  });
});

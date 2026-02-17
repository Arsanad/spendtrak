/**
 * Subscription Store
 * Manages subscriptions and Subscription Killer feature
 */

import { create } from 'zustand';
import * as subscriptionService from '@/services/subscriptions';
import { eventBus } from '@/services/eventBus';
import type {
  Subscription,
  SubscriptionWithCategory,
  SubscriptionSummary,
  SubscriptionListParams,
  SubscriptionStatus,
} from '@/types';

interface SubscriptionState {
  // State
  subscriptions: SubscriptionWithCategory[];
  currentSubscription: SubscriptionWithCategory | null;
  summary: SubscriptionSummary | null;
  upcomingRenewals: Subscription[];
  filters: { status?: SubscriptionStatus };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSubscriptions: (status?: SubscriptionStatus) => Promise<void>;
  fetchSubscription: (id: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchUpcomingRenewals: () => Promise<void>;
  createSubscription: (data: Partial<Subscription>) => Promise<Subscription>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  cancelSubscription: (id: string, reason?: string) => Promise<void>;
  markAsUsed: (id: string) => Promise<void>;
  setFilters: (filters: { status?: SubscriptionStatus }) => void;
  generateCancellationEmail: (subscription: Subscription) => string;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  subscriptions: [],
  currentSubscription: null,
  summary: null,
  upcomingRenewals: [],
  filters: { status: 'active' },
  isLoading: false,
  error: null,

  // Fetch all subscriptions
  fetchSubscriptions: async (status) => {
    try {
      set({ isLoading: true, error: null });

      const filterStatus = status || get().filters.status;
      const subscriptions = await subscriptionService.getSubscriptions(filterStatus);

      set({
        subscriptions,
        filters: { status: filterStatus },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch single subscription
  fetchSubscription: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const subscription = await subscriptionService.getSubscription(id);
      set({ currentSubscription: subscription, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch summary
  fetchSummary: async () => {
    try {
      const summary = await subscriptionService.getSubscriptionSummary();
      set({ summary });
    } catch (error) {
      // Silent fail
    }
  },

  // Fetch upcoming renewals
  fetchUpcomingRenewals: async () => {
    try {
      const renewals = await subscriptionService.getUpcomingRenewals();
      set({ upcomingRenewals: renewals });
    } catch (error) {
      // Silent fail
    }
  },

  // Create subscription
  createSubscription: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const subscription = await subscriptionService.createSubscription(data as Parameters<typeof subscriptionService.createSubscription>[0]);

      await get().fetchSubscriptions();
      await get().fetchSummary();

      set({ isLoading: false });

      // Emit event for Quantum Alive Experience
      eventBus.emit('subscription:created', {
        name: subscription.service_name || 'Subscription',
        amount: Number(subscription.amount) || 0,
      });

      return subscription;
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update subscription
  updateSubscription: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      await subscriptionService.updateSubscription(id, data);

      const { subscriptions } = get();
      set({
        subscriptions: subscriptions.map((s) =>
          s.id === id ? { ...s, ...data } : s
        ),
        isLoading: false,
      });

      await get().fetchSummary();
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (id, reason) => {
    try {
      set({ isLoading: true, error: null });
      await subscriptionService.cancelSubscription(id, reason);

      const { subscriptions } = get();
      const cancelledSub = subscriptions.find(s => s.id === id);
      set({
        subscriptions: subscriptions.map((s) =>
          s.id === id ? { ...s, status: 'cancelled' as SubscriptionStatus } : s
        ),
        isLoading: false,
      });

      await get().fetchSummary();

      // Emit event for Quantum Alive Experience
      eventBus.emit('subscription:cancelled', { name: cancelledSub?.service_name || 'Subscription' });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Mark as used
  markAsUsed: async (id) => {
    try {
      await subscriptionService.markAsUsed(id);

      const { subscriptions } = get();
      set({
        subscriptions: subscriptions.map((s) =>
          s.id === id
            ? { ...s, last_used_at: new Date().toISOString(), usage_count: s.usage_count + 1 }
            : s
        ),
      });
    } catch (error) {
      // Silent fail
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchSubscriptions();
  },

  // Generate cancellation email
  generateCancellationEmail: (subscription) => {
    return subscriptionService.generateCancellationEmail(subscription);
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

/**
 * Subscription Tier Store
 * Manages user subscription tier and feature usage tracking
 * SECURITY: Uses SecureStore for encrypted storage of tier data
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SubscriptionTier, FeatureName } from '@/config/features';
import { supabase } from '@/services/supabase';
import { isDevMode } from '@/utils/devMode';

// In-memory fallback storage for when SecureStore fails or for web platform
const memoryFallback: Record<string, string> = {};

// Secure storage adapter for tier data (same pattern as supabase.ts)
const SecureTierStorage: StateStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // Use in-memory storage for web
      return memoryFallback[key] ?? null;
    }
    try {
      const value = await SecureStore.getItemAsync(key);
      return value ?? memoryFallback[key] ?? null;
    } catch (error) {
      if (__DEV__) console.error('[TierStore] SecureStore getItem error:', error);
      return memoryFallback[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      memoryFallback[key] = value;
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
      memoryFallback[key] = value;
    } catch (error) {
      if (__DEV__) console.error('[TierStore] SecureStore setItem error:', error);
      // Fallback to memory storage
      memoryFallback[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      delete memoryFallback[key];
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
      delete memoryFallback[key];
    } catch (error) {
      if (__DEV__) console.error('[TierStore] SecureStore removeItem error:', error);
      delete memoryFallback[key];
    }
  },
};

interface UsageRecord {
  count: number;
  lastReset: string; // ISO date string
  period: 'hour' | 'day' | 'month';
}

interface TierState {
  // Current subscription tier
  tier: SubscriptionTier;

  // Subscription metadata
  subscriptionId: string | null;
  expiresAt: string | null;
  isTrialing: boolean;

  // Feature usage tracking
  usage: Partial<Record<FeatureName, UsageRecord>>;

  // Actions
  setTier: (tier: SubscriptionTier) => void;
  setSubscription: (data: {
    tier: SubscriptionTier;
    subscriptionId?: string;
    expiresAt?: string;
    isTrialing?: boolean;
  }) => void;
  incrementUsage: (feature: FeatureName, period: 'hour' | 'day' | 'month') => number;
  getUsage: (feature: FeatureName) => number;
  resetUsage: (feature: FeatureName) => void;
  resetAllUsage: () => void;
  checkAndResetExpiredUsage: () => void;
}

const getResetThreshold = (period: 'hour' | 'day' | 'month'): number => {
  switch (period) {
    case 'hour':
      return 60 * 60 * 1000; // 1 hour in ms
    case 'day':
      return 24 * 60 * 60 * 1000; // 1 day in ms
    case 'month':
      return 30 * 24 * 60 * 60 * 1000; // ~30 days in ms
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
};

const shouldResetUsage = (lastReset: string, period: 'hour' | 'day' | 'month'): boolean => {
  const lastResetDate = new Date(lastReset);
  const now = new Date();
  const threshold = getResetThreshold(period);
  return now.getTime() - lastResetDate.getTime() >= threshold;
};

export const useTierStore = create<TierState>()(
  persist(
    (set, get) => ({
      // Initial state - default to FREE tier (RevenueCat will sync actual status)
      // SECURITY: Never default to premium - always verify entitlements via RevenueCat
      tier: 'free',
      subscriptionId: null,
      expiresAt: null,
      isTrialing: false,
      usage: {},

      // Set tier directly
      // DEV OVERRIDE: VIP users always get premium
      setTier: (tier) => {
        const effectiveTier = _isVIPUser() ? 'premium' as SubscriptionTier : tier;
        if (__DEV__) console.log(`[TierStore] Tier changed to: ${effectiveTier}${_isVIPUser() ? ' (VIP override)' : ''}`);
        set({ tier: effectiveTier });
      },

      // Set full subscription data
      // DEV OVERRIDE: VIP users always get premium
      setSubscription: (data) => {
        const effectiveTier = _isVIPUser() ? 'premium' as SubscriptionTier : data.tier;
        if (__DEV__) console.log(`[TierStore] Subscription updated:`, { ...data, tier: effectiveTier });
        set({
          tier: effectiveTier,
          subscriptionId: data.subscriptionId ?? null,
          expiresAt: data.expiresAt ?? null,
          isTrialing: data.isTrialing ?? false,
        });
      },

      // Increment usage for a feature and return new count
      // Also syncs to server for server-side verification
      incrementUsage: (feature, period) => {
        const { usage } = get();
        const currentRecord = usage[feature];
        const now = new Date().toISOString();

        let newCount: number;

        // Check if we need to reset the counter
        if (currentRecord && shouldResetUsage(currentRecord.lastReset, period)) {
          // Reset expired usage
          newCount = 1;
          set({
            usage: {
              ...usage,
              [feature]: {
                count: newCount,
                lastReset: now,
                period,
              },
            },
          });
          if (__DEV__) console.debug(`[TierStore] Reset and incremented ${feature} usage to ${newCount}`);
        } else {
          // Increment existing or create new
          newCount = (currentRecord?.count ?? 0) + 1;
          set({
            usage: {
              ...usage,
              [feature]: {
                count: newCount,
                lastReset: currentRecord?.lastReset ?? now,
                period,
              },
            },
          });
          if (__DEV__) console.debug(`[TierStore] Incremented ${feature} usage to ${newCount}`);
        }

        // Sync to server (non-blocking) - skip in dev mode
        if (!isDevMode()) {
          Promise.resolve(
            supabase.rpc('increment_feature_usage', {
              p_feature_name: feature,
              p_period_type: period,
            })
          ).then(({ error: rpcError }) => {
            if (rpcError) {
              if (__DEV__) console.warn(`[TierStore] Failed to sync usage to server:`, rpcError);
            }
          }).catch((err: unknown) => {
            if (__DEV__) console.warn(`[TierStore] Server sync error:`, err);
          });
        }

        return newCount;
      },

      // Get current usage for a feature
      getUsage: (feature) => {
        const { usage } = get();
        const record = usage[feature];

        if (!record) return 0;

        // Check if usage has expired
        if (shouldResetUsage(record.lastReset, record.period)) {
          return 0;
        }

        return record.count;
      },

      // Reset usage for a specific feature
      resetUsage: (feature) => {
        const { usage } = get();
        const newUsage = { ...usage };
        delete newUsage[feature];
        set({ usage: newUsage });
        if (__DEV__) console.debug(`[TierStore] Reset ${feature} usage`);
      },

      // Reset all usage counters
      resetAllUsage: () => {
        set({ usage: {} });
        if (__DEV__) console.debug(`[TierStore] Reset all usage`);
      },

      // Check and reset any expired usage counters
      checkAndResetExpiredUsage: () => {
        const { usage } = get();
        const newUsage: Partial<Record<FeatureName, UsageRecord>> = {};
        let hasChanges = false;

        Object.entries(usage).forEach(([feature, record]) => {
          if (record && !shouldResetUsage(record.lastReset, record.period)) {
            newUsage[feature as FeatureName] = record;
          } else {
            hasChanges = true;
            if (__DEV__) console.debug(`[TierStore] Auto-reset expired usage for ${feature}`);
          }
        });

        if (hasChanges) {
          set({ usage: newUsage });
        }
      },
    }),
    {
      name: 'tier-storage',
      storage: createJSONStorage(() => SecureTierStorage),
      partialize: (state) => ({
        tier: state.tier,
        subscriptionId: state.subscriptionId,
        expiresAt: state.expiresAt,
        isTrialing: state.isTrialing,
        usage: state.usage,
      }),
    }
  )
);

// DEV OVERRIDE — remove before production release
// VIP email that always gets premium access regardless of RevenueCat
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];

const _isVIPUser = (): boolean => {
  try {
    // Dynamic require to avoid circular dependency with authStore
    const { useAuthStore } = require('@/stores/authStore');
    const email = useAuthStore.getState().user?.email?.toLowerCase();
    return !!email && VIP_EMAILS.includes(email);
  } catch {
    return false;
  }
};

// DEV OVERRIDE: Call after auth loads to force premium for VIP users
export const forceVIPPremiumIfNeeded = (): boolean => {
  if (_isVIPUser()) {
    const state = useTierStore.getState();
    if (state.tier !== 'premium') {
      state.setTier('premium' as SubscriptionTier);
      if (__DEV__) console.log('[TierStore] VIP premium forced after auth loaded');
    }
    return true;
  }
  return false;
};

// Helper to get current tier
// DEV OVERRIDE: VIP users always get premium
export const getCurrentTier = (): SubscriptionTier => {
  if (_isVIPUser()) return 'premium';
  return useTierStore.getState().tier;
};

// Helper to check if user has premium access
// DEV OVERRIDE: VIP users always have premium access
export const hasPremiumAccess = (): boolean => {
  if (_isVIPUser()) return true;
  const tier = useTierStore.getState().tier;
  return tier === 'premium';
};

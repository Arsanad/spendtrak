/**
 * Purchases Store
 * Manages in-app purchase state with RevenueCat
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import * as purchasesService from '@/services/purchases';
import { TIER_CONFIGS, type SubscriptionTier } from '@/config/revenuecat';
import type { SubscriptionStatus, OfferingData, BillingPeriod } from '@/services/purchases';
import { logger } from '@/utils/logger';
import { useTierStore } from '@/stores/tierStore';
import { useAuthStore } from '@/stores/authStore';

// DEV OVERRIDE — remove before production release
// VIP email that always gets premium access regardless of RevenueCat
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];

const isVIPUser = (): boolean => {
  const email = useAuthStore.getState().user?.email?.toLowerCase();
  return !!email && VIP_EMAILS.includes(email);
};

// Helper to sync tier store with purchases store
// DEV OVERRIDE: VIP users always get premium
const syncTierStore = (tier: SubscriptionTier) => {
  const effectiveTier = isVIPUser() ? 'premium' : tier;
  const tierStore = useTierStore.getState();
  if (tierStore.tier !== effectiveTier) {
    tierStore.setTier(effectiveTier);
    logger.purchases.info('Synced tier store with purchases store:', effectiveTier);
  }
};

// Re-export types
export type { SubscriptionStatus, OfferingData, SubscriptionTier, BillingPeriod };
export { TIER_CONFIGS };

interface PurchasesState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;

  // Subscription State
  subscriptionStatus: SubscriptionStatus;
  customerInfo: CustomerInfo | null;

  // Offerings
  offerings: OfferingData | null;

  // Actions
  initialize: (userId?: string) => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; message?: string }>;
  loginUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  clearError: () => void;

  // Computed Helpers
  getTier: () => SubscriptionTier;
  isPremium: () => boolean;
  isFree: () => boolean;
  getPackageForPlan: (tier: 'premium', period: BillingPeriod) => PurchasesPackage | null;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  tier: 'free',
  isActive: false,
  willRenew: false,
  expirationDate: null,
  isTrialActive: false,
  trialEndDate: null,
  productId: null,
  originalPurchaseDate: null,
};

// DEV OVERRIDE: Overrides subscriptionStatus tier to premium for VIP users
const vipOverrideStatus = (status: SubscriptionStatus): SubscriptionStatus => {
  if (isVIPUser()) {
    return { ...status, tier: 'premium' as SubscriptionTier, isActive: true };
  }
  return status;
};

export const usePurchasesStore = create<PurchasesState>()(
  persist(
    (set, get) => ({
      // Initial State
      isInitialized: false,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      error: null,
      subscriptionStatus: DEFAULT_STATUS,
      customerInfo: null,
      offerings: null,

      // Initialize RevenueCat
      initialize: async (userId?: string) => {
        try {
          set({ isLoading: true, error: null });

          const success = await purchasesService.initializePurchases(userId);

          if (!success) {
            // Even if RevenueCat fails, mark as initialized to allow the app to work in free mode
            set({
              isInitialized: true,
              isLoading: false,
              error: null, // Don't show error for missing config
            });

            // Ensure tier is set to free when RevenueCat is not configured
            syncTierStore('free');

            logger.purchases.info('Running in free mode (RevenueCat not configured)');
            return;
          }

          // Get customer info and subscription status
          const customerInfo = await purchasesService.getCustomerInfo();
          const subscriptionStatus = purchasesService.getSubscriptionStatus(customerInfo);

          // Get offerings
          const offerings = await purchasesService.getOfferings();

          // DEV OVERRIDE: apply VIP override to subscriptionStatus
          const effectiveStatus = vipOverrideStatus(subscriptionStatus);

          set({
            isInitialized: true,
            isLoading: false,
            customerInfo,
            subscriptionStatus: effectiveStatus,
            offerings,
          });

          // Sync tier store with actual subscription status
          syncTierStore(effectiveStatus.tier);

          logger.purchases.info('Store initialized with status:', effectiveStatus.tier);
        } catch (error) {
          logger.purchases.error('Failed to initialize store:', error);
          set({
            isInitialized: true, // Still mark as initialized
            isLoading: false,
            error: null, // Don't block the UI
          });

          // Ensure tier is set to free on initialization error
          syncTierStore('free');
        }
      },

      // Refresh subscription status
      refreshSubscriptionStatus: async () => {
        try {
          set({ isLoading: true });

          const customerInfo = await purchasesService.getCustomerInfo();
          const subscriptionStatus = purchasesService.getSubscriptionStatus(customerInfo);

          // DEV OVERRIDE: apply VIP override
          const effectiveStatus = vipOverrideStatus(subscriptionStatus);

          set({
            customerInfo,
            subscriptionStatus: effectiveStatus,
            isLoading: false,
          });

          // Sync tier store
          syncTierStore(effectiveStatus.tier);
        } catch (error) {
          logger.purchases.error('Failed to refresh status:', error);
          set({ isLoading: false });
        }
      },

      // Fetch offerings
      fetchOfferings: async () => {
        try {
          set({ isLoading: true });

          const offerings = await purchasesService.getOfferings();

          set({
            offerings,
            isLoading: false,
          });
        } catch (error) {
          logger.purchases.error('Failed to fetch offerings:', error);
          set({ isLoading: false });
        }
      },

      // Purchase a package
      purchasePackage: async (pkg: PurchasesPackage) => {
        try {
          set({ isPurchasing: true, error: null });

          const result = await purchasesService.purchasePackage(pkg);

          if (result.success && result.customerInfo) {
            const subscriptionStatus = purchasesService.getSubscriptionStatus(result.customerInfo);
            const effectiveStatus = vipOverrideStatus(subscriptionStatus);

            set({
              customerInfo: result.customerInfo,
              subscriptionStatus: effectiveStatus,
              isPurchasing: false,
            });

            // Sync tier store after successful purchase
            syncTierStore(effectiveStatus.tier);

            return { success: true };
          }

          // User cancelled - don't show as error
          if (result.error === 'cancelled') {
            set({ isPurchasing: false });
            return { success: false, error: 'cancelled' };
          }

          set({
            isPurchasing: false,
            error: result.error || 'Purchase failed',
          });

          return { success: false, error: result.error };
        } catch (error) {
          logger.purchases.error('Purchase failed:', error);
          const errorMessage = 'Purchase failed. Please try again.';
          set({
            isPurchasing: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Restore purchases
      restorePurchases: async () => {
        try {
          set({ isRestoring: true, error: null });

          const result = await purchasesService.restorePurchases();

          if (result.customerInfo) {
            const subscriptionStatus = purchasesService.getSubscriptionStatus(result.customerInfo);
            const effectiveStatus = vipOverrideStatus(subscriptionStatus);

            set({
              customerInfo: result.customerInfo,
              subscriptionStatus: effectiveStatus,
              isRestoring: false,
            });

            // Sync tier store after restore
            syncTierStore(effectiveStatus.tier);

            if (effectiveStatus.tier !== 'free') {
              const tierName = effectiveStatus.tier.charAt(0).toUpperCase() + effectiveStatus.tier.slice(1);
              return { success: true, message: `${tierName} subscription restored!` };
            }
          }

          set({ isRestoring: false });

          return {
            success: result.success,
            message: result.error || 'No active subscriptions found.',
          };
        } catch (error) {
          logger.purchases.error('Restore failed:', error);
          set({
            isRestoring: false,
            error: 'Failed to restore purchases',
          });
          return { success: false, message: 'Failed to restore purchases. Please try again.' };
        }
      },

      // Login user
      loginUser: async (userId: string) => {
        try {
          const customerInfo = await purchasesService.loginUser(userId);
          if (customerInfo) {
            const subscriptionStatus = purchasesService.getSubscriptionStatus(customerInfo);
            const effectiveStatus = vipOverrideStatus(subscriptionStatus);
            set({ customerInfo, subscriptionStatus: effectiveStatus });

            // Sync tier store after login
            syncTierStore(effectiveStatus.tier);
          }
        } catch (error) {
          logger.purchases.error('Login failed:', error);
        }
      },

      // Logout user
      logoutUser: async () => {
        try {
          await purchasesService.logoutUser();
          set({
            customerInfo: null,
            subscriptionStatus: DEFAULT_STATUS,
          });

          // Reset tier store to free on logout
          syncTierStore('free');
        } catch (error) {
          logger.purchases.error('Logout failed:', error);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Get current tier
      // DEV OVERRIDE: VIP users always get premium
      getTier: () => isVIPUser() ? 'premium' : get().subscriptionStatus.tier,

      // Check if premium
      // DEV OVERRIDE: VIP users always premium
      isPremium: () => isVIPUser() || get().subscriptionStatus.tier === 'premium',

      // Check if free
      // DEV OVERRIDE: VIP users are never free
      isFree: () => !isVIPUser() && get().subscriptionStatus.tier === 'free',

      // Get package for plan
      getPackageForPlan: (tier: 'premium', period: BillingPeriod) => {
        const { offerings } = get();
        if (!offerings) return null;

        return period === 'monthly' ? offerings.premiumMonthly : offerings.premiumYearly;
      },
    }),
    {
      name: 'purchases-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
      }),
    }
  )
);

// DEV OVERRIDE — remove before production release
// Force VIP premium status in both stores. Call after auth is confirmed.
export const forceVIPPremium = () => {
  if (isVIPUser()) {
    const store = usePurchasesStore.getState();
    if (store.subscriptionStatus.tier !== 'premium') {
      usePurchasesStore.setState({
        subscriptionStatus: { ...store.subscriptionStatus, tier: 'premium' as SubscriptionTier, isActive: true },
      });
      syncTierStore('premium');
      logger.purchases.info('DEV OVERRIDE: VIP premium forced after auth loaded');
    }
    return true;
  }
  return false;
};

// Helper to open subscription management
export const openSubscriptionManagement = purchasesService.openSubscriptionManagement;

// Helper to get trial duration string
export const getTrialDurationString = purchasesService.getTrialDurationString;

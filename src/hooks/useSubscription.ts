/**
 * useSubscription Hook
 * Feature gating hook for SpendTrak subscription status
 *
 * Provides easy access to subscription state and purchase actions
 */

import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { usePurchasesStore, openSubscriptionManagement } from '@/stores/purchasesStore';
import { TIER_CONFIGS, type SubscriptionTier } from '@/config/revenuecat';
import type { BillingPeriod } from '@/services/purchases';
import { useAuthStore } from '@/stores/authStore';

// DEV OVERRIDE — remove before production release
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];
const _useIsVIP = (): boolean => {
  const email = useAuthStore((s) => s.user?.email?.toLowerCase());
  return !!email && VIP_EMAILS.includes(email);
};

export interface UseSubscriptionReturn {
  /** Whether user has premium access (SpendTrak Pro) */
  isPremium: boolean;
  /** Whether user has plus or higher access */
  isPlus: boolean;
  /** Whether user is on free tier */
  isFree: boolean;
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Whether subscription is loading */
  isLoading: boolean;
  /** Whether a purchase is in progress */
  isPurchasing: boolean;
  /** Whether restore is in progress */
  isRestoring: boolean;
  /** Subscription expiration date (if active) */
  expirationDate: Date | null;
  /** Whether subscription will auto-renew */
  willRenew: boolean;
  /** Whether user is in trial period */
  isInTrial: boolean;
  /** Subscribe to a plan */
  subscribe: (period?: BillingPeriod) => Promise<boolean>;
  /** Restore previous purchases */
  restore: () => Promise<boolean>;
  /** Open subscription management (App Store/Play Store) */
  manage: () => void;
  /** Check if user has access to a feature requiring a specific tier */
  hasAccess: (requiredTier: SubscriptionTier) => boolean;
  /** Get tier configuration */
  getTierConfig: (tier: SubscriptionTier) => typeof TIER_CONFIGS[SubscriptionTier];
  /** Check if a limit is exceeded for current tier */
  isLimitExceeded: (limitType: keyof typeof TIER_CONFIGS['free']['limits'], currentValue: number) => boolean;
}

/**
 * Hook for accessing subscription status and performing subscription actions
 *
 * @example
 * ```tsx
 * function FeatureComponent() {
 *   const { isPremium, subscribe, isLoading } = useSubscription();
 *
 *   if (!isPremium) {
 *     return (
 *       <Button onPress={() => subscribe('yearly')} disabled={isLoading}>
 *         Upgrade to Pro
 *       </Button>
 *     );
 *   }
 *
 *   return <PremiumFeature />;
 * }
 * ```
 */
export function useSubscription(): UseSubscriptionReturn {
  const {
    subscriptionStatus,
    isLoading,
    isPurchasing,
    isRestoring,
    offerings,
    purchasePackage,
    restorePurchases,
    getPackageForPlan,
  } = usePurchasesStore();

  // Computed values
  // DEV OVERRIDE: VIP users always premium
  const isVIP = _useIsVIP();
  const isPremium = isVIP || subscriptionStatus.tier === 'premium';
  const isFree = !isVIP && subscriptionStatus.tier === 'free';
  const tier: SubscriptionTier = isVIP ? 'premium' : subscriptionStatus.tier;
  const expirationDate = subscriptionStatus.expirationDate;
  const willRenew = subscriptionStatus.willRenew;
  const isInTrial = subscriptionStatus.isTrialActive;

  /**
   * Subscribe to SpendTrak Pro
   * Opens purchase flow for the selected billing period
   */
  const subscribe = useCallback(async (period: BillingPeriod = 'yearly'): Promise<boolean> => {
    // Get the premium package for the selected period
    const pkg = getPackageForPlan('premium', period);

    if (!pkg) {
      Alert.alert(
        'Not Available',
        'Subscriptions are not available at this time. Please try again later.',
        [{ text: 'OK' }]
      );
      return false;
    }

    const result = await purchasePackage(pkg);

    if (result.success) {
      return true;
    }

    // Don't show error for user cancellation
    if (result.error === 'cancelled') {
      return false;
    }

    // Error is handled by the store, but we return false
    return false;
  }, [getPackageForPlan, purchasePackage]);

  /**
   * Restore previous purchases
   */
  const restore = useCallback(async (): Promise<boolean> => {
    const result = await restorePurchases();

    if (result.success && result.message?.includes('restored')) {
      Alert.alert('Success', result.message, [{ text: 'OK' }]);
      return true;
    }

    Alert.alert(
      result.success ? 'Restore Complete' : 'Restore Failed',
      result.message || 'No active subscriptions found.',
      [{ text: 'OK' }]
    );

    return result.success;
  }, [restorePurchases]);

  /**
   * Open subscription management in App Store / Play Store
   */
  const manage = useCallback(() => {
    openSubscriptionManagement();
  }, []);

  /**
   * Check if user has access to a feature requiring a specific tier
   */
  const hasAccess = useCallback((requiredTier: SubscriptionTier): boolean => {
    const tierHierarchy: SubscriptionTier[] = ['free', 'premium'];
    const userTierIndex = tierHierarchy.indexOf(tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  }, [tier]);

  /**
   * Get tier configuration
   */
  const getTierConfig = useCallback((t: SubscriptionTier) => {
    return TIER_CONFIGS[t];
  }, []);

  /**
   * Check if a limit is exceeded for current tier
   */
  const isLimitExceeded = useCallback((
    limitType: keyof typeof TIER_CONFIGS['free']['limits'],
    currentValue: number
  ): boolean => {
    const limit = TIER_CONFIGS[tier].limits[limitType];
    if (limit === 'unlimited') return false;
    if (typeof limit === 'number') return currentValue >= limit;
    return false;
  }, [tier]);

  return useMemo(() => ({
    isPremium,
    isPlus: isPremium, // Plus tier deprecated, treated as Premium
    isFree,
    tier,
    isLoading,
    isPurchasing,
    isRestoring,
    expirationDate,
    willRenew,
    isInTrial,
    subscribe,
    restore,
    manage,
    hasAccess,
    getTierConfig,
    isLimitExceeded,
  }), [
    isPremium,
    isFree,
    tier,
    isLoading,
    isPurchasing,
    isRestoring,
    expirationDate,
    willRenew,
    isInTrial,
    subscribe,
    restore,
    manage,
    hasAccess,
    getTierConfig,
    isLimitExceeded,
  ]);
}

/**
 * Hook for checking if user has premium access
 * Simple boolean hook for feature gating
 *
 * @example
 * ```tsx
 * function FeatureButton() {
 *   const isPremium = useIsPremium();
 *   return isPremium ? <UnlockedFeature /> : <LockedFeature />;
 * }
 * ```
 */
export function useIsPremium(): boolean {
  const isVIP = _useIsVIP();
  const storePremium = usePurchasesStore((state) => state.subscriptionStatus.tier === 'premium');
  // DEV OVERRIDE: VIP users always premium
  return isVIP || storePremium;
}

/**
 * Hook for getting current subscription tier
 */
export function useSubscriptionTier(): SubscriptionTier {
  const isVIP = _useIsVIP();
  const storeTier = usePurchasesStore((state) => state.subscriptionStatus.tier);
  // DEV OVERRIDE: VIP users always premium
  return isVIP ? 'premium' : storeTier;
}

/**
 * Hook for checking subscription loading state
 */
export function useSubscriptionLoading(): boolean {
  return usePurchasesStore((state) => state.isLoading);
}

export default useSubscription;

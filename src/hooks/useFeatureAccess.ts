/**
 * Feature Access Hook
 * Provides feature gating logic based on subscription tier
 * SECURITY: Includes server-side verification for premium operations
 */

import { useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { useTierStore } from '@/stores/tierStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import { isDevMode } from '@/utils/devMode';

// DEV OVERRIDE — remove before production release
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];
import {
  type FeatureName,
  type SubscriptionTier,
  TIER_CONFIGS,
  FEATURE_METADATA,
  hasAccessToFeature,
  getFeatureLimit,
  isUnlimited,
  isNotAvailable,
  getRequiredTierForFeature,
  getTierHierarchy,
  getUpgradeBenefits,
} from '@/config/features';

// Server verification result type
export interface ServerEntitlementResult {
  allowed: boolean;
  tier: SubscriptionTier;
  feature: string;
  usage: number;
  limit: number;
  remaining?: number;
  message: string;
}

export interface FeatureAccessResult {
  /** Whether user can access this feature at all */
  canAccess: boolean;
  /** The limit for this feature (-1 = unlimited, 0 = not available) */
  limit: number | 'unlimited';
  /** Remaining usage before hitting limit */
  remaining: number | 'unlimited';
  /** Whether user has hit the limit */
  isAtLimit: boolean;
  /** Whether this feature is enabled for user's tier */
  isEnabled: boolean;
  /** The minimum tier required for this feature */
  requiredTier: SubscriptionTier;
  /** User's current tier */
  currentTier: SubscriptionTier;
  /** Whether user needs to upgrade to access this feature */
  needsUpgrade: boolean;
}

export interface UseFeatureAccessReturn {
  /** Get full access result for a feature */
  getFeatureAccess: (feature: FeatureName) => FeatureAccessResult;

  /** Simple check if user can access a feature */
  canAccess: (feature: FeatureName) => boolean;

  /** Get the limit for a feature */
  getLimit: (feature: FeatureName) => number | 'unlimited';

  /** Get remaining usage for a feature */
  getRemainingUsage: (feature: FeatureName) => number | 'unlimited';

  /** Check if user is at the limit for a feature */
  isAtLimit: (feature: FeatureName) => boolean;

  /** Increment usage counter for a feature */
  trackUsage: (feature: FeatureName) => { allowed: boolean; newCount: number };

  /**
   * Server-side verification of feature entitlement
   * SECURITY: Use this before premium operations (AI, receipts, exports)
   * Returns server-verified access status
   */
  verifyEntitlementServer: (feature: FeatureName) => Promise<ServerEntitlementResult>;

  /** Show upgrade prompt and navigate to subscription screen */
  showUpgradePrompt: (feature: FeatureName, options?: { replace?: boolean }) => void;

  /** Navigate to subscription screen */
  goToSubscriptions: () => void;

  /** Get user's current tier */
  currentTier: SubscriptionTier;

  /** Get tier display info */
  getTierInfo: (tier?: SubscriptionTier) => typeof TIER_CONFIGS[SubscriptionTier];

  /** Get feature metadata for display */
  getFeatureInfo: (feature: FeatureName) => typeof FEATURE_METADATA[FeatureName];

  /** Get benefits of upgrading from current tier to target */
  getUpgradeBenefits: (targetTier: SubscriptionTier) => ReturnType<typeof getUpgradeBenefits>;

  /** Check if user has premium access (plus or premium) */
  hasPremiumAccess: boolean;
}

export const useFeatureAccess = (): UseFeatureAccessReturn => {
  const { tier: _rawTier, usage, incrementUsage, getUsage, checkAndResetExpiredUsage } = useTierStore();
  // DEV OVERRIDE — remove before production release
  const vipEmail = useAuthStore((s) => s.user?.email?.toLowerCase());
  const isVIP = !!vipEmail && VIP_EMAILS.includes(vipEmail);
  const tier: SubscriptionTier = isVIP ? 'premium' : _rawTier;

  // Check and reset expired usage on hook mount
  useMemo(() => {
    checkAndResetExpiredUsage();
  }, []);

  const getFeatureAccess = useCallback((feature: FeatureName): FeatureAccessResult => {
    const featureConfig = TIER_CONFIGS[tier].features[feature];
    const limit = featureConfig.limit;
    const isEnabled = featureConfig.enabled && !isNotAvailable(limit);
    const requiredTier = getRequiredTierForFeature(feature);
    const needsUpgrade = getTierHierarchy(tier) < getTierHierarchy(requiredTier);

    // Check if feature has usage-based limit
    const currentUsage = getUsage(feature);
    const unlimited = isUnlimited(limit);
    const notAvailable = isNotAvailable(limit);

    let remaining: number | 'unlimited' = 'unlimited';
    let isAtLimitResult = false;

    if (notAvailable) {
      remaining = 0;
      isAtLimitResult = true;
    } else if (!unlimited) {
      remaining = Math.max(0, limit - currentUsage);
      isAtLimitResult = currentUsage >= limit;
    }

    return {
      canAccess: isEnabled && !isAtLimitResult,
      limit: unlimited ? 'unlimited' : limit,
      remaining,
      isAtLimit: isAtLimitResult,
      isEnabled,
      requiredTier,
      currentTier: tier,
      needsUpgrade,
    };
  }, [tier, getUsage]);

  const canAccess = useCallback((feature: FeatureName): boolean => {
    return getFeatureAccess(feature).canAccess;
  }, [getFeatureAccess]);

  const getLimit = useCallback((feature: FeatureName): number | 'unlimited' => {
    return getFeatureAccess(feature).limit;
  }, [getFeatureAccess]);

  const getRemainingUsage = useCallback((feature: FeatureName): number | 'unlimited' => {
    return getFeatureAccess(feature).remaining;
  }, [getFeatureAccess]);

  const isAtLimit = useCallback((feature: FeatureName): boolean => {
    return getFeatureAccess(feature).isAtLimit;
  }, [getFeatureAccess]);

  const trackUsage = useCallback((feature: FeatureName): { allowed: boolean; newCount: number } => {
    const featureConfig = TIER_CONFIGS[tier].features[feature];
    const limit = featureConfig.limit;

    // Check if feature is available
    if (!featureConfig.enabled || isNotAvailable(limit)) {
      return { allowed: false, newCount: 0 };
    }

    // Unlimited - always allow
    if (isUnlimited(limit)) {
      return { allowed: true, newCount: -1 };
    }

    // Check current usage before incrementing
    const currentUsage = getUsage(feature);
    if (currentUsage >= limit) {
      return { allowed: false, newCount: currentUsage };
    }

    // Increment and check - filter out 'forever' as it doesn't need tracking
    const period = featureConfig.period ?? 'month';
    const trackPeriod = period === 'forever' ? 'month' : period;
    const newCount = incrementUsage(feature, trackPeriod);

    return {
      allowed: newCount <= limit,
      newCount,
    };
  }, [tier, getUsage, incrementUsage]);

  /**
   * Server-side verification of feature entitlement
   * SECURITY: Use this before premium operations to prevent client-side tampering
   */
  const verifyEntitlementServer = useCallback(async (feature: FeatureName): Promise<ServerEntitlementResult> => {
    // In dev mode, use client-side check only
    if (isDevMode()) {
      const access = getFeatureAccess(feature);
      return {
        allowed: access.canAccess,
        tier: tier,
        feature,
        usage: access.remaining === 'unlimited' ? 0 : (access.limit as number) - (access.remaining as number),
        limit: access.limit === 'unlimited' ? -1 : access.limit as number,
        remaining: access.remaining === 'unlimited' ? undefined : access.remaining as number,
        message: access.canAccess ? 'Access granted (dev mode)' : 'Access denied (dev mode)',
      };
    }

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          allowed: false,
          tier: 'free',
          feature,
          usage: 0,
          limit: 0,
          message: 'Not authenticated',
        };
      }

      // Call server-side verification
      const { data, error } = await supabase.functions.invoke('verify-entitlement', {
        body: { feature },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.warn('[useFeatureAccess] Server verification failed:', error);
        // On error, fall back to client-side check (don't block users)
        const access = getFeatureAccess(feature);
        return {
          allowed: access.canAccess,
          tier: tier,
          feature,
          usage: 0,
          limit: access.limit === 'unlimited' ? -1 : access.limit as number,
          message: 'Server check failed, using local check',
        };
      }

      return data as ServerEntitlementResult;
    } catch (err) {
      console.warn('[useFeatureAccess] Server verification error:', err);
      // On error, fall back to client-side check
      const access = getFeatureAccess(feature);
      return {
        allowed: access.canAccess,
        tier: tier,
        feature,
        usage: 0,
        limit: access.limit === 'unlimited' ? -1 : access.limit as number,
        message: 'Verification error, using local check',
      };
    }
  }, [tier, getFeatureAccess]);

  const showUpgradePrompt = useCallback((feature: FeatureName, options?: { replace?: boolean }) => {
    const requiredTier = getRequiredTierForFeature(feature);
    const featureInfo = FEATURE_METADATA[feature];

    // Navigate to upgrade screen with feature context
    const params = {
      feature,
      requiredTier,
      featureName: featureInfo.displayName,
    };

    if (options?.replace) {
      router.replace({
        pathname: '/(modals)/upgrade' as any,
        params,
      });
    } else {
      router.push({
        pathname: '/(modals)/upgrade' as any,
        params,
      });
    }
  }, []);

  const goToSubscriptions = useCallback(() => {
    router.push('/settings/upgrade' as any);
  }, []);

  const getTierInfo = useCallback((tierToGet?: SubscriptionTier) => {
    return TIER_CONFIGS[tierToGet ?? tier];
  }, [tier]);

  const getFeatureInfo = useCallback((feature: FeatureName) => {
    return FEATURE_METADATA[feature];
  }, []);

  const getUpgradeBenefitsForTier = useCallback((targetTier: SubscriptionTier) => {
    return getUpgradeBenefits(tier, targetTier);
  }, [tier]);

  const hasPremiumAccess = useMemo(() => {
    return tier === 'premium';
  }, [tier]);

  return {
    getFeatureAccess,
    canAccess,
    getLimit,
    getRemainingUsage,
    isAtLimit,
    trackUsage,
    verifyEntitlementServer,
    showUpgradePrompt,
    goToSubscriptions,
    currentTier: tier,
    getTierInfo,
    getFeatureInfo,
    getUpgradeBenefits: getUpgradeBenefitsForTier,
    hasPremiumAccess,
  };
};

// Standalone helper for use outside of React components
// DEV OVERRIDE — remove before production release
export const checkFeatureAccess = (feature: FeatureName): boolean => {
  const email = useAuthStore.getState().user?.email?.toLowerCase();
  if (email && VIP_EMAILS.includes(email)) return true;
  const tier = useTierStore.getState().tier;
  return hasAccessToFeature(tier, feature);
};

// DEV OVERRIDE — remove before production release
export const getFeatureLimitStandalone = (feature: FeatureName): number => {
  const email = useAuthStore.getState().user?.email?.toLowerCase();
  if (email && VIP_EMAILS.includes(email)) return getFeatureLimit('premium', feature);
  const tier = useTierStore.getState().tier;
  return getFeatureLimit(tier, feature);
};

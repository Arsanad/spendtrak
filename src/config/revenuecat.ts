/**
 * RevenueCat Configuration
 * In-app purchases and subscription management for SpendTrak
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ===========================================
// API Keys
// ===========================================

/**
 * RevenueCat API Keys (from environment variables)
 * Get these from RevenueCat Dashboard → Project Settings → API Keys
 */
export const REVENUECAT_API_KEY = Platform.select({
  ios: Constants.expoConfig?.extra?.revenuecatIosKey ||
       process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: Constants.expoConfig?.extra?.revenuecatAndroidKey ||
           process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
  default: '',
});

// ===========================================
// Subscription Tiers
// ===========================================

export type SubscriptionTier = 'free' | 'premium';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  features: string[];
  limits: {
    transactions: number | 'unlimited';
    receiptsPerMonth: number | 'unlimited';
    aiConsultations: number | 'unlimited';
    budgets: number | 'unlimited';
    goals: number | 'unlimited';
    exportFormats: string[];
    historicalData: string; // e.g., "3 months", "1 year", "unlimited"
  };
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic expense tracking',
    features: [
      'Manual expense entry',
      'Basic categories',
      'Monthly summary',
      'Single budget',
      'Single goal',
    ],
    limits: {
      transactions: 50, // per month
      receiptsPerMonth: 5,
      aiConsultations: 3, // per month
      budgets: 1,
      goals: 1,
      exportFormats: ['csv'],
      historicalData: '3 months',
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'The ultimate financial management experience',
    features: [
      'Everything in Free, plus:',
      'Unlimited receipt scanning',
      'Unlimited AI consultations',
      'Unlimited budgets & goals',
      'Advanced analytics',
      'Behavioral insights',
      'Investment tracking',
      'Net worth dashboard',
      'Export to all formats',
      'Unlimited history',
      'Family sharing (coming soon)',
    ],
    limits: {
      transactions: 'unlimited',
      receiptsPerMonth: 'unlimited',
      aiConsultations: 'unlimited',
      budgets: 'unlimited',
      goals: 'unlimited',
      exportFormats: ['csv', 'pdf', 'xlsx', 'json'],
      historicalData: 'unlimited',
    },
  },
};

// ===========================================
// Product Identifiers
// ===========================================

/**
 * Product IDs as configured in App Store Connect and Google Play Console
 * These must match exactly with your store configurations
 *
 * Bundle ID: com.spendtrak.app
 *
 * PRICING (set in stores, not code):
 * - Premium Monthly: $9.99/month
 * - Premium Yearly: $79.99/year (save 33%)
 */
export const PRODUCT_IDS = {
  // SpendTrak Pro (Premium) Tier
  PREMIUM_MONTHLY: 'spendtrak_premium_monthly',  // $9.99/month
  PREMIUM_YEARLY: 'spendtrak_premium_yearly',    // $79.99/year

  // Legacy aliases for backward compatibility (Plus tier is deprecated)
  PLUS_MONTHLY: 'spendtrak_premium_monthly',
  PLUS_YEARLY: 'spendtrak_premium_yearly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

/**
 * Product metadata for display
 */
export interface ProductMetadata {
  id: ProductId;
  tier: SubscriptionTier;
  name: string;
  period: 'monthly' | 'yearly';
  price: number; // USD, for display before RevenueCat loads
  priceString: string;
  savings?: string; // e.g., "Save 33%"
}

export const PRODUCTS: ProductMetadata[] = [
  {
    id: PRODUCT_IDS.PREMIUM_MONTHLY,
    tier: 'premium',
    name: 'SpendTrak Pro Monthly',
    period: 'monthly',
    price: 9.99,
    priceString: '$9.99/month',
  },
  {
    id: PRODUCT_IDS.PREMIUM_YEARLY,
    tier: 'premium',
    name: 'SpendTrak Pro Yearly',
    period: 'yearly',
    price: 79.99,
    priceString: '$79.99/year',
    savings: 'Save 33%',
  },
];

// ===========================================
// Entitlements
// ===========================================

/**
 * Entitlement identifiers as configured in RevenueCat Dashboard
 * These determine what features the user has access to
 *
 * Main entitlement: "SpendTrak Pro"
 */
export const ENTITLEMENTS = {
  /** Main entitlement for SpendTrak Pro subscription */
  PRO: 'SpendTrak Pro',
  /** Legacy aliases for backward compatibility */
  PLUS: 'SpendTrak Pro',
  PREMIUM: 'SpendTrak Pro',
} as const;

export type EntitlementId = 'SpendTrak Pro' | 'premium';

/**
 * Map entitlements to tiers
 */
export const ENTITLEMENT_TO_TIER: Record<string, SubscriptionTier> = {
  'SpendTrak Pro': 'premium',
  'plus': 'premium', // Legacy: treat plus as premium
  'premium': 'premium',
};

// ===========================================
// Offerings
// ===========================================

/**
 * Offering identifier - the default offering in RevenueCat
 */
export const DEFAULT_OFFERING_ID = 'default';

// ===========================================
// Helper Functions
// ===========================================

/**
 * Get tier from entitlements
 */
export function getTierFromEntitlements(entitlements: string[]): SubscriptionTier {
  // Check for SpendTrak Pro entitlement (the main entitlement)
  if (entitlements.includes(ENTITLEMENTS.PRO)) {
    return 'premium';
  }
  // Legacy entitlement checks for backward compatibility (plus is now treated as premium)
  if (entitlements.includes('premium') || entitlements.includes('plus')) {
    return 'premium';
  }
  return 'free';
}

/**
 * Get tier config
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy: SubscriptionTier[] = ['free', 'premium'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  return userTierIndex >= requiredTierIndex;
}

/**
 * Check if a limit is exceeded
 */
export function isLimitExceeded(
  tier: SubscriptionTier,
  limitType: keyof TierConfig['limits'],
  currentValue: number
): boolean {
  const limit = TIER_CONFIGS[tier].limits[limitType];
  if (limit === 'unlimited') return false;
  if (typeof limit === 'number') return currentValue >= limit;
  return false;
}

/**
 * Get remaining allowance for a limit
 */
export function getRemainingAllowance(
  tier: SubscriptionTier,
  limitType: keyof TierConfig['limits'],
  currentUsage: number
): number | 'unlimited' {
  const limit = TIER_CONFIGS[tier].limits[limitType];
  if (limit === 'unlimited') return 'unlimited';
  if (typeof limit === 'number') return Math.max(0, limit - currentUsage);
  return 0;
}

/**
 * Get product by ID
 */
export function getProductById(productId: ProductId): ProductMetadata | undefined {
  return PRODUCTS.find(p => p.id === productId);
}

/**
 * Get products by tier
 */
export function getProductsByTier(tier: SubscriptionTier): ProductMetadata[] {
  return PRODUCTS.filter(p => p.tier === tier);
}

/**
 * Get the best value product for a tier (yearly)
 */
export function getBestValueProduct(tier: SubscriptionTier): ProductMetadata | undefined {
  return PRODUCTS.find(p => p.tier === tier && p.period === 'yearly');
}

// ===========================================
// Validation
// ===========================================

/**
 * Validate that RevenueCat is properly configured
 */
export function isRevenueCatConfigured(): boolean {
  return Boolean(REVENUECAT_API_KEY && REVENUECAT_API_KEY.length > 0);
}

/**
 * Validate RevenueCat API key format
 * iOS keys should start with 'appl_'
 * Android keys should start with 'goog_'
 */
export function validateRevenueCatKey(key: string): { valid: boolean; warning?: string } {
  if (!key) {
    return { valid: false, warning: 'RevenueCat API key is not configured' };
  }

  if (Platform.OS === 'ios' && !key.startsWith('appl_')) {
    return { valid: false, warning: 'iOS RevenueCat key should start with "appl_"' };
  }

  if (Platform.OS === 'android' && !key.startsWith('goog_')) {
    return { valid: false, warning: 'Android RevenueCat key should start with "goog_"' };
  }

  return { valid: true };
}

/**
 * Get configuration status for debugging
 */
export function getConfigurationStatus(): {
  isConfigured: boolean;
  platform: string;
  hasApiKey: boolean;
  keyValid: boolean;
  warning?: string;
} {
  const validation = validateRevenueCatKey(REVENUECAT_API_KEY);
  return {
    isConfigured: isRevenueCatConfigured(),
    platform: Platform.OS,
    hasApiKey: Boolean(REVENUECAT_API_KEY),
    keyValid: validation.valid,
    warning: validation.warning,
  };
}

export default {
  REVENUECAT_API_KEY,
  PRODUCT_IDS,
  PRODUCTS,
  ENTITLEMENTS,
  DEFAULT_OFFERING_ID,
  TIER_CONFIGS,
  getTierFromEntitlements,
  getTierConfig,
  hasFeatureAccess,
  isLimitExceeded,
  getRemainingAllowance,
  getProductById,
  getProductsByTier,
  getBestValueProduct,
  isRevenueCatConfigured,
  validateRevenueCatKey,
  getConfigurationStatus,
};

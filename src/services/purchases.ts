/**
 * Purchases Service
 * RevenueCat integration for in-app purchases and subscriptions
 *
 * Features:
 * - Initialize RevenueCat SDK with platform-specific API keys
 * - Link RevenueCat customer to Supabase user
 * - Fetch and manage subscription status
 * - Handle purchases with comprehensive error mapping
 * - Restore purchases
 * - Sync subscription state to Supabase database
 * - Customer info change listeners
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  INTRO_ELIGIBILITY_STATUS,
} from 'react-native-purchases';
import { Platform, Linking } from 'react-native';
import { supabase } from './supabase';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/utils/errors';
import {
  REVENUECAT_API_KEY,
  PRODUCT_IDS,
  ENTITLEMENTS,
  isRevenueCatConfigured,
  type SubscriptionTier,
  type EntitlementId,
} from '@/config/revenuecat';
import type {
  PurchaseResult,
  RestoreResult,
  SubscriptionStatus as NewSubscriptionStatus,
  EntitlementStatus,
  PackageInfo,
  PurchaseErrorCode,
  PurchaseError,
  TrialEligibility,
  TrialEligibilityResult,
  SubscriptionSyncData,
  CustomerInfoListener,
  PurchaseInitOptions,
  InitResult,
  SubscriptionPeriod,
} from '@/types/purchases';

// Re-export for convenience
export { ENTITLEMENTS, PRODUCT_IDS } from '@/config/revenuecat';
export type { SubscriptionTier, EntitlementId } from '@/config/revenuecat';
export type BillingPeriod = 'monthly' | 'yearly';

// ============================================
// TYPES
// ============================================

/** Legacy subscription status (for backward compatibility) */
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  willRenew: boolean;
  expirationDate: Date | null;
  isTrialActive: boolean;
  trialEndDate: Date | null;
  productId: string | null;
  originalPurchaseDate: Date | null;
}

export interface PlanPricing {
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPriceValue: number;
  yearlyPriceValue: number;
  yearlySavingsPercent: number;
  currency: string;
}

export interface OfferingData {
  plusMonthly: PurchasesPackage | null;
  plusYearly: PurchasesPackage | null;
  premiumMonthly: PurchasesPackage | null;
  premiumYearly: PurchasesPackage | null;
  plusPricing: PlanPricing | null;
  premiumPricing: PlanPricing | null;
}

// ============================================
// STATE
// ============================================

let isInitialized = false;
let currentUserId: string | null = null;
const customerInfoListeners: Set<CustomerInfoListener> = new Set();

/** Map product ID patterns to billing periods */
const PERIOD_KEYWORDS: Record<string, SubscriptionPeriod> = {
  monthly: 'monthly',
  month: 'monthly',
  annual: 'yearly',
  yearly: 'yearly',
  year: 'yearly',
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize RevenueCat SDK
 *
 * Must be called before any other purchase operations.
 * Typically called during app startup after determining the user.
 *
 * @param userIdOrOptions - User ID string or configuration options
 * @returns Whether initialization was successful (legacy) or InitResult (new)
 *
 * @example
 * ```typescript
 * // Legacy usage
 * const success = await initializePurchases(user.id);
 *
 * // New usage with options
 * const result = await initializePurchases({ userId: user.id, debugMode: true });
 * ```
 */
export async function initializePurchases(
  userIdOrOptions?: string | PurchaseInitOptions
): Promise<boolean | InitResult> {
  try {
    // Handle both legacy (string) and new (options object) signatures
    const opts: PurchaseInitOptions =
      typeof userIdOrOptions === 'string'
        ? { userId: userIdOrOptions }
        : userIdOrOptions || {};

    if (isInitialized) {
      logger.purchases.info('RevenueCat already initialized');

      // If a new user ID is provided, update it
      if (opts.userId && opts.userId !== currentUserId) {
        await setUserId(opts.userId);
      }

      // Return format based on input type
      if (typeof userIdOrOptions === 'object') {
        return { success: true, isIdentified: !!currentUserId };
      }
      return true;
    }

    if (!isRevenueCatConfigured()) {
      logger.purchases.warn('RevenueCat API key not configured');
      if (typeof userIdOrOptions === 'object') {
        return {
          success: false,
          error: 'RevenueCat API key not configured',
          isIdentified: false,
        };
      }
      return false;
    }

    // Set log level for debugging (disable in production)
    if (__DEV__ || opts.debugMode) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      logger.purchases.debug('RevenueCat debug logging enabled');
    } else {
      Purchases.setLogLevel(LOG_LEVEL.ERROR);
    }

    // Configure RevenueCat
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: opts.userId || null,
    });

    isInitialized = true;
    currentUserId = opts.userId || null;

    // Set up customer info listener for real-time updates
    Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    logger.purchases.info('RevenueCat initialized successfully');

    // Sync initial customer info to database if user is identified
    if (opts.userId) {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        await syncCustomerInfoToDatabase(customerInfo);
      } catch (syncError) {
        logger.purchases.warn('Initial sync failed:', getErrorMessage(syncError));
      }
    }

    // Pre-validate offerings to catch configuration issues early
    // This prevents the "Play Store API key with no products" error from
    // crashing at an unexpected time later
    try {
      await Purchases.getOfferings();
    } catch (offeringsError) {
      const msg = getErrorMessage(offeringsError);
      if (msg.includes('ConfigurationError') || msg.includes('no products')) {
        logger.purchases.warn(
          'RevenueCat offerings not configured yet. ' +
          'Products must be created in App Store Connect / Google Play Console ' +
          'and linked in RevenueCat dashboard. Subscriptions will be unavailable.',
        );
      } else {
        logger.purchases.warn('Failed to pre-fetch offerings:', msg);
      }
      // Don't fail initialization — the app can still run without subscriptions
    }

    if (typeof userIdOrOptions === 'object') {
      return { success: true, isIdentified: !!opts.userId };
    }
    return true;
  } catch (error) {
    logger.purchases.error('Failed to initialize RevenueCat:', error);
    if (typeof userIdOrOptions === 'object') {
      return { success: false, error: getErrorMessage(error), isIdentified: false };
    }
    return false;
  }
}

/**
 * Set the user ID for RevenueCat (link to Supabase user)
 *
 * Call this after user authentication to link their purchases.
 * This enables purchase syncing across devices.
 *
 * @param userId - Supabase user ID (UUID)
 *
 * @example
 * ```typescript
 * // After user signs in
 * await setUserId(user.id);
 * ```
 */
export async function setUserId(userId: string): Promise<void> {
  try {
    if (!isInitialized) {
      logger.purchases.warn('Cannot set user ID: Purchases not initialized');
      return;
    }

    if (currentUserId === userId) {
      logger.purchases.debug('User ID already set:', userId);
      return;
    }

    logger.purchases.info('Setting RevenueCat user ID:', userId);
    const { customerInfo } = await Purchases.logIn(userId);
    currentUserId = userId;

    // Sync customer info to database after login
    await syncCustomerInfoToDatabase(customerInfo);
  } catch (error) {
    logger.purchases.error('Failed to set user ID:', getErrorMessage(error));
    throw error;
  }
}

/**
 * Login user to RevenueCat (for syncing purchases across devices)
 *
 * @param userId - Supabase user ID
 * @returns Customer info after login
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    await setUserId(userId);
    return await getCustomerInfo();
  } catch (error) {
    logger.purchases.error('Failed to login to RevenueCat:', error);
    return null;
  }
}

/**
 * Log out from RevenueCat
 *
 * Call this when user signs out of your app.
 * Resets to anonymous user and clears user association.
 */
export async function logOutPurchases(): Promise<void> {
  try {
    if (!isInitialized) {
      logger.purchases.debug('Purchases not initialized, skipping logout');
      return;
    }

    logger.purchases.info('Logging out from RevenueCat');
    await Purchases.logOut();
    currentUserId = null;
  } catch (error) {
    logger.purchases.error('Failed to log out:', getErrorMessage(error));
    // Don't throw - logout should be best-effort
  }
}

/**
 * Logout user from RevenueCat (alias for logOutPurchases)
 */
export async function logoutUser(): Promise<void> {
  return logOutPurchases();
}

// ============================================
// CUSTOMER INFO
// ============================================

/**
 * Get current customer info and subscription status
 *
 * @returns Customer info or null if not available
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    if (!isInitialized) {
      logger.purchases.warn('Cannot get customer info: Purchases not initialized');
      return null;
    }

    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    logger.purchases.error('Failed to get customer info:', error);
    return null;
  }
}

/**
 * Check if a specific entitlement is active
 *
 * @param entitlement - Entitlement to check ('plus' or 'premium')
 * @returns Whether the entitlement is currently active
 *
 * @example
 * ```typescript
 * if (await isEntitlementActive('premium')) {
 *   // Show premium features
 * }
 * ```
 */
export async function isEntitlementActive(
  entitlement: EntitlementId | string
): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const entitlementInfo = customerInfo.entitlements.active[entitlement];
    return !!entitlementInfo && entitlementInfo.isActive;
  } catch (error) {
    logger.purchases.error('Failed to check entitlement:', getErrorMessage(error));
    return false;
  }
}

/**
 * Get subscription status from customer info (legacy API)
 *
 * @param customerInfo - Customer info object
 * @returns Subscription status
 */
export function getSubscriptionStatus(
  customerInfo: CustomerInfo | null
): SubscriptionStatus {
  const defaultStatus: SubscriptionStatus = {
    tier: 'free',
    isActive: false,
    willRenew: false,
    expirationDate: null,
    isTrialActive: false,
    trialEndDate: null,
    productId: null,
    originalPurchaseDate: null,
  };

  if (!customerInfo) {
    return defaultStatus;
  }

  // Check for SpendTrak Pro entitlement (main entitlement)
  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
  if (proEntitlement) {
    return {
      tier: 'premium',
      isActive: true,
      willRenew: proEntitlement.willRenew,
      expirationDate: proEntitlement.expirationDate
        ? new Date(proEntitlement.expirationDate)
        : null,
      isTrialActive: proEntitlement.periodType === 'TRIAL',
      trialEndDate:
        proEntitlement.periodType === 'TRIAL' && proEntitlement.expirationDate
          ? new Date(proEntitlement.expirationDate)
          : null,
      productId: proEntitlement.productIdentifier,
      originalPurchaseDate: proEntitlement.originalPurchaseDate
        ? new Date(proEntitlement.originalPurchaseDate)
        : null,
    };
  }

  // Legacy: Check for Premium entitlement
  const premiumEntitlement = customerInfo.entitlements.active['premium'];
  if (premiumEntitlement) {
    return {
      tier: 'premium',
      isActive: true,
      willRenew: premiumEntitlement.willRenew,
      expirationDate: premiumEntitlement.expirationDate
        ? new Date(premiumEntitlement.expirationDate)
        : null,
      isTrialActive: premiumEntitlement.periodType === 'TRIAL',
      trialEndDate:
        premiumEntitlement.periodType === 'TRIAL' && premiumEntitlement.expirationDate
          ? new Date(premiumEntitlement.expirationDate)
          : null,
      productId: premiumEntitlement.productIdentifier,
      originalPurchaseDate: premiumEntitlement.originalPurchaseDate
        ? new Date(premiumEntitlement.originalPurchaseDate)
        : null,
    };
  }

  // Legacy: Check for Plus entitlement (map to premium)
  const plusEntitlement = customerInfo.entitlements.active['plus'];
  if (plusEntitlement) {
    return {
      tier: 'premium', // Plus is now treated as Premium
      isActive: true,
      willRenew: plusEntitlement.willRenew,
      expirationDate: plusEntitlement.expirationDate
        ? new Date(plusEntitlement.expirationDate)
        : null,
      isTrialActive: plusEntitlement.periodType === 'TRIAL',
      trialEndDate:
        plusEntitlement.periodType === 'TRIAL' && plusEntitlement.expirationDate
          ? new Date(plusEntitlement.expirationDate)
          : null,
      productId: plusEntitlement.productIdentifier,
      originalPurchaseDate: plusEntitlement.originalPurchaseDate
        ? new Date(plusEntitlement.originalPurchaseDate)
        : null,
    };
  }

  return defaultStatus;
}

/**
 * Get current subscription status (new API with more details)
 *
 * @returns Comprehensive subscription status object
 */
export async function getCurrentSubscription(): Promise<NewSubscriptionStatus> {
  const defaultStatus: NewSubscriptionStatus = {
    tier: 'free',
    isActive: false,
    isInTrial: false,
    expiresAt: null,
    purchasedAt: null,
    willRenew: false,
    productId: null,
    period: null,
    isInGracePeriod: false,
    hasBillingIssue: false,
  };

  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return defaultStatus;

    // Check for SpendTrak Pro entitlement (main), then legacy entitlements
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    const plusEntitlement = customerInfo.entitlements.active['plus'];
    const activeEntitlement = proEntitlement || premiumEntitlement || plusEntitlement;

    if (!activeEntitlement) {
      return defaultStatus;
    }

    // Determine tier based on which entitlement is active (plus is now treated as premium)
    const tier: SubscriptionTier = 'premium';

    return {
      tier,
      isActive: activeEntitlement.isActive,
      isInTrial: activeEntitlement.periodType === 'TRIAL',
      expiresAt: activeEntitlement.expirationDate,
      purchasedAt: activeEntitlement.originalPurchaseDate,
      willRenew: activeEntitlement.willRenew,
      productId: activeEntitlement.productIdentifier,
      period: extractPeriodFromProductId(activeEntitlement.productIdentifier),
      isInGracePeriod: activeEntitlement.periodType === 'GRACE',
      hasBillingIssue: !!activeEntitlement.billingIssueDetectedAt,
    };
  } catch (error) {
    logger.purchases.error('Failed to get subscription status:', getErrorMessage(error));
    return defaultStatus;
  }
}

/**
 * Get entitlement status for a specific entitlement
 *
 * @param entitlementId - Entitlement to check
 * @returns Detailed entitlement status
 */
export async function getEntitlementStatus(
  entitlementId: EntitlementId | string
): Promise<EntitlementStatus> {
  const defaultStatus: EntitlementStatus = {
    id: entitlementId as EntitlementId,
    isActive: false,
    expiresAt: null,
    productId: null,
    isInTrial: false,
    willRenew: false,
  };

  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return defaultStatus;

    const entitlement = customerInfo.entitlements.active[entitlementId];
    if (!entitlement) return defaultStatus;

    return {
      id: entitlementId as EntitlementId,
      isActive: entitlement.isActive,
      expiresAt: entitlement.expirationDate,
      productId: entitlement.productIdentifier,
      isInTrial: entitlement.periodType === 'TRIAL',
      willRenew: entitlement.willRenew,
    };
  } catch (error) {
    logger.purchases.error('Failed to get entitlement status:', getErrorMessage(error));
    return defaultStatus;
  }
}

// ============================================
// OFFERINGS
// ============================================

/**
 * Get available offerings (subscription packages)
 *
 * @returns Structured offering data with pricing
 */
export async function getOfferings(): Promise<OfferingData | null> {
  try {
    if (!isInitialized) {
      logger.purchases.warn('Cannot get offerings: Purchases not initialized');
      return null;
    }

    let offerings: PurchasesOfferings;
    try {
      offerings = await Purchases.getOfferings();
    } catch (offeringsError) {
      const msg = getErrorMessage(offeringsError);
      if (msg.includes('ConfigurationError') || msg.includes('no products')) {
        // Play Store / App Store products not configured yet
        // This is expected during development or before store setup
        logger.purchases.warn(
          'No store products configured. Create products in App Store Connect / ' +
          'Google Play Console and link them in RevenueCat dashboard.',
        );
        return null;
      }
      throw offeringsError;
    }

    if (!offerings.current) {
      logger.purchases.warn('No current offering available');
      return null;
    }

    const packages = offerings.current.availablePackages;

    // Debug: Log available packages to help diagnose configuration issues
    logger.purchases.info('Available packages from RevenueCat:',
      packages.map(p => ({
        identifier: p.identifier,
        productId: p.product.identifier,
        price: p.product.priceString,
      }))
    );

    // Find packages by identifier
    const plusMonthly =
      packages.find(
        (p) =>
          p.identifier === '$rc_monthly' && p.product.identifier.includes('plus')
      ) ||
      packages.find((p) => p.product.identifier === PRODUCT_IDS.PLUS_MONTHLY) ||
      null;

    const plusYearly =
      packages.find(
        (p) =>
          p.identifier === '$rc_annual' && p.product.identifier.includes('plus')
      ) ||
      packages.find((p) => p.product.identifier === PRODUCT_IDS.PLUS_YEARLY) ||
      null;

    const premiumMonthly =
      // First try exact match with expected product ID
      packages.find((p) => p.product.identifier === PRODUCT_IDS.PREMIUM_MONTHLY) ||
      // Then try $rc_monthly with 'premium' in product ID
      packages.find(
        (p) =>
          p.identifier === '$rc_monthly' &&
          p.product.identifier.includes('premium')
      ) ||
      // Fallback: any monthly package (for simpler RevenueCat setups)
      packages.find((p) => p.identifier === '$rc_monthly') ||
      null;

    const premiumYearly =
      // First try exact match with expected product ID
      packages.find((p) => p.product.identifier === PRODUCT_IDS.PREMIUM_YEARLY) ||
      // Then try $rc_annual with 'premium' in product ID
      packages.find(
        (p) =>
          p.identifier === '$rc_annual' &&
          p.product.identifier.includes('premium')
      ) ||
      // Fallback: any annual package (for simpler RevenueCat setups)
      packages.find((p) => p.identifier === '$rc_annual') ||
      null;

    // Debug: Log which packages were matched
    logger.purchases.info('Matched packages:', {
      premiumMonthly: premiumMonthly?.product.identifier || 'NOT FOUND',
      premiumYearly: premiumYearly?.product.identifier || 'NOT FOUND',
    });

    // Calculate pricing for Plus
    let plusPricing: PlanPricing | null = null;
    if (plusMonthly && plusYearly) {
      const monthlyPrice = plusMonthly.product.price;
      const yearlyPrice = plusYearly.product.price;
      plusPricing = {
        monthlyPrice: plusMonthly.product.priceString,
        yearlyPrice: plusYearly.product.priceString,
        monthlyPriceValue: monthlyPrice,
        yearlyPriceValue: yearlyPrice,
        yearlySavingsPercent: Math.round(
          (1 - yearlyPrice / 12 / monthlyPrice) * 100
        ),
        currency: plusMonthly.product.currencyCode,
      };
    }

    // Calculate pricing for Premium
    let premiumPricing: PlanPricing | null = null;
    if (premiumMonthly && premiumYearly) {
      const monthlyPrice = premiumMonthly.product.price;
      const yearlyPrice = premiumYearly.product.price;
      premiumPricing = {
        monthlyPrice: premiumMonthly.product.priceString,
        yearlyPrice: premiumYearly.product.priceString,
        monthlyPriceValue: monthlyPrice,
        yearlyPriceValue: yearlyPrice,
        yearlySavingsPercent: Math.round(
          (1 - yearlyPrice / 12 / monthlyPrice) * 100
        ),
        currency: premiumMonthly.product.currencyCode,
      };
    }

    return {
      plusMonthly,
      plusYearly,
      premiumMonthly,
      premiumYearly,
      plusPricing,
      premiumPricing,
    };
  } catch (error) {
    logger.purchases.error('Failed to get offerings:', error);
    return null;
  }
}

/**
 * Get raw RevenueCat offerings
 *
 * @returns Raw offerings object from RevenueCat
 */
export async function getRawOfferings(): Promise<PurchasesOfferings | null> {
  try {
    if (!isInitialized) {
      logger.purchases.warn('Cannot get offerings: Purchases not initialized');
      return null;
    }

    return await Purchases.getOfferings();
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('ConfigurationError') || msg.includes('no products')) {
      logger.purchases.warn(
        'No store products configured. Subscriptions unavailable until products are set up.',
      );
      return null;
    }
    logger.purchases.error('Failed to get raw offerings:', msg);
    return null;
  }
}

/**
 * Get current offering packages formatted for UI display
 *
 * @returns Array of package info for UI
 */
export async function getCurrentPackages(): Promise<PackageInfo[]> {
  try {
    const offerings = await getRawOfferings();
    if (!offerings?.current) {
      logger.purchases.debug('No current offering available');
      return [];
    }

    return offerings.current.availablePackages.map(formatPackageInfo);
  } catch (error) {
    logger.purchases.error('Failed to get packages:', getErrorMessage(error));
    return [];
  }
}

// ============================================
// PURCHASES
// ============================================

/**
 * Purchase a subscription package
 *
 * @param pkg - RevenueCat package to purchase
 * @returns Purchase result with success status and customer info
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    if (!isInitialized) {
      return {
        success: false,
        error: 'Purchase service not initialized',
        errorCode: 'CONFIGURATION_ERROR',
      };
    }

    logger.purchases.info('Starting purchase for package:', pkg.identifier);

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    logger.purchases.info('Purchase successful:', pkg.product.identifier);

    // Sync to database
    await syncCustomerInfoToDatabase(customerInfo);

    return {
      success: true,
      customerInfo,
    };
  } catch (error) {
    const purchaseError = mapRevenueCatError(error);
    logger.purchases.error('Purchase failed:', {
      code: purchaseError.code,
      message: purchaseError.message,
    });

    return {
      success: false,
      error: purchaseError.message,
      errorCode: purchaseError.code,
      isPending: purchaseError.code === 'PAYMENT_PENDING',
    };
  }
}

/**
 * Purchase a specific product by ID
 *
 * @param productId - Product identifier
 * @returns Purchase result
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    const offerings = await getRawOfferings();
    if (!offerings?.current) {
      return {
        success: false,
        error: 'No offerings available',
        errorCode: 'PRODUCT_NOT_AVAILABLE',
      };
    }

    const pkg = offerings.current.availablePackages.find(
      (p) => p.product.identifier === productId
    );

    if (!pkg) {
      return {
        success: false,
        error: 'Product not found',
        errorCode: 'PRODUCT_NOT_AVAILABLE',
      };
    }

    return purchasePackage(pkg);
  } catch (error) {
    const purchaseError = mapRevenueCatError(error);
    return {
      success: false,
      error: purchaseError.message,
      errorCode: purchaseError.code,
    };
  }
}

// ============================================
// RESTORE
// ============================================

/**
 * Restore previous purchases
 *
 * @returns Restore result with count of restored purchases
 */
export async function restorePurchases(): Promise<RestoreResult> {
  try {
    if (!isInitialized) {
      return {
        success: false,
        error: 'Purchase service not initialized',
      };
    }

    logger.purchases.info('Restoring purchases...');

    const customerInfo = await Purchases.restorePurchases();
    const status = getSubscriptionStatus(customerInfo);

    // Count active entitlements as restored purchases
    const restoredCount = Object.keys(customerInfo.entitlements.active).length;

    if (restoredCount > 0) {
      logger.purchases.info(`Restored ${restoredCount} purchase(s):`, status.tier);
      await syncCustomerInfoToDatabase(customerInfo);
    } else {
      logger.purchases.info('No purchases to restore');
    }

    return {
      success: true,
      customerInfo,
      restoredCount,
      error:
        restoredCount === 0
          ? 'No active subscriptions found to restore.'
          : undefined,
    };
  } catch (error) {
    logger.purchases.error('Failed to restore purchases:', error);

    return {
      success: false,
      error: 'Failed to restore purchases. Please try again.',
    };
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Get URL for managing subscription in App Store / Play Store
 *
 * @returns Management URL or null if not available
 */
export async function getSubscriptionManagementURL(): Promise<string | null> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;

    return customerInfo.managementURL;
  } catch (error) {
    logger.purchases.error('Failed to get management URL:', getErrorMessage(error));
    return null;
  }
}

/**
 * Open subscription management in device settings
 */
export function openSubscriptionManagement(): void {
  if (Platform.OS === 'ios') {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  } else {
    Linking.openURL('https://play.google.com/store/account/subscriptions');
  }
}

/**
 * Check if user is eligible for trial on a product (legacy API)
 *
 * @param pkg - Package to check
 * @returns Whether trial is available
 */
export async function checkTrialEligibility(
  pkg: PurchasesPackage
): Promise<boolean> {
  try {
    // RevenueCat handles trial eligibility automatically
    // If the product has an intro offer and user is eligible, it will be applied
    return pkg.product.introPrice !== null;
  } catch (error) {
    logger.purchases.error('Failed to check trial eligibility:', error);
    return false;
  }
}

/**
 * Check if user is eligible for trial on a product by ID (new API)
 *
 * @param productId - Product identifier to check
 * @returns Trial eligibility result
 */
export async function checkTrialEligibilityByProductId(
  productId: string
): Promise<TrialEligibilityResult> {
  try {
    const offerings = await getRawOfferings();
    if (!offerings?.current) {
      return { productId, eligibility: 'unknown' };
    }

    const pkg = offerings.current.availablePackages.find(
      (p) => p.product.identifier === productId
    );

    if (!pkg) {
      return { productId, eligibility: 'unknown' };
    }

    // Check if product has intro pricing (trial)
    const hasIntroPrice = pkg.product.introPrice !== null;

    if (!hasIntroPrice) {
      return { productId, eligibility: 'ineligible' };
    }

    // Check intro eligibility status
    const eligibilityMap = await Purchases.checkTrialOrIntroductoryPriceEligibility([
      productId,
    ]);

    const eligibility = eligibilityMap[productId];

    if (eligibility === undefined) {
      return { productId, eligibility: 'unknown' };
    }

    // Map RevenueCat eligibility to our type
    const eligibilityValue: TrialEligibility =
      eligibility.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        ? 'eligible'
        : eligibility.status ===
            INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE
          ? 'ineligible'
          : 'unknown';

    return { productId, eligibility: eligibilityValue };
  } catch (error) {
    logger.purchases.error(
      'Failed to check trial eligibility:',
      getErrorMessage(error)
    );
    return { productId, eligibility: 'unknown' };
  }
}

/**
 * Get trial duration string for display
 *
 * @param pkg - Package to get trial info from
 * @returns Formatted trial duration string or null
 */
export function getTrialDurationString(pkg: PurchasesPackage): string | null {
  const introPrice = pkg.product.introPrice;
  if (!introPrice) return null;

  const periodUnit = introPrice.periodUnit;
  const periodCount = introPrice.periodNumberOfUnits;

  switch (periodUnit) {
    case 'DAY':
      return periodCount === 1 ? '1 day' : `${periodCount} days`;
    case 'WEEK':
      return periodCount === 1 ? '1 week' : `${periodCount} weeks`;
    case 'MONTH':
      return periodCount === 1 ? '1 month' : `${periodCount} months`;
    case 'YEAR':
      return periodCount === 1 ? '1 year' : `${periodCount} years`;
    default:
      return null;
  }
}

// ============================================
// DATABASE SYNC
// ============================================

/**
 * Sync customer info to Supabase database
 *
 * Updates the user_subscriptions table with current subscription state.
 *
 * @param customerInfo - RevenueCat customer info to sync
 */
export async function syncCustomerInfoToDatabase(
  customerInfo: CustomerInfo
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.purchases.debug('No authenticated user, skipping sync');
      return;
    }

    const syncData = buildSyncData(customerInfo);

    logger.purchases.debug('Syncing subscription to database:', syncData.tier);

    // Upsert to user_subscriptions table
    const { error } = await supabase.from('user_subscriptions').upsert(
      {
        user_id: user.id,
        ...syncData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      logger.purchases.error('Failed to sync subscription:', error.message);
    } else {
      logger.purchases.info('Subscription synced to database');
    }
  } catch (error) {
    logger.purchases.error(
      'Failed to sync customer info:',
      getErrorMessage(error)
    );
  }
}

/**
 * Fetch subscription status from database
 *
 * @returns Subscription data from database or null
 */
export async function fetchSubscriptionFromDatabase(): Promise<SubscriptionSyncData | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // Not a "not found" error
        logger.purchases.error('Failed to fetch subscription:', error.message);
      }
      return null;
    }

    return data as SubscriptionSyncData;
  } catch (error) {
    logger.purchases.error(
      'Failed to fetch subscription from database:',
      getErrorMessage(error)
    );
    return null;
  }
}

// ============================================
// CUSTOMER INFO LISTENERS
// ============================================

/**
 * Subscribe to customer info updates
 *
 * Listener is called whenever subscription status changes.
 *
 * @param listener - Callback for customer info changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToCustomerInfo((customerInfo) => {
 *   const status = getSubscriptionStatus(customerInfo);
 *   updateUI(status);
 * });
 *
 * // Later, to unsubscribe
 * unsubscribe();
 * ```
 */
export function subscribeToCustomerInfo(
  listener: CustomerInfoListener
): () => void {
  customerInfoListeners.add(listener);

  return () => {
    customerInfoListeners.delete(listener);
  };
}

/**
 * Handle customer info updates from RevenueCat
 */
function handleCustomerInfoUpdate(customerInfo: CustomerInfo): void {
  logger.purchases.debug('Customer info updated');

  // Sync to database
  syncCustomerInfoToDatabase(customerInfo).catch((error) => {
    logger.purchases.error('Failed to sync on update:', getErrorMessage(error));
  });

  // Notify listeners
  customerInfoListeners.forEach((listener) => {
    try {
      listener(customerInfo);
    } catch (error) {
      logger.purchases.error('Listener error:', getErrorMessage(error));
    }
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format a RevenueCat package for UI display
 */
function formatPackageInfo(pkg: PurchasesPackage): PackageInfo {
  const product = pkg.product;

  return {
    id: pkg.identifier,
    productId: product.identifier,
    title: product.title,
    description: product.description,
    priceString: product.priceString,
    priceAmountMicros: Math.round(product.price * 1000000),
    currencyCode: product.currencyCode,
    period: extractPeriodFromProductId(product.identifier),
    introPrice: product.introPrice
      ? {
          priceString: product.introPrice.priceString,
          cycles: product.introPrice.cycles,
          periodUnit: product.introPrice.periodUnit,
          periodNumberOfUnits: product.introPrice.periodNumberOfUnits,
        }
      : undefined,
    rcPackage: pkg,
  };
}

/**
 * Extract subscription period from product ID
 */
function extractPeriodFromProductId(productId: string): SubscriptionPeriod | null {
  const lowerProductId = productId.toLowerCase();

  for (const [keyword, period] of Object.entries(PERIOD_KEYWORDS)) {
    if (lowerProductId.includes(keyword)) {
      return period;
    }
  }

  return null;
}

/**
 * Build sync data from customer info
 */
function buildSyncData(customerInfo: CustomerInfo): SubscriptionSyncData {
  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
  const premiumEntitlement = customerInfo.entitlements.active['premium'];
  const plusEntitlement = customerInfo.entitlements.active['plus'];
  const activeEntitlement = proEntitlement || premiumEntitlement || plusEntitlement;

  if (!activeEntitlement) {
    return {
      tier: 'free',
      status: 'expired',
      started_at: new Date().toISOString(),
      expires_at: null,
      cancelled_at: null,
      payment_provider: 'revenuecat',
      payment_id: customerInfo.originalAppUserId,
      amount: null,
      currency: 'USD',
      metadata: {
        product_id: null,
        entitlement_id: null,
        is_trial: false,
        will_renew: false,
        original_purchase_date: customerInfo.originalPurchaseDate,
        store: 'unknown',
      },
    };
  }

  const tier: SubscriptionTier = 'premium'; // All paid subscriptions are now Premium tier
  const isTrial = activeEntitlement.periodType === 'TRIAL';
  const isCancelled =
    !activeEntitlement.willRenew && !!activeEntitlement.expirationDate;

  let status: 'active' | 'cancelled' | 'expired' | 'trial';
  if (isTrial) {
    status = 'trial';
  } else if (isCancelled) {
    status = 'cancelled';
  } else if (!activeEntitlement.isActive) {
    status = 'expired';
  } else {
    status = 'active';
  }

  // Determine store
  type StoreType = 'app_store' | 'play_store' | 'stripe' | 'unknown';
  let store: StoreType = 'unknown';
  if (activeEntitlement.store) {
    const storeMap: Record<string, StoreType> = {
      APP_STORE: 'app_store',
      PLAY_STORE: 'play_store',
      STRIPE: 'stripe',
    };
    store = storeMap[activeEntitlement.store] || 'unknown';
  }

  // Determine entitlement ID
  const entitlementId = proEntitlement
    ? 'SpendTrak Pro'
    : 'premium'; // All are mapped to premium

  return {
    tier,
    status,
    started_at: activeEntitlement.originalPurchaseDate || new Date().toISOString(),
    expires_at: activeEntitlement.expirationDate,
    cancelled_at: isCancelled ? new Date().toISOString() : null,
    payment_provider: 'revenuecat',
    payment_id: customerInfo.originalAppUserId,
    amount: null, // RevenueCat doesn't expose price paid
    currency: 'USD',
    metadata: {
      product_id: activeEntitlement.productIdentifier,
      entitlement_id: entitlementId as any,
      is_trial: isTrial,
      will_renew: activeEntitlement.willRenew,
      original_purchase_date: activeEntitlement.originalPurchaseDate,
      store,
    },
  };
}

/**
 * Type guard for RevenueCat purchase errors
 */
interface RevenueCatError {
  code: number;
  message: string;
  userCancelled?: boolean;
}

function isRevenueCatError(error: unknown): error is RevenueCatError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as RevenueCatError).code === 'number' &&
    'message' in error
  );
}

/**
 * Map RevenueCat error to user-friendly error
 */
function mapRevenueCatError(error: unknown): PurchaseError {
  if (isRevenueCatError(error)) {
    // Check if user cancelled
    if (error.userCancelled) {
      return {
        code: 'PURCHASE_CANCELLED',
        message: 'Purchase was cancelled',
        details: error.message,
        isRecoverable: true,
      };
    }

    const errorMap: Record<
      number,
      { code: PurchaseErrorCode; message: string; recoverable: boolean }
    > = {
      [PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR]: {
        code: 'PURCHASE_CANCELLED',
        message: 'Purchase was cancelled.',
        recoverable: true,
      },
      [PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR]: {
        code: 'PAYMENT_PENDING',
        message: 'Payment is pending approval (e.g., parental approval).',
        recoverable: true,
      },
      [PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR]: {
        code: 'PRODUCT_NOT_AVAILABLE',
        message: 'This product is not available for purchase.',
        recoverable: false,
      },
      [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]: {
        code: 'PURCHASE_NOT_ALLOWED',
        message: 'Purchases are not allowed on this device.',
        recoverable: false,
      },
      [PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR]: {
        code: 'PURCHASE_INVALID',
        message: 'The purchase was invalid.',
        recoverable: false,
      },
      [PURCHASES_ERROR_CODE.NETWORK_ERROR]: {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
        recoverable: true,
      },
      [PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR]: {
        code: 'STORE_PROBLEM',
        message:
          'There was a problem with the App Store. Please try again later.',
        recoverable: true,
      },
      [PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR]: {
        code: 'ALREADY_PURCHASED',
        message: 'You already own this product. Try restoring purchases.',
        recoverable: false,
      },
      [PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR]: {
        code: 'RECEIPT_ALREADY_IN_USE',
        message: 'This receipt is already associated with another account.',
        recoverable: false,
      },
      [PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR]: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials. Please try again.',
        recoverable: false,
      },
      [PURCHASES_ERROR_CODE.CONFIGURATION_ERROR]: {
        code: 'CONFIGURATION_ERROR',
        message: 'Purchase configuration error. Please contact support.',
        recoverable: false,
      },
    };

    const mapped = errorMap[error.code];
    if (mapped) {
      return {
        code: mapped.code,
        message: mapped.message,
        details: error.message,
        isRecoverable: mapped.recoverable,
      };
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    details: getErrorMessage(error),
    isRecoverable: true,
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Initialization
  initializePurchases,
  setUserId,
  loginUser,
  logOutPurchases,
  logoutUser,

  // Customer Info
  getCustomerInfo,
  isEntitlementActive,
  getSubscriptionStatus,
  getCurrentSubscription,
  getEntitlementStatus,

  // Offerings
  getOfferings,
  getRawOfferings,
  getCurrentPackages,

  // Purchases
  purchasePackage,
  purchaseProduct,

  // Restore
  restorePurchases,

  // Management
  getSubscriptionManagementURL,
  openSubscriptionManagement,
  checkTrialEligibility,
  checkTrialEligibilityByProductId,
  getTrialDurationString,

  // Database
  syncCustomerInfoToDatabase,
  fetchSubscriptionFromDatabase,

  // Listeners
  subscribeToCustomerInfo,

  // Constants
  ENTITLEMENTS,
  PRODUCT_IDS,
};

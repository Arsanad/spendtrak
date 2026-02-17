/**
 * Purchase Types - RevenueCat Integration
 * Type definitions for in-app purchases and subscriptions
 */

import type { PurchasesPackage, CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';

// ============================================
// SUBSCRIPTION TIERS
// ============================================

/** Available subscription tiers in SpendTrak */
export type SubscriptionTier = 'free' | 'premium';

/** Subscription billing periods */
export type SubscriptionPeriod = 'monthly' | 'yearly';

/** Entitlement identifiers matching RevenueCat dashboard */
export type EntitlementId = 'SpendTrak Pro' | 'premium';

// ============================================
// PURCHASE RESULT TYPES
// ============================================

/** Result of a purchase attempt */
export interface PurchaseResult {
  /** Whether the purchase was successful */
  success: boolean;
  /** Customer info after purchase (if successful) */
  customerInfo?: CustomerInfo;
  /** Error message (if failed) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: PurchaseErrorCode;
  /** Whether the purchase is pending (e.g., parental approval) */
  isPending?: boolean;
}

/** Result of a restore attempt */
export interface RestoreResult {
  /** Whether restore was successful */
  success: boolean;
  /** Customer info after restore (if successful) */
  customerInfo?: CustomerInfo;
  /** Error message (if failed) */
  error?: string;
  /** Number of purchases restored */
  restoredCount?: number;
}

// ============================================
// SUBSCRIPTION STATUS
// ============================================

/** Current subscription status for the user */
export interface SubscriptionStatus {
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Whether the subscription is active */
  isActive: boolean;
  /** Whether the user is in a trial period */
  isInTrial: boolean;
  /** Expiration date (ISO string) */
  expiresAt: string | null;
  /** Original purchase date (ISO string) */
  purchasedAt: string | null;
  /** Whether auto-renewal is enabled */
  willRenew: boolean;
  /** Product identifier */
  productId: string | null;
  /** Billing period */
  period: SubscriptionPeriod | null;
  /** Whether grace period is active */
  isInGracePeriod: boolean;
  /** Whether billing issue detected */
  hasBillingIssue: boolean;
}

/** Detailed entitlement information */
export interface EntitlementStatus {
  /** Entitlement identifier */
  id: EntitlementId;
  /** Whether the entitlement is active */
  isActive: boolean;
  /** Expiration date */
  expiresAt: string | null;
  /** Product identifier that granted this entitlement */
  productId: string | null;
  /** Whether in trial period */
  isInTrial: boolean;
  /** Whether will auto-renew */
  willRenew: boolean;
}

// ============================================
// OFFERINGS & PACKAGES
// ============================================

/** Simplified offering information */
export interface OfferingInfo {
  /** Offering identifier */
  id: string;
  /** Available packages in this offering */
  packages: PackageInfo[];
  /** Whether this is the current offering */
  isCurrent: boolean;
}

/** Simplified package information for UI display */
export interface PackageInfo {
  /** Package identifier */
  id: string;
  /** Product identifier */
  productId: string;
  /** Display title */
  title: string;
  /** Description */
  description: string;
  /** Formatted price string (e.g., "$9.99") */
  priceString: string;
  /** Price in micros (for comparison) */
  priceAmountMicros: number;
  /** Currency code */
  currencyCode: string;
  /** Billing period */
  period: SubscriptionPeriod | null;
  /** Introductory price info (for trials) */
  introPrice?: {
    priceString: string;
    cycles: number;
    periodUnit: string;
    periodNumberOfUnits: number;
  };
  /** Original RevenueCat package (for purchase) */
  rcPackage: PurchasesPackage;
}

// ============================================
// ERROR TYPES
// ============================================

/** Purchase error codes for handling different scenarios */
export type PurchaseErrorCode =
  | 'PURCHASE_CANCELLED'
  | 'PAYMENT_PENDING'
  | 'PRODUCT_NOT_AVAILABLE'
  | 'PURCHASE_NOT_ALLOWED'
  | 'PURCHASE_INVALID'
  | 'NETWORK_ERROR'
  | 'STORE_PROBLEM'
  | 'ALREADY_PURCHASED'
  | 'RECEIPT_ALREADY_IN_USE'
  | 'INVALID_CREDENTIALS'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

/** Detailed purchase error */
export interface PurchaseError {
  /** Error code */
  code: PurchaseErrorCode;
  /** User-friendly error message */
  message: string;
  /** Technical details (for logging) */
  details?: string;
  /** Whether the error is recoverable */
  isRecoverable: boolean;
}

// ============================================
// TRIAL ELIGIBILITY
// ============================================

/** Trial eligibility status */
export type TrialEligibility = 'eligible' | 'ineligible' | 'unknown';

/** Trial eligibility result */
export interface TrialEligibilityResult {
  /** Product identifier */
  productId: string;
  /** Eligibility status */
  eligibility: TrialEligibility;
}

// ============================================
// DATABASE SYNC TYPES
// ============================================

/** Data to sync to Supabase user_subscriptions table */
export interface SubscriptionSyncData {
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  payment_provider: 'revenuecat';
  payment_id: string | null;
  amount: number | null;
  currency: string;
  metadata: {
    product_id: string | null;
    entitlement_id: EntitlementId | null;
    is_trial: boolean;
    will_renew: boolean;
    original_purchase_date: string | null;
    store: 'app_store' | 'play_store' | 'stripe' | 'unknown';
  };
}

// ============================================
// CUSTOMER INFO LISTENER
// ============================================

/** Callback type for customer info updates */
export type CustomerInfoListener = (customerInfo: CustomerInfo) => void;

// ============================================
// INITIALIZATION
// ============================================

/** Purchase service initialization options */
export interface PurchaseInitOptions {
  /** RevenueCat API key for iOS */
  iosApiKey?: string;
  /** RevenueCat API key for Android */
  androidApiKey?: string;
  /** User ID to associate with RevenueCat (typically Supabase user ID) */
  userId?: string;
  /** Enable debug logging */
  debugMode?: boolean;
}

/** Initialization result */
export interface InitResult {
  /** Whether initialization was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Whether user was identified */
  isIdentified: boolean;
}

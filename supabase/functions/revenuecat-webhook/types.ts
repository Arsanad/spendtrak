/**
 * RevenueCat Webhook Types
 * Types for RevenueCat webhook payloads and SpendTrak integration
 *
 * @see https://www.revenuecat.com/docs/webhooks
 */

// ============================================
// REVENUECAT WEBHOOK EVENT TYPES
// ============================================

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'      // New subscription purchased
  | 'RENEWAL'               // Subscription successfully renewed
  | 'CANCELLATION'          // User cancelled (still has access until period ends)
  | 'UNCANCELLATION'        // User re-enabled auto-renew
  | 'BILLING_ISSUE'         // Payment failed, entering grace period
  | 'SUBSCRIBER_ALIAS'      // Customer ID changed/merged
  | 'SUBSCRIPTION_PAUSED'   // Subscription paused (Android only)
  | 'EXPIRATION'            // Subscription expired (no longer has access)
  | 'PRODUCT_CHANGE'        // User changed subscription tier
  | 'TRANSFER'              // Purchase transferred between users
  | 'NON_RENEWING_PURCHASE' // One-time purchase
  | 'SUBSCRIPTION_EXTENDED' // Subscription extended (promo, support, etc.)
  | 'BILLING_ISSUE_RESOLVED'; // Payment issue resolved

// ============================================
// REVENUECAT WEBHOOK PAYLOAD
// ============================================

export interface RevenueCatSubscriberInfo {
  original_app_user_id: string;
  aliases: string[];
  first_seen: string;
  last_seen: string;
  non_subscriptions: Record<string, NonSubscriptionPurchase[]>;
  subscriptions: Record<string, SubscriptionInfo>;
  entitlements: Record<string, EntitlementInfo>;
}

export interface NonSubscriptionPurchase {
  id: string;
  is_sandbox: boolean;
  original_purchase_date: string;
  purchase_date: string;
  store: string;
  store_transaction_id: string;
}

export interface SubscriptionInfo {
  auto_resume_date: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string;
  grace_period_expires_date: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
  period_type: 'normal' | 'trial' | 'intro';
  product_plan_identifier: string | null;
  purchase_date: string;
  refunded_at: string | null;
  store: 'app_store' | 'play_store' | 'stripe' | 'promotional' | 'amazon';
  store_transaction_id: string;
  unsubscribe_detected_at: string | null;
}

export interface EntitlementInfo {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  product_plan_identifier: string | null;
  purchase_date: string;
}

export interface RevenueCatEvent {
  aliases: string[];
  app_id: string;
  app_user_id: string;
  commission_percentage: number | null;
  country_code: string;
  currency: string;
  entitlement_id: string | null;
  entitlement_ids: string[];
  environment: 'SANDBOX' | 'PRODUCTION';
  event_timestamp_ms: number;
  expiration_at_ms: number | null;
  id: string;
  is_family_share: boolean;
  is_trial_conversion: boolean | null;
  offer_code: string | null;
  original_app_user_id: string;
  original_transaction_id: string;
  period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
  presented_offering_id: string | null;
  price: number;
  price_in_purchased_currency: number;
  product_id: string;
  purchased_at_ms: number;
  store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL' | 'AMAZON';
  subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
  takehome_percentage: number | null;
  tax_percentage: number | null;
  transaction_id: string;
  type: RevenueCatEventType;
  // Cancellation specific
  cancel_reason?: 'UNSUBSCRIBE' | 'BILLING_ERROR' | 'DEVELOPER_INITIATED' | 'PRICE_INCREASE' | 'CUSTOMER_SUPPORT' | 'UNKNOWN';
  // Product change specific
  new_product_id?: string;
  // Transfer specific
  transferred_from?: string[];
  transferred_to?: string[];
}

export interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

// ============================================
// SPENDTRAK SUBSCRIPTION TYPES
// ============================================

export type SpendTrakTier = 'free' | 'plus' | 'premium';

export type SpendTrakSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'cancelled'    // Cancelled but still has access
  | 'expired'
  | 'paused'
  | 'billing_issue'; // In grace period

export interface SubscriptionUpdate {
  user_id: string;
  tier: SpendTrakTier;
  status: SpendTrakSubscriptionStatus;
  revenuecat_app_user_id: string;
  product_id: string | null;
  expires_at: string | null;
  started_at: string;
  cancelled_at: string | null;
  billing_issue_detected_at: string | null;
  grace_period_expires_at: string | null;
  store: string;
  environment: 'sandbox' | 'production';
  is_family_share: boolean;
  updated_at: string;
}

export interface SubscriptionEventRecord {
  user_id: string;
  event_type: RevenueCatEventType;
  event_id: string;
  product_id: string;
  price: number;
  currency: string;
  store: string;
  environment: 'sandbox' | 'production';
  event_timestamp: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

// ============================================
// ENTITLEMENT TO TIER MAPPING
// ============================================

export const ENTITLEMENT_TO_TIER: Record<string, SpendTrakTier> = {
  'plus': 'plus',
  'premium': 'premium',
  'pro': 'premium',  // Legacy alias
};

export const PRODUCT_TO_TIER: Record<string, SpendTrakTier> = {
  // iOS Products
  'spendtrak_plus_monthly': 'plus',
  'spendtrak_plus_yearly': 'plus',
  'spendtrak_premium_monthly': 'premium',
  'spendtrak_premium_yearly': 'premium',
  // Android Products
  'spendtrak.plus.monthly': 'plus',
  'spendtrak.plus.yearly': 'plus',
  'spendtrak.premium.monthly': 'premium',
  'spendtrak.premium.yearly': 'premium',
  // Stripe Products
  'price_plus_monthly': 'plus',
  'price_plus_yearly': 'plus',
  'price_premium_monthly': 'premium',
  'price_premium_yearly': 'premium',
};

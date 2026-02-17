/**
 * Subscription Service
 * Subscription detection, management, and cancellation
 * Uses Supabase for real accounts, local AsyncStorage for dev mode
 */

import { supabase } from './supabase';
import type {
  Subscription,
  SubscriptionWithCategory,
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionSummary,
  SubscriptionStatus,
  SubscriptionFrequency,
} from '@/types';
import { detectSubscription, SUBSCRIPTION_PATTERNS } from '@/config/subscriptions';
import { useAuthStore } from '@/stores/authStore';
import * as devStorage from './devStorage';
import { isDevMode } from '@/utils/devMode';

/**
 * Get the current user ID (from Supabase or dev mode)
 * For OAuth users, always verifies the Supabase session is valid
 */
async function getCurrentUserId(): Promise<string> {
  // First check if we're in dev mode
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.id?.startsWith('dev-user-')) {
    return storeUser.id;
  }

  // For OAuth users, verify the Supabase session is valid
  // First try to get the current session
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData?.session?.user) {
    return sessionData.session.user.id;
  }

  // No valid session, try to refresh
  const { data: refreshData } = await supabase.auth.refreshSession();

  if (refreshData?.session?.user) {
    return refreshData.session.user.id;
  }

  // Last resort: try getUser()
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

/**
 * Get all subscriptions for current user
 */
export async function getSubscriptions(
  status?: SubscriptionStatus
): Promise<SubscriptionWithCategory[]> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevSubscriptions(status);
  }

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      category:categories(*)
    `)
    .order('next_billing_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get single subscription by ID
 */
export async function getSubscription(id: string): Promise<SubscriptionWithCategory | null> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevSubscription(id);
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create subscription
 */
export async function createSubscription(
  subscription: Omit<SubscriptionInsert, 'user_id'>
): Promise<Subscription> {
  const userId = await getCurrentUserId();

  const subscriptionData: SubscriptionInsert = {
    ...subscription,
    user_id: userId,
  };

  // Try to detect subscription pattern for additional info
  const pattern = detectSubscription(subscriptionData.merchant_name);
  if (pattern) {
    subscriptionData.display_name = subscriptionData.display_name || pattern.displayName;
    subscriptionData.icon = subscriptionData.icon || pattern.icon;
    subscriptionData.cancellation_url = subscriptionData.cancellation_url || pattern.cancellationUrl || null;
    subscriptionData.cancellation_instructions =
      subscriptionData.cancellation_instructions || pattern.cancellationInstructions || null;
  }

  // In dev mode, save to local storage
  if (isDevMode()) {
    const mockSubscription: Subscription = {
      id: 'dev-sub-' + Date.now(),
      user_id: userId,
      merchant_name: subscriptionData.merchant_name,
      display_name: subscriptionData.display_name || null,
      icon: subscriptionData.icon || null,
      category_id: subscriptionData.category_id || null,
      amount: subscriptionData.amount,
      currency: subscriptionData.currency || 'USD',
      frequency: subscriptionData.frequency,
      billing_day: subscriptionData.billing_day || null,
      next_billing_date: subscriptionData.next_billing_date || null,
      last_billing_date: subscriptionData.last_billing_date || null,
      status: subscriptionData.status || 'active',
      cancellation_url: subscriptionData.cancellation_url || null,
      cancellation_instructions: subscriptionData.cancellation_instructions || null,
      auto_detected: subscriptionData.auto_detected || false,
      detection_confidence: subscriptionData.detection_confidence || null,
      last_used_at: subscriptionData.last_used_at || null,
      usage_count: subscriptionData.usage_count || 0,
      notes: subscriptionData.notes || null,
      metadata: subscriptionData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return devStorage.saveDevSubscription(mockSubscription);
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update subscription
 */
export async function updateSubscription(
  id: string,
  updates: SubscriptionUpdate
): Promise<Subscription> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.updateDevSubscription(id, updates);
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  id: string,
  reason?: string
): Promise<Subscription> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.cancelDevSubscription(id, reason);
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled' as SubscriptionStatus,
      metadata: reason ? { cancellation_reason: reason } : undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log the savings
  if (data) {
    const yearlySavings = calculateYearlySavings(data.amount, data.frequency);
    await logSavings(
      data.user_id,
      'subscription_cancelled',
      yearlySavings,
      `Cancelled ${data.merchant_name}`,
      'subscription',
      data.id
    );
  }

  return data;
}

/**
 * Get subscription summary
 */
export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevSubscriptionSummary();
  }

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*');

  if (!subscriptions) {
    return {
      total_monthly: 0,
      total_yearly: 0,
      active_count: 0,
      cancelled_count: 0,
      upcoming_renewals: 0,
      potential_savings: 0,
      unused_subscriptions: [],
    };
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const cancelledSubscriptions = subscriptions.filter((s) => s.status === 'cancelled');

  // Calculate totals
  let totalMonthly = 0;
  activeSubscriptions.forEach((s) => {
    totalMonthly += normalizeToMonthly(s.amount, s.frequency);
  });

  // Find unused subscriptions (no activity in 30+ days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const unusedSubscriptions = activeSubscriptions.filter(
    (s) => s.last_used_at && new Date(s.last_used_at) < thirtyDaysAgo
  );

  // Upcoming renewals (next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingRenewals = activeSubscriptions.filter(
    (s) => s.next_billing_date && new Date(s.next_billing_date) <= sevenDaysFromNow
  );

  // Potential savings from unused subscriptions
  const potentialSavings = unusedSubscriptions.reduce(
    (sum, s) => sum + normalizeToMonthly(s.amount, s.frequency),
    0
  );

  return {
    total_monthly: totalMonthly,
    total_yearly: totalMonthly * 12,
    active_count: activeSubscriptions.length,
    cancelled_count: cancelledSubscriptions.length,
    upcoming_renewals: upcomingRenewals.length,
    potential_savings: potentialSavings,
    unused_subscriptions: unusedSubscriptions,
  };
}

/**
 * Get upcoming renewals
 */
export async function getUpcomingRenewals(days: number = 7): Promise<Subscription[]> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.getDevUpcomingRenewals(days);
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .not('next_billing_date', 'is', null)
    .lte('next_billing_date', endDate.toISOString().split('T')[0])
    .gte('next_billing_date', new Date().toISOString().split('T')[0])
    .order('next_billing_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get unused subscriptions
 */
export async function getUnusedSubscriptions(daysThreshold: number = 30): Promise<Subscription[]> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysThreshold);

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lt('last_used_at', threshold.toISOString());

  if (error) throw error;
  return data || [];
}

/**
 * Mark subscription as used
 */
export async function markAsUsed(id: string): Promise<void> {
  // In dev mode, use local storage
  if (isDevMode()) {
    return devStorage.markDevSubscriptionAsUsed(id);
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: supabase.rpc('increment_usage_count', { row_id: id }),
    } as Record<string, unknown>)
    .eq('id', id);

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: current } = await supabase
      .from('subscriptions')
      .select('usage_count')
      .eq('id', id)
      .single();

    await supabase
      .from('subscriptions')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (current?.usage_count || 0) + 1,
      })
      .eq('id', id);
  }
}

/**
 * Generate cancellation email template
 */
export function generateCancellationEmail(subscription: Subscription): string {
  const merchantName = subscription.display_name || subscription.merchant_name;

  return `Subject: Cancellation Request - ${merchantName} Subscription

Dear ${merchantName} Support Team,

I am writing to request the cancellation of my subscription with immediate effect.

Account email: [YOUR EMAIL]
Subscription: ${merchantName}
Amount: $${subscription.amount} / ${subscription.frequency}

Please confirm the cancellation and ensure no further charges are made to my account.

Thank you for your assistance.

Best regards,
[YOUR NAME]`;
}

/**
 * Get cancellation info for subscription
 */
export function getCancellationInfo(merchantName: string): {
  url?: string;
  instructions?: string;
  emailTemplate?: string;
} {
  const pattern = detectSubscription(merchantName);

  if (!pattern) {
    return {
      emailTemplate: generateCancellationEmail({ merchant_name: merchantName } as Subscription),
    };
  }

  return {
    url: pattern.cancellationUrl,
    instructions: pattern.cancellationInstructions,
    emailTemplate: generateCancellationEmail({ merchant_name: merchantName, display_name: pattern.displayName } as Subscription),
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeToMonthly(amount: number, frequency: SubscriptionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

function calculateYearlySavings(amount: number, frequency: SubscriptionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'quarterly':
      return amount * 4;
    case 'yearly':
      return amount;
    default:
      return amount * 12;
  }
}

async function logSavings(
  userId: string,
  savingType: string,
  amount: number,
  description: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  await supabase.from('savings_log').insert({
    user_id: userId,
    saving_type: savingType,
    amount,
    currency: 'USD',
    description,
    related_entity_type: entityType,
    related_entity_id: entityId,
    saved_at: new Date().toISOString(),
  });
}

export default {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionSummary,
  getUpcomingRenewals,
  getUnusedSubscriptions,
  markAsUsed,
  generateCancellationEmail,
  getCancellationInfo,
};

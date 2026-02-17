/**
 * RevenueCat Webhook Handler for SpendTrak
 *
 * Handles all RevenueCat subscription events and syncs them to the database.
 *
 * Webhook URL: https://[PROJECT_REF].supabase.co/functions/v1/revenuecat-webhook
 *
 * Required environment variables:
 * - REVENUECAT_WEBHOOK_AUTH_KEY: Authorization key from RevenueCat dashboard
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 *
 * @see https://www.revenuecat.com/docs/webhooks
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import type {
  RevenueCatWebhookPayload,
  RevenueCatEvent,
  RevenueCatEventType,
  SpendTrakTier,
  SpendTrakSubscriptionStatus,
  SubscriptionUpdate,
  SubscriptionEventRecord,
} from './types.ts';
import { ENTITLEMENT_TO_TIER, PRODUCT_TO_TIER } from './types.ts';

// ============================================
// CONFIGURATION
// ============================================

const REVENUECAT_WEBHOOK_AUTH_KEY = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================
// LOGGING UTILITIES
// ============================================

interface LogContext {
  event_id?: string;
  event_type?: string;
  user_id?: string;
  product_id?: string;
  [key: string]: unknown;
}

function log(level: 'info' | 'warn' | 'error', message: string, context?: LogContext): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'revenuecat-webhook',
    ...context,
  };
  console.log(JSON.stringify(logEntry));
}

function logInfo(message: string, context?: LogContext): void {
  log('info', message, context);
}

function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context);
}

function logError(message: string, context?: LogContext): void {
  log('error', message, context);
}

// ============================================
// SECURITY
// ============================================

function verifyAuthorization(req: Request): boolean {
  if (!REVENUECAT_WEBHOOK_AUTH_KEY) {
    logError('REVENUECAT_WEBHOOK_AUTH_KEY environment variable not set');
    return false;
  }

  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    logWarn('Missing Authorization header', { ip: req.headers.get('x-forwarded-for') });
    return false;
  }

  // RevenueCat sends: "Bearer <auth_key>"
  const providedKey = authHeader.replace('Bearer ', '');

  if (providedKey !== REVENUECAT_WEBHOOK_AUTH_KEY) {
    logWarn('Invalid Authorization key', { ip: req.headers.get('x-forwarded-for') });
    return false;
  }

  return true;
}

// ============================================
// TIER MAPPING
// ============================================

/**
 * Determine the SpendTrak tier from RevenueCat event data
 */
function determineTier(event: RevenueCatEvent): SpendTrakTier {
  // First check entitlements
  if (event.entitlement_ids && event.entitlement_ids.length > 0) {
    for (const entitlementId of event.entitlement_ids) {
      const tier = ENTITLEMENT_TO_TIER[entitlementId.toLowerCase()];
      if (tier) {
        return tier;
      }
    }
  }

  // Fall back to product ID mapping
  if (event.product_id) {
    const tier = PRODUCT_TO_TIER[event.product_id.toLowerCase()];
    if (tier) {
      return tier;
    }
  }

  // Default to free if no matching entitlement or product
  return 'free';
}

/**
 * Determine subscription status from event type
 */
function determineStatus(eventType: RevenueCatEventType, event: RevenueCatEvent): SpendTrakSubscriptionStatus {
  switch (eventType) {
    case 'INITIAL_PURCHASE':
      return event.period_type === 'TRIAL' ? 'trialing' : 'active';

    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'BILLING_ISSUE_RESOLVED':
    case 'SUBSCRIPTION_EXTENDED':
      return 'active';

    case 'CANCELLATION':
      // User cancelled but still has access until period ends
      return 'cancelled';

    case 'BILLING_ISSUE':
      return 'billing_issue';

    case 'SUBSCRIPTION_PAUSED':
      return 'paused';

    case 'EXPIRATION':
      return 'expired';

    case 'PRODUCT_CHANGE':
      return 'active';

    case 'TRANSFER':
      return 'active';

    default:
      return 'active';
  }
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Extract user ID from RevenueCat app_user_id
 * RevenueCat app_user_id should be set to our Supabase user ID
 */
function extractUserId(event: RevenueCatEvent): string {
  // Use original_app_user_id as the canonical user ID
  // This handles alias merges correctly
  return event.original_app_user_id;
}

/**
 * Update user subscription in database
 */
async function updateUserSubscription(
  supabase: SupabaseClient,
  event: RevenueCatEvent,
  eventType: RevenueCatEventType
): Promise<void> {
  const userId = extractUserId(event);
  const tier = determineTier(event);
  const status = determineStatus(eventType, event);

  // For expiration events, downgrade to free tier
  const finalTier: SpendTrakTier = status === 'expired' ? 'free' : tier;

  const update: Partial<SubscriptionUpdate> = {
    tier: finalTier,
    status: status === 'expired' ? 'expired' : status,
    revenuecat_app_user_id: event.app_user_id,
    product_id: event.product_id,
    store: event.store.toLowerCase(),
    environment: event.environment.toLowerCase() as 'sandbox' | 'production',
    is_family_share: event.is_family_share,
    updated_at: new Date().toISOString(),
  };

  // Set timestamps based on event type
  if (eventType === 'INITIAL_PURCHASE') {
    update.started_at = new Date(event.purchased_at_ms).toISOString();
  }

  if (event.expiration_at_ms) {
    update.expires_at = new Date(event.expiration_at_ms).toISOString();
  }

  if (eventType === 'CANCELLATION') {
    update.cancelled_at = new Date(event.event_timestamp_ms).toISOString();
  }

  if (eventType === 'UNCANCELLATION') {
    update.cancelled_at = null;
  }

  if (eventType === 'BILLING_ISSUE') {
    update.billing_issue_detected_at = new Date(event.event_timestamp_ms).toISOString();
  }

  if (eventType === 'BILLING_ISSUE_RESOLVED') {
    update.billing_issue_detected_at = null;
  }

  // Upsert subscription record
  const { error: upsertError } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        ...update,
      },
      {
        onConflict: 'user_id',
      }
    );

  if (upsertError) {
    logError('Failed to update user subscription', {
      user_id: userId,
      event_type: eventType,
      error: upsertError.message,
    });
    throw new Error(`Database update failed: ${upsertError.message}`);
  }

  logInfo('Updated user subscription', {
    user_id: userId,
    event_type: eventType,
    tier: finalTier,
    status,
  });
}

/**
 * Record subscription event for analytics
 */
async function recordSubscriptionEvent(
  supabase: SupabaseClient,
  event: RevenueCatEvent,
  eventType: RevenueCatEventType
): Promise<void> {
  const userId = extractUserId(event);

  // Sanitize payload - remove sensitive data
  const sanitizedPayload = {
    app_user_id: event.app_user_id,
    product_id: event.product_id,
    entitlement_ids: event.entitlement_ids,
    store: event.store,
    environment: event.environment,
    period_type: event.period_type,
    is_trial_conversion: event.is_trial_conversion,
    is_family_share: event.is_family_share,
    offer_code: event.offer_code,
    // Exclude: price, transaction_id, original_transaction_id, etc.
  };

  const eventRecord: SubscriptionEventRecord = {
    user_id: userId,
    event_type: eventType,
    event_id: event.id,
    product_id: event.product_id,
    price: event.price,
    currency: event.currency,
    store: event.store.toLowerCase(),
    environment: event.environment.toLowerCase() as 'sandbox' | 'production',
    event_timestamp: new Date(event.event_timestamp_ms).toISOString(),
    raw_payload: sanitizedPayload,
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase
    .from('subscription_events')
    .insert(eventRecord);

  if (insertError) {
    // Log but don't throw - event recording is not critical
    logWarn('Failed to record subscription event', {
      user_id: userId,
      event_type: eventType,
      event_id: event.id,
      error: insertError.message,
    });
  }
}

/**
 * Handle transfer event - update both source and target users
 */
async function handleTransfer(
  supabase: SupabaseClient,
  event: RevenueCatEvent
): Promise<void> {
  const newUserId = extractUserId(event);

  // The transferred_from array contains the old user IDs
  if (event.transferred_from && event.transferred_from.length > 0) {
    for (const oldUserId of event.transferred_from) {
      // Expire the old user's subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'free',
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', oldUserId);

      if (error) {
        logWarn('Failed to expire transferred subscription', {
          old_user_id: oldUserId,
          new_user_id: newUserId,
          error: error.message,
        });
      }
    }
  }

  // Update the new user with the transferred subscription
  await updateUserSubscription(supabase, event, 'TRANSFER');

  logInfo('Processed subscription transfer', {
    new_user_id: newUserId,
    transferred_from: event.transferred_from,
  });
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleEvent(
  supabase: SupabaseClient,
  event: RevenueCatEvent
): Promise<void> {
  const eventType = event.type;
  const userId = extractUserId(event);

  logInfo('Processing webhook event', {
    event_id: event.id,
    event_type: eventType,
    user_id: userId,
    product_id: event.product_id,
    environment: event.environment,
  });

  // Handle transfer events specially
  if (eventType === 'TRANSFER') {
    await handleTransfer(supabase, event);
    await recordSubscriptionEvent(supabase, event, eventType);
    return;
  }

  // Handle subscriber alias - just log for now, no action needed
  // The original_app_user_id remains the canonical ID
  if (eventType === 'SUBSCRIBER_ALIAS') {
    logInfo('Subscriber alias event', {
      user_id: userId,
      aliases: event.aliases,
    });
    await recordSubscriptionEvent(supabase, event, eventType);
    return;
  }

  // Handle non-renewing purchases (one-time purchases)
  if (eventType === 'NON_RENEWING_PURCHASE') {
    // For one-time purchases, we might give temporary premium access
    // or permanent access depending on the product
    logInfo('Non-renewing purchase', {
      user_id: userId,
      product_id: event.product_id,
    });
    await recordSubscriptionEvent(supabase, event, eventType);
    return;
  }

  // Standard subscription events
  await updateUserSubscription(supabase, event, eventType);
  await recordSubscriptionEvent(supabase, event, eventType);
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  }

  // Verify authorization
  if (!verifyAuthorization(req)) {
    logError('Unauthorized webhook request');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const payload: RevenueCatWebhookPayload = await req.json();

    // Validate payload structure
    if (!payload.event || !payload.event.type || !payload.event.app_user_id) {
      logError('Malformed webhook payload', {
        has_event: !!payload.event,
        has_type: !!payload.event?.type,
        has_user: !!payload.event?.app_user_id,
      });
      return new Response(
        JSON.stringify({ error: 'Malformed request' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        }
      );
    }

    const event = payload.event;

    // Skip sandbox events in production (optional - remove if you want to process sandbox)
    // if (event.environment === 'SANDBOX' && Deno.env.get('DENO_ENV') === 'production') {
    //   logInfo('Skipping sandbox event in production', { event_id: event.id });
    //   return new Response(JSON.stringify({ success: true, skipped: true }), {
    //     headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    //   });
    // }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process the event
    await handleEvent(supabase, event);

    logInfo('Successfully processed webhook', {
      event_id: event.id,
      event_type: event.type,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError('Webhook processing failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 500 so RevenueCat will retry
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    );
  }
});

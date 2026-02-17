/**
 * Verify Entitlement Edge Function
 * Server-side verification of user's subscription tier and feature usage
 *
 * SECURITY: This function is the source of truth for feature access.
 * Client-side checks are for UX only - server MUST verify before premium operations.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// AI features that require premium subscription
// Non-AI features are always allowed (free tier gets everything non-AI)
const AI_FEATURES = [
  'ai_consultant',
  'receipt_scanner',
  'receipt_scans',
  'ai_messages',
  'email_import',
  'ai_health_recommendations',
];

// Premium gets unlimited AI access
const PREMIUM_AI_CONFIG = { limit: -1, period: 'month' };

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    // ===== SECURITY: Require JWT authentication =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }
    // ===== END AUTH BLOCK =====

    // Parse request body
    const { feature } = await req.json();
    if (!feature) {
      return new Response(
        JSON.stringify({ error: 'Feature name required' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Get user's subscription tier from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('tier, status, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Default to free tier if no active subscription
    let tier = 'free';
    if (!subError && subscription) {
      // Check if subscription is still valid
      if (subscription.expires_at) {
        const expiresAt = new Date(subscription.expires_at);
        if (expiresAt > new Date()) {
          tier = subscription.tier || 'free';
        }
      } else {
        tier = subscription.tier || 'free';
      }
    }

    // Non-AI features: always allowed (free tier gets everything non-AI)
    if (!AI_FEATURES.includes(feature)) {
      return new Response(
        JSON.stringify({
          allowed: true,
          tier,
          feature,
          usage: 0,
          limit: -1,
          message: 'Non-AI feature — always available',
        }),
        { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // AI features: premium users get unlimited access
    if (tier === 'premium') {
      return new Response(
        JSON.stringify({
          allowed: true,
          tier,
          feature,
          usage: 0,
          limit: -1,
          message: 'Premium — unlimited AI access',
        }),
        { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // AI features: free users are blocked
    return new Response(
      JSON.stringify({
        allowed: false,
        tier,
        feature,
        usage: 0,
        limit: 0,
        remaining: 0,
        message: 'AI features require Premium subscription. Upgrade to unlock.',
      }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verify entitlement error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});

-- ============================================
-- SPENDTRAK - SUBSCRIPTION MANAGEMENT SYSTEM
-- Migration 010: RevenueCat Integration & Subscription Management
-- ============================================

-- ============================================
-- 1. DROP EXISTING TABLE IF EXISTS (to recreate with new schema)
-- ============================================

-- First, drop dependent objects
DROP FUNCTION IF EXISTS get_user_subscription(UUID);
DROP FUNCTION IF EXISTS update_subscription_from_webhook(JSONB);
DROP FUNCTION IF EXISTS check_feature_access(UUID, TEXT);
DROP FUNCTION IF EXISTS sync_subscription_status(UUID);

-- Drop existing table (backup data first in production!)
DROP TABLE IF EXISTS public.subscription_events;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- ============================================
-- 2. CREATE USER_SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- RevenueCat Integration
    revenuecat_customer_id TEXT UNIQUE,

    -- Subscription Status
    current_entitlement TEXT NOT NULL DEFAULT 'free'
        CHECK (current_entitlement IN ('free', 'plus', 'premium')),
    product_id TEXT,

    -- Dates
    purchase_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    original_purchase_date TIMESTAMPTZ,
    cancellation_date TIMESTAMPTZ,
    grace_period_expires_at TIMESTAMPTZ,

    -- Store Information
    store TEXT CHECK (store IN ('app_store', 'play_store', 'stripe', 'promotional', NULL)),
    is_sandbox BOOLEAN DEFAULT FALSE,

    -- Status Flags
    auto_renew_status BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN GENERATED ALWAYS AS (
        CASE
            WHEN current_entitlement = 'free' THEN TRUE
            WHEN expiration_date IS NULL THEN FALSE
            WHEN expiration_date > NOW() THEN TRUE
            WHEN grace_period_expires_at IS NOT NULL AND grace_period_expires_at > NOW() THEN TRUE
            ELSE FALSE
        END
    ) STORED,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_revenuecat ON public.user_subscriptions(revenuecat_customer_id);
CREATE INDEX idx_user_subscriptions_entitlement ON public.user_subscriptions(current_entitlement);
CREATE INDEX idx_user_subscriptions_expiration ON public.user_subscriptions(expiration_date)
    WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_user_subscriptions_active ON public.user_subscriptions(is_active)
    WHERE is_active = TRUE;

-- ============================================
-- 3. CREATE SUBSCRIPTION_EVENTS TABLE (Audit Log)
-- ============================================

CREATE TABLE public.subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Event Details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'INITIAL_PURCHASE',
        'RENEWAL',
        'CANCELLATION',
        'BILLING_ISSUE',
        'GRACE_PERIOD',
        'EXPIRED',
        'RESTORED',
        'PRODUCT_CHANGE',
        'REFUND',
        'TRIAL_STARTED',
        'TRIAL_CONVERTED',
        'TRIAL_CANCELLED',
        'PROMOTIONAL_GRANT',
        'PROMOTIONAL_REVOKED',
        'SUBSCRIPTION_PAUSED',
        'SUBSCRIPTION_RESUMED'
    )),

    -- Subscription Details
    product_id TEXT,
    entitlement TEXT,
    previous_entitlement TEXT,

    -- RevenueCat Data
    revenuecat_event_id TEXT UNIQUE,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Full Payload for debugging
    raw_payload JSONB,

    -- Processing Status
    processed_at TIMESTAMPTZ,
    processing_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_events_user ON public.subscription_events(user_id);
CREATE INDEX idx_subscription_events_type ON public.subscription_events(event_type);
CREATE INDEX idx_subscription_events_timestamp ON public.subscription_events(event_timestamp DESC);
CREATE INDEX idx_subscription_events_revenuecat ON public.subscription_events(revenuecat_event_id);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own subscription events
CREATE POLICY "Users can view own subscription events" ON public.subscription_events
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage subscription events" ON public.subscription_events
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. FEATURE LIMITS BY ENTITLEMENT
-- ============================================

CREATE TABLE public.entitlement_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entitlement TEXT NOT NULL CHECK (entitlement IN ('free', 'plus', 'premium')),
    feature_name TEXT NOT NULL,
    feature_limit INTEGER, -- NULL means unlimited
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entitlement, feature_name)
);

-- Insert default feature limits
INSERT INTO public.entitlement_features (entitlement, feature_name, feature_limit, is_enabled) VALUES
    -- Free tier limits
    ('free', 'receipt_scans_per_month', 10, TRUE),
    ('free', 'ai_messages_per_hour', 30, TRUE),
    ('free', 'budgets_count', 3, TRUE),
    ('free', 'goals_count', 2, TRUE),
    ('free', 'subscriptions_tracking', 5, TRUE),
    ('free', 'export_data', NULL, FALSE),
    ('free', 'advanced_analytics', NULL, FALSE),
    ('free', 'custom_categories', 3, TRUE),
    ('free', 'household_members', 0, FALSE),
    ('free', 'bill_reminders', 3, TRUE),

    -- Plus tier limits
    ('plus', 'receipt_scans_per_month', 100, TRUE),
    ('plus', 'ai_messages_per_hour', NULL, TRUE), -- Unlimited
    ('plus', 'budgets_count', NULL, TRUE), -- Unlimited
    ('plus', 'goals_count', NULL, TRUE), -- Unlimited
    ('plus', 'subscriptions_tracking', NULL, TRUE), -- Unlimited
    ('plus', 'export_data', NULL, TRUE),
    ('plus', 'advanced_analytics', NULL, TRUE),
    ('plus', 'custom_categories', NULL, TRUE), -- Unlimited
    ('plus', 'household_members', 1, TRUE),
    ('plus', 'bill_reminders', NULL, TRUE), -- Unlimited

    -- Premium tier limits
    ('premium', 'receipt_scans_per_month', NULL, TRUE), -- Unlimited
    ('premium', 'ai_messages_per_hour', NULL, TRUE), -- Unlimited
    ('premium', 'budgets_count', NULL, TRUE), -- Unlimited
    ('premium', 'goals_count', NULL, TRUE), -- Unlimited
    ('premium', 'subscriptions_tracking', NULL, TRUE), -- Unlimited
    ('premium', 'export_data', NULL, TRUE),
    ('premium', 'advanced_analytics', NULL, TRUE),
    ('premium', 'custom_categories', NULL, TRUE), -- Unlimited
    ('premium', 'household_members', NULL, TRUE), -- Unlimited
    ('premium', 'bill_reminders', NULL, TRUE), -- Unlimited
    ('premium', 'priority_support', NULL, TRUE),
    ('premium', 'early_access_features', NULL, TRUE);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function: Get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_subscription RECORD;
    v_days_until_expiration INTEGER;
    v_is_in_grace_period BOOLEAN;
BEGIN
    -- Get subscription record
    SELECT * INTO v_subscription
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    -- If no subscription exists, return free tier
    IF NOT FOUND THEN
        RETURN json_build_object(
            'current_entitlement', 'free',
            'is_active', TRUE,
            'days_until_expiration', NULL,
            'is_in_grace_period', FALSE,
            'can_access_plus_features', FALSE,
            'can_access_premium_features', FALSE,
            'product_id', NULL,
            'store', NULL,
            'auto_renew_status', NULL,
            'expiration_date', NULL,
            'purchase_date', NULL
        );
    END IF;

    -- Calculate days until expiration
    IF v_subscription.expiration_date IS NOT NULL THEN
        v_days_until_expiration := GREATEST(0,
            EXTRACT(DAY FROM (v_subscription.expiration_date - NOW()))::INTEGER);
    ELSE
        v_days_until_expiration := NULL;
    END IF;

    -- Check if in grace period
    v_is_in_grace_period := (
        v_subscription.expiration_date IS NOT NULL AND
        v_subscription.expiration_date < NOW() AND
        v_subscription.grace_period_expires_at IS NOT NULL AND
        v_subscription.grace_period_expires_at > NOW()
    );

    RETURN json_build_object(
        'current_entitlement', v_subscription.current_entitlement,
        'is_active', v_subscription.is_active,
        'days_until_expiration', v_days_until_expiration,
        'is_in_grace_period', v_is_in_grace_period,
        'can_access_plus_features', v_subscription.current_entitlement IN ('plus', 'premium') AND v_subscription.is_active,
        'can_access_premium_features', v_subscription.current_entitlement = 'premium' AND v_subscription.is_active,
        'product_id', v_subscription.product_id,
        'store', v_subscription.store,
        'auto_renew_status', v_subscription.auto_renew_status,
        'expiration_date', v_subscription.expiration_date,
        'purchase_date', v_subscription.purchase_date,
        'cancellation_date', v_subscription.cancellation_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check feature access
CREATE OR REPLACE FUNCTION check_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS JSON AS $$
DECLARE
    v_subscription RECORD;
    v_feature RECORD;
    v_current_usage INTEGER;
BEGIN
    -- Get user's current entitlement
    SELECT current_entitlement, is_active INTO v_subscription
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    -- Default to free if no subscription
    IF NOT FOUND THEN
        v_subscription.current_entitlement := 'free';
        v_subscription.is_active := TRUE;
    END IF;

    -- Get feature limits for this entitlement
    SELECT * INTO v_feature
    FROM public.entitlement_features
    WHERE entitlement = v_subscription.current_entitlement
    AND feature_name = p_feature;

    -- Feature not found for this tier
    IF NOT FOUND THEN
        RETURN json_build_object(
            'has_access', FALSE,
            'reason', 'feature_not_available',
            'limit', 0,
            'current_usage', 0,
            'remaining', 0,
            'is_unlimited', FALSE
        );
    END IF;

    -- Feature is disabled for this tier
    IF NOT v_feature.is_enabled THEN
        RETURN json_build_object(
            'has_access', FALSE,
            'reason', 'feature_disabled',
            'limit', 0,
            'current_usage', 0,
            'remaining', 0,
            'is_unlimited', FALSE,
            'upgrade_required', TRUE
        );
    END IF;

    -- Unlimited access
    IF v_feature.feature_limit IS NULL THEN
        RETURN json_build_object(
            'has_access', TRUE,
            'reason', 'unlimited',
            'limit', NULL,
            'current_usage', NULL,
            'remaining', NULL,
            'is_unlimited', TRUE
        );
    END IF;

    -- Get current usage based on feature type
    v_current_usage := 0;

    -- Check specific feature usages
    IF p_feature = 'receipt_scans_per_month' THEN
        SELECT COALESCE(scans_used, 0) INTO v_current_usage
        FROM public.receipt_scan_usage
        WHERE user_id = p_user_id
        AND period_start = DATE_TRUNC('month', CURRENT_DATE);
    ELSIF p_feature = 'ai_messages_per_hour' THEN
        SELECT COALESCE(messages_used, 0) INTO v_current_usage
        FROM public.ai_chat_usage
        WHERE user_id = p_user_id
        AND period_start = DATE_TRUNC('hour', NOW());
    ELSIF p_feature = 'budgets_count' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.budgets
        WHERE user_id = p_user_id AND is_active = TRUE;
    ELSIF p_feature = 'goals_count' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.financial_goals
        WHERE user_id = p_user_id AND status = 'active';
    ELSIF p_feature = 'subscriptions_tracking' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.subscriptions
        WHERE user_id = p_user_id AND status = 'active';
    ELSIF p_feature = 'custom_categories' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.categories
        WHERE user_id = p_user_id AND is_default = FALSE;
    ELSIF p_feature = 'bill_reminders' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.bills
        WHERE user_id = p_user_id AND is_active = TRUE;
    END IF;

    RETURN json_build_object(
        'has_access', v_current_usage < v_feature.feature_limit,
        'reason', CASE WHEN v_current_usage < v_feature.feature_limit THEN 'within_limit' ELSE 'limit_reached' END,
        'limit', v_feature.feature_limit,
        'current_usage', v_current_usage,
        'remaining', GREATEST(0, v_feature.feature_limit - v_current_usage),
        'is_unlimited', FALSE,
        'upgrade_required', v_current_usage >= v_feature.feature_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update subscription from RevenueCat webhook
CREATE OR REPLACE FUNCTION update_subscription_from_webhook(p_payload JSONB)
RETURNS JSON AS $$
DECLARE
    v_event_type TEXT;
    v_app_user_id TEXT;
    v_user_id UUID;
    v_product_id TEXT;
    v_entitlement TEXT;
    v_previous_entitlement TEXT;
    v_expiration_date TIMESTAMPTZ;
    v_purchase_date TIMESTAMPTZ;
    v_original_purchase_date TIMESTAMPTZ;
    v_store TEXT;
    v_is_sandbox BOOLEAN;
    v_event_id TEXT;
    v_subscriber JSONB;
    v_entitlements JSONB;
BEGIN
    -- Extract event type
    v_event_type := p_payload->>'event';
    v_event_id := p_payload->>'id';

    -- Check for duplicate event
    IF EXISTS (SELECT 1 FROM public.subscription_events WHERE revenuecat_event_id = v_event_id) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'duplicate_event',
            'message', 'Event already processed'
        );
    END IF;

    -- Extract subscriber info
    v_subscriber := p_payload->'subscriber';
    v_app_user_id := p_payload->>'app_user_id';

    -- Try to find user by RevenueCat customer ID or app_user_id
    SELECT user_id INTO v_user_id
    FROM public.user_subscriptions
    WHERE revenuecat_customer_id = v_app_user_id;

    -- If not found, try to parse app_user_id as UUID
    IF v_user_id IS NULL THEN
        BEGIN
            v_user_id := v_app_user_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            -- Not a valid UUID, log event without user
            INSERT INTO public.subscription_events (
                event_type, revenuecat_event_id, raw_payload, processing_error
            ) VALUES (
                v_event_type, v_event_id, p_payload, 'Could not identify user'
            );

            RETURN json_build_object(
                'success', FALSE,
                'error', 'user_not_found',
                'message', 'Could not identify user from webhook'
            );
        END;
    END IF;

    -- Extract product and entitlement info
    v_product_id := p_payload->>'product_id';
    v_entitlements := v_subscriber->'entitlements';

    -- Determine entitlement level from product_id or entitlements
    IF v_entitlements ? 'premium' AND (v_entitlements->'premium'->>'expires_date') IS NOT NULL THEN
        v_entitlement := 'premium';
        v_expiration_date := (v_entitlements->'premium'->>'expires_date')::TIMESTAMPTZ;
    ELSIF v_entitlements ? 'plus' AND (v_entitlements->'plus'->>'expires_date') IS NOT NULL THEN
        v_entitlement := 'plus';
        v_expiration_date := (v_entitlements->'plus'->>'expires_date')::TIMESTAMPTZ;
    ELSIF v_product_id ILIKE '%premium%' THEN
        v_entitlement := 'premium';
    ELSIF v_product_id ILIKE '%plus%' OR v_product_id ILIKE '%pro%' THEN
        v_entitlement := 'plus';
    ELSE
        v_entitlement := 'free';
    END IF;

    -- Extract dates
    v_purchase_date := COALESCE(
        (p_payload->>'purchased_at')::TIMESTAMPTZ,
        (p_payload->>'event_timestamp')::TIMESTAMPTZ,
        NOW()
    );
    v_original_purchase_date := (p_payload->>'original_purchased_at')::TIMESTAMPTZ;

    -- Extract store
    v_store := LOWER(p_payload->>'store');
    IF v_store NOT IN ('app_store', 'play_store', 'stripe') THEN
        v_store := NULL;
    END IF;

    -- Check if sandbox
    v_is_sandbox := COALESCE((p_payload->>'environment')::TEXT = 'SANDBOX', FALSE);

    -- Get previous entitlement for logging
    SELECT current_entitlement INTO v_previous_entitlement
    FROM public.user_subscriptions
    WHERE user_id = v_user_id;

    -- Process based on event type
    CASE v_event_type
        WHEN 'INITIAL_PURCHASE', 'RENEWAL', 'RESTORED', 'PRODUCT_CHANGE' THEN
            -- Upsert subscription
            INSERT INTO public.user_subscriptions (
                user_id,
                revenuecat_customer_id,
                current_entitlement,
                product_id,
                purchase_date,
                expiration_date,
                original_purchase_date,
                store,
                is_sandbox,
                auto_renew_status,
                cancellation_date,
                grace_period_expires_at
            ) VALUES (
                v_user_id,
                v_app_user_id,
                v_entitlement,
                v_product_id,
                v_purchase_date,
                v_expiration_date,
                COALESCE(v_original_purchase_date, v_purchase_date),
                v_store,
                v_is_sandbox,
                TRUE,
                NULL,
                NULL
            )
            ON CONFLICT (user_id) DO UPDATE SET
                revenuecat_customer_id = EXCLUDED.revenuecat_customer_id,
                current_entitlement = EXCLUDED.current_entitlement,
                product_id = EXCLUDED.product_id,
                purchase_date = EXCLUDED.purchase_date,
                expiration_date = EXCLUDED.expiration_date,
                store = COALESCE(EXCLUDED.store, user_subscriptions.store),
                is_sandbox = EXCLUDED.is_sandbox,
                auto_renew_status = TRUE,
                cancellation_date = NULL,
                grace_period_expires_at = NULL,
                updated_at = NOW();

        WHEN 'CANCELLATION' THEN
            UPDATE public.user_subscriptions SET
                auto_renew_status = FALSE,
                cancellation_date = NOW(),
                updated_at = NOW()
            WHERE user_id = v_user_id;

        WHEN 'BILLING_ISSUE', 'GRACE_PERIOD' THEN
            UPDATE public.user_subscriptions SET
                grace_period_expires_at = COALESCE(
                    (p_payload->>'grace_period_expires_date')::TIMESTAMPTZ,
                    expiration_date + INTERVAL '16 days'
                ),
                updated_at = NOW()
            WHERE user_id = v_user_id;

        WHEN 'EXPIRED' THEN
            UPDATE public.user_subscriptions SET
                current_entitlement = 'free',
                auto_renew_status = FALSE,
                grace_period_expires_at = NULL,
                updated_at = NOW()
            WHERE user_id = v_user_id;

        WHEN 'REFUND' THEN
            UPDATE public.user_subscriptions SET
                current_entitlement = 'free',
                expiration_date = NOW(),
                auto_renew_status = FALSE,
                updated_at = NOW()
            WHERE user_id = v_user_id;

        ELSE
            -- Log unknown event type
            NULL;
    END CASE;

    -- Log the event
    INSERT INTO public.subscription_events (
        user_id,
        event_type,
        product_id,
        entitlement,
        previous_entitlement,
        revenuecat_event_id,
        event_timestamp,
        raw_payload,
        processed_at
    ) VALUES (
        v_user_id,
        v_event_type,
        v_product_id,
        v_entitlement,
        v_previous_entitlement,
        v_event_id,
        COALESCE((p_payload->>'event_timestamp')::TIMESTAMPTZ, NOW()),
        p_payload,
        NOW()
    );

    RETURN json_build_object(
        'success', TRUE,
        'user_id', v_user_id,
        'event_type', v_event_type,
        'entitlement', v_entitlement,
        'previous_entitlement', v_previous_entitlement
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.subscription_events (
        event_type,
        revenuecat_event_id,
        raw_payload,
        processing_error
    ) VALUES (
        COALESCE(v_event_type, 'UNKNOWN'),
        v_event_id,
        p_payload,
        SQLERRM
    );

    RETURN json_build_object(
        'success', FALSE,
        'error', 'processing_error',
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Sync subscription status (for manual refresh)
CREATE OR REPLACE FUNCTION sync_subscription_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_subscription RECORD;
    v_was_active BOOLEAN;
    v_is_now_active BOOLEAN;
BEGIN
    -- Get current subscription
    SELECT * INTO v_subscription
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- Create free tier subscription
        INSERT INTO public.user_subscriptions (user_id, current_entitlement)
        VALUES (p_user_id, 'free')
        RETURNING * INTO v_subscription;

        RETURN json_build_object(
            'success', TRUE,
            'action', 'created',
            'entitlement', 'free'
        );
    END IF;

    v_was_active := v_subscription.is_active;

    -- Check if subscription has expired
    IF v_subscription.current_entitlement != 'free' AND
       v_subscription.expiration_date IS NOT NULL AND
       v_subscription.expiration_date < NOW() AND
       (v_subscription.grace_period_expires_at IS NULL OR v_subscription.grace_period_expires_at < NOW())
    THEN
        -- Subscription has expired
        UPDATE public.user_subscriptions SET
            current_entitlement = 'free',
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Log expiration event
        INSERT INTO public.subscription_events (
            user_id, event_type, entitlement, previous_entitlement, event_timestamp
        ) VALUES (
            p_user_id, 'EXPIRED', 'free', v_subscription.current_entitlement, NOW()
        );

        RETURN json_build_object(
            'success', TRUE,
            'action', 'expired',
            'previous_entitlement', v_subscription.current_entitlement,
            'current_entitlement', 'free'
        );
    END IF;

    RETURN json_build_object(
        'success', TRUE,
        'action', 'no_change',
        'entitlement', v_subscription.current_entitlement,
        'is_active', v_subscription.is_active
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Grant promotional subscription
CREATE OR REPLACE FUNCTION grant_promotional_subscription(
    p_user_id UUID,
    p_entitlement TEXT,
    p_duration_days INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_expiration_date TIMESTAMPTZ;
    v_previous_entitlement TEXT;
BEGIN
    -- Validate entitlement
    IF p_entitlement NOT IN ('plus', 'premium') THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'invalid_entitlement',
            'message', 'Entitlement must be plus or premium'
        );
    END IF;

    v_expiration_date := NOW() + (p_duration_days || ' days')::INTERVAL;

    -- Get previous entitlement
    SELECT current_entitlement INTO v_previous_entitlement
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    -- Upsert subscription
    INSERT INTO public.user_subscriptions (
        user_id,
        current_entitlement,
        product_id,
        purchase_date,
        expiration_date,
        original_purchase_date,
        store,
        is_sandbox,
        auto_renew_status,
        metadata
    ) VALUES (
        p_user_id,
        p_entitlement,
        'promotional_' || p_entitlement,
        NOW(),
        v_expiration_date,
        NOW(),
        'promotional',
        FALSE,
        FALSE,
        jsonb_build_object('reason', p_reason, 'granted_at', NOW())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_entitlement = EXCLUDED.current_entitlement,
        product_id = EXCLUDED.product_id,
        purchase_date = EXCLUDED.purchase_date,
        expiration_date = GREATEST(user_subscriptions.expiration_date, EXCLUDED.expiration_date),
        store = EXCLUDED.store,
        auto_renew_status = FALSE,
        metadata = user_subscriptions.metadata || EXCLUDED.metadata,
        updated_at = NOW();

    -- Log event
    INSERT INTO public.subscription_events (
        user_id, event_type, product_id, entitlement, previous_entitlement, event_timestamp
    ) VALUES (
        p_user_id, 'PROMOTIONAL_GRANT', 'promotional_' || p_entitlement,
        p_entitlement, v_previous_entitlement, NOW()
    );

    RETURN json_build_object(
        'success', TRUE,
        'user_id', p_user_id,
        'entitlement', p_entitlement,
        'expiration_date', v_expiration_date,
        'duration_days', p_duration_days
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get feature limits for user
CREATE OR REPLACE FUNCTION get_user_feature_limits(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_entitlement TEXT;
    v_features JSON;
BEGIN
    -- Get user's entitlement
    SELECT current_entitlement INTO v_entitlement
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;

    -- Default to free
    v_entitlement := COALESCE(v_entitlement, 'free');

    -- Get all features for this entitlement
    SELECT json_object_agg(
        feature_name,
        json_build_object(
            'limit', feature_limit,
            'is_enabled', is_enabled,
            'is_unlimited', feature_limit IS NULL AND is_enabled
        )
    ) INTO v_features
    FROM public.entitlement_features
    WHERE entitlement = v_entitlement;

    RETURN json_build_object(
        'entitlement', v_entitlement,
        'features', v_features
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. SCHEDULED JOBS (Optional - requires pg_cron)
-- ============================================

-- Note: These would be scheduled via pg_cron or external scheduler
-- Example: Check for expired subscriptions daily

CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_subscription RECORD;
BEGIN
    FOR v_subscription IN
        SELECT user_id, current_entitlement
        FROM public.user_subscriptions
        WHERE current_entitlement != 'free'
        AND expiration_date < NOW()
        AND (grace_period_expires_at IS NULL OR grace_period_expires_at < NOW())
    LOOP
        -- Update to free
        UPDATE public.user_subscriptions SET
            current_entitlement = 'free',
            updated_at = NOW()
        WHERE user_id = v_subscription.user_id;

        -- Log event
        INSERT INTO public.subscription_events (
            user_id, event_type, entitlement, previous_entitlement, event_timestamp
        ) VALUES (
            v_subscription.user_id, 'EXPIRED', 'free',
            v_subscription.current_entitlement, NOW()
        );

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. CREATE DEFAULT SUBSCRIPTION FOR EXISTING USERS
-- ============================================

-- Insert free tier for users who don't have a subscription
INSERT INTO public.user_subscriptions (user_id, current_entitlement)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- SPENDTRAK - AI CHAT RATE LIMITING
-- Migration 009: AI Message Usage Tracking
-- ============================================

-- ============================================
-- 1. AI CHAT USAGE TABLE
-- ============================================

CREATE TABLE public.ai_chat_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    messages_used INTEGER DEFAULT 0,
    messages_limit INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period_start)
);

-- Indexes
CREATE INDEX idx_ai_chat_usage_user ON public.ai_chat_usage(user_id);
CREATE INDEX idx_ai_chat_usage_period ON public.ai_chat_usage(period_start, period_end);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own AI usage" ON public.ai_chat_usage
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_ai_chat_usage_updated_at
    BEFORE UPDATE ON public.ai_chat_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Check if user can send an AI message
-- Returns: { can_send, messages_used, messages_limit, reset_time, is_premium }
CREATE OR REPLACE FUNCTION can_send_ai_message(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_subscription_tier TEXT;
    v_current_usage INTEGER;
    v_limit INTEGER;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_is_premium BOOLEAN := FALSE;
BEGIN
    -- Check if user is premium
    SELECT tier INTO v_subscription_tier
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_subscription_tier IN ('pro', 'premium') THEN
        v_is_premium := TRUE;
        RETURN json_build_object(
            'can_send', TRUE,
            'messages_used', 0,
            'messages_limit', -1, -- -1 indicates unlimited
            'reset_time', NULL,
            'is_premium', TRUE
        );
    END IF;

    -- Calculate current hour window
    v_period_start := date_trunc('hour', NOW());
    v_period_end := v_period_start + INTERVAL '1 hour';

    -- Get current usage for this hour
    SELECT messages_used, messages_limit INTO v_current_usage, v_limit
    FROM public.ai_chat_usage
    WHERE user_id = p_user_id
    AND period_start = v_period_start;

    -- If no record exists, user hasn't used any messages this hour
    IF NOT FOUND THEN
        RETURN json_build_object(
            'can_send', TRUE,
            'messages_used', 0,
            'messages_limit', 30,
            'reset_time', v_period_end,
            'is_premium', FALSE
        );
    END IF;

    -- Return usage status
    RETURN json_build_object(
        'can_send', v_current_usage < v_limit,
        'messages_used', v_current_usage,
        'messages_limit', v_limit,
        'reset_time', v_period_end,
        'is_premium', FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment AI chat usage for current hour
CREATE OR REPLACE FUNCTION increment_ai_chat_usage(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_new_count INTEGER;
BEGIN
    -- Calculate current hour window
    v_period_start := date_trunc('hour', NOW());
    v_period_end := v_period_start + INTERVAL '1 hour';

    -- Upsert usage record
    INSERT INTO public.ai_chat_usage (user_id, period_start, period_end, messages_used, messages_limit)
    VALUES (p_user_id, v_period_start, v_period_end, 1, 30)
    ON CONFLICT (user_id, period_start)
    DO UPDATE SET
        messages_used = ai_chat_usage.messages_used + 1,
        updated_at = NOW()
    RETURNING messages_used INTO v_new_count;

    RETURN json_build_object(
        'messages_used', v_new_count,
        'messages_limit', 30,
        'period_end', v_period_end
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get AI usage statistics for analytics
-- Returns: { total_messages, avg_per_day, peak_hour, usage_by_day }
CREATE OR REPLACE FUNCTION get_ai_usage_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    v_total_messages INTEGER;
    v_avg_per_day NUMERIC;
    v_peak_hour INTEGER;
    v_usage_by_day JSON;
BEGIN
    -- Get total messages in period
    SELECT COALESCE(SUM(messages_used), 0) INTO v_total_messages
    FROM public.ai_chat_usage
    WHERE user_id = p_user_id
    AND period_start >= NOW() - (p_days || ' days')::INTERVAL;

    -- Calculate average per day
    v_avg_per_day := ROUND(v_total_messages::NUMERIC / GREATEST(p_days, 1), 1);

    -- Find peak hour (most messages sent)
    SELECT EXTRACT(HOUR FROM period_start)::INTEGER INTO v_peak_hour
    FROM public.ai_chat_usage
    WHERE user_id = p_user_id
    AND period_start >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY EXTRACT(HOUR FROM period_start)
    ORDER BY SUM(messages_used) DESC
    LIMIT 1;

    -- Get usage by day for last 7 days
    SELECT json_agg(day_usage ORDER BY date) INTO v_usage_by_day
    FROM (
        SELECT
            date_trunc('day', period_start)::DATE as date,
            SUM(messages_used) as messages
        FROM public.ai_chat_usage
        WHERE user_id = p_user_id
        AND period_start >= NOW() - INTERVAL '7 days'
        GROUP BY date_trunc('day', period_start)
    ) day_usage;

    RETURN json_build_object(
        'total_messages', v_total_messages,
        'avg_per_day', v_avg_per_day,
        'peak_hour', COALESCE(v_peak_hour, 12),
        'usage_by_day', COALESCE(v_usage_by_day, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CLEANUP JOB (Optional - for maintenance)
-- ============================================

-- Function to clean up old usage records (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_usage()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.ai_chat_usage
    WHERE period_start < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

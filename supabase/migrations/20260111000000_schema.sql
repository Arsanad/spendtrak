-- ============================================
-- SPENDTRAK v2.0 DATABASE SCHEMA (GLOBAL)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS TABLE
-- ============================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    default_currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{
        "push_enabled": true,
        "email_digest": false,
        "alert_unusual_spending": true,
        "alert_subscriptions": true,
        "alert_budget": true,
        "alert_bills": true,
        "quiet_hours_start": null,
        "quiet_hours_end": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================
-- 2. EMAIL CONNECTIONS TABLE
-- ============================================

CREATE TABLE public.email_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
    email_address TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'error')),
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider, email_address)
);

-- Index
CREATE INDEX idx_email_connections_user ON public.email_connections(user_id);
CREATE INDEX idx_email_connections_active ON public.email_connections(is_active) WHERE is_active = TRUE;

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_categories_default ON public.categories(is_default);

-- ============================================
-- 4. TRANSACTIONS TABLE
-- ============================================

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    merchant_name TEXT NOT NULL,
    merchant_name_clean TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL,
    transaction_time TIME,
    source TEXT NOT NULL CHECK (source IN ('email', 'receipt', 'manual', 'import')),
    card_last_four TEXT,
    bank_name TEXT,
    receipt_image_url TEXT,
    notes TEXT,
    transaction_type TEXT DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'payment', 'refund', 'atm', 'transfer')),
    is_recurring BOOLEAN DEFAULT FALSE,
    is_reviewed BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_source ON public.transactions(source);
CREATE INDEX idx_transactions_not_deleted ON public.transactions(user_id, is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX idx_transactions_merchant ON public.transactions(merchant_name_clean);

-- ============================================
-- 5. SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    display_name TEXT,
    icon TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    billing_day INTEGER,
    next_billing_date DATE,
    last_billing_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused', 'expired')),
    cancellation_url TEXT,
    cancellation_instructions TEXT,
    auto_detected BOOLEAN DEFAULT TRUE,
    detection_confidence DECIMAL(3, 2),
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_user_active ON public.subscriptions(user_id, status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_merchant ON public.subscriptions(merchant_name);

-- ============================================
-- 6. ALERTS TABLE
-- ============================================

CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'unusual_spending',
        'duplicate_charge',
        'price_increase',
        'free_trial_ending',
        'subscription_renewal',
        'large_transaction',
        'budget_warning',
        'budget_exceeded',
        'upcoming_bill',
        'low_balance',
        'goal_milestone',
        'weekly_summary',
        'monthly_report'
    )),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_actioned BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alerts_user ON public.alerts(user_id);
CREATE INDEX idx_alerts_user_unread ON public.alerts(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_alerts_type ON public.alerts(alert_type);
CREATE INDEX idx_alerts_created ON public.alerts(created_at DESC);

-- ============================================
-- 7. USER CARDS TABLE
-- ============================================

CREATE TABLE public.user_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    card_name TEXT NOT NULL,
    card_type TEXT DEFAULT 'credit' CHECK (card_type IN ('credit', 'debit')),
    last_four_digits TEXT,
    reward_type TEXT CHECK (reward_type IN ('cashback', 'miles', 'points')),
    card_reward_id TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    nickname TEXT,
    color TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_cards_user ON public.user_cards(user_id);

-- ============================================
-- 8. FINANCIAL GOALS TABLE
-- ============================================

CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'emergency_fund',
        'vacation',
        'home_down_payment',
        'car',
        'education',
        'retirement',
        'debt_payoff',
        'custom'
    )),
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    target_date DATE,
    monthly_contribution DECIMAL(10, 2),
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    icon TEXT,
    color TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_financial_goals_user ON public.financial_goals(user_id);
CREATE INDEX idx_financial_goals_active ON public.financial_goals(user_id, status) WHERE status = 'active';

-- ============================================
-- 9. BUDGETS TABLE
-- ============================================

CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    period TEXT DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE,
    alert_threshold INTEGER DEFAULT 80,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budgets_user ON public.budgets(user_id);
CREATE INDEX idx_budgets_category ON public.budgets(category_id);

-- ============================================
-- 10. AI CONVERSATIONS TABLE
-- ============================================

CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    context_snapshot JSONB,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_recent ON public.ai_conversations(user_id, created_at DESC);

-- ============================================
-- 11. PROCESSED EMAILS TABLE
-- ============================================

CREATE TABLE public.processed_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_connection_id UUID REFERENCES public.email_connections(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    thread_id TEXT,
    subject TEXT,
    sender TEXT,
    received_at TIMESTAMPTZ,
    processing_result TEXT CHECK (processing_result IN ('transaction', 'subscription', 'ignored', 'error')),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

-- Indexes
CREATE INDEX idx_processed_emails_user ON public.processed_emails(user_id);
CREATE INDEX idx_processed_emails_message ON public.processed_emails(message_id);
CREATE INDEX idx_processed_emails_connection ON public.processed_emails(email_connection_id);

-- ============================================
-- 12. RECEIPT SCANS TABLE
-- ============================================

CREATE TABLE public.receipt_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_path TEXT,
    parsed_data JSONB,
    confidence DECIMAL(3, 2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    error_message TEXT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_receipt_scans_user ON public.receipt_scans(user_id);
CREATE INDEX idx_receipt_scans_status ON public.receipt_scans(status);

-- ============================================
-- 13. RECEIPT SCAN USAGE TABLE (Free Tier Tracking)
-- ============================================

CREATE TABLE public.receipt_scan_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    scans_used INTEGER DEFAULT 0,
    scans_limit INTEGER DEFAULT 10,
    UNIQUE(user_id, period_start)
);

-- Index
CREATE INDEX idx_receipt_scan_usage_user ON public.receipt_scan_usage(user_id);

-- ============================================
-- 14. USER SUBSCRIPTIONS TABLE (App Subscription Tiers)
-- ============================================

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    payment_provider TEXT,
    payment_id TEXT,
    amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);

-- ============================================
-- 15. SAVINGS TRACKING
-- ============================================

CREATE TABLE public.savings_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    saving_type TEXT NOT NULL CHECK (saving_type IN (
        'subscription_cancelled',
        'card_optimization',
        'alternative_found',
        'duplicate_refund',
        'budget_saved'
    )),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_savings_log_user ON public.savings_log(user_id);
CREATE INDEX idx_savings_log_date ON public.savings_log(saved_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_log ENABLE ROW LEVEL SECURITY;

-- Users: users can only see/update their own record
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Email Connections
CREATE POLICY "Users can view own email connections" ON public.email_connections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email connections" ON public.email_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email connections" ON public.email_connections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email connections" ON public.email_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Categories: users can see defaults + their own
CREATE POLICY "Users can view categories" ON public.categories
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- User Cards
CREATE POLICY "Users can manage own cards" ON public.user_cards
    FOR ALL USING (auth.uid() = user_id);

-- Financial Goals
CREATE POLICY "Users can manage own goals" ON public.financial_goals
    FOR ALL USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

-- AI Conversations
CREATE POLICY "Users can manage own conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

-- Processed Emails
CREATE POLICY "Users can view own processed emails" ON public.processed_emails
    FOR SELECT USING (auth.uid() = user_id);

-- Receipt Scans
CREATE POLICY "Users can manage own receipt scans" ON public.receipt_scans
    FOR ALL USING (auth.uid() = user_id);

-- Receipt Scan Usage
CREATE POLICY "Users can view own scan usage" ON public.receipt_scan_usage
    FOR SELECT USING (auth.uid() = user_id);

-- User Subscriptions (App Tier)
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Savings Log
CREATE POLICY "Users can view own savings" ON public.savings_log
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_connections_updated_at BEFORE UPDATE ON public.email_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_cards_updated_at BEFORE UPDATE ON public.user_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current month spending by category
CREATE OR REPLACE FUNCTION get_monthly_spending_by_category(
    p_user_id UUID,
    p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    category_color TEXT,
    total_amount DECIMAL,
    transaction_count BIGINT,
    percentage DECIMAL
) AS $$
DECLARE
    v_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.transactions
    WHERE user_id = p_user_id
    AND transaction_date >= p_month
    AND transaction_date < p_month + INTERVAL '1 month'
    AND is_deleted = FALSE;

    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) as transaction_count,
        CASE WHEN v_total > 0
            THEN ROUND((COALESCE(SUM(t.amount), 0) / v_total * 100), 1)
            ELSE 0
        END as percentage
    FROM public.categories c
    LEFT JOIN public.transactions t ON t.category_id = c.id
        AND t.user_id = p_user_id
        AND t.transaction_date >= p_month
        AND t.transaction_date < p_month + INTERVAL '1 month'
        AND t.is_deleted = FALSE
    WHERE c.user_id IS NULL OR c.user_id = p_user_id
    GROUP BY c.id, c.name, c.icon, c.color
    HAVING COALESCE(SUM(t.amount), 0) > 0
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get subscription summary
CREATE OR REPLACE FUNCTION get_subscription_summary(p_user_id UUID)
RETURNS TABLE (
    total_monthly DECIMAL,
    total_yearly DECIMAL,
    active_count BIGINT,
    cancelled_count BIGINT,
    upcoming_renewals BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE
            WHEN frequency = 'monthly' THEN amount
            WHEN frequency = 'yearly' THEN amount / 12
            WHEN frequency = 'weekly' THEN amount * 4.33
            WHEN frequency = 'quarterly' THEN amount / 3
            ELSE 0
        END) FILTER (WHERE status = 'active'), 0) as total_monthly,
        COALESCE(SUM(CASE
            WHEN frequency = 'yearly' THEN amount
            WHEN frequency = 'monthly' THEN amount * 12
            WHEN frequency = 'weekly' THEN amount * 52
            WHEN frequency = 'quarterly' THEN amount * 4
            ELSE 0
        END) FILTER (WHERE status = 'active'), 0) as total_yearly,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE status = 'active' AND next_billing_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming_renewals
    FROM public.subscriptions
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can scan receipt (free tier limit)
CREATE OR REPLACE FUNCTION can_scan_receipt(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_tier TEXT;
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT tier INTO v_subscription_tier
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_subscription_tier IN ('pro', 'premium') THEN
        RETURN TRUE;
    END IF;

    SELECT scans_used, scans_limit INTO v_current_usage, v_limit
    FROM public.receipt_scan_usage
    WHERE user_id = p_user_id
    AND period_start = DATE_TRUNC('month', CURRENT_DATE);

    IF NOT FOUND THEN
        INSERT INTO public.receipt_scan_usage (user_id, period_start, period_end, scans_used, scans_limit)
        VALUES (p_user_id, DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 0, 10);
        RETURN TRUE;
    END IF;

    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment scan usage
CREATE OR REPLACE FUNCTION increment_scan_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.receipt_scan_usage (user_id, period_start, period_end, scans_used, scans_limit)
    VALUES (p_user_id, DATE_TRUNC('month', CURRENT_DATE),
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 1, 10)
    ON CONFLICT (user_id, period_start)
    DO UPDATE SET scans_used = receipt_scan_usage.scans_used + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total savings
CREATE OR REPLACE FUNCTION get_total_savings(
    p_user_id UUID,
    p_period TEXT DEFAULT 'all'
)
RETURNS DECIMAL AS $$
DECLARE
    v_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.savings_log
    WHERE user_id = p_user_id
    AND (
        p_period = 'all' OR
        (p_period = 'month' AND saved_at >= DATE_TRUNC('month', CURRENT_DATE)) OR
        (p_period = 'year' AND saved_at >= DATE_TRUNC('year', CURRENT_DATE))
    );

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: DEFAULT CATEGORIES (Global)
-- ============================================

INSERT INTO public.categories (id, name, icon, color, keywords, is_default, sort_order) VALUES
(uuid_generate_v4(), 'Food & Dining', 'restaurant', '#FF6B6B', ARRAY['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'burger', 'pizza', 'doordash', 'ubereats', 'grubhub', 'grocery', 'walmart', 'target', 'costco', 'whole foods', 'trader joes'], TRUE, 1),
(uuid_generate_v4(), 'Transportation', 'car', '#4ECDC4', ARRAY['gas', 'petrol', 'fuel', 'shell', 'exxon', 'chevron', 'bp', 'uber', 'lyft', 'taxi', 'metro', 'subway', 'bus', 'parking', 'toll'], TRUE, 2),
(uuid_generate_v4(), 'Shopping', 'cart', '#45B7D1', ARRAY['amazon', 'ebay', 'etsy', 'shein', 'h&m', 'zara', 'nike', 'ikea', 'mall', 'electronics', 'best buy', 'apple store'], TRUE, 3),
(uuid_generate_v4(), 'Entertainment', 'film', '#96CEB4', ARRAY['netflix', 'spotify', 'apple', 'disney', 'hulu', 'hbo', 'youtube', 'cinema', 'amc', 'gaming', 'steam', 'playstation', 'xbox'], TRUE, 4),
(uuid_generate_v4(), 'Bills & Utilities', 'flash', '#FFEAA7', ARRAY['electric', 'electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'at&t', 'verizon', 't-mobile', 'comcast', 'spectrum'], TRUE, 5),
(uuid_generate_v4(), 'Health', 'medical', '#DDA0DD', ARRAY['pharmacy', 'cvs', 'walgreens', 'medicine', 'hospital', 'clinic', 'doctor', 'dentist', 'gym', 'fitness', 'planet fitness'], TRUE, 6),
(uuid_generate_v4(), 'Travel', 'airplane', '#98D8C8', ARRAY['united', 'delta', 'american airlines', 'southwest', 'flight', 'hotel', 'marriott', 'hilton', 'airbnb', 'booking', 'expedia'], TRUE, 7),
(uuid_generate_v4(), 'Education', 'school', '#F7DC6F', ARRAY['school', 'university', 'college', 'course', 'udemy', 'coursera', 'tuition', 'books', 'chegg'], TRUE, 8),
(uuid_generate_v4(), 'Personal Care', 'body', '#BB8FCE', ARRAY['salon', 'spa', 'barber', 'haircut', 'beauty', 'skincare', 'cosmetics', 'sephora', 'ulta'], TRUE, 9),
(uuid_generate_v4(), 'Housing', 'home', '#85C1E9', ARRAY['rent', 'mortgage', 'maintenance', 'repair', 'cleaning', 'furniture', 'home depot', 'lowes'], TRUE, 10),
(uuid_generate_v4(), 'Family', 'people', '#F8B500', ARRAY['kids', 'children', 'baby', 'toys', 'daycare', 'gift', 'toys r us'], TRUE, 11),
(uuid_generate_v4(), 'Other', 'ellipsis-horizontal', '#BDC3C7', ARRAY[]::TEXT[], TRUE, 99);

-- ============================================
-- END OF DATABASE SCHEMA
-- ============================================

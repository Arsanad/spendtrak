-- ============================================
-- SPENDTRAK PHASE 1 FEATURES MIGRATION
-- Split Transactions, Budget Rollover, Daily Limits
-- ============================================

-- ============================================
-- 1. TRANSACTION SPLITS TABLE
-- Allows splitting a single transaction across multiple categories
-- ============================================

CREATE TABLE public.transaction_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transaction splits
CREATE INDEX idx_transaction_splits_transaction ON public.transaction_splits(transaction_id);
CREATE INDEX idx_transaction_splits_category ON public.transaction_splits(category_id);

-- Add is_split column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT FALSE;

-- Create index for split transactions
CREATE INDEX idx_transactions_is_split ON public.transactions(is_split) WHERE is_split = TRUE;

-- ============================================
-- 2. VALIDATION TRIGGER FOR SPLIT AMOUNTS
-- Ensures split amounts equal the original transaction amount
-- ============================================

CREATE OR REPLACE FUNCTION validate_transaction_splits()
RETURNS TRIGGER AS $$
DECLARE
    original_amount DECIMAL(12, 2);
    total_splits DECIMAL(12, 2);
BEGIN
    -- Get the original transaction amount
    SELECT amount INTO original_amount
    FROM public.transactions
    WHERE id = NEW.transaction_id;

    -- Calculate total of all splits for this transaction
    SELECT COALESCE(SUM(amount), 0) INTO total_splits
    FROM public.transaction_splits
    WHERE transaction_id = NEW.transaction_id
    AND id != COALESCE(NEW.id, uuid_nil());

    -- Add the new/updated split amount
    total_splits := total_splits + NEW.amount;

    -- Check if total splits exceed original amount
    IF total_splits > original_amount THEN
        RAISE EXCEPTION 'Split amounts (%) exceed transaction amount (%)', total_splits, original_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_splits
    BEFORE INSERT OR UPDATE ON public.transaction_splits
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_splits();

-- ============================================
-- 3. AUTO-UPDATE is_split FLAG
-- Automatically set is_split when splits are added/removed
-- ============================================

CREATE OR REPLACE FUNCTION update_transaction_split_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.transactions
        SET is_split = TRUE, updated_at = NOW()
        WHERE id = NEW.transaction_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Check if any splits remain
        IF NOT EXISTS (
            SELECT 1 FROM public.transaction_splits
            WHERE transaction_id = OLD.transaction_id AND id != OLD.id
        ) THEN
            UPDATE public.transactions
            SET is_split = FALSE, updated_at = NOW()
            WHERE id = OLD.transaction_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_split_flag
    AFTER INSERT OR DELETE ON public.transaction_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_split_flag();

-- ============================================
-- 4. BUDGET ROLLOVER COLUMNS
-- Allows unused budget to roll over to next period
-- ============================================

ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS rollover_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS rollover_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS max_rollover DECIMAL(12, 2); -- NULL = unlimited

-- ============================================
-- 5. BUDGET HISTORY TABLE
-- Track budget performance and rollover history
-- ============================================

CREATE TABLE public.budget_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    budget_amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) NOT NULL,
    rollover_in DECIMAL(12, 2) DEFAULT 0,
    rollover_out DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_history_budget ON public.budget_history(budget_id);
CREATE INDEX idx_budget_history_period ON public.budget_history(period_start, period_end);

-- ============================================
-- 6. DAILY SPENDING LIMITS TABLE
-- "Safe to Spend" daily budget feature
-- ============================================

CREATE TABLE public.daily_spending_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    daily_limit DECIMAL(12, 2) NOT NULL CHECK (daily_limit > 0),
    currency TEXT DEFAULT 'USD',
    exclude_categories UUID[] DEFAULT '{}', -- Categories to exclude from limit
    exclude_recurring BOOLEAN DEFAULT TRUE, -- Exclude recurring transactions
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One limit per user
);

CREATE INDEX idx_daily_limits_user ON public.daily_spending_limits(user_id);

-- ============================================
-- 7. DAILY SPENDING LOG TABLE
-- Track daily spending for "Safe to Spend"
-- ============================================

CREATE TABLE public.daily_spending_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    spent_amount DECIMAL(12, 2) DEFAULT 0,
    daily_limit DECIMAL(12, 2) NOT NULL,
    remaining_amount DECIMAL(12, 2) GENERATED ALWAYS AS (daily_limit - spent_amount) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_log_user_date ON public.daily_spending_log(user_id, date);

-- ============================================
-- 8. CUSTOM DATE RANGE PRESETS TABLE
-- User-defined date range filters
-- ============================================

CREATE TABLE public.custom_date_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    relative_days INTEGER, -- For "Last N days" type presets
    is_relative BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_date_presets_user ON public.custom_date_presets(user_id);

-- ============================================
-- 9. EXPORT HISTORY TABLE
-- Track data exports for audit and re-download
-- ============================================

CREATE TABLE public.export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'excel', 'pdf', 'json')),
    data_type TEXT NOT NULL CHECK (data_type IN ('transactions', 'subscriptions', 'budgets', 'all')),
    filters JSONB, -- Filters applied during export
    row_count INTEGER,
    file_url TEXT,
    file_size_bytes INTEGER,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_history_user ON public.export_history(user_id);
CREATE INDEX idx_export_history_created ON public.export_history(created_at);

-- ============================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Transaction Splits RLS
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction splits"
    ON public.transaction_splits FOR SELECT
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transaction splits"
    ON public.transaction_splits FOR INSERT
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transaction splits"
    ON public.transaction_splits FOR UPDATE
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own transaction splits"
    ON public.transaction_splits FOR DELETE
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );

-- Budget History RLS
ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget history"
    ON public.budget_history FOR SELECT
    USING (
        budget_id IN (
            SELECT id FROM public.budgets WHERE user_id = auth.uid()
        )
    );

-- Daily Spending Limits RLS
ALTER TABLE public.daily_spending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily limits"
    ON public.daily_spending_limits FOR ALL
    USING (user_id = auth.uid());

-- Daily Spending Log RLS
ALTER TABLE public.daily_spending_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily log"
    ON public.daily_spending_log FOR ALL
    USING (user_id = auth.uid());

-- Custom Date Presets RLS
ALTER TABLE public.custom_date_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own date presets"
    ON public.custom_date_presets FOR ALL
    USING (user_id = auth.uid());

-- Export History RLS
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own export history"
    ON public.export_history FOR ALL
    USING (user_id = auth.uid());

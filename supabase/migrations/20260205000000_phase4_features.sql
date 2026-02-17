-- ============================================
-- Phase 4 Features Migration
-- Plaid Bank Sync, Investment Tracking, Gamification
-- ============================================

-- ============================================
-- PLAID BANK SYNC TABLES
-- ============================================

-- Connection status enum
CREATE TYPE connection_status AS ENUM (
  'active',
  'error',
  'pending_reauth',
  'disconnected'
);

-- Connected Bank Accounts (via Plaid)
-- SECURITY TODO: Before launching Plaid integration:
-- 1. The plaid_access_token column MUST be encrypted using AES-256-GCM
--    (same pattern as email_connections_imap.encrypted_password)
-- 2. Use the _shared/encryption.ts functions: encryptPassword() and decryptPassword()
-- 3. Store encrypted value with IV, never plaintext
-- 4. Verify RLS prevents cross-user access (already configured below)
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL UNIQUE,
  plaid_access_token TEXT NOT NULL, -- ENCRYPT THIS before Plaid production launch!
  plaid_institution_id TEXT,
  institution_name TEXT NOT NULL,
  institution_logo TEXT, -- Base64 or URL
  institution_color VARCHAR(7),
  status connection_status NOT NULL DEFAULT 'active',
  error_code TEXT,
  error_message TEXT,
  last_successful_sync TIMESTAMPTZ,
  consent_expiration_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account type enum
CREATE TYPE bank_account_type AS ENUM (
  'depository',
  'credit',
  'loan',
  'investment',
  'other'
);

-- Individual Bank Accounts within a Plaid Item
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  official_name TEXT,
  type bank_account_type NOT NULL DEFAULT 'other',
  subtype TEXT, -- checking, savings, credit card, etc.
  mask VARCHAR(4), -- Last 4 digits
  current_balance DECIMAL(14,2),
  available_balance DECIMAL(14,2),
  credit_limit DECIMAL(14,2),
  iso_currency_code VARCHAR(3) DEFAULT 'USD',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  include_in_net_worth BOOLEAN NOT NULL DEFAULT true,
  last_balance_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid Transaction Sync Cursor
CREATE TABLE IF NOT EXISTS plaid_sync_cursors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE UNIQUE,
  cursor TEXT, -- Plaid sync cursor for incremental updates
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Plaid fields to existing transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plaid_category TEXT[];
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plaid_category_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_channel TEXT; -- online, in store, other
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location_region TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location_country TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT true;

-- ============================================
-- INVESTMENT TRACKING TABLES
-- ============================================

-- Investment type enum
CREATE TYPE investment_type AS ENUM (
  'stock',
  'etf',
  'mutual_fund',
  'bond',
  'crypto',
  'cash',
  'option',
  'other'
);

-- Investment Holdings
CREATE TABLE IF NOT EXISTS investment_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type investment_type NOT NULL DEFAULT 'other',
  quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
  cost_basis DECIMAL(14,2),
  current_price DECIMAL(14,4),
  current_value DECIMAL(14,2),
  institution TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment Price History
CREATE TABLE IF NOT EXISTS investment_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(14,4) NOT NULL,
  change_amount DECIMAL(14,4),
  change_percent DECIMAL(8,4),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'api'
);

-- Investment Performance Snapshots
CREATE TABLE IF NOT EXISTS investment_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_value DECIMAL(14,2) NOT NULL,
  total_cost_basis DECIMAL(14,2),
  total_gain_loss DECIMAL(14,2),
  total_gain_loss_percent DECIMAL(8,4),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Crypto Holdings (separate for specialized tracking)
CREATE TABLE IF NOT EXISTS crypto_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL, -- BTC, ETH, etc.
  name TEXT NOT NULL,
  quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
  cost_basis DECIMAL(14,2),
  current_price DECIMAL(14,4),
  current_value DECIMAL(14,2),
  wallet_address TEXT,
  exchange TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment Transactions (buys, sells, dividends)
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holding_id UUID REFERENCES investment_holdings(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'split', 'transfer')),
  quantity DECIMAL(18,8) NOT NULL,
  price_per_unit DECIMAL(14,4) NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  fees DECIMAL(12,2) DEFAULT 0,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMIFICATION TABLES
-- ============================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- savings, spending, goals, streaks, milestones
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT NOT NULL, -- count, amount, streak, milestone
  requirement_value DECIMAL(14,2) NOT NULL,
  requirement_unit TEXT, -- days, transactions, dollars, etc.
  is_repeatable BOOLEAN NOT NULL DEFAULT false,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress DECIMAL(14,2) DEFAULT 0,
  times_earned INTEGER DEFAULT 1,
  UNIQUE(user_id, achievement_id)
);

-- User points and levels
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  achievements_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges (time-limited goals)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- spending, saving, budget, custom
  target_amount DECIMAL(14,2),
  target_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 50,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User challenge participation
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  current_progress DECIMAL(14,2) DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- Leaderboard (weekly/monthly)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- ============================================
-- INDEXES
-- ============================================

-- Plaid indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_plaid_item_id ON connected_accounts(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON connected_accounts(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connected_account ON bank_accounts(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid_account_id ON bank_accounts(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON transactions(plaid_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(pending) WHERE pending = true;

-- Investment indexes
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_id ON investment_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_symbol ON investment_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_investment_prices_symbol ON investment_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_investment_prices_recorded_at ON investment_prices(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_investment_snapshots_user_date ON investment_snapshots(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_crypto_holdings_user_id ON crypto_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_holding ON investment_transactions(holding_id);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_entries(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(period_type, period_start, rank);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Plaid policies
CREATE POLICY "Users manage own connected accounts"
  ON connected_accounts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own bank accounts"
  ON bank_accounts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sync cursors"
  ON plaid_sync_cursors FOR ALL
  USING (
    connected_account_id IN (
      SELECT id FROM connected_accounts WHERE user_id = auth.uid()
    )
  );

-- Investment policies
CREATE POLICY "Users manage own investment holdings"
  ON investment_holdings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own investment snapshots"
  ON investment_snapshots FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own crypto holdings"
  ON crypto_holdings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own investment transactions"
  ON investment_transactions FOR ALL
  USING (auth.uid() = user_id);

-- Gamification policies
CREATE POLICY "Users view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System manages user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own gamification"
  ON user_gamification FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own challenges"
  ON user_challenges FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users view leaderboard"
  ON leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "Users manage own leaderboard entries"
  ON leaderboard_entries FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA: DEFAULT ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (slug, name, description, category, icon, points, requirement_type, requirement_value, requirement_unit, tier) VALUES
-- Savings achievements
('first_savings', 'First Steps', 'Save your first $100', 'savings', 'piggy-bank', 10, 'amount', 100, 'dollars', 'bronze'),
('savings_500', 'Steady Saver', 'Save $500 total', 'savings', 'piggy-bank', 25, 'amount', 500, 'dollars', 'silver'),
('savings_1000', 'Thousand Dollar Club', 'Save $1,000 total', 'savings', 'piggy-bank', 50, 'amount', 1000, 'dollars', 'gold'),
('savings_5000', 'Super Saver', 'Save $5,000 total', 'savings', 'piggy-bank', 100, 'amount', 5000, 'dollars', 'platinum'),
('savings_10000', 'Savings Master', 'Save $10,000 total', 'savings', 'piggy-bank', 200, 'amount', 10000, 'dollars', 'diamond'),

-- Spending achievements
('first_budget', 'Budget Beginner', 'Create your first budget', 'spending', 'calculator', 10, 'count', 1, 'budgets', 'bronze'),
('under_budget', 'Budget Champion', 'Stay under budget for a month', 'spending', 'trophy', 25, 'count', 1, 'months', 'silver'),
('under_budget_3', 'Budget Pro', 'Stay under budget for 3 months', 'spending', 'trophy', 50, 'count', 3, 'months', 'gold'),
('track_100', 'Transaction Tracker', 'Log 100 transactions', 'spending', 'receipt', 20, 'count', 100, 'transactions', 'bronze'),
('track_500', 'Transaction Expert', 'Log 500 transactions', 'spending', 'receipt', 50, 'count', 500, 'transactions', 'silver'),

-- Goal achievements
('first_goal', 'Goal Getter', 'Create your first financial goal', 'goals', 'target', 10, 'count', 1, 'goals', 'bronze'),
('goal_complete', 'Goal Achiever', 'Complete a financial goal', 'goals', 'check-circle', 50, 'count', 1, 'goals', 'gold'),
('goals_3', 'Goal Master', 'Complete 3 financial goals', 'goals', 'medal', 100, 'count', 3, 'goals', 'platinum'),

-- Streak achievements
('streak_7', 'Week Warrior', 'Log in 7 days in a row', 'streaks', 'flame', 15, 'streak', 7, 'days', 'bronze'),
('streak_30', 'Month Master', 'Log in 30 days in a row', 'streaks', 'flame', 50, 'streak', 30, 'days', 'silver'),
('streak_90', 'Quarter Champion', 'Log in 90 days in a row', 'streaks', 'flame', 100, 'streak', 90, 'days', 'gold'),
('streak_365', 'Year Legend', 'Log in 365 days in a row', 'streaks', 'flame', 500, 'streak', 365, 'days', 'diamond'),

-- Milestone achievements
('net_worth_positive', 'In the Green', 'Achieve positive net worth', 'milestones', 'trending-up', 100, 'milestone', 0, 'dollars', 'gold'),
('debt_free', 'Debt Destroyer', 'Pay off all debts', 'milestones', 'link-off', 200, 'milestone', 0, 'dollars', 'platinum'),
('emergency_fund', 'Emergency Ready', 'Build 3 months emergency fund', 'milestones', 'shield', 150, 'milestone', 3, 'months', 'gold'),

-- Connection achievements
('bank_connected', 'Connected', 'Connect your first bank account', 'milestones', 'bank', 25, 'count', 1, 'accounts', 'bronze'),
('banks_3', 'Multi-Banker', 'Connect 3 bank accounts', 'milestones', 'bank', 50, 'count', 3, 'accounts', 'silver')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate total investment value
CREATE OR REPLACE FUNCTION calculate_investment_totals(p_user_id UUID)
RETURNS TABLE (
  total_value DECIMAL,
  total_cost_basis DECIMAL,
  total_gain_loss DECIMAL,
  total_gain_loss_percent DECIMAL
) AS $$
DECLARE
  v_total_value DECIMAL;
  v_total_cost_basis DECIMAL;
BEGIN
  -- Calculate from holdings
  SELECT
    COALESCE(SUM(current_value), 0),
    COALESCE(SUM(cost_basis), 0)
  INTO v_total_value, v_total_cost_basis
  FROM investment_holdings
  WHERE user_id = p_user_id;

  -- Add crypto holdings
  SELECT
    v_total_value + COALESCE(SUM(current_value), 0),
    v_total_cost_basis + COALESCE(SUM(cost_basis), 0)
  INTO v_total_value, v_total_cost_basis
  FROM crypto_holdings
  WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT
    v_total_value,
    v_total_cost_basis,
    (v_total_value - v_total_cost_basis),
    CASE WHEN v_total_cost_basis > 0
      THEN ((v_total_value - v_total_cost_basis) / v_total_cost_basis) * 100
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user points
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_update_streak BOOLEAN DEFAULT false
) RETURNS void AS $$
BEGIN
  INSERT INTO user_gamification (user_id, total_points, current_level, current_streak, last_activity_date)
  VALUES (
    p_user_id,
    p_points,
    1,
    CASE WHEN p_update_streak THEN 1 ELSE 0 END,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_gamification.total_points + p_points,
    current_level = FLOOR(SQRT((user_gamification.total_points + p_points) / 100)) + 1,
    current_streak = CASE
      WHEN p_update_streak AND user_gamification.last_activity_date = CURRENT_DATE - 1 THEN user_gamification.current_streak + 1
      WHEN p_update_streak AND user_gamification.last_activity_date < CURRENT_DATE - 1 THEN 1
      ELSE user_gamification.current_streak
    END,
    longest_streak = GREATEST(
      user_gamification.longest_streak,
      CASE
        WHEN p_update_streak AND user_gamification.last_activity_date = CURRENT_DATE - 1 THEN user_gamification.current_streak + 1
        ELSE user_gamification.current_streak
      END
    ),
    last_activity_date = CASE WHEN p_update_streak THEN CURRENT_DATE ELSE user_gamification.last_activity_date END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock achievement
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID,
  p_achievement_slug TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_achievement achievements%ROWTYPE;
  v_already_earned BOOLEAN;
BEGIN
  -- Get achievement
  SELECT * INTO v_achievement FROM achievements WHERE slug = p_achievement_slug;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement.id
  ) INTO v_already_earned;

  IF v_already_earned AND NOT v_achievement.is_repeatable THEN
    RETURN FALSE;
  END IF;

  -- Award achievement
  IF v_already_earned THEN
    UPDATE user_achievements
    SET times_earned = times_earned + 1
    WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
  ELSE
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, v_achievement.id);

    -- Update achievement count
    UPDATE user_gamification
    SET achievements_count = achievements_count + 1
    WHERE user_id = p_user_id;
  END IF;

  -- Add points
  PERFORM add_user_points(p_user_id, v_achievement.points, false);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account balances summary
CREATE OR REPLACE FUNCTION get_bank_account_summary(p_user_id UUID)
RETURNS TABLE (
  total_cash DECIMAL,
  total_credit_balance DECIMAL,
  total_credit_limit DECIMAL,
  total_investments DECIMAL,
  net_cash DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'depository' THEN current_balance ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'credit' THEN current_balance ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'credit' THEN credit_limit ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'investment' THEN current_balance ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'depository' THEN current_balance ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type = 'credit' THEN current_balance ELSE 0 END), 0)
  FROM bank_accounts
  WHERE user_id = p_user_id
  AND is_hidden = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER trigger_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_investment_holdings_updated_at
  BEFORE UPDATE ON investment_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_crypto_holdings_updated_at
  BEFORE UPDATE ON crypto_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create gamification record for new users
CREATE OR REPLACE FUNCTION create_user_gamification_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_gamification
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_gamification_record();

-- ============================================
-- Phase 2 Features Migration
-- Debt Management & Income Tracking
-- ============================================

-- ============================================
-- DEBT MANAGEMENT TABLES
-- ============================================

-- Debt type enum
CREATE TYPE debt_type AS ENUM (
  'credit_card',
  'loan',
  'mortgage',
  'student_loan',
  'auto_loan',
  'personal_loan',
  'medical',
  'other'
);

-- Payoff strategy enum
CREATE TYPE payoff_strategy AS ENUM (
  'snowball',
  'avalanche',
  'custom'
);

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  debt_type debt_type NOT NULL DEFAULT 'other',
  original_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- Stored as decimal (0.1999 = 19.99%)
  minimum_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date INTEGER CHECK (due_date >= 1 AND due_date <= 31), -- Day of month
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  lender_name VARCHAR(255),
  account_number_last_four VARCHAR(4),
  start_date DATE,
  target_payoff_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debt payments table
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  principal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  interest_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(12,2) NOT NULL,
  notes TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User debt settings (for payoff strategy preferences)
CREATE TABLE IF NOT EXISTS user_debt_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferred_strategy payoff_strategy NOT NULL DEFAULT 'avalanche',
  extra_payment_amount DECIMAL(12,2) DEFAULT 0,
  target_debt_free_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INCOME TRACKING TABLES
-- ============================================

-- Income source enum
CREATE TYPE income_source AS ENUM (
  'salary',
  'freelance',
  'investment',
  'rental',
  'business',
  'gift',
  'refund',
  'other'
);

-- Income frequency enum
CREATE TYPE income_frequency AS ENUM (
  'one_time',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly'
);

-- Income table
CREATE TABLE IF NOT EXISTS income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  source income_source NOT NULL DEFAULT 'other',
  description VARCHAR(255),
  payer_name VARCHAR(255),
  income_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  frequency income_frequency,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Debts indexes
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_user_active ON debts(user_id, is_active);
CREATE INDEX idx_debts_due_date ON debts(user_id, due_date) WHERE is_active = true;

-- Debt payments indexes
CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON debt_payments(user_id);
CREATE INDEX idx_debt_payments_date ON debt_payments(payment_date);

-- Income indexes
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_income_date ON income(user_id, income_date);
CREATE INDEX idx_income_source ON income(user_id, source);
CREATE INDEX idx_income_recurring ON income(user_id, is_recurring) WHERE is_recurring = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_debt_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Debts policies
CREATE POLICY "Users can view own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
  ON debts FOR DELETE
  USING (auth.uid() = user_id);

-- Debt payments policies
CREATE POLICY "Users can view own debt payments"
  ON debt_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debt payments"
  ON debt_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debt payments"
  ON debt_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debt payments"
  ON debt_payments FOR DELETE
  USING (auth.uid() = user_id);

-- User debt settings policies
CREATE POLICY "Users can view own debt settings"
  ON user_debt_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debt settings"
  ON user_debt_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debt settings"
  ON user_debt_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Income policies
CREATE POLICY "Users can view own income"
  ON income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income"
  ON income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income"
  ON income FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income"
  ON income FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate monthly interest for a debt
CREATE OR REPLACE FUNCTION calculate_monthly_interest(
  p_balance DECIMAL,
  p_annual_rate DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(p_balance * (p_annual_rate / 12), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get debt summary for a user
CREATE OR REPLACE FUNCTION get_debt_summary(p_user_id UUID)
RETURNS TABLE (
  total_debt DECIMAL,
  total_minimum_payments DECIMAL,
  highest_interest_rate DECIMAL,
  lowest_balance DECIMAL,
  debts_count INTEGER,
  monthly_interest_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(d.current_balance), 0) AS total_debt,
    COALESCE(SUM(d.minimum_payment), 0) AS total_minimum_payments,
    COALESCE(MAX(d.interest_rate), 0) AS highest_interest_rate,
    COALESCE(MIN(d.current_balance), 0) AS lowest_balance,
    COUNT(*)::INTEGER AS debts_count,
    COALESCE(SUM(calculate_monthly_interest(d.current_balance, d.interest_rate)), 0) AS monthly_interest_cost
  FROM debts d
  WHERE d.user_id = p_user_id AND d.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cash flow for a period
CREATE OR REPLACE FUNCTION get_cash_flow(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  total_income DECIMAL,
  total_expenses DECIMAL,
  net_cash_flow DECIMAL,
  savings_rate DECIMAL
) AS $$
DECLARE
  v_income DECIMAL;
  v_expenses DECIMAL;
BEGIN
  -- Calculate total income
  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM income
  WHERE user_id = p_user_id
    AND income_date BETWEEN p_start_date AND p_end_date;

  -- Calculate total expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM transactions
  WHERE user_id = p_user_id
    AND is_deleted = false
    AND transaction_date BETWEEN p_start_date AND p_end_date;

  RETURN QUERY
  SELECT
    v_income AS total_income,
    v_expenses AS total_expenses,
    (v_income - v_expenses) AS net_cash_flow,
    CASE
      WHEN v_income > 0 THEN ROUND(((v_income - v_expenses) / v_income) * 100, 2)
      ELSE 0
    END AS savings_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get income by source for a period
CREATE OR REPLACE FUNCTION get_income_by_source(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  source income_source,
  total_amount DECIMAL,
  percentage DECIMAL,
  transaction_count BIGINT
) AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  -- Get total income for percentage calculation
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM income
  WHERE user_id = p_user_id
    AND income_date BETWEEN p_start_date AND p_end_date;

  RETURN QUERY
  SELECT
    i.source,
    SUM(i.amount) AS total_amount,
    CASE
      WHEN v_total > 0 THEN ROUND((SUM(i.amount) / v_total) * 100, 2)
      ELSE 0
    END AS percentage,
    COUNT(*) AS transaction_count
  FROM income i
  WHERE i.user_id = p_user_id
    AND i.income_date BETWEEN p_start_date AND p_end_date
  GROUP BY i.source
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update debt balance after payment
CREATE OR REPLACE FUNCTION update_debt_balance_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE debts
  SET
    current_balance = NEW.balance_after,
    updated_at = NOW()
  WHERE id = NEW.debt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_debt_balance
  AFTER INSERT ON debt_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_debt_balance_after_payment();

-- Updated_at trigger for debts
CREATE TRIGGER trigger_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for income
CREATE TRIGGER trigger_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for user_debt_settings
CREATE TRIGGER trigger_user_debt_settings_updated_at
  BEFORE UPDATE ON user_debt_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

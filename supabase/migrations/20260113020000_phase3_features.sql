-- ============================================
-- Phase 3 Features Migration
-- Net Worth Dashboard, Partner/Spouse Sharing,
-- Bill Calendar, Zero-Based Budgeting
-- ============================================

-- ============================================
-- NET WORTH DASHBOARD TABLES
-- ============================================

-- Asset type enum
CREATE TYPE asset_type AS ENUM (
  'cash',
  'checking',
  'savings',
  'investment',
  'retirement',
  'real_estate',
  'vehicle',
  'cryptocurrency',
  'collectibles',
  'business',
  'other'
);

-- Liability type enum
CREATE TYPE liability_type AS ENUM (
  'credit_card',
  'mortgage',
  'auto_loan',
  'student_loan',
  'personal_loan',
  'medical_debt',
  'tax_debt',
  'other'
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  asset_type asset_type NOT NULL DEFAULT 'other',
  current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  original_value DECIMAL(15,2),
  purchase_date DATE,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  institution_name VARCHAR(255),
  account_number_last_four VARCHAR(4),
  notes TEXT,
  is_liquid BOOLEAN NOT NULL DEFAULT false,
  include_in_net_worth BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liabilities table (separate from debts for more detailed tracking)
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  liability_type liability_type NOT NULL DEFAULT 'other',
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  original_balance DECIMAL(15,2),
  interest_rate DECIMAL(5,4) DEFAULT 0,
  minimum_payment DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  lender_name VARCHAR(255),
  account_number_last_four VARCHAR(4),
  due_date INTEGER CHECK (due_date >= 1 AND due_date <= 31),
  notes TEXT,
  linked_debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
  include_in_net_worth BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset value history for tracking changes over time
CREATE TABLE IF NOT EXISTS asset_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_value DECIMAL(15,2) NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liability balance history
CREATE TABLE IF NOT EXISTS liability_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liability_id UUID NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_balance DECIMAL(15,2) NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net worth snapshots (monthly/periodic summaries)
CREATE TABLE IF NOT EXISTS net_worth_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_assets DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_worth DECIMAL(15,2) NOT NULL DEFAULT 0,
  liquid_assets DECIMAL(15,2) NOT NULL DEFAULT 0,
  asset_breakdown JSONB DEFAULT '{}',
  liability_breakdown JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- ============================================
-- PARTNER/SPOUSE SHARING TABLES
-- ============================================

-- Household role enum
CREATE TYPE household_role AS ENUM (
  'owner',
  'admin',
  'member',
  'viewer'
);

-- Invite status enum
CREATE TYPE invite_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired'
);

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members
CREATE TABLE IF NOT EXISTS household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role household_role NOT NULL DEFAULT 'member',
  nickname VARCHAR(100),
  can_view_transactions BOOLEAN NOT NULL DEFAULT true,
  can_add_transactions BOOLEAN NOT NULL DEFAULT true,
  can_edit_budgets BOOLEAN NOT NULL DEFAULT false,
  can_manage_members BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Household invitations
CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  role household_role NOT NULL DEFAULT 'member',
  status invite_status NOT NULL DEFAULT 'pending',
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared budgets (household-level budgets)
CREATE TABLE IF NOT EXISTS shared_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared financial goals
CREATE TABLE IF NOT EXISTS shared_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  target_date DATE,
  icon VARCHAR(50) DEFAULT 'flag',
  color VARCHAR(7) DEFAULT '#007AFF',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared goal contributions
CREATE TABLE IF NOT EXISTS shared_goal_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES shared_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction assignments (assign transactions to household or specific member)
CREATE TABLE IF NOT EXISTS transaction_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  is_shared BOOLEAN NOT NULL DEFAULT true,
  split_percentage DECIMAL(5,2) DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BILL CALENDAR TABLES
-- ============================================

-- Bill status enum
CREATE TYPE bill_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'cancelled',
  'scheduled'
);

-- Bills/Recurring payments table
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payee_name VARCHAR(255),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  frequency income_frequency NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  auto_pay BOOLEAN NOT NULL DEFAULT false,
  reminder_days INTEGER DEFAULT 3,
  is_essential BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill payments/occurrences
CREATE TABLE IF NOT EXISTS bill_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status bill_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill reminders
CREATE TABLE IF NOT EXISTS bill_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ZERO-BASED BUDGETING TABLES
-- ============================================

-- Zero-based budget periods
CREATE TABLE IF NOT EXISTS zero_based_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  period_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_balanced BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zero-based budget categories/allocations
CREATE TABLE IF NOT EXISTS zero_based_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID NOT NULL REFERENCES zero_based_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  priority INTEGER DEFAULT 0,
  is_essential BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income sources for zero-based budgeting
CREATE TABLE IF NOT EXISTS zero_based_income_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID NOT NULL REFERENCES zero_based_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  expected_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  received_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_date DATE,
  received_date DATE,
  income_id UUID REFERENCES income(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Assets indexes
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_user_active ON assets(user_id, is_active);
CREATE INDEX idx_assets_type ON assets(user_id, asset_type);

-- Liabilities indexes
CREATE INDEX idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX idx_liabilities_user_active ON liabilities(user_id, is_active);
CREATE INDEX idx_liabilities_type ON liabilities(user_id, liability_type);

-- Asset/Liability history indexes
CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX idx_asset_history_date ON asset_history(asset_id, recorded_date);
CREATE INDEX idx_liability_history_liability ON liability_history(liability_id);
CREATE INDEX idx_liability_history_date ON liability_history(liability_id, recorded_date);

-- Net worth history indexes
CREATE INDEX idx_net_worth_history_user ON net_worth_history(user_id);
CREATE INDEX idx_net_worth_history_date ON net_worth_history(user_id, snapshot_date);

-- Household indexes
CREATE INDEX idx_households_created_by ON households(created_by);
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_household_invitations_email ON household_invitations(invited_email);
CREATE INDEX idx_household_invitations_code ON household_invitations(invite_code);

-- Shared budgets/goals indexes
CREATE INDEX idx_shared_budgets_household ON shared_budgets(household_id);
CREATE INDEX idx_shared_goals_household ON shared_goals(household_id);
CREATE INDEX idx_shared_goal_contributions_goal ON shared_goal_contributions(goal_id);
CREATE INDEX idx_transaction_assignments_transaction ON transaction_assignments(transaction_id);
CREATE INDEX idx_transaction_assignments_household ON transaction_assignments(household_id);

-- Bills indexes
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_household ON bills(household_id);
CREATE INDEX idx_bills_due_day ON bills(due_day) WHERE is_active = true;
CREATE INDEX idx_bill_payments_bill ON bill_payments(bill_id);
CREATE INDEX idx_bill_payments_due_date ON bill_payments(due_date);
CREATE INDEX idx_bill_payments_status ON bill_payments(status);
CREATE INDEX idx_bill_reminders_date ON bill_reminders(reminder_date) WHERE is_sent = false;

-- Zero-based budgeting indexes
CREATE INDEX idx_zero_based_periods_user ON zero_based_periods(user_id);
CREATE INDEX idx_zero_based_periods_dates ON zero_based_periods(start_date, end_date);
CREATE INDEX idx_zero_based_allocations_period ON zero_based_allocations(period_id);
CREATE INDEX idx_zero_based_income_sources_period ON zero_based_income_sources(period_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE liability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zero_based_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE zero_based_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zero_based_income_sources ENABLE ROW LEVEL SECURITY;

-- Assets policies
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (auth.uid() = user_id);

-- Liabilities policies
CREATE POLICY "Users can view own liabilities"
  ON liabilities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liabilities"
  ON liabilities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liabilities"
  ON liabilities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own liabilities"
  ON liabilities FOR DELETE
  USING (auth.uid() = user_id);

-- Asset history policies
CREATE POLICY "Users can view own asset history"
  ON asset_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset history"
  ON asset_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Liability history policies
CREATE POLICY "Users can view own liability history"
  ON liability_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liability history"
  ON liability_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Net worth history policies
CREATE POLICY "Users can view own net worth history"
  ON net_worth_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own net worth history"
  ON net_worth_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Households policies
CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = households.id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update households"
  ON households FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete households"
  ON households FOR DELETE
  USING (auth.uid() = created_by);

-- Household members policies
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage household members"
  ON household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND (hm.role = 'owner' OR hm.role = 'admin' OR hm.can_manage_members = true)
    ) OR
    auth.uid() = household_members.user_id
  );

CREATE POLICY "Admins can update household members"
  ON household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND (hm.role = 'owner' OR hm.role = 'admin' OR hm.can_manage_members = true)
    )
  );

CREATE POLICY "Admins can remove household members"
  ON household_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND (hm.role = 'owner' OR hm.role = 'admin' OR hm.can_manage_members = true)
    ) OR
    auth.uid() = household_members.user_id
  );

-- Household invitations policies
CREATE POLICY "Users can view invitations for their households"
  ON household_invitations FOR SELECT
  USING (
    invited_email = (SELECT email FROM users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_invitations.household_id
      AND hm.user_id = auth.uid()
      AND (hm.role = 'owner' OR hm.role = 'admin')
    )
  );

CREATE POLICY "Admins can create invitations"
  ON household_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_invitations.household_id
      AND hm.user_id = auth.uid()
      AND (hm.role = 'owner' OR hm.role = 'admin' OR hm.can_manage_members = true)
    )
  );

-- Shared budgets policies
CREATE POLICY "Household members can view shared budgets"
  ON shared_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = shared_budgets.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Budget editors can manage shared budgets"
  ON shared_budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = shared_budgets.household_id
      AND hm.user_id = auth.uid()
      AND (hm.role IN ('owner', 'admin') OR hm.can_edit_budgets = true)
    )
  );

-- Shared goals policies
CREATE POLICY "Household members can view shared goals"
  ON shared_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = shared_goals.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage shared goals"
  ON shared_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = shared_goals.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'admin')
    )
  );

-- Shared goal contributions policies
CREATE POLICY "Members can view contributions"
  ON shared_goal_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_goals sg
      JOIN household_members hm ON hm.household_id = sg.household_id
      WHERE sg.id = shared_goal_contributions.goal_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add contributions"
  ON shared_goal_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transaction assignments policies
CREATE POLICY "Household members can view assignments"
  ON transaction_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = transaction_assignments.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Transaction owners can assign"
  ON transaction_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_assignments.transaction_id
      AND t.user_id = auth.uid()
    )
  );

-- Bills policies
CREATE POLICY "Users can view own bills"
  ON bills FOR SELECT
  USING (
    auth.uid() = user_id OR
    (household_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = bills.household_id
      AND hm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);

-- Bill payments policies
CREATE POLICY "Users can view own bill payments"
  ON bill_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bill payments"
  ON bill_payments FOR ALL
  USING (auth.uid() = user_id);

-- Bill reminders policies
CREATE POLICY "Users can view own bill reminders"
  ON bill_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bill reminders"
  ON bill_reminders FOR ALL
  USING (auth.uid() = user_id);

-- Zero-based budgeting policies
CREATE POLICY "Users can view own zero-based periods"
  ON zero_based_periods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own zero-based periods"
  ON zero_based_periods FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own allocations"
  ON zero_based_allocations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own allocations"
  ON zero_based_allocations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own income sources"
  ON zero_based_income_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own income sources"
  ON zero_based_income_sources FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate net worth for a user
CREATE OR REPLACE FUNCTION calculate_net_worth(p_user_id UUID)
RETURNS TABLE (
  total_assets DECIMAL,
  total_liabilities DECIMAL,
  net_worth DECIMAL,
  liquid_assets DECIMAL,
  asset_breakdown JSONB,
  liability_breakdown JSONB
) AS $$
DECLARE
  v_total_assets DECIMAL;
  v_total_liabilities DECIMAL;
  v_liquid_assets DECIMAL;
  v_asset_breakdown JSONB;
  v_liability_breakdown JSONB;
BEGIN
  -- Calculate total assets
  SELECT COALESCE(SUM(current_value), 0) INTO v_total_assets
  FROM assets
  WHERE user_id = p_user_id AND is_active = true AND include_in_net_worth = true;

  -- Calculate liquid assets
  SELECT COALESCE(SUM(current_value), 0) INTO v_liquid_assets
  FROM assets
  WHERE user_id = p_user_id AND is_active = true AND include_in_net_worth = true AND is_liquid = true;

  -- Calculate total liabilities
  SELECT COALESCE(SUM(current_balance), 0) INTO v_total_liabilities
  FROM liabilities
  WHERE user_id = p_user_id AND is_active = true AND include_in_net_worth = true;

  -- Also include debts not linked to liabilities
  SELECT v_total_liabilities + COALESCE(SUM(current_balance), 0) INTO v_total_liabilities
  FROM debts d
  WHERE d.user_id = p_user_id AND d.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM liabilities l WHERE l.linked_debt_id = d.id
  );

  -- Asset breakdown by type
  SELECT COALESCE(
    jsonb_object_agg(asset_type, type_total),
    '{}'::jsonb
  ) INTO v_asset_breakdown
  FROM (
    SELECT asset_type::text, SUM(current_value) as type_total
    FROM assets
    WHERE user_id = p_user_id AND is_active = true AND include_in_net_worth = true
    GROUP BY asset_type
  ) t;

  -- Liability breakdown by type
  SELECT COALESCE(
    jsonb_object_agg(liability_type, type_total),
    '{}'::jsonb
  ) INTO v_liability_breakdown
  FROM (
    SELECT liability_type::text, SUM(current_balance) as type_total
    FROM liabilities
    WHERE user_id = p_user_id AND is_active = true AND include_in_net_worth = true
    GROUP BY liability_type
  ) t;

  RETURN QUERY
  SELECT
    v_total_assets,
    v_total_liabilities,
    (v_total_assets - v_total_liabilities),
    v_liquid_assets,
    v_asset_breakdown,
    v_liability_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a net worth snapshot
CREATE OR REPLACE FUNCTION create_net_worth_snapshot(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_data RECORD;
BEGIN
  SELECT * INTO v_data FROM calculate_net_worth(p_user_id);

  INSERT INTO net_worth_history (
    user_id,
    snapshot_date,
    total_assets,
    total_liabilities,
    net_worth,
    liquid_assets,
    asset_breakdown,
    liability_breakdown
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    v_data.total_assets,
    v_data.total_liabilities,
    v_data.net_worth,
    v_data.liquid_assets,
    v_data.asset_breakdown,
    v_data.liability_breakdown
  )
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_assets = EXCLUDED.total_assets,
    total_liabilities = EXCLUDED.total_liabilities,
    net_worth = EXCLUDED.net_worth,
    liquid_assets = EXCLUDED.liquid_assets,
    asset_breakdown = EXCLUDED.asset_breakdown,
    liability_breakdown = EXCLUDED.liability_breakdown
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate upcoming bills for a period
CREATE OR REPLACE FUNCTION generate_bill_occurrences(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  bill_id UUID,
  bill_name VARCHAR,
  amount DECIMAL,
  due_date DATE,
  status bill_status,
  is_essential BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dates AS (
    SELECT p_start_date as dt
    UNION ALL
    SELECT dt + 1 FROM dates WHERE dt < p_end_date
  ),
  monthly_bills AS (
    SELECT
      b.id,
      b.name,
      b.amount,
      (DATE_TRUNC('month', d.dt) + (b.due_day - 1) * INTERVAL '1 day')::date as calc_due_date,
      b.is_essential
    FROM bills b
    CROSS JOIN (SELECT DISTINCT DATE_TRUNC('month', dt) as dt FROM dates) d
    WHERE b.user_id = p_user_id
    AND b.is_active = true
    AND b.frequency = 'monthly'
    AND b.start_date <= p_end_date
    AND (b.end_date IS NULL OR b.end_date >= p_start_date)
  )
  SELECT
    mb.id,
    mb.name,
    mb.amount,
    mb.calc_due_date,
    COALESCE(bp.status, 'pending'::bill_status),
    mb.is_essential
  FROM monthly_bills mb
  LEFT JOIN bill_payments bp ON bp.bill_id = mb.id AND bp.due_date = mb.calc_due_date
  WHERE mb.calc_due_date BETWEEN p_start_date AND p_end_date
  ORDER BY mb.calc_due_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check zero-based budget balance
CREATE OR REPLACE FUNCTION check_zero_based_balance(p_period_id UUID)
RETURNS TABLE (
  is_balanced BOOLEAN,
  total_income DECIMAL,
  total_allocated DECIMAL,
  unallocated DECIMAL
) AS $$
DECLARE
  v_income DECIMAL;
  v_allocated DECIMAL;
BEGIN
  SELECT COALESCE(SUM(expected_amount), 0) INTO v_income
  FROM zero_based_income_sources
  WHERE period_id = p_period_id;

  SELECT COALESCE(SUM(allocated_amount), 0) INTO v_allocated
  FROM zero_based_allocations
  WHERE period_id = p_period_id;

  -- Update the period
  UPDATE zero_based_periods
  SET
    total_income = v_income,
    total_allocated = v_allocated,
    is_balanced = (v_income = v_allocated AND v_income > 0),
    updated_at = NOW()
  WHERE id = p_period_id;

  RETURN QUERY
  SELECT
    (v_income = v_allocated AND v_income > 0),
    v_income,
    v_allocated,
    (v_income - v_allocated);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-record asset value changes
CREATE OR REPLACE FUNCTION record_asset_value_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_value != NEW.current_value THEN
    INSERT INTO asset_history (asset_id, user_id, recorded_value, change_reason)
    VALUES (NEW.id, NEW.user_id, NEW.current_value, 'Value updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_asset_value
  AFTER UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION record_asset_value_change();

-- Auto-record liability balance changes
CREATE OR REPLACE FUNCTION record_liability_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_balance != NEW.current_balance THEN
    INSERT INTO liability_history (liability_id, user_id, recorded_balance, change_reason)
    VALUES (NEW.id, NEW.user_id, NEW.current_balance, 'Balance updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_liability_balance
  AFTER UPDATE ON liabilities
  FOR EACH ROW
  EXECUTE FUNCTION record_liability_balance_change();

-- Auto-add owner as household member
CREATE OR REPLACE FUNCTION add_owner_as_household_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO household_members (household_id, user_id, role, can_view_transactions, can_add_transactions, can_edit_budgets, can_manage_members)
  VALUES (NEW.id, NEW.created_by, 'owner', true, true, true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_household_owner
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_household_member();

-- Updated_at triggers for new tables
CREATE TRIGGER trigger_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_liabilities_updated_at
  BEFORE UPDATE ON liabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_shared_budgets_updated_at
  BEFORE UPDATE ON shared_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_shared_goals_updated_at
  BEFORE UPDATE ON shared_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bill_payments_updated_at
  BEFORE UPDATE ON bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_zero_based_periods_updated_at
  BEFORE UPDATE ON zero_based_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_zero_based_allocations_updated_at
  BEFORE UPDATE ON zero_based_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_zero_based_income_sources_updated_at
  BEFORE UPDATE ON zero_based_income_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

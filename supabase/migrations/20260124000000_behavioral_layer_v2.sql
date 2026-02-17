-- SpendTrak Behavioral Engine v2.0
-- Migration: 007_behavioral_layer_v2.sql
-- Adds state machine and v2.0 behavioral tracking

-- USER BEHAVIORAL PROFILE (v2.0 - Enhanced with State Machine)
DROP TABLE IF EXISTS user_behavioral_profile CASCADE;

CREATE TABLE IF NOT EXISTS user_behavioral_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- State Machine
  user_state TEXT NOT NULL DEFAULT 'OBSERVING'
    CHECK (user_state IN ('OBSERVING', 'FOCUSED', 'COOLDOWN', 'WITHDRAWN')),
  active_behavior TEXT DEFAULT NULL
    CHECK (active_behavior IS NULL OR active_behavior IN ('small_recurring', 'stress_spending', 'end_of_month')),
  active_behavior_intensity DECIMAL(3,2) DEFAULT 0.0,
  state_changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence Scores (0.0 - 1.0)
  confidence_small_recurring DECIMAL(4,3) DEFAULT 0.0,
  confidence_stress_spending DECIMAL(4,3) DEFAULT 0.0,
  confidence_end_of_month DECIMAL(4,3) DEFAULT 0.0,

  -- Last Detection Times
  last_detected_small_recurring TIMESTAMPTZ DEFAULT NULL,
  last_detected_stress_spending TIMESTAMPTZ DEFAULT NULL,
  last_detected_end_of_month TIMESTAMPTZ DEFAULT NULL,

  -- Intervention Tracking
  last_intervention_at TIMESTAMPTZ DEFAULT NULL,
  cooldown_ends_at TIMESTAMPTZ DEFAULT NULL,
  withdrawal_ends_at TIMESTAMPTZ DEFAULT NULL,
  interventions_today INTEGER DEFAULT 0,
  interventions_this_week INTEGER DEFAULT 0,
  last_intervention_reset TIMESTAMPTZ DEFAULT NOW(),

  -- Failure Tracking
  ignored_interventions INTEGER DEFAULT 0,
  dismissed_count INTEGER DEFAULT 0,

  -- Win Tracking
  total_wins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_win_at TIMESTAMPTZ DEFAULT NULL,

  -- Budget (for end-of-month)
  budget_adherence_early_month DECIMAL(4,3) DEFAULT 1.0,
  budget_adherence_current DECIMAL(4,3) DEFAULT 1.0,

  -- Settings
  intervention_enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_behavioral_profile_user_id ON user_behavioral_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_profile_state ON user_behavioral_profile(user_state);

-- BEHAVIORAL SIGNALS
DROP TABLE IF EXISTS behavioral_signals CASCADE;

CREATE TABLE IF NOT EXISTS behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_strength DECIMAL(4,3) NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  category_id TEXT,
  merchant_name TEXT,
  amount DECIMAL(12,2),
  hour_of_day INTEGER,
  day_of_week INTEGER,
  day_of_month INTEGER,
  detection_reason TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_signals_user_id ON behavioral_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_detected_at ON behavioral_signals(detected_at);

-- INTERVENTIONS
DROP TABLE IF EXISTS interventions CASCADE;

CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL,
  intervention_type TEXT NOT NULL,
  message_key TEXT NOT NULL,
  message_content TEXT NOT NULL,
  trigger_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  behavioral_moment_type TEXT,
  confidence_at_delivery DECIMAL(4,3) NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  user_response TEXT DEFAULT NULL CHECK (user_response IS NULL OR user_response IN ('viewed', 'dismissed', 'engaged', 'ignored')),
  response_at TIMESTAMPTZ DEFAULT NULL,
  led_to_ai_chat BOOLEAN DEFAULT FALSE,
  decision_reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_delivered_at ON interventions(delivered_at);

-- BEHAVIORAL WINS
DROP TABLE IF EXISTS behavioral_wins CASCADE;

CREATE TABLE IF NOT EXISTS behavioral_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL,
  win_type TEXT NOT NULL CHECK (win_type IN ('pattern_break', 'improvement', 'streak_milestone', 'silent_win')),
  message TEXT NOT NULL,
  streak_days INTEGER DEFAULT NULL,
  improvement_percent DECIMAL(5,2) DEFAULT NULL,
  celebrated BOOLEAN DEFAULT FALSE,
  celebrated_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_wins_user_id ON behavioral_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_wins_celebrated ON behavioral_wins(celebrated);

-- STATE TRANSITION LOG (for debugging and analysis)
CREATE TABLE IF NOT EXISTS state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason TEXT NOT NULL,
  active_behavior TEXT,
  confidence_at_transition DECIMAL(4,3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_transitions_user_id ON state_transitions(user_id);

-- RLS POLICIES
ALTER TABLE user_behavioral_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_transitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_behavioral_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_behavioral_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_behavioral_profile;
DROP POLICY IF EXISTS "Users can view own signals" ON behavioral_signals;
DROP POLICY IF EXISTS "Users can insert own signals" ON behavioral_signals;
DROP POLICY IF EXISTS "Users can view own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can insert own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can update own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can view own wins" ON behavioral_wins;
DROP POLICY IF EXISTS "Users can insert own wins" ON behavioral_wins;
DROP POLICY IF EXISTS "Users can update own wins" ON behavioral_wins;
DROP POLICY IF EXISTS "Users can view own transitions" ON state_transitions;
DROP POLICY IF EXISTS "Users can insert own transitions" ON state_transitions;

-- User Behavioral Profile Policies
CREATE POLICY "Users can view own profile" ON user_behavioral_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_behavioral_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_behavioral_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Behavioral Signals Policies
CREATE POLICY "Users can view own signals" ON behavioral_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signals" ON behavioral_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interventions Policies
CREATE POLICY "Users can view own interventions" ON interventions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interventions" ON interventions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interventions" ON interventions
  FOR UPDATE USING (auth.uid() = user_id);

-- Behavioral Wins Policies
CREATE POLICY "Users can view own wins" ON behavioral_wins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wins" ON behavioral_wins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wins" ON behavioral_wins
  FOR UPDATE USING (auth.uid() = user_id);

-- State Transitions Policies
CREATE POLICY "Users can view own transitions" ON state_transitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transitions" ON state_transitions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- HELPER FUNCTIONS

-- Ensure profile exists for user
CREATE OR REPLACE FUNCTION ensure_behavioral_profile(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM user_behavioral_profile WHERE user_id = p_user_id;

  IF v_profile_id IS NULL THEN
    INSERT INTO user_behavioral_profile (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily/weekly intervention counts
CREATE OR REPLACE FUNCTION reset_intervention_counts()
RETURNS void AS $$
BEGIN
  -- Reset daily count at midnight
  UPDATE user_behavioral_profile
  SET interventions_today = 0,
      last_intervention_reset = NOW()
  WHERE DATE(last_intervention_reset) < CURRENT_DATE;

  -- Reset weekly count on Monday
  UPDATE user_behavioral_profile
  SET interventions_this_week = 0
  WHERE EXTRACT(DOW FROM last_intervention_reset) > EXTRACT(DOW FROM NOW())
    OR (NOW() - last_intervention_reset) > INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update active behavior based on confidence scores
CREATE OR REPLACE FUNCTION update_active_behavior(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_profile user_behavioral_profile%ROWTYPE;
  v_max_confidence DECIMAL(4,3);
  v_new_behavior TEXT;
  v_threshold DECIMAL(4,3) := 0.750;
  v_deactivation_threshold DECIMAL(4,3) := 0.500;
BEGIN
  SELECT * INTO v_profile FROM user_behavioral_profile WHERE user_id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN;
  END IF;

  -- Find highest confidence
  v_max_confidence := GREATEST(
    v_profile.confidence_small_recurring,
    v_profile.confidence_stress_spending,
    v_profile.confidence_end_of_month
  );

  -- Determine which behavior has the highest confidence
  IF v_max_confidence >= v_threshold THEN
    IF v_profile.confidence_small_recurring = v_max_confidence THEN
      v_new_behavior := 'small_recurring';
    ELSIF v_profile.confidence_stress_spending = v_max_confidence THEN
      v_new_behavior := 'stress_spending';
    ELSE
      v_new_behavior := 'end_of_month';
    END IF;

    -- Transition to FOCUSED if in OBSERVING
    IF v_profile.user_state = 'OBSERVING' THEN
      UPDATE user_behavioral_profile
      SET active_behavior = v_new_behavior,
          active_behavior_intensity = v_max_confidence,
          user_state = 'FOCUSED',
          state_changed_at = NOW(),
          updated_at = NOW()
      WHERE user_id = p_user_id;

      INSERT INTO state_transitions (user_id, from_state, to_state, trigger, reason, active_behavior, confidence_at_transition)
      VALUES (p_user_id, 'OBSERVING', 'FOCUSED', 'CONFIDENCE_REACHED', 'Confidence threshold reached', v_new_behavior, v_max_confidence);
    ELSE
      UPDATE user_behavioral_profile
      SET active_behavior = v_new_behavior,
          active_behavior_intensity = v_max_confidence,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;

  ELSIF v_max_confidence < v_deactivation_threshold AND v_profile.active_behavior IS NOT NULL THEN
    -- Deactivate if below threshold
    UPDATE user_behavioral_profile
    SET active_behavior = NULL,
        active_behavior_intensity = 0,
        user_state = 'OBSERVING',
        state_changed_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO state_transitions (user_id, from_state, to_state, trigger, reason, confidence_at_transition)
    VALUES (p_user_id, v_profile.user_state, 'OBSERVING', 'CONFIDENCE_DROPPED', 'Confidence below deactivation threshold', v_max_confidence);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_behavioral_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS behavioral_profile_updated ON user_behavioral_profile;
CREATE TRIGGER behavioral_profile_updated
  BEFORE UPDATE ON user_behavioral_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_behavioral_profile_timestamp();

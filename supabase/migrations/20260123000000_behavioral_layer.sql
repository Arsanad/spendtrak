-- ============================================
-- Phase 6: Behavioral Intelligence Layer
-- Silent behavior detection, targeted interventions, pattern tracking
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================

-- Types of spending behaviors we track
CREATE TYPE behavior_type AS ENUM (
  'small_recurring',    -- Death by 1000 cuts (frequent small purchases)
  'stress_spending',    -- Emotional/stress-driven spending
  'end_of_month'        -- End-of-month budget collapse
);

-- Types of interventions
CREATE TYPE intervention_type AS ENUM (
  'immediate',          -- Real-time during transaction
  'reflective',         -- Post-transaction reflection
  'reinforcement'       -- Positive reinforcement
);

-- Types of behavioral wins
CREATE TYPE win_type AS ENUM (
  'pattern_break',      -- Broke a negative pattern
  'avoidance',          -- Successfully avoided trigger
  'improvement',        -- Showed measurable improvement
  'streak'              -- Maintained good behavior
);

-- ============================================
-- CORE BEHAVIORAL TABLES
-- ============================================

-- User Behavioral Profile (one per user)
-- Stores confidence scores and tracking state for each behavior type
CREATE TABLE IF NOT EXISTS user_behavioral_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Confidence scores (0.0 to 1.0) for each behavior
  confidence_small_recurring DECIMAL(4,3) NOT NULL DEFAULT 0.000,
  confidence_stress_spending DECIMAL(4,3) NOT NULL DEFAULT 0.000,
  confidence_end_of_month DECIMAL(4,3) NOT NULL DEFAULT 0.000,

  -- Active behavior being tracked (highest confidence above threshold)
  active_behavior behavior_type,
  active_behavior_intensity DECIMAL(4,3) DEFAULT 0.000,

  -- Detection metadata
  last_detection_run TIMESTAMPTZ,
  detection_data JSONB DEFAULT '{}',

  -- Intervention state
  interventions_today INTEGER NOT NULL DEFAULT 0,
  interventions_this_week INTEGER NOT NULL DEFAULT 0,
  last_intervention_at TIMESTAMPTZ,
  last_intervention_type intervention_type,

  -- Win tracking
  total_wins INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,

  -- Historical context
  pattern_history JSONB DEFAULT '[]',
  behavior_notes JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Behavioral Signals (raw detected patterns)
-- Each row represents one detected signal from a transaction or pattern
CREATE TABLE IF NOT EXISTS behavioral_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Signal details
  behavior_type behavior_type NOT NULL,
  signal_strength DECIMAL(4,3) NOT NULL, -- 0.0 to 1.0

  -- Context
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  merchant_name TEXT,
  amount DECIMAL(12,2),

  -- Detection metadata
  detection_reason TEXT NOT NULL, -- Why this was flagged
  time_context TEXT, -- 'late_night', 'end_of_workday', 'end_of_month', etc.
  pattern_data JSONB DEFAULT '{}', -- Additional pattern context

  -- State
  is_processed BOOLEAN NOT NULL DEFAULT false,
  contributed_to_intervention BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interventions (record of all interventions shown)
CREATE TABLE IF NOT EXISTS interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Intervention details
  behavior_type behavior_type NOT NULL,
  intervention_type intervention_type NOT NULL,
  message_key TEXT NOT NULL, -- Reference to message in library
  message_content TEXT NOT NULL, -- Actual message shown

  -- Trigger context
  trigger_event TEXT NOT NULL, -- 'transaction_created', 'app_open', 'daily_summary', etc.
  trigger_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Confidence at time of intervention
  confidence_at_trigger DECIMAL(4,3) NOT NULL,

  -- User response
  user_response TEXT CHECK (user_response IN ('dismissed', 'acknowledged', 'engaged', 'pending')),
  response_at TIMESTAMPTZ,

  -- Follow-up
  led_to_ai_chat BOOLEAN NOT NULL DEFAULT false,
  led_to_behavior_change BOOLEAN, -- null = unknown yet

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Behavioral Wins (positive pattern breaks and improvements)
CREATE TABLE IF NOT EXISTS behavioral_wins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Win details
  win_type win_type NOT NULL,
  behavior_type behavior_type NOT NULL,

  -- Description
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Metrics
  metric_name TEXT, -- 'days_avoided', 'amount_saved', 'streak_length', etc.
  metric_value DECIMAL(14,2),
  metric_previous DECIMAL(14,2), -- For comparison

  -- Context
  win_data JSONB DEFAULT '{}',

  -- Display state
  is_celebrated BOOLEAN NOT NULL DEFAULT false,
  celebrated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_behavioral_profile_user ON user_behavioral_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_profile_active ON user_behavioral_profile(active_behavior) WHERE active_behavior IS NOT NULL;

-- Signal indexes
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_user ON behavioral_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_type ON behavioral_signals(behavior_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_created ON behavioral_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_unprocessed ON behavioral_signals(user_id, is_processed) WHERE is_processed = false;
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_transaction ON behavioral_signals(transaction_id) WHERE transaction_id IS NOT NULL;

-- Intervention indexes
CREATE INDEX IF NOT EXISTS idx_interventions_user ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON interventions(behavior_type, intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_created ON interventions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_pending ON interventions(user_id, user_response) WHERE user_response = 'pending';
CREATE INDEX IF NOT EXISTS idx_interventions_message_key ON interventions(message_key);

-- Win indexes
CREATE INDEX IF NOT EXISTS idx_behavioral_wins_user ON behavioral_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_wins_type ON behavioral_wins(win_type, behavior_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_wins_uncelebrated ON behavioral_wins(user_id, is_celebrated) WHERE is_celebrated = false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_behavioral_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_wins ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users manage own behavioral profile"
  ON user_behavioral_profile FOR ALL
  USING (auth.uid() = user_id);

-- Signal policies
CREATE POLICY "Users view own behavioral signals"
  ON behavioral_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts behavioral signals"
  ON behavioral_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System updates behavioral signals"
  ON behavioral_signals FOR UPDATE
  USING (auth.uid() = user_id);

-- Intervention policies
CREATE POLICY "Users view own interventions"
  ON interventions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts interventions"
  ON interventions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own intervention responses"
  ON interventions FOR UPDATE
  USING (auth.uid() = user_id);

-- Win policies
CREATE POLICY "Users view own behavioral wins"
  ON behavioral_wins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts behavioral wins"
  ON behavioral_wins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own wins"
  ON behavioral_wins FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get behavioral context for AI (returns JSON)
CREATE OR REPLACE FUNCTION get_behavioral_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile user_behavioral_profile%ROWTYPE;
  v_recent_signals JSONB;
  v_recent_interventions JSONB;
  v_recent_wins JSONB;
  v_result JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM user_behavioral_profile
  WHERE user_id = p_user_id;

  -- If no profile exists, return minimal context
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_profile', false,
      'confidence_scores', jsonb_build_object(
        'small_recurring', 0,
        'stress_spending', 0,
        'end_of_month', 0
      ),
      'active_behavior', null,
      'recent_signals', '[]'::jsonb,
      'recent_interventions', '[]'::jsonb,
      'recent_wins', '[]'::jsonb,
      'win_streak', 0
    );
  END IF;

  -- Get recent signals (last 7 days)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'behavior_type', behavior_type,
      'signal_strength', signal_strength,
      'detection_reason', detection_reason,
      'time_context', time_context,
      'amount', amount,
      'merchant_name', merchant_name,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  INTO v_recent_signals
  FROM behavioral_signals
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '7 days'
  LIMIT 20;

  -- Get recent interventions (last 14 days)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'behavior_type', behavior_type,
      'intervention_type', intervention_type,
      'message_key', message_key,
      'user_response', user_response,
      'confidence_at_trigger', confidence_at_trigger,
      'led_to_behavior_change', led_to_behavior_change,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  INTO v_recent_interventions
  FROM interventions
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '14 days'
  LIMIT 10;

  -- Get recent wins (last 30 days)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'win_type', win_type,
      'behavior_type', behavior_type,
      'title', title,
      'metric_name', metric_name,
      'metric_value', metric_value,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  INTO v_recent_wins
  FROM behavioral_wins
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
  LIMIT 10;

  -- Build result
  v_result := jsonb_build_object(
    'has_profile', true,
    'confidence_scores', jsonb_build_object(
      'small_recurring', v_profile.confidence_small_recurring,
      'stress_spending', v_profile.confidence_stress_spending,
      'end_of_month', v_profile.confidence_end_of_month
    ),
    'active_behavior', v_profile.active_behavior,
    'active_behavior_intensity', v_profile.active_behavior_intensity,
    'interventions_today', v_profile.interventions_today,
    'interventions_this_week', v_profile.interventions_this_week,
    'last_intervention_at', v_profile.last_intervention_at,
    'recent_signals', v_recent_signals,
    'recent_interventions', v_recent_interventions,
    'recent_wins', v_recent_wins,
    'total_wins', v_profile.total_wins,
    'win_streak', v_profile.current_win_streak,
    'pattern_history', v_profile.pattern_history,
    'behavior_notes', v_profile.behavior_notes
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update behavior confidence score with smoothing
CREATE OR REPLACE FUNCTION update_behavior_confidence(
  p_user_id UUID,
  p_behavior_type behavior_type,
  p_new_confidence DECIMAL(4,3),
  p_intensity DECIMAL(4,3) DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_current_confidence DECIMAL(4,3);
  v_smoothed_confidence DECIMAL(4,3);
  v_smoothing_factor DECIMAL(4,3) := 0.3; -- 30% new, 70% old
BEGIN
  -- Ensure profile exists
  INSERT INTO user_behavioral_profile (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current confidence
  EXECUTE format(
    'SELECT confidence_%s FROM user_behavioral_profile WHERE user_id = $1',
    p_behavior_type
  ) INTO v_current_confidence USING p_user_id;

  -- Apply exponential smoothing to prevent sudden jumps
  v_smoothed_confidence := (v_smoothing_factor * p_new_confidence) + ((1 - v_smoothing_factor) * v_current_confidence);

  -- Clamp to valid range
  v_smoothed_confidence := GREATEST(0.000, LEAST(1.000, v_smoothed_confidence));

  -- Update the specific confidence column
  EXECUTE format(
    'UPDATE user_behavioral_profile SET confidence_%s = $1, updated_at = NOW() WHERE user_id = $2',
    p_behavior_type
  ) USING v_smoothed_confidence, p_user_id;

  -- Update active behavior if this is now the highest
  PERFORM update_active_behavior(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update active behavior based on confidence thresholds
CREATE OR REPLACE FUNCTION update_active_behavior(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_profile user_behavioral_profile%ROWTYPE;
  v_max_confidence DECIMAL(4,3);
  v_new_active behavior_type;
  v_threshold DECIMAL(4,3) := 0.500; -- 50% confidence threshold (lowered from 60%)
BEGIN
  SELECT * INTO v_profile
  FROM user_behavioral_profile
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Find highest confidence above threshold
  v_max_confidence := GREATEST(
    v_profile.confidence_small_recurring,
    v_profile.confidence_stress_spending,
    v_profile.confidence_end_of_month
  );

  IF v_max_confidence < v_threshold THEN
    -- No behavior above threshold
    UPDATE user_behavioral_profile
    SET active_behavior = NULL,
        active_behavior_intensity = 0.000,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Determine which behavior is active
  IF v_profile.confidence_small_recurring = v_max_confidence THEN
    v_new_active := 'small_recurring';
  ELSIF v_profile.confidence_stress_spending = v_max_confidence THEN
    v_new_active := 'stress_spending';
  ELSE
    v_new_active := 'end_of_month';
  END IF;

  -- Update active behavior
  UPDATE user_behavioral_profile
  SET active_behavior = v_new_active,
      active_behavior_intensity = v_max_confidence,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record an intervention and update counters
CREATE OR REPLACE FUNCTION record_intervention(
  p_user_id UUID,
  p_behavior_type behavior_type,
  p_intervention_type intervention_type,
  p_message_key TEXT,
  p_message_content TEXT,
  p_trigger_event TEXT,
  p_confidence DECIMAL(4,3),
  p_transaction_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_intervention_id UUID;
BEGIN
  -- Insert intervention record
  INSERT INTO interventions (
    user_id, behavior_type, intervention_type,
    message_key, message_content, trigger_event,
    trigger_transaction_id, confidence_at_trigger, user_response
  )
  VALUES (
    p_user_id, p_behavior_type, p_intervention_type,
    p_message_key, p_message_content, p_trigger_event,
    p_transaction_id, p_confidence, 'pending'
  )
  RETURNING id INTO v_intervention_id;

  -- Update profile counters
  UPDATE user_behavioral_profile
  SET interventions_today = interventions_today + 1,
      interventions_this_week = interventions_this_week + 1,
      last_intervention_at = NOW(),
      last_intervention_type = p_intervention_type,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record a behavioral win
CREATE OR REPLACE FUNCTION record_behavioral_win(
  p_user_id UUID,
  p_win_type win_type,
  p_behavior_type behavior_type,
  p_title TEXT,
  p_description TEXT,
  p_metric_name TEXT DEFAULT NULL,
  p_metric_value DECIMAL(14,2) DEFAULT NULL,
  p_metric_previous DECIMAL(14,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_win_id UUID;
BEGIN
  -- Insert win record
  INSERT INTO behavioral_wins (
    user_id, win_type, behavior_type,
    title, description, metric_name,
    metric_value, metric_previous
  )
  VALUES (
    p_user_id, p_win_type, p_behavior_type,
    p_title, p_description, p_metric_name,
    p_metric_value, p_metric_previous
  )
  RETURNING id INTO v_win_id;

  -- Update profile win counters
  UPDATE user_behavioral_profile
  SET total_wins = total_wins + 1,
      current_win_streak = current_win_streak + 1,
      longest_win_streak = GREATEST(longest_win_streak, current_win_streak + 1),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_win_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily/weekly intervention counters (called by cron)
CREATE OR REPLACE FUNCTION reset_intervention_counters()
RETURNS void AS $$
BEGIN
  -- Reset daily counter at midnight
  UPDATE user_behavioral_profile
  SET interventions_today = 0,
      updated_at = NOW()
  WHERE interventions_today > 0;

  -- Reset weekly counter on Monday
  IF EXTRACT(DOW FROM NOW()) = 1 THEN
    UPDATE user_behavioral_profile
    SET interventions_this_week = 0,
        updated_at = NOW()
    WHERE interventions_this_week > 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get intervention eligibility (checks cooldowns and limits)
CREATE OR REPLACE FUNCTION can_show_intervention(
  p_user_id UUID,
  p_behavior_type behavior_type DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_profile user_behavioral_profile%ROWTYPE;
  v_last_intervention_minutes INTEGER;
  v_can_show BOOLEAN := true;
  v_reason TEXT := 'eligible';
BEGIN
  SELECT * INTO v_profile
  FROM user_behavioral_profile
  WHERE user_id = p_user_id;

  -- No profile = can show (will create profile)
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_show', true, 'reason', 'new_user');
  END IF;

  -- Check daily limit (max 3)
  IF v_profile.interventions_today >= 3 THEN
    RETURN jsonb_build_object('can_show', false, 'reason', 'daily_limit_reached');
  END IF;

  -- Check weekly limit (max 10)
  IF v_profile.interventions_this_week >= 10 THEN
    RETURN jsonb_build_object('can_show', false, 'reason', 'weekly_limit_reached');
  END IF;

  -- Check cooldown (minimum 2 hours between interventions)
  IF v_profile.last_intervention_at IS NOT NULL THEN
    v_last_intervention_minutes := EXTRACT(EPOCH FROM (NOW() - v_profile.last_intervention_at)) / 60;
    IF v_last_intervention_minutes < 120 THEN
      RETURN jsonb_build_object(
        'can_show', false,
        'reason', 'cooldown_active',
        'minutes_remaining', 120 - v_last_intervention_minutes
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('can_show', true, 'reason', 'eligible');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger for behavioral profile
CREATE TRIGGER trigger_behavioral_profile_updated_at
  BEFORE UPDATE ON user_behavioral_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create behavioral profile for new users
CREATE OR REPLACE FUNCTION create_user_behavioral_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_behavioral_profile (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_behavioral_profile
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_behavioral_profile();

-- ============================================
-- VIEWS (for analytics)
-- ============================================

-- Active behaviors summary
CREATE OR REPLACE VIEW v_active_behaviors AS
SELECT
  active_behavior,
  COUNT(*) as user_count,
  AVG(active_behavior_intensity) as avg_intensity,
  AVG(total_wins) as avg_wins,
  AVG(current_win_streak) as avg_streak
FROM user_behavioral_profile
WHERE active_behavior IS NOT NULL
GROUP BY active_behavior;

-- Intervention effectiveness
CREATE OR REPLACE VIEW v_intervention_effectiveness AS
SELECT
  behavior_type,
  intervention_type,
  COUNT(*) as total_interventions,
  COUNT(CASE WHEN user_response = 'engaged' THEN 1 END) as engaged_count,
  COUNT(CASE WHEN user_response = 'acknowledged' THEN 1 END) as acknowledged_count,
  COUNT(CASE WHEN user_response = 'dismissed' THEN 1 END) as dismissed_count,
  COUNT(CASE WHEN led_to_behavior_change = true THEN 1 END) as behavior_change_count,
  ROUND(
    COUNT(CASE WHEN user_response = 'engaged' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as engagement_rate
FROM interventions
GROUP BY behavior_type, intervention_type;

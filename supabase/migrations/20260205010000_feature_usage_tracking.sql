-- Feature Usage Tracking for Server-Side Verification
-- This table tracks feature usage per user per period for server-side entitlement verification

-- Create feature_usage table
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('hour', 'day', 'month')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one record per user/feature/period
  CONSTRAINT unique_user_feature_period UNIQUE (user_id, feature_name, period_start)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON feature_usage(period_start);
CREATE INDEX IF NOT EXISTS idx_feature_usage_lookup ON feature_usage(user_id, feature_name, period_start);

-- Enable RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage
CREATE POLICY "Users can read own usage"
  ON feature_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage (for client-side sync)
CREATE POLICY "Users can insert own usage"
  ON feature_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage"
  ON feature_usage
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to increment usage (atomic upsert)
-- Uses auth.uid() to get user ID from JWT context
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_feature_name TEXT,
  p_period_type TEXT DEFAULT 'month'
)
RETURNS TABLE(new_count INTEGER, period_start TIMESTAMPTZ) AS $$
DECLARE
  v_user_id UUID;
  v_period_start TIMESTAMPTZ;
  v_new_count INTEGER;
BEGIN
  -- Get user ID from auth context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate period start based on period type
  CASE p_period_type
    WHEN 'hour' THEN
      v_period_start := date_trunc('hour', NOW());
    WHEN 'day' THEN
      v_period_start := date_trunc('day', NOW());
    WHEN 'month' THEN
      v_period_start := date_trunc('month', NOW());
    ELSE
      v_period_start := date_trunc('month', NOW());
  END CASE;

  -- Atomic upsert with increment
  INSERT INTO feature_usage (user_id, feature_name, usage_count, period_start, period_type)
  VALUES (v_user_id, p_feature_name, 1, v_period_start, p_period_type)
  ON CONFLICT (user_id, feature_name, period_start)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    updated_at = NOW()
  RETURNING feature_usage.usage_count, feature_usage.period_start
  INTO v_new_count, v_period_start;

  RETURN QUERY SELECT v_new_count, v_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage for a feature
-- Uses auth.uid() to get user ID from JWT context
CREATE OR REPLACE FUNCTION get_feature_usage(
  p_feature_name TEXT,
  p_period_type TEXT DEFAULT 'month'
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_period_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Get user ID from auth context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate period start based on period type
  CASE p_period_type
    WHEN 'hour' THEN
      v_period_start := date_trunc('hour', NOW());
    WHEN 'day' THEN
      v_period_start := date_trunc('day', NOW());
    WHEN 'month' THEN
      v_period_start := date_trunc('month', NOW());
    ELSE
      v_period_start := date_trunc('month', NOW());
  END CASE;

  SELECT usage_count INTO v_count
  FROM feature_usage
  WHERE user_id = v_user_id
    AND feature_name = p_feature_name
    AND feature_usage.period_start = v_period_start;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_usage TO authenticated;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_feature_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_usage_updated_at
  BEFORE UPDATE ON feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_usage_updated_at();

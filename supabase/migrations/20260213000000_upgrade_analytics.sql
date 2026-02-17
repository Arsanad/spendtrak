-- Contextual Upgrade Engine - Analytics table
-- Tracks friction detection, prompt impressions, dismissals, and conversions

CREATE TABLE IF NOT EXISTS public.upgrade_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  friction_type TEXT,
  prompt_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_upgrade_analytics_user_id
  ON public.upgrade_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_upgrade_analytics_event_type
  ON public.upgrade_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_upgrade_analytics_created_at
  ON public.upgrade_analytics(created_at);

-- RLS: Users can only insert and read their own rows
ALTER TABLE public.upgrade_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own upgrade analytics"
  ON public.upgrade_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own upgrade analytics"
  ON public.upgrade_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

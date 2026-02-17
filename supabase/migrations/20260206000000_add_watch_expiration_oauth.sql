-- Add watch_expiration column to email_connections_oauth
-- Gmail push notification watches expire after 7 days.
-- This column tracks when the watch expires so the gmail-watch-renew
-- cron function can renew it before it lapses.

-- Create the table if it doesn't exist yet (idempotent)
CREATE TABLE IF NOT EXISTS email_connections_oauth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gmail',
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  last_history_id TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  watch_expiration TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Add watch_expiration column if table already exists but column is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_connections_oauth'
    AND column_name = 'watch_expiration'
  ) THEN
    ALTER TABLE email_connections_oauth
      ADD COLUMN watch_expiration TIMESTAMPTZ;
  END IF;
END$$;

-- Create the processed_emails_oauth table if it doesn't exist
CREATE TABLE IF NOT EXISTS processed_emails_oauth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_connection_id UUID REFERENCES email_connections_oauth(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  email_subject TEXT,
  email_from TEXT,
  email_date TIMESTAMPTZ,
  was_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_message_id)
);

-- RLS policies
ALTER TABLE email_connections_oauth ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_emails_oauth ENABLE ROW LEVEL SECURITY;

-- Users can only read their own connections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_connections_oauth'
    AND policyname = 'Users can view own oauth connections'
  ) THEN
    CREATE POLICY "Users can view own oauth connections"
      ON email_connections_oauth FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_connections_oauth'
    AND policyname = 'Users can delete own oauth connections'
  ) THEN
    CREATE POLICY "Users can delete own oauth connections"
      ON email_connections_oauth FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Index for the watch renewal cron query
CREATE INDEX IF NOT EXISTS idx_oauth_watch_expiration
  ON email_connections_oauth (provider, watch_expiration)
  WHERE provider = 'gmail';

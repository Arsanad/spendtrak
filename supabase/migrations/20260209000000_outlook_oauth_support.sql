-- Add Outlook/Microsoft Graph support to email OAuth tables
-- Microsoft Graph subscriptions require storing a subscription_id for renewal

-- Add subscription_id column for Microsoft Graph webhook subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_connections_oauth'
    AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE email_connections_oauth
      ADD COLUMN subscription_id TEXT;
  END IF;
END$$;

-- Add email_body column to processed_emails_oauth if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processed_emails_oauth'
    AND column_name = 'email_body'
  ) THEN
    ALTER TABLE processed_emails_oauth
      ADD COLUMN email_body TEXT;
  END IF;
END$$;

-- Add gemini_response column to processed_emails_oauth if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processed_emails_oauth'
    AND column_name = 'gemini_response'
  ) THEN
    ALTER TABLE processed_emails_oauth
      ADD COLUMN gemini_response JSONB;
  END IF;
END$$;

-- Index for Outlook watch renewal cron query
CREATE INDEX IF NOT EXISTS idx_oauth_watch_expiration_outlook
  ON email_connections_oauth (provider, watch_expiration)
  WHERE provider = 'outlook';

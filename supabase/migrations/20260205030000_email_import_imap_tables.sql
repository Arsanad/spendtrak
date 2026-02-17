-- ============================================
-- EMAIL IMPORT FEATURE - DATABASE SCHEMA (IMAP-based)
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: email_connections_imap
-- Stores user's connected email accounts via IMAP
-- ============================================
CREATE TABLE IF NOT EXISTS email_connections_imap (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'icloud', 'outlook', 'yahoo', 'other')),
  email TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  custom_imap_host TEXT,
  custom_imap_port INTEGER DEFAULT 993,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'pending', 'partial')),
  last_sync_error TEXT,
  receipts_imported INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE email_connections_imap ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_connections_imap
DROP POLICY IF EXISTS "Users can view own email connections imap" ON email_connections_imap;
CREATE POLICY "Users can view own email connections imap" ON email_connections_imap
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email connections imap" ON email_connections_imap;
CREATE POLICY "Users can insert own email connections imap" ON email_connections_imap
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email connections imap" ON email_connections_imap;
CREATE POLICY "Users can update own email connections imap" ON email_connections_imap
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own email connections imap" ON email_connections_imap;
CREATE POLICY "Users can delete own email connections imap" ON email_connections_imap
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_connections_imap_user ON email_connections_imap(user_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_imap_active ON email_connections_imap(is_active) WHERE is_active = true;

-- ============================================
-- TABLE: processed_emails_imap
-- Tracks which emails have been processed to avoid duplicates
-- ============================================
CREATE TABLE IF NOT EXISTS processed_emails_imap (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_connection_id UUID REFERENCES email_connections_imap(id) ON DELETE CASCADE,
  email_message_id TEXT NOT NULL,
  email_subject TEXT,
  email_from TEXT,
  email_date TIMESTAMP WITH TIME ZONE,
  was_receipt BOOLEAN DEFAULT false,
  transaction_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, email_message_id)
);

-- Enable RLS
ALTER TABLE processed_emails_imap ENABLE ROW LEVEL SECURITY;

-- RLS Policies for processed_emails_imap
DROP POLICY IF EXISTS "Users can view own processed emails imap" ON processed_emails_imap;
CREATE POLICY "Users can view own processed emails imap" ON processed_emails_imap
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own processed emails imap" ON processed_emails_imap;
CREATE POLICY "Users can insert own processed emails imap" ON processed_emails_imap
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_emails_imap_user ON processed_emails_imap(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_emails_imap_message_id ON processed_emails_imap(email_message_id);

-- ============================================
-- ADD COLUMNS TO EXISTING TRANSACTIONS TABLE
-- These might already exist from previous migrations
-- ============================================
DO $$
BEGIN
  -- Add source column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'source') THEN
    ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;

  -- Add source_email column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'source_email') THEN
    ALTER TABLE transactions ADD COLUMN source_email TEXT;
  END IF;

  -- Add merchant column if not exists (might be merchant_name instead)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'merchant') THEN
    -- Only add if merchant_name doesn't exist either
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'transactions' AND column_name = 'merchant_name') THEN
      ALTER TABLE transactions ADD COLUMN merchant TEXT;
    END IF;
  END IF;
END $$;

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for email_connections_imap
DROP TRIGGER IF EXISTS update_email_connections_imap_updated_at ON email_connections_imap;
CREATE TRIGGER update_email_connections_imap_updated_at
  BEFORE UPDATE ON email_connections_imap
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT SERVICE ROLE ACCESS FOR EDGE FUNCTIONS
-- ============================================
GRANT ALL ON email_connections_imap TO service_role;
GRANT ALL ON processed_emails_imap TO service_role;

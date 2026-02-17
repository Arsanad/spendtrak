-- Onboarding profile columns
-- Stores financial snapshot data collected during the post-auth personalization tunnel
-- All nullable — doesn't break existing users

ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS income_frequency TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_situation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pain_points TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS tracking_preference TEXT DEFAULT 'manual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

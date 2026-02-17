-- ============================================
-- Fix user_subscriptions table - add unique constraint on user_id
-- Required for upsert operations in the purchases service
-- ============================================

-- Add unique constraint on user_id
-- Each user should only have one subscription record
ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

-- Note: The existing index idx_user_subscriptions_user will be replaced by the unique constraint index
-- We can optionally drop the old non-unique index since unique constraint creates its own index
DROP INDEX IF EXISTS idx_user_subscriptions_user;

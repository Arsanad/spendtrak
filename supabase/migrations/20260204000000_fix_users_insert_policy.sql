-- ============================================
-- FIX: Add INSERT policy for users table
--
-- The users table had RLS enabled but was missing
-- an INSERT policy. This prevented new users from
-- creating their profile record after OAuth sign-in.
-- ============================================

-- Add INSERT policy for users table
-- Users can insert their own profile record (id must match auth.uid())
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Also add DELETE policy in case it's needed later
CREATE POLICY "Users can delete own profile" ON public.users
    FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- PROFILE UPDATE FIX
-- Run this in Supabase SQL Editor to fix onboarding
-- =====================================================

-- Allow users to INSERT their own profile (for new users)
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Allow users to UPDATE their own profile
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Allow users to SELECT their own profile (redundant but ensures it exists)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
    USING (id = auth.uid());

-- Keep public read for freelancer profiles (for job board)
DROP POLICY IF EXISTS "freelancer_profiles_select_all" ON freelancer_profiles;
CREATE POLICY "freelancer_profiles_select_public" ON freelancer_profiles FOR SELECT
    USING (true);

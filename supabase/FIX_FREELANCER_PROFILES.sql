-- =====================================================
-- FREELANCER PROFILE UPDATE FIX  
-- Run this in Supabase SQL Editor
-- =====================================================

-- Allow users to INSERT their own freelancer profile
CREATE POLICY "freelancer_profiles_insert_own" ON freelancer_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Allow users to UPDATE their own freelancer profile
CREATE POLICY "freelancer_profiles_update_own" ON freelancer_profiles FOR UPDATE
    USING (id = auth.uid());

-- =====================================================
-- PROFILES SECURITY FIX
-- Run in Supabase SQL Editor
-- =====================================================

-- Remove the dangerous public profiles policy
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;

-- Keep: profiles_select_own (owner can see own)
-- Keep: admin_select_all_profiles (admin can see all)

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

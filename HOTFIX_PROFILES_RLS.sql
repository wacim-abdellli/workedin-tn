-- HOTFIX: Fix profiles RLS policy for updates
-- The profile was created by the trigger (SECURITY DEFINER)
-- But user needs to be able to UPDATE it

-- First, check if profile exists for this user
-- SELECT * FROM profiles WHERE id = '3af3e5f2-9039-4386-8765-2441cd50ba73';

-- Fix: Recreate profiles policies with correct logic
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Anyone can view profiles
CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (true);

-- Users can insert their own profile (matching their auth.uid)
CREATE POLICY "profiles_insert" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Also fix freelancer_profiles policies
DROP POLICY IF EXISTS "Freelancer profiles viewable" ON freelancer_profiles;
DROP POLICY IF EXISTS "Freelancers can insert own" ON freelancer_profiles;
DROP POLICY IF EXISTS "Freelancers can update own" ON freelancer_profiles;

CREATE POLICY "freelancer_profiles_select" ON freelancer_profiles
FOR SELECT USING (true);

CREATE POLICY "freelancer_profiles_insert" ON freelancer_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "freelancer_profiles_update" ON freelancer_profiles
FOR UPDATE USING (auth.uid() = id);

-- Verify with:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'freelancer_profiles';

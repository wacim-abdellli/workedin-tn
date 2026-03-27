-- ============================================
-- COMPLETE DIAGNOSTIC - Check Everything
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check your user in auth.users
SELECT 
  '1️⃣ Your auth.users record' as step,
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'wacimabdelli01@gmail.com';

-- 2. Check your profile
SELECT 
  '2️⃣ Your profile record' as step,
  id,
  email,
  full_name,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'wacimabdelli01@gmail.com';

-- 3. Check if auth.uid() matches your profile
SELECT 
  '3️⃣ Does auth.uid() match?' as step,
  auth.uid() as current_session_user_id,
  (SELECT id FROM public.profiles WHERE email = 'wacimabdelli01@gmail.com') as your_profile_id,
  CASE 
    WHEN auth.uid() = (SELECT id FROM public.profiles WHERE email = 'wacimabdelli01@gmail.com') 
    THEN '✅ MATCH - Session is correct'
    ELSE '❌ MISMATCH - You are logged in as a different user!'
  END as status;

-- 4. Check is_admin() function
SELECT 
  '4️⃣ is_admin() function result' as step,
  public.is_admin() as is_admin_result,
  CASE 
    WHEN public.is_admin() = true 
    THEN '✅ Function returns TRUE'
    ELSE '❌ Function returns FALSE - This is the problem!'
  END as status;

-- 5. List ALL RLS policies on profiles table
SELECT 
  '5️⃣ RLS policies on profiles' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Check if RLS is enabled
SELECT 
  '6️⃣ RLS status' as step,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'jobs', 'contracts', 'proposals', 'identity_verifications', 'wallets', 'disputes')
ORDER BY tablename;

-- 7. Try to count records (this will fail if RLS blocks you)
SELECT 
  '7️⃣ Can you count profiles?' as step,
  COUNT(*) as total_profiles
FROM public.profiles;

SELECT 
  '7️⃣ Can you count jobs?' as step,
  COUNT(*) as total_jobs
FROM public.jobs;

SELECT 
  '7️⃣ Can you count contracts?' as step,
  COUNT(*) as total_contracts
FROM public.contracts;

-- 8. Check for conflicting policies
SELECT 
  '8️⃣ All policies that might affect admin' as step,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '🔵 Admin policy'
    WHEN qual LIKE '%is_admin%' THEN '🔵 Uses is_admin'
    ELSE '⚪ Regular policy'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
AND (
  policyname LIKE '%admin%' 
  OR qual LIKE '%is_admin%'
  OR with_check LIKE '%is_admin%'
)
ORDER BY tablename, policyname;

-- 9. Final verdict
SELECT 
  '9️⃣ FINAL VERDICT' as step,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT LOGGED IN - You need to log in first!'
    WHEN auth.uid() != (SELECT id FROM public.profiles WHERE email = 'wacimabdelli01@gmail.com') THEN '❌ WRONG USER - You are logged in as someone else!'
    WHEN NOT public.is_admin() THEN '❌ NOT ADMIN - is_admin() returns false'
    WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN '❌ RLS BLOCKING - Policies are preventing access'
    ELSE '✅ EVERYTHING LOOKS GOOD - The problem is elsewhere'
  END as diagnosis;

-- ============================================================
-- ADMIN STATUS DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to check your admin status
-- ============================================================

-- 1. Check if is_admin() function exists
SELECT 
  'is_admin() function exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_admin'
    ) THEN '✅ YES'
    ELSE '❌ NO - Run FIX_ADMIN_RLS.sql first!'
  END as status;

-- 2. Check your current session info
SELECT 
  'Your session info' as check_name,
  auth.uid() as user_id,
  auth.email() as email,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT LOGGED IN'
    ELSE '✅ Logged in'
  END as login_status;

-- 3. Check if you're admin in the database
SELECT 
  'Database admin status' as check_name,
  id,
  email,
  full_name,
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ Admin in database'
    ELSE '❌ NOT admin in database - Update profiles table!'
  END as status
FROM profiles 
WHERE id = auth.uid();

-- 4. Check if is_admin() function returns true
SELECT 
  'is_admin() function result' as check_name,
  is_admin() as result,
  CASE 
    WHEN is_admin() = true THEN '✅ Function returns TRUE'
    ELSE '❌ Function returns FALSE - Session needs refresh!'
  END as status;

-- 5. Check RLS policies on profiles table
SELECT 
  'RLS policies on profiles' as check_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Policies exist'
    ELSE '❌ Missing policies - Run FIX_ADMIN_RLS.sql!'
  END as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. List all policies on profiles
SELECT 
  'Policy: ' || policyname as policy_name,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. Test if you can read profiles table
SELECT 
  'Can read profiles table' as check_name,
  COUNT(*) as profiles_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can read profiles'
    ELSE '❌ Cannot read profiles - RLS blocking!'
  END as status
FROM profiles;

-- 8. Test if you can read jobs table
SELECT 
  'Can read jobs table' as check_name,
  COUNT(*) as jobs_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Can read jobs'
    ELSE '❌ Cannot read jobs - RLS blocking!'
  END as status
FROM jobs;

-- 9. Test if you can read identity_verifications table
SELECT 
  'Can read identity_verifications' as check_name,
  COUNT(*) as verifications_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Can read verifications'
    ELSE '❌ Cannot read verifications - RLS blocking!'
  END as status
FROM identity_verifications;

-- 10. Test if you can read disputes table
SELECT 
  'Can read disputes table' as check_name,
  COUNT(*) as disputes_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Can read disputes'
    ELSE '❌ Cannot read disputes - RLS blocking!'
  END as status
FROM disputes;

-- ============================================================
-- SUMMARY
-- ============================================================

SELECT 
  '=== SUMMARY ===' as section,
  '' as details
UNION ALL
SELECT 
  'If all checks show ✅' as section,
  'Your admin setup is complete! Just refresh your browser session.' as details
UNION ALL
SELECT 
  'If is_admin() returns FALSE' as section,
  'Your JWT token is stale. Sign out and sign back in.' as details
UNION ALL
SELECT 
  'If database shows is_admin = false' as section,
  'Run: UPDATE profiles SET is_admin = true WHERE id = auth.uid();' as details
UNION ALL
SELECT 
  'If policies are missing' as section,
  'Run the complete FIX_ADMIN_RLS.sql script.' as details;

-- ============================================================
-- QUICK FIX: Make yourself admin (if needed)
-- ============================================================

-- Uncomment and run this if you're not admin in the database:
-- UPDATE profiles SET is_admin = true WHERE id = auth.uid();

-- Then verify:
-- SELECT id, email, is_admin FROM profiles WHERE id = auth.uid();

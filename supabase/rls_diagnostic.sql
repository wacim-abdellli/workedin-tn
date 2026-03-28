-- ============================================
-- RLS POLICY DIAGNOSTIC QUERY
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check RLS status on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Count policies per table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Tables without RLS (potential security issue)
SELECT 
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
    AND rowsecurity = false
ORDER BY tablename;

-- 4. Check if anon can read public data
-- Test: Should return jobs for anonymous users
-- SELECT COUNT(*) FROM jobs WHERE status = 'open' LIMIT 1;

-- 5. Test authenticated access
-- Test: Can authenticated user insert/update their profile?
-- SELECT COUNT(*) FROM profiles WHERE id = auth.uid() LIMIT 1;

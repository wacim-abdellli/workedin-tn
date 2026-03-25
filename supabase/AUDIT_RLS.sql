-- =====================================================
-- RLS AUDIT — Run in Supabase SQL Editor
-- All tables must show: rls_enabled = true
-- =====================================================

SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE WHEN rowsecurity THEN '✅ Protected' ELSE '❌ EXPOSED — no RLS!' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, tablename;

-- =====================================================
-- Show all active policies per table
-- =====================================================

SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operation,
    qual AS using_expr,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- =====================================================
-- Check for tables with RLS enabled but ZERO policies
-- (these would block ALL access — a common mistake)
-- =====================================================

SELECT
    t.tablename,
    'RLS ON but 0 policies — ALL access blocked!' AS warning
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.tablename
  );

-- ============================================================
-- OPTIMIZED RLS POLICIES
-- This version caches the is_admin check to avoid repeated queries
-- ============================================================

-- Drop and recreate the is_admin function with better performance
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE  -- This allows PostgreSQL to cache the result within a transaction
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Verify it works
SELECT is_admin() as am_i_admin;

-- Test query performance
EXPLAIN ANALYZE
SELECT id, email, full_name, is_admin
FROM profiles
ORDER BY created_at DESC
LIMIT 100;

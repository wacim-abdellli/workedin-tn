-- =====================================================
-- VERIFY RLS POLICIES (CORRECTED)
-- Run in Supabase SQL Editor
-- =====================================================

SELECT
    tablename,
    policyname,
    cmd AS operation,
    CASE 
        -- These ARE secure (owner/admin only)
        WHEN policyname LIKE '%own%' OR policyname LIKE '%parties%' THEN '✅ SECURE'
        -- Admin policies - secure
        WHEN policyname LIKE 'admin_%' THEN '✅ ADMIN'
        -- Public - only OK for jobs, portfolio, reviews
        WHEN policyname LIKE '%public%' OR policyname LIKE '%select_all%' THEN 
            CASE 
                WHEN tablename IN ('jobs', 'portfolio_items', 'reviews') THEN '✅ INTENTIONAL'
                ELSE '❌ PUBLIC!'
            END
        ELSE 'ℹ️ OTHER'
    END AS status
FROM pg_policies
WHERE schemaname = 'public'
    AND cmd = 'SELECT'
ORDER BY tablename;

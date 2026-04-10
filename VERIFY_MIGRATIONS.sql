-- Verification Script: Run this in Supabase SQL Editor to verify all migrations applied correctly

-- ============================================
-- 1. Check Avatar Columns Exist
-- ============================================
SELECT 
    'Avatar Columns' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing columns'
    END as status,
    string_agg(column_name, ', ') as columns_found
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'profiles' 
  AND column_name IN ('avatar_url_client', 'avatar_url_freelancer')
GROUP BY check_name;

-- ============================================
-- 2. Check Conversation Scope Column Exists
-- ============================================
SELECT 
    'Conversation Scope Column' as check_name,
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing column'
    END as status,
    column_name as column_found
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'conversations' 
  AND column_name = 'conversation_scope';

-- ============================================
-- 3. Check Conversation Scope Constraint
-- ============================================
SELECT 
    'Conversation Scope Constraint' as check_name,
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing constraint'
    END as status,
    conname as constraint_name
FROM pg_constraint 
WHERE conname = 'conversations_scope_check';

-- ============================================
-- 4. Check Unique Indexes Exist
-- ============================================
SELECT 
    'Unique Indexes' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing indexes'
    END as status,
    string_agg(indexname, ', ') as indexes_found
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename = 'conversations'
  AND indexname IN ('uq_conversations_pair_scope_no_contract', 'uq_conversations_pair_scope_contract')
GROUP BY check_name;

-- ============================================
-- 5. Check Performance Indexes Exist
-- ============================================
SELECT 
    'Performance Indexes' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing indexes'
    END as status,
    string_agg(indexname, ', ') as indexes_found
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename = 'conversations'
  AND indexname IN ('idx_conversations_participant1_scope_activity', 'idx_conversations_participant2_scope_activity')
GROUP BY check_name;

-- ============================================
-- 6. Check get_or_create_conversation Functions
-- ============================================
SELECT 
    'get_or_create_conversation Functions' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing functions'
    END as status,
    COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'get_or_create_conversation'
GROUP BY check_name;

-- ============================================
-- 7. Check Onboarding Profile Fields (Profiles)
-- ============================================
SELECT 
    'Client Onboarding Fields' as check_name,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing fields'
    END as status,
    COUNT(*) as fields_found
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'profiles' 
  AND column_name IN (
    'company_name', 'company_website', 'company_industry', 'company_size',
    'company_role', 'hiring_needs', 'project_budget_preference', 
    'project_timeline_preference', 'communication_preferences', 
    'screening_preferences', 'legal_preferences'
  )
GROUP BY check_name;

-- ============================================
-- 8. Check Freelancer Profile Fields
-- ============================================
SELECT 
    'Freelancer Onboarding Fields' as check_name,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing fields'
    END as status,
    COUNT(*) as fields_found
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'freelancer_profiles' 
  AND column_name IN (
    'years_experience', 'tools', 'industries', 'portfolio_links',
    'weekly_availability_hours', 'revision_policy', 'project_preferences'
  )
GROUP BY check_name;

-- ============================================
-- 9. Check set_user_account_status Function
-- ============================================
SELECT 
    'set_user_account_status Function' as check_name,
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing function'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'set_user_account_status'
GROUP BY check_name;

-- ============================================
-- 10. Sample Data Check - Conversation Scopes
-- ============================================
SELECT 
    'Conversation Scope Distribution' as check_name,
    conversation_scope,
    COUNT(*) as count
FROM public.conversations
GROUP BY conversation_scope
ORDER BY count DESC;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
    '=== MIGRATION VERIFICATION COMPLETE ===' as summary,
    'All checks above should show ✓ PASS' as expected_result;

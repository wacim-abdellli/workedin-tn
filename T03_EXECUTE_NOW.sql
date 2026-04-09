-- ============================================================================
-- T03: HIDE TEST JOBS FROM PRODUCTION
-- ============================================================================
-- Date: 2026-04-09
-- Orchestrator: Kiro
-- Execution: Copy this entire file and paste into Supabase SQL Editor
-- ============================================================================

-- STEP 1: Preview what will be affected (SAFE - read-only)
-- ============================================================================
SELECT 
  id,
  title,
  status,
  visibility,
  created_at,
  client_id
FROM jobs 
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%'
ORDER BY created_at DESC;

-- Expected: 4-6 jobs with titles like "Smoke Test Job", "Test Job", etc.
-- Review these results before proceeding to STEP 2


-- ============================================================================
-- STEP 2: Hide test jobs from public view (RECOMMENDED)
-- ============================================================================
-- This sets visibility to 'invite_only' so jobs are hidden from /jobs page
-- but preserved in database for debugging/audit trail

UPDATE jobs 
SET 
  visibility = 'invite_only',
  updated_at = NOW()
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%';

-- Expected output: "UPDATE X" where X is the number of jobs affected


-- ============================================================================
-- STEP 3: Verify the update worked (SAFE - read-only)
-- ============================================================================
SELECT 
  COUNT(*) as hidden_jobs_count,
  'invite_only' as visibility_status
FROM jobs 
WHERE 
  visibility = 'invite_only'
  AND (
    title ILIKE '%smoke%' 
    OR title ILIKE '%test%'
    OR description ILIKE '%test%'
  );

-- Expected: hidden_jobs_count should match the UPDATE count from STEP 2


-- ============================================================================
-- STEP 4: Verify public jobs still work (SAFE - read-only)
-- ============================================================================
-- This is what the job board query uses
SELECT 
  id,
  title,
  status,
  visibility,
  created_at
FROM jobs 
WHERE 
  visibility = 'public' 
  AND status = 'open'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Real jobs appear, NO test/smoke jobs


-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================
-- After running STEP 2, verify:
-- 
-- [ ] STEP 3 query shows correct count of hidden jobs
-- [ ] STEP 4 query shows NO test/smoke jobs
-- [ ] Visit https://khedma-tn.vercel.app/jobs
-- [ ] Confirm NO test jobs visible on production
-- [ ] Confirm real jobs still appear correctly
--
-- If everything looks good, you're done!
-- ============================================================================


-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If you accidentally hide the wrong jobs, run this:
-- (Replace the job IDs with actual IDs from STEP 1)

-- UPDATE jobs 
-- SET 
--   visibility = 'public',
--   updated_at = NOW()
-- WHERE id IN (
--   'replace-with-actual-job-id-1',
--   'replace-with-actual-job-id-2'
-- );


-- ============================================================================
-- NOTES
-- ============================================================================
-- - This approach preserves data (doesn't delete)
-- - Jobs remain in database for audit trail
-- - Can be restored if needed (see ROLLBACK above)
-- - No foreign key cascade issues
-- - Immediate effect on production /jobs page
-- ============================================================================

# 🗄️ DATABASE TASK: T03 - Remove Test Jobs from Production

**Executor**: USER (manual SQL execution)  
**Estimated time**: 5 minutes  
**Complexity**: LOW  
**Priority**: CRITICAL 🔴  
**Date**: 2026-04-09

---

## YOUR TASK

Remove test/smoke jobs from production database so they don't appear on the public `/jobs` page.

**Impact**: Affects production credibility - test data visible to real users

---

## EXECUTION STEPS

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `khedma-tn`
3. Click "SQL Editor" in left sidebar
4. Click "New query"

---

### Step 2: Inspect Affected Jobs (OPTIONAL)

Run this query to see what will be affected:

```sql
-- Preview jobs that will be hidden
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
```

**Expected results**: 4-6 jobs with titles like "Smoke Test Job", "Test Job", etc.

---

### Step 3: Hide Test Jobs (RECOMMENDED)

Run this query to hide test jobs from public view:

```sql
-- Hide test jobs from public (set to invite_only)
UPDATE jobs 
SET 
  visibility = 'invite_only',
  updated_at = NOW()
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%';

-- Return count of affected rows
SELECT COUNT(*) as hidden_jobs_count
FROM jobs 
WHERE visibility = 'invite_only'
  AND (
    title ILIKE '%smoke%' 
    OR title ILIKE '%test%'
    OR description ILIKE '%test%'
  );
```

**Why `invite_only` instead of delete?**
- Preserves data for debugging
- Can be restored if needed
- Doesn't break foreign key relationships
- Audit trail remains intact

---

### Step 4: ALTERNATIVE - Cancel Test Jobs

If you prefer to mark them as cancelled instead:

```sql
-- Cancel test jobs (keeps them in database but marks as cancelled)
UPDATE jobs 
SET 
  status = 'cancelled',
  visibility = 'invite_only',
  updated_at = NOW()
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%';
```

---

### Step 5: ALTERNATIVE - Permanent Delete (USE WITH CAUTION)

⚠️ **WARNING**: This permanently deletes data. Only use if you're certain.

```sql
-- DANGER: Permanently delete test jobs
-- This cannot be undone!
DELETE FROM jobs 
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%';

-- Verify deletion
SELECT COUNT(*) as remaining_test_jobs
FROM jobs 
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%';
```

**Expected result**: `remaining_test_jobs: 0`

---

## VERIFICATION

### 1. Check Database

Run this query to verify test jobs are hidden:

```sql
-- Verify test jobs are no longer public
SELECT 
  id,
  title,
  status,
  visibility
FROM jobs 
WHERE 
  title ILIKE '%smoke%' 
  OR title ILIKE '%test%'
  OR description ILIKE '%test%';
```

**Expected**: All jobs should have `visibility = 'invite_only'` or zero results if deleted.

### 2. Check Production Website

1. Open https://khedma-tn.vercel.app/jobs
2. Verify NO test jobs are visible
3. Check that real jobs still appear correctly

### 3. Check Job Board Query

The job board query should filter by `visibility = 'public'`:

```sql
-- This is what the job board uses
SELECT * FROM jobs 
WHERE visibility = 'public' 
  AND status = 'open'
ORDER BY created_at DESC;
```

Test jobs should NOT appear in these results.

---

## ROLLBACK (If Needed)

If you accidentally hide the wrong jobs:

```sql
-- Restore jobs to public visibility
UPDATE jobs 
SET 
  visibility = 'public',
  updated_at = NOW()
WHERE id IN (
  -- Replace with actual job IDs
  'job-id-1',
  'job-id-2'
);
```

---

## DATABASE SCHEMA REFERENCE

```sql
-- jobs table structure
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status job_status_enum DEFAULT 'open',
  visibility job_visibility_enum DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES profiles(id)
);

-- Enum values
-- status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
-- visibility: 'public' | 'invite_only'
```

---

## NOTES

- **Recommended approach**: Set `visibility = 'invite_only'` (Step 3)
- **Why not delete?**: Preserves audit trail and relationships
- **Production impact**: Immediate - jobs disappear from public view
- **Reversible**: Yes (if using invite_only approach)
- **Foreign keys**: No cascade issues with invite_only approach

---

## REPORT BACK TO ORCHESTRATOR

After execution, report:

```
T03 - Database Cleanup: COMPLETE

Method used: [invite_only / cancelled / deleted]
Jobs affected: [number]
Verification: ✅ No test jobs visible on /jobs page

SQL executed:
[paste the query you ran]

Result:
[paste the query result]
```

---

**Orchestrator**: Kiro  
**Priority**: CRITICAL 🔴  
**Blocking**: Production credibility  
**Estimated Impact**: Immediate improvement to production appearance

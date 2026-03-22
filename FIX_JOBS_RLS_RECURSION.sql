-- =====================================================
-- FIX: Infinite Recursion in Jobs Table RLS Policies
-- =====================================================
-- Error: 42P17 - "infinite recursion detected in policy for relation "jobs""
-- 
-- This happens when RLS policies on the jobs table (or related tables)
-- create a circular dependency. The fix is to drop ALL existing policies
-- on the jobs table and recreate them with simple, non-recursive logic.
--
-- RUN THIS IN YOUR SUPABASE SQL EDITOR (Dashboard > SQL Editor)
-- =====================================================

-- Step 1: Drop ALL existing policies on jobs table
-- (This ensures we remove any duplicate or conflicting policies)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'jobs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON jobs', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Recreate clean, non-recursive policies
-- SELECT: Anyone can see public jobs, clients can see their own (including private)
CREATE POLICY "jobs_select_policy" ON jobs 
    FOR SELECT 
    USING (visibility = 'public' OR client_id = auth.uid());

-- INSERT: Any authenticated user can post a job (client_id must match their auth ID)
CREATE POLICY "jobs_insert_policy" ON jobs 
    FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

-- UPDATE: Only the job owner can update
CREATE POLICY "jobs_update_policy" ON jobs 
    FOR UPDATE 
    USING (auth.uid() = client_id);

-- DELETE: Only the job owner can delete
CREATE POLICY "jobs_delete_policy" ON jobs 
    FOR DELETE 
    USING (auth.uid() = client_id);

-- Step 3: Also fix proposals policies that reference jobs
-- (These can cause indirect recursion)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'proposals'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON proposals', pol.policyname);
    END LOOP;
END $$;

-- Recreate proposals policies using security_invoker to avoid recursion
-- The key fix: use SECURITY DEFINER function to check job ownership
-- instead of direct subquery that triggers jobs RLS

-- First, create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION is_job_owner(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM jobs WHERE id = p_job_id AND client_id = auth.uid()
    );
$$;

-- Proposals: viewable by the freelancer who submitted or the job owner
CREATE POLICY "proposals_select_policy" ON proposals 
    FOR SELECT 
    USING (freelancer_id = auth.uid() OR is_job_owner(job_id));

-- Proposals: freelancers can submit
CREATE POLICY "proposals_insert_policy" ON proposals 
    FOR INSERT 
    WITH CHECK (auth.uid() = freelancer_id);

-- Proposals: parties can update (freelancer can withdraw, client can accept/reject)
CREATE POLICY "proposals_update_policy" ON proposals 
    FOR UPDATE 
    USING (freelancer_id = auth.uid() OR is_job_owner(job_id));

-- Step 4: Verify the fix
-- This should return results now instead of error
SELECT id, title, status FROM jobs LIMIT 3;

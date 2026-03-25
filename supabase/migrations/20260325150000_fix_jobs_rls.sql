-- =====================================================
-- FIX: Infinite Recursion in Jobs Table RLS Policies
-- =====================================================
-- Error: 42P17 - "infinite recursion detected in policy for relation "jobs""
-- The original proposals policies used a subquery referencing jobs,
-- which triggered jobs RLS again → infinite loop.
-- Fix: simple non-recursive policies + SECURITY DEFINER helper for proposals.
-- =====================================================

-- Step 1: Drop ALL existing policies on jobs table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'jobs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON jobs', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Recreate clean, non-recursive jobs policies

-- Anyone can read open public jobs (no auth required)
CREATE POLICY "jobs_select_public" ON jobs
    FOR SELECT
    USING (status = 'open' AND visibility = 'public');

-- Authenticated clients can also see their own jobs (any status/visibility)
CREATE POLICY "jobs_select_own" ON jobs
    FOR SELECT
    USING (auth.uid() = client_id);

-- Any authenticated user can post a job (client_id must match their auth ID)
CREATE POLICY "jobs_insert" ON jobs
    FOR INSERT
    WITH CHECK (auth.uid() = client_id);

-- Only the job owner can update
CREATE POLICY "jobs_update" ON jobs
    FOR UPDATE
    USING (auth.uid() = client_id);

-- Only the job owner can delete
CREATE POLICY "jobs_delete" ON jobs
    FOR DELETE
    USING (auth.uid() = client_id);

-- Step 3: Drop ALL existing policies on proposals table
-- (These caused indirect recursion by subquerying jobs with RLS active)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'proposals'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON proposals', pol.policyname);
    END LOOP;
END $$;

-- Step 4: SECURITY DEFINER helper — checks job ownership bypassing RLS
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

-- Step 5: Recreate proposals policies using the helper (no direct jobs subquery)
CREATE POLICY "proposals_select" ON proposals
    FOR SELECT
    USING (freelancer_id = auth.uid() OR is_job_owner(job_id));

CREATE POLICY "proposals_insert" ON proposals
    FOR INSERT
    WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "proposals_update" ON proposals
    FOR UPDATE
    USING (freelancer_id = auth.uid() OR is_job_owner(job_id));

CREATE POLICY "proposals_delete" ON proposals
    FOR DELETE
    USING (auth.uid() = freelancer_id AND status = 'pending');

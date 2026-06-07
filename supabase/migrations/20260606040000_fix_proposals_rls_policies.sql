-- =========================================================================
-- MIGRATION: Fix proposals and jobs RLS policies configuration
-- Resolves proposal visibility bug on client job listings page
-- =========================================================================

-- 1. Drop and rename the confusing mis-targeted proposals policy on jobs table to jobs_select_applied
DROP POLICY IF EXISTS "proposals_select_client" ON public.jobs;
CREATE POLICY "jobs_select_applied" ON public.jobs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.job_id = jobs.id AND proposals.freelancer_id = auth.uid()));

-- 2. Create the correct select policy for clients on the proposals table
DROP POLICY IF EXISTS "proposals_select_client" ON public.proposals;
CREATE POLICY "proposals_select_client" ON public.proposals FOR SELECT
    USING (is_job_owner(job_id));

-- 3. Re-create the update policy for proposals to allow freelancers to withdraw and clients to update status
DROP POLICY IF EXISTS "proposals_update" ON public.proposals;
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE
    USING (freelancer_id = auth.uid() OR is_job_owner(job_id));

-- 4. Re-create the delete policy for proposals to allow freelancers to delete pending proposals
DROP POLICY IF EXISTS "proposals_delete" ON public.proposals;
CREATE POLICY "proposals_delete" ON public.proposals FOR DELETE
    USING (freelancer_id = auth.uid() AND status = 'pending');

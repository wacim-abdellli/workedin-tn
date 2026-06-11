-- ============================================================================
-- SQL Script: Fix Milestones RLS Policy Scoping
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Enable RLS on public.milestones (ensuring it is active)
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on public.milestones to avoid duplicates/collisions
DROP POLICY IF EXISTS "Milestones viewable by contract parties" ON public.milestones;
DROP POLICY IF EXISTS "Clients can create milestones" ON public.milestones;
DROP POLICY IF EXISTS "Contract parties can update milestones" ON public.milestones;
DROP POLICY IF EXISTS "milestones_select_all" ON public.milestones;

-- 3. Create explicit, qualified policies to prevent Postgres scope resolution issues

-- SELECT POLICY: Contract parties can view milestones
CREATE POLICY "Milestones viewable by contract parties" 
    ON public.milestones FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c 
            WHERE c.id = milestones.contract_id 
            AND (c.freelancer_id = auth.uid() OR c.client_id = auth.uid())
        )
    );

-- INSERT POLICY: Clients can create milestones for their own contracts
CREATE POLICY "Clients can create milestones" 
    ON public.milestones FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts c 
            WHERE c.id = milestones.contract_id 
            AND c.client_id = auth.uid()
        )
    );

-- UPDATE POLICY: Involved parties can update milestone statuses/fields
CREATE POLICY "Contract parties can update milestones" 
    ON public.milestones FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c 
            WHERE c.id = milestones.contract_id 
            AND (c.freelancer_id = auth.uid() OR c.client_id = auth.uid())
        )
    );

-- 4. Reload PostgREST schema cache to make sure the changes are instantly active
NOTIFY pgrst, 'reload schema';

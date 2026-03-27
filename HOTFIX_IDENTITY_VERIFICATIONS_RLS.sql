-- =========================================================================
-- HOTFIX: identity_verifications RLS for normal authenticated users
-- Run in Supabase SQL Editor (target project)
-- =========================================================================

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Recreate user policies (idempotent)
DROP POLICY IF EXISTS "identity_verifications_select" ON public.identity_verifications;
CREATE POLICY "identity_verifications_select"
ON public.identity_verifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "identity_verifications_insert" ON public.identity_verifications;
CREATE POLICY "identity_verifications_insert"
ON public.identity_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "identity_verifications_delete" ON public.identity_verifications;
CREATE POLICY "identity_verifications_delete"
ON public.identity_verifications
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Ensure authenticated role has table privileges (RLS still enforced)
GRANT SELECT, INSERT, DELETE ON TABLE public.identity_verifications TO authenticated;

COMMIT;

-- =========================================================================
-- HOTFIX: Enable Admins to Delete/Revoke Identity Verifications
-- Run in Supabase SQL Editor (target project)
-- =========================================================================

BEGIN;

DROP POLICY IF EXISTS "identity_verifications_delete_admin" ON public.identity_verifications;

CREATE POLICY "identity_verifications_delete_admin" ON public.identity_verifications
    FOR DELETE USING (
        (SELECT is_admin FROM public.profiles WHERE profiles.id = auth.uid())
    );

COMMIT;
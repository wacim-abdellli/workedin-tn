-- FIX: Allow users to delete their own identity verifications of any status
-- Previous policy only allowed delete when status = 'pending'
-- This prevented users from resubmitting after rejection or when they had approved status
-- 
-- Allow users to delete their own verifications regardless of status
-- (This is needed for the resubmit flow in VerifyIdentity.tsx)

DROP POLICY IF EXISTS "identity_verifications_delete" ON identity_verifications;

CREATE POLICY "identity_verifications_delete" ON identity_verifications
    FOR DELETE USING (auth.uid() = user_id);

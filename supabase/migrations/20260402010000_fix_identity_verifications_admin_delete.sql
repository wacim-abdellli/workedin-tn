-- Create policy to allow admins to delete identity verifications
DROP POLICY IF EXISTS "identity_verifications_delete_admin" ON identity_verifications;

CREATE POLICY "identity_verifications_delete_admin" ON identity_verifications
    FOR DELETE USING (
        (SELECT is_admin FROM profiles WHERE profiles.id = auth.uid())
    );

-- ============================================================================
-- Fix Storage Insert RLS Error (RETURNING clause constraint)
-- ============================================================================
-- When the Supabase Storage API inserts a file, it uses a RETURNING * clause.
-- Postgres RLS requires that the newly inserted row be readable by the user
-- (i.e., a SELECT policy must evaluate to true for the new row).
-- Since the file is not yet registered in 'public.contract_delivery_assets',
-- the existing SELECT policy fails, causing the INSERT to abort with the 
-- error "new row violates row-level security policy".
-- This policy allows authenticated users to read their own uploaded files
-- in the 'contract-files' bucket, satisfying the RETURNING constraint.
-- ============================================================================

DROP POLICY IF EXISTS "contract_files_freelancer_select_own" ON storage.objects;
CREATE POLICY "contract_files_freelancer_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'contract-files'
    AND owner = auth.uid()
);

-- Allow admins to read identity documents from storage
-- This is needed for the admin verification review panel to show document images

-- Drop existing policy if any
DROP POLICY IF EXISTS "admin_read_identity_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_all_identity_documents" ON storage.objects;

-- Allow admins full access to identity-documents bucket
CREATE POLICY "admin_all_identity_documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id IN ('identity-documents', 'identity_documents', 'verification-documents')
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR is_super_admin = true)
    )
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id IN ('identity-documents', 'identity_documents', 'verification-documents')
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR is_super_admin = true)
    )
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

NOTIFY pgrst, 'reload schema';

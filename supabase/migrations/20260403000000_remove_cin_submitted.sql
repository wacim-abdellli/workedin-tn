-- Remove stale cin_submitted flags from profiles
-- This column is no longer used - verification status comes from identity_verifications table only

-- Clear all cin_submitted flags
UPDATE profiles 
SET cin_submitted = false 
WHERE cin_submitted = true;

-- Add comment to document that this column is deprecated
COMMENT ON COLUMN profiles.cin_submitted IS 'DEPRECATED: No longer used. Verification status comes from identity_verifications table.';

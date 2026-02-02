-- =====================================================
-- KHEDMA.TN - Add Missing Columns for Onboarding Flow
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add onboarding_completed column (CRITICAL)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add other missing columns that TypeScript expects
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cin_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cin_submitted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Columns added successfully!' as status;

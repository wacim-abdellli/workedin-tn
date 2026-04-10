# Migration Fix Instructions

## Problem
The migration `20260410103000_expand_onboarding_profile_fields.sql` was already partially applied to your database, causing a duplicate key error when trying to push migrations.

## Solution

You have two options:

### Option 1: Manual SQL Execution (Recommended)

Since the problematic migration is already applied, we can skip it and apply only the new migrations manually.

1. Go to Supabase Dashboard → SQL Editor

2. Run the restoration migration directly:

```sql
-- Add columns to track original user data before archiving
-- This allows proper restoration of user accounts

-- Add backup columns to profiles table (if they don't exist)
DO $$ 
BEGIN
    -- Add column to store original full_name before archiving
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'original_full_name'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN original_full_name TEXT;
    END IF;

    -- Add column to store original email before archiving
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'original_email'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN original_email TEXT;
    END IF;

    -- Add column to store archive timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN archived_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create or replace function to properly archive users (soft delete)
CREATE OR REPLACE FUNCTION archive_user_account(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_result JSONB;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Only admins can archive users';
    END IF;

    -- Get current profile data
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Store original data before archiving (only if not already archived)
    IF v_profile.account_status != 'archived' THEN
        UPDATE public.profiles
        SET 
            original_full_name = COALESCE(original_full_name, full_name),
            original_email = COALESCE(original_email, email),
            archived_at = NOW(),
            -- Anonymize current data
            full_name = 'Deleted User',
            username = 'deleted_' || SUBSTRING(p_user_id::TEXT, 1, 8),
            phone = NULL,
            location = NULL,
            bio = NULL,
            avatar_url = NULL,
            avatar_url_client = NULL,
            avatar_url_freelancer = NULL,
            account_status = 'archived',
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    -- Create audit log
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_user_id,
        reason,
        created_at
    ) VALUES (
        auth.uid(),
        'archive_user',
        p_user_id,
        p_reason,
        NOW()
    ) ON CONFLICT DO NOTHING;

    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'action', 'archived'
    );

    RETURN v_result;
END;
$$;

-- Create or replace function to properly restore archived users
CREATE OR REPLACE FUNCTION restore_user_account(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_result JSONB;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Only admins can restore users';
    END IF;

    -- Get current profile data
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Restore original data if available
    UPDATE public.profiles
    SET 
        full_name = COALESCE(original_full_name, 'Restored User'),
        email = COALESCE(original_email, email),
        account_status = 'active',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Create audit log
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_user_id,
        reason,
        created_at
    ) VALUES (
        auth.uid(),
        'restore_user',
        p_user_id,
        p_reason,
        NOW()
    ) ON CONFLICT DO NOTHING;

    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'action', 'restored',
        'restored_name', COALESCE(v_profile.original_full_name, 'Restored User')
    );

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION archive_user_account(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_user_account(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION archive_user_account IS 'Archives a user account while preserving original data for potential restoration';
COMMENT ON FUNCTION restore_user_account IS 'Restores an archived user account with original data';

-- Mark migration as applied
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
VALUES('20260410180000', 'add_user_restoration_support', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;
```

3. After running the SQL, manually fix the user "hajer ben rbeh":

```sql
-- Find the user
SELECT id, full_name, email, account_status FROM profiles WHERE full_name = 'Deleted User';

-- Update with the correct name (replace <user_id> with the actual UUID)
UPDATE profiles SET full_name = 'hajer ben rbeh' WHERE id = '<user_id>';
```

### Option 2: Reset Migration State (Advanced)

If you want to use `npx supabase db push` in the future, you need to clean up the migration state:

1. Go to Supabase Dashboard → SQL Editor

2. Remove the duplicate migration entry:

```sql
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '20260410103000' 
AND name LIKE '%FIXED%';
```

3. Then try `npx supabase db push` again

## Verification

After applying the migration, test it:

1. In admin dashboard, archive a test user
2. Verify their name changes to "Deleted User"
3. Reactivate the user
4. Verify their original name is restored

## Contact Form Test

1. Log out or use incognito mode
2. Try to access with a suspended/archived account
3. Click "Contact support" button
4. Verify the form appears and works correctly

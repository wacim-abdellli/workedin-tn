-- User Restoration Fix - Apply this in Supabase Dashboard SQL Editor
-- This adds the ability to properly restore user names when reactivating archived accounts

-- Step 1: Add backup columns to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'original_full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN original_full_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'original_email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN original_email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN archived_at TIMESTAMPTZ;
    END IF;
END $$;

-- Step 2: Create archive function
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
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Only admins can archive users';
    END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF v_profile.account_status != 'archived' THEN
        UPDATE public.profiles
        SET 
            original_full_name = COALESCE(original_full_name, full_name),
            original_email = COALESCE(original_email, email),
            archived_at = NOW(),
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

    INSERT INTO public.admin_actions (
        admin_id, action_type, target_user_id, reason, created_at
    ) VALUES (
        auth.uid(), 'archive_user', p_user_id, p_reason, NOW()
    ) ON CONFLICT DO NOTHING;

    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'action', 'archived'
    );

    RETURN v_result;
END;
$$;

-- Step 3: Create restore function
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
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Only admins can restore users';
    END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE public.profiles
    SET 
        full_name = COALESCE(original_full_name, 'Restored User'),
        email = COALESCE(original_email, email),
        account_status = 'active',
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.admin_actions (
        admin_id, action_type, target_user_id, reason, created_at
    ) VALUES (
        auth.uid(), 'restore_user', p_user_id, p_reason, NOW()
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION archive_user_account(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_user_account(UUID, TEXT) TO authenticated;

-- Step 5: Mark migration as applied
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
VALUES('20260410180000', 'add_user_restoration_support', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;

-- SUCCESS! Now you can:
-- 1. Archive users and their names will be backed up automatically
-- 2. Restore users and their original names will come back
-- 3. Fix the existing user "hajer ben rbeh" with the query below

-- OPTIONAL: Fix existing archived user "hajer ben rbeh"
-- First, find the user:
-- SELECT id, full_name, email, account_status FROM profiles WHERE full_name = 'Deleted User';
-- Then update (replace <user_id> with actual UUID):
-- UPDATE profiles SET full_name = 'hajer ben rbeh' WHERE id = '<user_id>';

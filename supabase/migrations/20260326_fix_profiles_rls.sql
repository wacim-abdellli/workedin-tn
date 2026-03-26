-- =====================================================
-- FIX: Profiles RLS + RPC functions for role selection
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- 1. Fix RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Create RPC function for setting user type (bypasses RLS)
CREATE OR REPLACE FUNCTION public.set_user_type_rpc(
  p_user_type TEXT,
  p_active_mode TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_user_type NOT IN ('client', 'freelancer', 'both') THEN
    RAISE EXCEPTION 'Invalid user_type: %', p_user_type;
  END IF;

  IF p_active_mode NOT IN ('client', 'freelancer') THEN
    RAISE EXCEPTION 'Invalid active_mode: %', p_active_mode;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET
    user_type = p_user_type,
    active_mode = p_active_mode::account_mode_enum,
    updated_at = now()
  WHERE id = auth.uid();

  -- Create freelancer_profiles row if needed
  IF p_user_type IN ('freelancer', 'both') THEN
    INSERT INTO public.freelancer_profiles (id, skills, availability)
    VALUES (auth.uid(), '[]'::jsonb, 'available')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_user_type_rpc(TEXT, TEXT) TO authenticated;

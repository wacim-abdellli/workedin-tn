DO $migration$
BEGIN
  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    BEGIN
      INSERT INTO public.wallets (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;

      RETURN NEW;
    END;
    $fn$;
  $sql$;

  INSERT INTO public.profiles (
    id,
    user_type,
    email,
    full_name,
    phone,
    avatar_url,
    preferred_language,
    onboarding_completed,
    client_onboarding_completed,
    freelancer_onboarding_completed
  )
  SELECT
    u.id,
    NULL,
    u.email,
    TRIM(
      COALESCE(
        NULLIF(u.raw_user_meta_data->>'full_name', ''),
        NULLIF(u.raw_user_meta_data->>'name', ''),
        NULLIF(CONCAT_WS(' ', u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'family_name'), ''),
        NULLIF(SPLIT_PART(COALESCE(u.email, ''), '@', 1), ''),
        'New user'
      )
    ),
    u.phone,
    COALESCE(NULLIF(u.raw_user_meta_data->>'avatar_url', ''), NULLIF(u.raw_user_meta_data->>'picture', '')),
    CASE
      WHEN LOWER(COALESCE(NULLIF(u.raw_user_meta_data->>'preferred_language', ''), NULLIF(u.raw_user_meta_data->>'locale', ''), 'ar')) LIKE 'fr%' THEN 'fr'::language_enum
      WHEN LOWER(COALESCE(NULLIF(u.raw_user_meta_data->>'preferred_language', ''), NULLIF(u.raw_user_meta_data->>'locale', ''), 'ar')) LIKE 'en%' THEN 'en'::language_enum
      ELSE 'ar'::language_enum
    END,
    FALSE,
    FALSE,
    FALSE
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p
    ON p.id = u.id
  WHERE p.id IS NULL;

  INSERT INTO public.wallets (user_id)
  SELECT p.id
  FROM public.profiles AS p
  LEFT JOIN public.wallets AS w
    ON w.user_id = p.id
  WHERE w.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
END;
$migration$;

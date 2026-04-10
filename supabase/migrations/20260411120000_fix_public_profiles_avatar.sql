-- Fix public_profiles view to return the correct avatar based on active_mode
-- Previously it only returned avatar_url, missing avatar_url_freelancer

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
    WITH (security_invoker = false)
AS
SELECT
    id,
    full_name,
    username,
    -- Return mode-specific avatar, falling back to generic avatar_url
    COALESCE(
        CASE
            WHEN active_mode = 'freelancer' THEN avatar_url_freelancer
            WHEN active_mode = 'client' THEN avatar_url_client
            ELSE NULL
        END,
        avatar_url_freelancer,
        avatar_url_client,
        avatar_url
    ) AS avatar_url,
    bio,
    location,
    user_type,
    active_mode,
    cin_verified,
    created_at,
    updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

NOTIFY pgrst, 'reload schema';

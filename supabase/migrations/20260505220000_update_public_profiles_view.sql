-- Update public_profiles to include client fields
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
    WITH (security_invoker = false)
AS
SELECT
    id,
    full_name,
    username,
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
    phone_verified,
    payment_verified,
    company_name,
    company_industry,
    company_size,
    company_role,
    company_website,
    hiring_needs,
    project_budget_preference,
    project_timeline_preference,
    communication_preferences,
    screening_preferences,
    legal_preferences,
    created_at,
    updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

NOTIFY pgrst, 'reload schema';

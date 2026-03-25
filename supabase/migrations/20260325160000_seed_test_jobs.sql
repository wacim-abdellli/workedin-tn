-- =====================================================
-- Seed: 6 test jobs for development/demo
-- =====================================================
-- profiles.id has FK → auth.users(id), so we must insert
-- into auth.users first before inserting the profile.
-- All inserts are ON CONFLICT DO NOTHING — safe to re-run.
-- =====================================================

DO $$
DECLARE
    test_client_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- 1. Insert a dummy auth user so the FK is satisfied
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        test_client_id,
        'demo-client@khedma.tn',
        '',                          -- no real password needed for demo
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Demo Client"}'::jsonb,
        false,
        'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert the profile (trigger may already have created it; DO NOTHING is safe)
    INSERT INTO profiles (id, full_name, email, user_type)
    VALUES (test_client_id, 'Demo Client', 'demo-client@khedma.tn', 'client')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Seed jobs only if table is empty
    IF (SELECT COUNT(*) FROM jobs) = 0 THEN

        INSERT INTO jobs (
            client_id,
            title,
            description,
            category,
            job_type,
            budget_min,
            budget_max,
            experience_level,
            visibility,
            status,
            required_skills
        ) VALUES
        (
            test_client_id,
            'React Developer for E-commerce Site',
            'Looking for an experienced React developer to build a modern e-commerce platform with cart, checkout, and payment integration.',
            'development',
            'fixed_price',
            800,
            1500,
            'intermediate',
            'public',
            'open',
            '["React", "TypeScript", "Node.js"]'::jsonb
        ),
        (
            test_client_id,
            'Logo Design for Startup',
            'Need a creative logo designer for a tech startup. Modern, minimalist style preferred.',
            'design',
            'fixed_price',
            150,
            300,
            'beginner',
            'public',
            'open',
            '["Logo Design", "Illustrator", "Branding"]'::jsonb
        ),
        (
            test_client_id,
            'Arabic/French Content Writer',
            'Looking for a bilingual content writer for blog posts and social media content.',
            'writing',
            'hourly',
            NULL,
            NULL,
            'intermediate',
            'public',
            'open',
            '["Content Writing", "Arabic", "French"]'::jsonb
        ),
        (
            test_client_id,
            'Mobile App UI/UX Design',
            'Need a UI/UX designer to create wireframes and mockups for a delivery app.',
            'design',
            'fixed_price',
            400,
            800,
            'intermediate',
            'public',
            'open',
            '["Figma", "UI/UX", "Mobile Design"]'::jsonb
        ),
        (
            test_client_id,
            'Python Data Analysis Script',
            'Need a Python developer to write data analysis scripts for CSV processing and visualization.',
            'development',
            'fixed_price',
            200,
            500,
            'beginner',
            'public',
            'open',
            '["Python", "Pandas", "Data Analysis"]'::jsonb
        ),
        (
            test_client_id,
            'Social Media Marketing Campaign',
            'Looking for a digital marketing expert to run Facebook and Instagram campaigns.',
            'marketing',
            'fixed_price',
            300,
            600,
            'intermediate',
            'public',
            'open',
            '["Social Media", "Facebook Ads", "Marketing"]'::jsonb
        );

        RAISE NOTICE 'Seeded 6 test jobs successfully.';
    ELSE
        RAISE NOTICE 'Jobs table not empty — skipping seed.';
    END IF;
END $$;

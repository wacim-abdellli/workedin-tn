-- =====================================================
-- Seed: 6 test jobs for development/demo
-- =====================================================
-- Uses a fixed UUID for the test client.
-- The profiles row for this UUID must exist first — we insert a minimal
-- placeholder profile if it doesn't, so the FK constraint is satisfied.
-- Only runs if the jobs table is currently empty.
-- =====================================================

DO $$
DECLARE
    test_client_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Ensure a placeholder profile exists for the test client
    INSERT INTO profiles (id, full_name, email, user_type)
    VALUES (
        test_client_id,
        'Test Client (Demo)',
        'demo-client@khedma.tn',
        'client'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Only seed if jobs table is empty
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
            required_skills,
            visibility,
            status
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
            '["React", "TypeScript", "Node.js"]'::jsonb,
            'public',
            'open'
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
            '["Logo Design", "Illustrator", "Branding"]'::jsonb,
            'public',
            'open'
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
            '["Content Writing", "Arabic", "French"]'::jsonb,
            'public',
            'open'
        ),
        (
            test_client_id,
            'Mobile App UI/UX Design',
            'Need a UI/UX designer to create wireframes and mockups for a delivery app.',
            'design',
            'fixed_price',
            400,
            800,
            'expert',
            '["Figma", "UI/UX", "Mobile Design"]'::jsonb,
            'public',
            'open'
        ),
        (
            test_client_id,
            'Python Data Analysis Script',
            'Need a Python developer to write data analysis scripts for CSV processing and visualization.',
            'development',
            'fixed_price',
            200,
            500,
            'intermediate',
            '["Python", "Pandas", "Data Analysis"]'::jsonb,
            'public',
            'open'
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
            '["Social Media", "Facebook Ads", "Marketing"]'::jsonb,
            'public',
            'open'
        );

        RAISE NOTICE 'Seeded 6 test jobs successfully.';
    ELSE
        RAISE NOTICE 'Jobs table not empty — skipping seed.';
    END IF;
END $$;

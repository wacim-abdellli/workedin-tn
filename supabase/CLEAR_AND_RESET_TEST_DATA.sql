-- ============================================================================
-- SQL Script: Clear All Jobs/Workspaces & Start Over with New Client
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Delete all transactional data in dependency order
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.reviews;
DELETE FROM public.contract_deliveries;
DELETE FROM public.milestones;
DELETE FROM public.contracts;
DELETE FROM public.proposals;
DELETE FROM public.jobs;

-- 2. Configure wacimabdelli01@gmail.com (333f078b-e980-42db-a162-28505c5c03ed) as CLIENT
UPDATE public.profiles 
SET active_mode = 'client' 
WHERE id = '333f078b-e980-42db-a162-28505c5c03ed';

-- 3. Configure wassimabdello94@gmail.com (b0098849-151a-4640-a947-f100192b5da0) as FREELANCER
UPDATE public.profiles 
SET active_mode = 'freelancer' 
WHERE id = 'b0098849-151a-4640-a947-f100192b5da0';

-- 4. Seed 3 premium sample jobs for the new client

-- Job 1: Fixed Price (Exact) - 800 TND
INSERT INTO public.jobs (
    id,
    client_id,
    title,
    description,
    category,
    subcategory,
    job_type,
    duration,
    experience_level,
    visibility,
    status,
    budget_min,
    budget_max,
    created_at
) VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '333f078b-e980-42db-a162-28505c5c03ed',
    'Next.js E-Commerce Platform Development',
    'Looking for a senior Next.js developer to build a modern e-commerce storefront for a local fashion brand. Must have experience with server actions, Tailwind CSS, Supabase database, and Flouci/Dhmad payment integration. Figma designs will be shared upon starting.',
    'development',
    'web_development',
    'fixed_price',
    '1_3_months',
    'expert',
    'public',
    'open',
    800,
    800,
    now()
);

-- Job 2: Fixed Price (Range) - 300 to 600 TND
INSERT INTO public.jobs (
    id,
    client_id,
    title,
    description,
    category,
    subcategory,
    job_type,
    duration,
    experience_level,
    visibility,
    status,
    budget_min,
    budget_max,
    created_at
) VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    '333f078b-e980-42db-a162-28505c5c03ed',
    'Modern UI/UX Redesign for Mobile SaaS',
    'Need a talented designer to revamp our SaaS mobile application dashboard. We need high-fidelity responsive screens in Figma (Dark mode/Light mode) along with a clean design system token guide. Wireframes and project brief are already prepared.',
    'design',
    'mobile_design',
    'fixed_price',
    'less_than_1_month',
    'intermediate',
    'public',
    'open',
    300,
    600,
    now()
);

-- Job 3: Hourly Rate - 25 TND/hr
INSERT INTO public.jobs (
    id,
    client_id,
    title,
    description,
    category,
    subcategory,
    job_type,
    duration,
    experience_level,
    visibility,
    status,
    hourly_rate,
    created_at
) VALUES (
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    '333f078b-e980-42db-a162-28505c5c03ed',
    'SEO Optimization & Technical Blog Writing',
    'We are seeking an experienced content writer to create 5 high-quality, SEO-optimized articles about Artificial Intelligence and Web Technologies. The role involves conducting keyword research and writing engaging copy matching our brand guidelines.',
    'writing',
    'blog_writing',
    'hourly',
    'less_than_1_month',
    'beginner',
    'public',
    'open',
    25,
    now()
);

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

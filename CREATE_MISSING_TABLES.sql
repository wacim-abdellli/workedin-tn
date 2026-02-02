-- ============================================
-- SAFE SCHEMA MIGRATION
-- Only creates missing tables/columns
-- ============================================

-- Enable necessary extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enums ONLY if they don't exist
DO $$ BEGIN
    CREATE TYPE user_type_enum AS ENUM ('freelancer', 'client', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE language_enum AS ENUM ('ar', 'fr', 'en');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_enum AS ENUM ('available', 'busy', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create freelancer_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    hourly_rate DECIMAL(10,2),
    availability availability_enum DEFAULT 'available',
    skills JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    response_time_hours DECIMAL(5,2),
    profile_views INTEGER DEFAULT 0,
    portfolio_items_count INTEGER DEFAULT 0,
    cin_verified BOOLEAN DEFAULT false,
    voice_intro_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    project_url TEXT,
    thumbnail_url TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    skills_used JSONB DEFAULT '[]'::jsonb,
    completion_date DATE,
    client_name TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for freelancer_profiles
DO $$ BEGIN
    CREATE POLICY "Freelancer profiles are viewable by everyone" 
        ON freelancer_profiles FOR SELECT 
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Freelancers can insert own profile" 
        ON freelancer_profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Freelancers can update own profile" 
        ON freelancer_profiles FOR UPDATE 
        USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create RLS policies for portfolio_items
DO $$ BEGIN
    CREATE POLICY "Portfolio items are viewable by everyone" 
        ON portfolio_items FOR SELECT 
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Freelancers can manage own portfolio items" 
        ON portfolio_items FOR ALL 
        USING (auth.uid() = freelancer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_availability ON freelancer_profiles(availability);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_freelancer ON portfolio_items(freelancer_id);

-- Refresh schema
NOTIFY pgrst, 'reload config';

-- Verification
SELECT 
    'Tables Created' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('freelancer_profiles', 'portfolio_items');

SELECT '✅ Missing tables created successfully!' AS result;

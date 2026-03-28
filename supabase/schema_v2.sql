-- ============================================
-- Khedma.tn Complete Database Schema v2
-- Freelance Marketplace like Upwork
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================
-- ENUMS (Type Definitions)
-- ============================================
CREATE TYPE user_type_enum AS ENUM ('freelancer', 'client', 'both');
CREATE TYPE account_mode_enum AS ENUM ('freelancer', 'client');
CREATE TYPE language_enum AS ENUM ('ar', 'fr', 'en');
CREATE TYPE availability_enum AS ENUM ('available', 'busy', 'offline');
CREATE TYPE job_type_enum AS ENUM ('fixed_price', 'hourly');
CREATE TYPE job_category_enum AS ENUM ('design', 'development', 'writing', 'translation', 'video', 'marketing', 'data', 'other');
CREATE TYPE job_duration_enum AS ENUM ('less_than_1_month', '1_3_months', '3_6_months', 'more_than_6_months');
CREATE TYPE experience_level_enum AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE job_visibility_enum AS ENUM ('public', 'invite_only');
CREATE TYPE job_status_enum AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'closed');
CREATE TYPE proposal_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE contract_status_enum AS ENUM ('active', 'completed', 'cancelled', 'disputed');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'in_escrow', 'released', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'd17', 'cash', 'payoneer');
CREATE TYPE milestone_status_enum AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE notification_type_enum AS ENUM ('new_job', 'new_proposal', 'message', 'payment', 'review', 'contract_update', 'milestone', 'system');

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_type_enum DEFAULT 'client',
    active_mode account_mode_enum,
    email TEXT,
    username TEXT,
    is_admin BOOLEAN DEFAULT false,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 500),
    location TEXT, -- Tunisian governorate
    preferred_language language_enum DEFAULT 'ar',
    cin_verified BOOLEAN DEFAULT false,
    cin_submitted BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. FREELANCER_PROFILES TABLE (extends profiles)
-- ============================================
CREATE TABLE freelancer_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT, -- Professional headline, e.g., "مصمم جرافيك محترف"
    hourly_rate DECIMAL(10,2),
    availability availability_enum DEFAULT 'available',
    skills JSONB DEFAULT '[]'::jsonb, -- [{name: string, level: 'beginner'|'intermediate'|'expert'}]
    languages JSONB DEFAULT '[]'::jsonb, -- [{language: string, proficiency: 'native'|'fluent'|'conversational'|'basic'}]
    education JSONB DEFAULT '[]'::jsonb, -- [{institution, degree, field, startYear, endYear}]
    certifications JSONB DEFAULT '[]'::jsonb, -- [{name, issuer, issueDate, expiryDate, url}]
    total_earnings DECIMAL(12,2) DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0, -- Percentage 0-100
    response_time_hours DECIMAL(5,2),
    profile_views INTEGER DEFAULT 0,
    portfolio_items_count INTEGER DEFAULT 0,
    cin_verified BOOLEAN DEFAULT false,
    voice_intro_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PORTFOLIO_ITEMS TABLE
-- ============================================
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    project_url TEXT,
    thumbnail_url TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb, -- Array of image/video URLs
    skills_used JSONB DEFAULT '[]'::jsonb, -- Array of skill names
    completion_date DATE,
    client_name TEXT,
    order_index INTEGER DEFAULT 0, -- For custom sorting
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. JOBS TABLE
-- ============================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL, -- Rich text
    category job_category_enum DEFAULT 'other',
    subcategory TEXT,
    job_type job_type_enum DEFAULT 'fixed_price',
    budget_min DECIMAL(10,2), -- Nullable for hourly
    budget_max DECIMAL(10,2), -- Nullable for hourly
    hourly_rate DECIMAL(10,2), -- Nullable for fixed_price
    duration job_duration_enum,
    experience_level experience_level_enum DEFAULT 'intermediate',
    required_skills JSONB DEFAULT '[]'::jsonb, -- Array of skill names
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
    visibility job_visibility_enum DEFAULT 'public',
    status job_status_enum DEFAULT 'open',
    proposals_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PROPOSALS TABLE
-- ============================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    delivery_time_days INTEGER NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
    status proposal_status_enum DEFAULT 'pending',
    is_invited BOOLEAN DEFAULT false,
    client_viewed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, freelancer_id) -- One proposal per freelancer per job
);

-- ============================================
-- 6. CONTRACTS TABLE
-- ============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    contract_type job_type_enum DEFAULT 'fixed_price',
    status contract_status_enum DEFAULT 'active',
    payment_status payment_status_enum DEFAULT 'pending',
    payment_method payment_method_enum,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MILESTONES TABLE (for fixed-price contracts)
-- ============================================
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    status milestone_status_enum DEFAULT 'pending',
    submission_note TEXT,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Either contract_id or proposal_id should be set
    CONSTRAINT message_context_check CHECK (
        (contract_id IS NOT NULL AND proposal_id IS NULL) OR
        (contract_id IS NULL AND proposal_id IS NOT NULL) OR
        (contract_id IS NULL AND proposal_id IS NULL)
    )
);

-- ============================================
-- 9. REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    skills_rating JSONB, -- {communication: 1-5, quality: 1-5, deadline: 1-5, professionalism: 1-5}
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contract_id, reviewer_id) -- One review per reviewer per contract
);

-- ============================================
-- 10. FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Either freelancer_id or job_id should be set
    CONSTRAINT favorite_target_check CHECK (
        (freelancer_id IS NOT NULL AND job_id IS NULL) OR
        (freelancer_id IS NULL AND job_id IS NOT NULL)
    ),
    UNIQUE(user_id, freelancer_id),
    UNIQUE(user_id, job_id)
);

-- ============================================
-- 11. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    link TEXT, -- Deep link to relevant page
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_location ON profiles(location);

-- Freelancer Profiles
CREATE INDEX idx_freelancer_profiles_availability ON freelancer_profiles(availability);
CREATE INDEX idx_freelancer_profiles_hourly_rate ON freelancer_profiles(hourly_rate);
CREATE INDEX idx_freelancer_profiles_success_rate ON freelancer_profiles(success_rate);
CREATE INDEX idx_freelancer_profiles_skills ON freelancer_profiles USING gin(skills);

-- Portfolio Items
CREATE INDEX idx_portfolio_items_freelancer_id ON portfolio_items(freelancer_id);
CREATE INDEX idx_portfolio_items_order ON portfolio_items(freelancer_id, order_index);

-- Jobs
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX idx_jobs_visibility ON jobs(visibility);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_required_skills ON jobs USING gin(required_skills);

-- Proposals
CREATE INDEX idx_proposals_job_id ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);

-- Contracts
CREATE INDEX idx_contracts_job_id ON contracts(job_id);
CREATE INDEX idx_contracts_freelancer_id ON contracts(freelancer_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_payment_status ON contracts(payment_status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);

-- Milestones
CREATE INDEX idx_milestones_contract_id ON milestones(contract_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);

-- Messages
CREATE INDEX idx_messages_contract_id ON messages(contract_id);
CREATE INDEX idx_messages_proposal_id ON messages(proposal_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;

-- Reviews
CREATE INDEX idx_reviews_contract_id ON reviews(contract_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Favorites
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_freelancer_id ON favorites(freelancer_id);
CREATE INDEX idx_favorites_job_id ON favorites(job_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

-- Jobs: Full-text search on title and description
CREATE INDEX idx_jobs_title_search ON jobs USING gin(to_tsvector('arabic', title));
CREATE INDEX idx_jobs_description_search ON jobs USING gin(to_tsvector('arabic', description));
CREATE INDEX idx_jobs_title_trgm ON jobs USING gin(title gin_trgm_ops);
CREATE INDEX idx_jobs_description_trgm ON jobs USING gin(description gin_trgm_ops);

-- Freelancer Profiles: Full-text search on title and bio
CREATE INDEX idx_freelancer_title_search ON freelancer_profiles USING gin(to_tsvector('arabic', COALESCE(title, '')));
CREATE INDEX idx_freelancer_title_trgm ON freelancer_profiles USING gin(title gin_trgm_ops);

-- Profiles: Full-text search on bio
CREATE INDEX idx_profiles_bio_search ON profiles USING gin(to_tsvector('arabic', COALESCE(bio, '')));
CREATE INDEX idx_profiles_bio_trgm ON profiles USING gin(bio gin_trgm_ops);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS
-- ============================================
CREATE POLICY "Profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================
-- FREELANCER_PROFILES RLS
-- ============================================
CREATE POLICY "Freelancer profiles are viewable by everyone" 
    ON freelancer_profiles FOR SELECT 
    USING (true);

CREATE POLICY "Freelancers can insert own profile" 
    ON freelancer_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Freelancers can update own profile" 
    ON freelancer_profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================
-- PORTFOLIO_ITEMS RLS
-- ============================================
CREATE POLICY "Portfolio items are viewable by everyone" 
    ON portfolio_items FOR SELECT 
    USING (true);

CREATE POLICY "Freelancers can manage own portfolio items" 
    ON portfolio_items FOR ALL 
    USING (auth.uid() = freelancer_id);

-- ============================================
-- JOBS RLS
-- ============================================
CREATE POLICY "Public jobs are viewable by everyone" 
    ON jobs FOR SELECT 
    USING (visibility = 'public' OR client_id = auth.uid());

CREATE POLICY "Clients can insert jobs" 
    ON jobs FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own jobs" 
    ON jobs FOR UPDATE 
    USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own jobs" 
    ON jobs FOR DELETE 
    USING (auth.uid() = client_id AND status = 'open');

-- ============================================
-- PROPOSALS RLS
-- ============================================
CREATE POLICY "Proposals viewable by job owner and proposal owner" 
    ON proposals FOR SELECT 
    USING (
        freelancer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid())
    );

CREATE POLICY "Freelancers can submit proposals" 
    ON proposals FOR INSERT 
    WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Proposal owners can update own proposals" 
    ON proposals FOR UPDATE 
    USING (freelancer_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));

CREATE POLICY "Freelancers can withdraw own proposals" 
    ON proposals FOR DELETE 
    USING (auth.uid() = freelancer_id AND status = 'pending');

-- ============================================
-- CONTRACTS RLS
-- ============================================
CREATE POLICY "Contracts viewable by involved parties" 
    ON contracts FOR SELECT 
    USING (freelancer_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Clients can create contracts" 
    ON contracts FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Contract parties can update contracts" 
    ON contracts FOR UPDATE 
    USING (freelancer_id = auth.uid() OR client_id = auth.uid());

-- ============================================
-- MILESTONES RLS
-- ============================================
CREATE POLICY "Milestones viewable by contract parties" 
    ON milestones FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_id 
            AND (contracts.freelancer_id = auth.uid() OR contracts.client_id = auth.uid())
        )
    );

CREATE POLICY "Clients can create milestones" 
    ON milestones FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_id 
            AND contracts.client_id = auth.uid()
        )
    );

CREATE POLICY "Contract parties can update milestones" 
    ON milestones FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_id 
            AND (contracts.freelancer_id = auth.uid() OR contracts.client_id = auth.uid())
        )
    );

-- ============================================
-- MESSAGES RLS
-- ============================================
CREATE POLICY "Messages viewable by sender and receiver" 
    ON messages FOR SELECT 
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" 
    ON messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read" 
    ON messages FOR UPDATE 
    USING (receiver_id = auth.uid());

-- ============================================
-- REVIEWS RLS
-- ============================================
CREATE POLICY "Public reviews are viewable by everyone" 
    ON reviews FOR SELECT 
    USING (is_public = true OR reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "Contract parties can create reviews" 
    ON reviews FOR INSERT 
    WITH CHECK (
        auth.uid() = reviewer_id AND
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_id 
            AND (contracts.freelancer_id = auth.uid() OR contracts.client_id = auth.uid())
            AND contracts.status = 'completed'
        )
    );

-- ============================================
-- FAVORITES RLS
-- ============================================
CREATE POLICY "Users can view own favorites" 
    ON favorites FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" 
    ON favorites FOR ALL 
    USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS RLS
-- ============================================
CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
    ON notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_proposals_updated_at 
    BEFORE UPDATE ON proposals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    locale_value TEXT;
    preferred_language_value language_enum := 'ar';
    generated_name TEXT;
BEGIN
    locale_value := LOWER(
        COALESCE(
            NULLIF(raw_meta->>'preferred_language', ''),
            NULLIF(raw_meta->>'locale', ''),
            'ar'
        )
    );

    IF locale_value LIKE 'fr%' THEN
        preferred_language_value := 'fr';
    ELSIF locale_value LIKE 'en%' THEN
        preferred_language_value := 'en';
    ELSE
        preferred_language_value := 'ar';
    END IF;

    generated_name := TRIM(
        COALESCE(
            NULLIF(raw_meta->>'full_name', ''),
            NULLIF(raw_meta->>'name', ''),
            NULLIF(CONCAT_WS(' ', raw_meta->>'given_name', raw_meta->>'family_name'), ''),
            NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
            'New user'
        )
    );

    INSERT INTO profiles (id, email, full_name, phone, avatar_url, preferred_language, onboarding_completed)
    VALUES (
        NEW.id,
        NEW.email,
        generated_name,
        NEW.phone,
        COALESCE(NULLIF(raw_meta->>'avatar_url', ''), NULLIF(raw_meta->>'picture', '')),
        preferred_language_value,
        false
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        full_name = CASE
            WHEN profiles.full_name IS NULL OR BTRIM(profiles.full_name) = '' THEN EXCLUDED.full_name
            ELSE profiles.full_name
        END,
        phone = COALESCE(profiles.phone, EXCLUDED.phone),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
        preferred_language = COALESCE(profiles.preferred_language, EXCLUDED.preferred_language);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update proposals count on job
CREATE OR REPLACE FUNCTION update_job_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET proposals_count = proposals_count + 1 WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET proposals_count = proposals_count - 1 WHERE id = OLD.job_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proposals_count
    AFTER INSERT OR DELETE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_job_proposals_count();

-- Update freelancer stats on contract completion
CREATE OR REPLACE FUNCTION update_freelancer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE freelancer_profiles 
        SET 
            jobs_completed = jobs_completed + 1,
            total_earnings = total_earnings + NEW.amount
        WHERE id = NEW.freelancer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_contract_completed
    AFTER UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_freelancer_stats();

-- Update portfolio items count
CREATE OR REPLACE FUNCTION update_portfolio_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE freelancer_profiles SET portfolio_items_count = portfolio_items_count + 1 WHERE id = NEW.freelancer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE freelancer_profiles SET portfolio_items_count = portfolio_items_count - 1 WHERE id = OLD.freelancer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_items_count
    AFTER INSERT OR DELETE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_count();

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;

-- ============================================
-- STORAGE BUCKETS (Run in Supabase Dashboard > Storage)
-- ============================================
-- Create the following buckets:
-- 1. "avatars" - Public bucket for profile pictures
-- 2. "portfolio" - Public bucket for portfolio items
-- 3. "attachments" - Private bucket for contract/proposal attachments
-- 4. "voice-intros" - Public bucket for voice introductions

-- ============================================
-- PAYMENT SYSTEM TABLES
-- Added from migrations/20260129_payments_schema.sql
-- ============================================

-- Create enum types for payment system
DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'escrow_fund', 'escrow_release', 'withdrawal', 'refund', 'platform_fee');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE withdrawal_status_enum AS ENUM ('pending', 'processing', 'completed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WALLETS TABLE: Tracks user balances
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(12, 2) DEFAULT 0 CHECK (balance >= 0),
    pending_balance DECIMAL(12, 2) DEFAULT 0,
    total_earned DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS TABLE: All financial movements
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    type transaction_type_enum NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(12, 2) DEFAULT 0,
    status transaction_status_enum DEFAULT 'pending',
    payment_gateway VARCHAR(50), -- 'flouci', 'd17', etc.
    payment_gateway_id VARCHAR(255), -- External payment reference
    payment_gateway_response JSONB,
    description TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WITHDRAWALS TABLE: Payout requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2) GENERATED ALWAYS AS (amount - fee) STORED,
    method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'd17', etc.
    status withdrawal_status_enum DEFAULT 'pending',
    bank_name VARCHAR(100),
    iban VARCHAR(50),
    d17_phone VARCHAR(20),
    notes TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT withdrawals_amount_positive CHECK (amount > 0),
    CONSTRAINT withdrawals_amount_minimum CHECK (amount >= 20)
);

-- PAYMENT_METHODS TABLE: Saved payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'bank', 'd17', 'card'
    is_default BOOLEAN DEFAULT false,
    bank_name VARCHAR(100),
    iban VARCHAR(50),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    d17_phone VARCHAR(20),
    label VARCHAR(100),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment tables
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_contract_id ON transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway_id ON transactions(payment_gateway_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- RLS Policies for wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System creates wallets" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for auto-creating wallet on profile creation
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_wallet
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_wallet_for_user();

-- Add realtime for payment tables
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;


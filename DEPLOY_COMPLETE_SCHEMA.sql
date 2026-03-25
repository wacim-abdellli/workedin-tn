-- =====================================================
-- KHEDMA.TN COMPLETE DATABASE DEPLOYMENT SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- STEP 2: CREATE ENUMS (Skip if exists)
-- ============================================
DO $$ BEGIN CREATE TYPE user_type_enum AS ENUM ('freelancer', 'client', 'both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE language_enum AS ENUM ('ar', 'fr', 'en'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE availability_enum AS ENUM ('available', 'busy', 'offline'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_type_enum AS ENUM ('fixed_price', 'hourly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_category_enum AS ENUM ('design', 'development', 'writing', 'translation', 'video', 'marketing', 'data', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_duration_enum AS ENUM ('less_than_1_month', '1_3_months', '3_6_months', 'more_than_6_months'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE experience_level_enum AS ENUM ('beginner', 'intermediate', 'expert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_visibility_enum AS ENUM ('public', 'invite_only'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_status_enum AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE proposal_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contract_status_enum AS ENUM ('active', 'completed', 'cancelled', 'disputed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status_enum AS ENUM ('pending', 'in_escrow', 'released', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'd17', 'cash', 'payoneer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE milestone_status_enum AS ENUM ('pending', 'submitted', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type_enum AS ENUM ('new_job', 'new_proposal', 'message', 'payment', 'review', 'contract_update', 'milestone', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'escrow_fund', 'escrow_release', 'withdrawal', 'refund', 'platform_fee'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE withdrawal_status_enum AS ENUM ('pending', 'processing', 'completed', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- STEP 3: CREATE TABLES
-- ============================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_type_enum DEFAULT 'client',
    full_name TEXT NOT NULL DEFAULT 'مستخدم جديد',
    phone TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 500),
    location TEXT,
    preferred_language language_enum DEFAULT 'ar',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FREELANCER_PROFILES
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PORTFOLIO_ITEMS
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

-- 4. JOBS
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category job_category_enum DEFAULT 'other',
    subcategory TEXT,
    job_type job_type_enum DEFAULT 'fixed_price',
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    duration job_duration_enum,
    experience_level experience_level_enum DEFAULT 'intermediate',
    required_skills JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    visibility job_visibility_enum DEFAULT 'public',
    status job_status_enum DEFAULT 'open',
    proposals_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROPOSALS
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    delivery_time_days INTEGER NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status proposal_status_enum DEFAULT 'pending',
    is_invited BOOLEAN DEFAULT false,
    client_viewed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, freelancer_id)
);

-- 6. CONTRACTS
CREATE TABLE IF NOT EXISTS contracts (
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

-- 7. MILESTONES
CREATE TABLE IF NOT EXISTS milestones (
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

-- 8. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count_1 INT DEFAULT 0,
    unread_count_2 INT DEFAULT 0,
    CONSTRAINT conversations_participants_order CHECK (participant_1 < participant_2),
    UNIQUE(participant_1, participant_2)
);

-- 9. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    skills_rating JSONB,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contract_id, reviewer_id)
);

-- 11. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. WALLETS
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

-- 13. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    type transaction_type_enum NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(12, 2) DEFAULT 0,
    status transaction_status_enum DEFAULT 'pending',
    payment_gateway VARCHAR(50),
    payment_gateway_id VARCHAR(255),
    payment_gateway_response JSONB,
    description TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(12, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2) GENERATED ALWAYS AS (amount - fee) STORED,
    method VARCHAR(50) NOT NULL,
    status withdrawal_status_enum DEFAULT 'pending',
    bank_name VARCHAR(100),
    iban VARCHAR(50),
    d17_phone VARCHAR(20),
    notes TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PAYMENT_METHODS
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
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

-- ============================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- ============================================
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
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- FREELANCER_PROFILES
DROP POLICY IF EXISTS "Freelancer profiles viewable" ON freelancer_profiles;
CREATE POLICY "Freelancer profiles viewable" ON freelancer_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Freelancers can insert own" ON freelancer_profiles;
CREATE POLICY "Freelancers can insert own" ON freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Freelancers can update own" ON freelancer_profiles;
CREATE POLICY "Freelancers can update own" ON freelancer_profiles FOR UPDATE USING (auth.uid() = id);

-- PORTFOLIO_ITEMS
DROP POLICY IF EXISTS "Portfolio items viewable" ON portfolio_items;
CREATE POLICY "Portfolio items viewable" ON portfolio_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Freelancers manage portfolio" ON portfolio_items;
CREATE POLICY "Freelancers manage portfolio" ON portfolio_items FOR ALL USING (auth.uid() = freelancer_id);

-- JOBS
DROP POLICY IF EXISTS "Jobs viewable" ON jobs;
CREATE POLICY "Jobs viewable" ON jobs FOR SELECT USING (visibility = 'public' OR client_id = auth.uid());
DROP POLICY IF EXISTS "Clients can insert jobs" ON jobs;
CREATE POLICY "Clients can insert jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Clients can update own jobs" ON jobs;
CREATE POLICY "Clients can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Clients can delete own jobs" ON jobs;
CREATE POLICY "Clients can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = client_id);

-- PROPOSALS
DROP POLICY IF EXISTS "Proposals viewable by parties" ON proposals;
CREATE POLICY "Proposals viewable by parties" ON proposals FOR SELECT 
    USING (freelancer_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));
DROP POLICY IF EXISTS "Freelancers can submit proposals" ON proposals;
CREATE POLICY "Freelancers can submit proposals" ON proposals FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Parties can update proposals" ON proposals;
CREATE POLICY "Parties can update proposals" ON proposals FOR UPDATE 
    USING (freelancer_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));

-- CONTRACTS
DROP POLICY IF EXISTS "Contracts viewable by parties" ON contracts;
CREATE POLICY "Contracts viewable by parties" ON contracts FOR SELECT USING (freelancer_id = auth.uid() OR client_id = auth.uid());
DROP POLICY IF EXISTS "Clients can create contracts" ON contracts;
CREATE POLICY "Clients can create contracts" ON contracts FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Parties can update contracts" ON contracts;
CREATE POLICY "Parties can update contracts" ON contracts FOR UPDATE USING (freelancer_id = auth.uid() OR client_id = auth.uid());

-- MILESTONES
DROP POLICY IF EXISTS "Milestones viewable by parties" ON milestones;
CREATE POLICY "Milestones viewable by parties" ON milestones FOR SELECT 
    USING (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_id AND (contracts.freelancer_id = auth.uid() OR contracts.client_id = auth.uid())));
DROP POLICY IF EXISTS "Clients can create milestones" ON milestones;
CREATE POLICY "Clients can create milestones" ON milestones FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_id AND contracts.client_id = auth.uid()));
DROP POLICY IF EXISTS "Parties can update milestones" ON milestones;
CREATE POLICY "Parties can update milestones" ON milestones FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_id AND (contracts.freelancer_id = auth.uid() OR contracts.client_id = auth.uid())));

-- MESSAGES
DROP POLICY IF EXISTS "Messages viewable by parties" ON messages;
CREATE POLICY "Messages viewable by parties" ON messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Receivers can update messages" ON messages;
CREATE POLICY "Receivers can update messages" ON messages FOR UPDATE USING (receiver_id = auth.uid());

-- REVIEWS
DROP POLICY IF EXISTS "Reviews viewable" ON reviews;
CREATE POLICY "Reviews viewable" ON reviews FOR SELECT USING (is_public = true OR reviewer_id = auth.uid() OR reviewee_id = auth.uid());
DROP POLICY IF EXISTS "Parties can create reviews" ON reviews;
CREATE POLICY "Parties can create reviews" ON reviews FOR INSERT 
    WITH CHECK (auth.uid() = reviewer_id AND EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_id AND contracts.status = 'completed'));

-- FAVORITES
DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- WALLETS
DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
CREATE POLICY "Users view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create own wallet" ON wallets;
CREATE POLICY "Users create own wallet" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own wallet" ON wallets;
CREATE POLICY "Users update own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create transactions" ON transactions;
CREATE POLICY "Users create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WITHDRAWALS
DROP POLICY IF EXISTS "Users view own withdrawals" ON withdrawals;
CREATE POLICY "Users view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users request withdrawals" ON withdrawals;
CREATE POLICY "Users request withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PAYMENT_METHODS
DROP POLICY IF EXISTS "Users manage payment methods" ON payment_methods;
CREATE POLICY "Users manage payment methods" ON payment_methods FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: CREATE TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
        COALESCE((NEW.raw_user_meta_data->>'preferred_language')::language_enum, 'ar')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_user_wallet ON profiles;
CREATE TRIGGER create_user_wallet AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION create_wallet_for_user();

-- Update proposals count
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

DROP TRIGGER IF EXISTS update_proposals_count ON proposals;
CREATE TRIGGER update_proposals_count AFTER INSERT OR DELETE ON proposals FOR EACH ROW EXECUTE FUNCTION update_job_proposals_count();

-- Update freelancer stats on contract completion
CREATE OR REPLACE FUNCTION update_freelancer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE freelancer_profiles 
        SET jobs_completed = jobs_completed + 1, total_earnings = total_earnings + NEW.amount
        WHERE id = NEW.freelancer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_contract_completed ON contracts;
CREATE TRIGGER on_contract_completed AFTER UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_freelancer_stats();

-- Update portfolio count
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

DROP TRIGGER IF EXISTS update_portfolio_items_count ON portfolio_items;
CREATE TRIGGER update_portfolio_items_count AFTER INSERT OR DELETE ON portfolio_items FOR EACH ROW EXECUTE FUNCTION update_portfolio_count();

-- ============================================
-- STEP 7: CREATE STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
    ('portfolio', 'portfolio', true, 10485760, ARRAY['image/*', 'video/*', 'application/pdf']),
    ('voice_intros', 'voice_intros', true, 5242880, ARRAY['audio/*']),
    ('attachments', 'attachments', false, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 8: STORAGE RLS POLICIES
-- ============================================

-- AVATARS
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth users upload avatars" ON storage.objects;
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth users update avatars" ON storage.objects;
CREATE POLICY "Auth users update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth users delete avatars" ON storage.objects;
CREATE POLICY "Auth users delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- PORTFOLIO
DROP POLICY IF EXISTS "Anyone can view portfolio" ON storage.objects;
CREATE POLICY "Anyone can view portfolio" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Auth users upload portfolio" ON storage.objects;
CREATE POLICY "Auth users upload portfolio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Auth users update portfolio" ON storage.objects;
CREATE POLICY "Auth users update portfolio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Auth users delete portfolio" ON storage.objects;
CREATE POLICY "Auth users delete portfolio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'portfolio');

-- VOICE_INTROS
DROP POLICY IF EXISTS "Anyone can view voice_intros" ON storage.objects;
CREATE POLICY "Anyone can view voice_intros" ON storage.objects FOR SELECT USING (bucket_id = 'voice_intros');

DROP POLICY IF EXISTS "Auth users upload voice_intros" ON storage.objects;
CREATE POLICY "Auth users upload voice_intros" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice_intros');

-- ============================================
-- STEP 9: ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;

-- ============================================
-- VERIFICATION: Run this to check everything
-- ============================================
SELECT 'Tables Created:' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public';

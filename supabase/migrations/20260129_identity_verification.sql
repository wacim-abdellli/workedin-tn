-- Identity Verification System Migration
-- Tunisia-specific CIN (Carte d'Identité Nationale) verification

-- ============================================
-- 1. IDENTITY VERIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cin_number VARCHAR(8) NOT NULL,
    cin_front_url TEXT NOT NULL,
    cin_back_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_resubmit')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One active verification per user
    CONSTRAINT unique_user_verification UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);

-- ============================================
-- 2. ADD cin_submitted TO PROFILES (if missing)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'cin_submitted'
    ) THEN
        ALTER TABLE profiles ADD COLUMN cin_submitted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================
-- 3. RLS POLICIES FOR IDENTITY VERIFICATIONS
-- ============================================

ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification
CREATE POLICY "Users can view own verification"
    ON identity_verifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own verification
CREATE POLICY "Users can submit verification"
    ON identity_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification (for resubmission)
CREATE POLICY "Users can update own verification"
    ON identity_verifications FOR UPDATE
    USING (auth.uid() = user_id AND status IN ('rejected', 'requires_resubmit'));

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
    ON identity_verifications FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND user_type = 'admin'
    ));

-- Admins can update verification status
CREATE POLICY "Admins can update verifications"
    ON identity_verifications FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND user_type = 'admin'
    ));

-- ============================================
-- 4. STORAGE BUCKET FOR IDENTITY DOCUMENTS
-- ============================================

-- Note: Run this in Supabase Dashboard SQL Editor if storage buckets don't exist
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'identity-documents', 
--     'identity-documents', 
--     false,
--     5242880, -- 5MB limit
--     ARRAY['image/jpeg', 'image/png', 'image/webp']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. STORAGE RLS POLICIES
-- ============================================

-- Users can upload to their own folder
-- CREATE POLICY "Users can upload own documents"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--         bucket_id = 'identity-documents' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Users can view their own documents
-- CREATE POLICY "Users can view own documents"
--     ON storage.objects FOR SELECT
--     USING (
--         bucket_id = 'identity-documents' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Admins can view all documents
-- CREATE POLICY "Admins can view all identity documents"
--     ON storage.objects FOR SELECT
--     USING (
--         bucket_id = 'identity-documents' 
--         AND EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() AND user_type = 'admin'
--         )
--     );

-- ============================================
-- 6. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_identity_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_identity_verification_updated_at ON identity_verifications;
CREATE TRIGGER trigger_update_identity_verification_updated_at
    BEFORE UPDATE ON identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_identity_verification_updated_at();

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload config';

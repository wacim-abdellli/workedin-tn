-- Identity verification submissions table
CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cin_number TEXT NOT NULL,
    cin_front_url TEXT NOT NULL,
    cin_back_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and insert their own verification
CREATE POLICY "identity_verifications_select" ON identity_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "identity_verifications_insert" ON identity_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pending verification (to resubmit)
CREATE POLICY "identity_verifications_delete" ON identity_verifications
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Index for admin queries
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);

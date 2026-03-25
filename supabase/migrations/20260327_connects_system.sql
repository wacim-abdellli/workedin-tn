-- =====================================================
-- Connects Credit System
-- Freelancers spend "connects" to submit proposals
-- New users get 20 connects free. Each proposal costs 2.
-- =====================================================

-- 1. Add connects_balance column to freelancer_profiles
ALTER TABLE public.freelancer_profiles
    ADD COLUMN IF NOT EXISTS connects_balance INTEGER NOT NULL DEFAULT 20,
    ADD COLUMN IF NOT EXISTS connects_used INTEGER NOT NULL DEFAULT 0;

-- 2. Connects transaction log
CREATE TABLE IF NOT EXISTS public.connects_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = added, negative = spent
    reason TEXT NOT NULL,    -- 'initial_grant' | 'proposal_submitted' | 'proposal_withdrawn' | 'purchased' | 'admin_grant'
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_connects_txn_freelancer ON public.connects_transactions(freelancer_id, created_at DESC);

-- 3. RLS on connects_transactions
ALTER TABLE public.connects_transactions ENABLE ROW LEVEL SECURITY;

-- Freelancers can only see their own
CREATE POLICY "connects_select_own" ON public.connects_transactions
    FOR SELECT USING (auth.uid() = freelancer_id);

-- Only server-side (service role) can insert
CREATE POLICY "connects_insert_service" ON public.connects_transactions
    FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

-- 4. Function: spend connects when proposal submitted (atomic)
CREATE OR REPLACE FUNCTION spend_connects_for_proposal(
    p_freelancer_id UUID,
    p_proposal_id UUID,
    p_cost INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- Lock the row
    SELECT connects_balance INTO v_balance
    FROM freelancer_profiles
    WHERE id = p_freelancer_id
    FOR UPDATE;

    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Freelancer profile not found');
    END IF;

    IF v_balance < p_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient connects', 'balance', v_balance);
    END IF;

    -- Deduct connects
    UPDATE freelancer_profiles
    SET
        connects_balance = connects_balance - p_cost,
        connects_used = connects_used + p_cost
    WHERE id = p_freelancer_id;

    -- Log the transaction
    INSERT INTO connects_transactions (freelancer_id, amount, reason, proposal_id)
    VALUES (p_freelancer_id, -p_cost, 'proposal_submitted', p_proposal_id);

    RETURN jsonb_build_object('success', true, 'balance', v_balance - p_cost);
END;
$$;

-- 5. Function: refund connects when proposal withdrawn
CREATE OR REPLACE FUNCTION refund_connects_for_proposal(
    p_freelancer_id UUID,
    p_proposal_id UUID,
    p_refund INTEGER DEFAULT 2
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE freelancer_profiles
    SET
        connects_balance = connects_balance + p_refund,
        connects_used = GREATEST(0, connects_used - p_refund)
    WHERE id = p_freelancer_id;

    INSERT INTO connects_transactions (freelancer_id, amount, reason, proposal_id)
    VALUES (p_freelancer_id, p_refund, 'proposal_withdrawn', p_proposal_id);
END;
$$;

-- 6. Grant initial connects to existing freelancers who have 0
UPDATE public.freelancer_profiles
SET connects_balance = 20
WHERE connects_balance = 0;

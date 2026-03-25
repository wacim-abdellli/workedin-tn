-- =====================================================
-- Dispute Resolution System
-- Tracks disputes separately from contract status
-- Allows admin to log resolution decisions
-- =====================================================

-- 1. Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved_client', 'resolved_freelancer', 'resolved_split', 'cancelled')),
    admin_note TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_contract ON public.disputes(contract_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- 2. RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Parties of the contract can read their own disputes
CREATE POLICY "disputes_select_parties" ON public.disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts c
            WHERE c.id = contract_id
              AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
        )
    );

-- Admins can read all disputes
CREATE POLICY "disputes_select_admin" ON public.disputes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Parties can open a dispute
CREATE POLICY "disputes_insert" ON public.disputes
    FOR INSERT WITH CHECK (auth.uid() = opened_by);

-- Only admins can update (resolve)
CREATE POLICY "disputes_update_admin" ON public.disputes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 3. Function: admin resolves dispute
-- resolution: 'resolved_client' | 'resolved_freelancer' | 'resolved_split' | 'cancelled'
CREATE OR REPLACE FUNCTION resolve_dispute(
    p_dispute_id UUID,
    p_resolution TEXT,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract_id UUID;
    v_admin_id UUID := auth.uid();
    v_is_admin BOOLEAN;
BEGIN
    -- Verify caller is admin
    SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_admin_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'Only admins can resolve disputes';
    END IF;

    -- Get contract id
    SELECT contract_id INTO v_contract_id FROM disputes WHERE id = p_dispute_id;
    IF v_contract_id IS NULL THEN
        RAISE EXCEPTION 'Dispute not found';
    END IF;

    -- Resolve the dispute record
    UPDATE disputes SET
        status = p_resolution,
        admin_note = p_admin_note,
        resolved_by = v_admin_id,
        resolved_at = now()
    WHERE id = p_dispute_id;

    -- Update contract based on resolution
    CASE p_resolution
        WHEN 'resolved_client' THEN
            -- Client wins: cancel contract, refund client
            UPDATE contracts SET status = 'cancelled', updated_at = now() WHERE id = v_contract_id;
        WHEN 'resolved_freelancer' THEN
            -- Freelancer wins: mark completed, release payment
            UPDATE contracts SET
                status = 'completed',
                payment_status = 'released',
                completed_at = now(),
                updated_at = now()
            WHERE id = v_contract_id;
        WHEN 'resolved_split', 'cancelled' THEN
            -- Admin-mediated or dropped: cancel contract
            UPDATE contracts SET status = 'cancelled', updated_at = now() WHERE id = v_contract_id;
        ELSE
            NULL;
    END CASE;
END;
$$;

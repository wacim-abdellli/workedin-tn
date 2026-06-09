-- ============================================================================
-- Fix Sandbox Escrow ID Generation & Backfill Null IDs
-- Migration: 20260609040000_fix_sandbox_escrow_ids.sql
-- ============================================================================

-- 1. Redefine sandbox_fund_escrow to automatically populate dhmad_escrow_id
CREATE OR REPLACE FUNCTION public.sandbox_fund_escrow(
    p_contract_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id    UUID;
    v_contract     RECORD;
    v_mock_escrow_id TEXT;
BEGIN
    -- 1. Verify caller is authenticated
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'PGRST301';
    END IF;

    -- 2. Fetch contract with a lock to prevent double-funding
    SELECT id, client_id, freelancer_id, status::text AS status, funded_at, amount, dhmad_escrow_id
    INTO   v_contract
    FROM   contracts
    WHERE  id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Only the client can fund escrow
    IF v_contract.client_id <> v_caller_id THEN
        RAISE EXCEPTION 'Only the client can fund escrow' USING ERRCODE = '42501';
    END IF;

    -- 4. Idempotency: if already funded and has an escrow ID, return success without error
    IF v_contract.funded_at IS NOT NULL AND v_contract.dhmad_escrow_id IS NOT NULL THEN
        RETURN json_build_object('amount', v_contract.amount, 'already_funded', TRUE);
    END IF;

    -- Generate a mock Dhmad escrow ID if not present
    v_mock_escrow_id := COALESCE(
        v_contract.dhmad_escrow_id,
        'dhmad_mock_' || replace(gen_random_uuid()::text, '-', '')
    );

    -- 5. Only allow funding on active/pending_payment contracts
    IF v_contract.status NOT IN ('active', 'pending_payment') THEN
        RAISE EXCEPTION 'Contract is not in a fundable state (status: %)', v_contract.status
            USING ERRCODE = '22000';
    END IF;

    -- 6. Mark escrow as funded and assign the mock Dhmad escrow ID
    UPDATE contracts
    SET
        payment_status = 'in_escrow',
        status        = 'active',
        funded_at     = NOW(),
        dhmad_escrow_id = v_mock_escrow_id,
        updated_at    = NOW()
    WHERE id = p_contract_id;

    RETURN json_build_object('amount', v_contract.amount, 'already_funded', FALSE, 'dhmad_escrow_id', v_mock_escrow_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sandbox_fund_escrow(UUID) TO authenticated;

-- 2. Backfill existing funded contracts that are missing a dhmad_escrow_id
UPDATE public.contracts
SET dhmad_escrow_id = 'dhmad_mock_' || replace(gen_random_uuid()::text, '-', ''),
    updated_at = NOW()
WHERE funded_at IS NOT NULL 
  AND dhmad_escrow_id IS NULL;

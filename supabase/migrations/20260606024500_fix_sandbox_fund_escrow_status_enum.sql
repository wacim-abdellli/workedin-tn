CREATE OR REPLACE FUNCTION sandbox_fund_escrow(
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
BEGIN
    -- 1. Verify caller is authenticated
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'PGRST301';
    END IF;

    -- 2. Fetch contract with a lock to prevent double-funding.
    -- Cast status to text so this works whether pending_payment exists in the enum or not.
    SELECT id, client_id, freelancer_id, status::text AS status, funded_at, amount
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

    -- 4. Idempotency: if already funded, return success without error
    IF v_contract.funded_at IS NOT NULL THEN
        RETURN json_build_object('amount', v_contract.amount, 'already_funded', TRUE);
    END IF;

    -- 5. Only allow funding on active/pending_payment contracts
    IF v_contract.status NOT IN ('active', 'pending_payment') THEN
        RAISE EXCEPTION 'Contract is not in a fundable state (status: %)', v_contract.status
            USING ERRCODE = '22000';
    END IF;

    -- 6. Mark escrow as funded
    UPDATE contracts
    SET
        payment_status = 'in_escrow',
        status        = 'active',
        funded_at     = NOW(),
        updated_at    = NOW()
    WHERE id = p_contract_id;

    RETURN json_build_object('amount', v_contract.amount, 'already_funded', FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION sandbox_fund_escrow(UUID) TO authenticated;

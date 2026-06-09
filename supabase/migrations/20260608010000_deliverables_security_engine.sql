-- ============================================================================
-- Deliverables Security Engine (48-Hour Escrow Hold & Snapshots)
-- ============================================================================

-- 1. Alter public.contracts to support clearance holds and dispute flags
ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS escrow_pending_clearance_until timestamptz DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS escrow_hold_disputed boolean DEFAULT false;

-- 2. Alter public.contract_delivery_links to support platforms-owned snapshots
ALTER TABLE public.contract_delivery_links
    ADD COLUMN IF NOT EXISTS snapshot_storage_path text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS snapshot_bucket text DEFAULT 'contract-files-snapshots';

-- 3. Update release_contract_payment_atomic to set the 48-hour hold buffer
CREATE OR REPLACE FUNCTION public.release_contract_payment_atomic(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_client_id uuid;
    v_contract_status text;
    v_payment_status text;
    v_completed_at timestamptz;
    v_delivery_note text;
    v_escrow_funded boolean;
    v_dhmad_escrow_id text;
    v_has_escrow_funded boolean := false;
    v_clearance_interval interval := interval '48 hours';
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('release_contract_payment:' || p_contract_id::text));

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'escrow_funded'
    ) INTO v_has_escrow_funded;

    IF v_has_escrow_funded THEN
        SELECT client_id, status::text, payment_status::text, completed_at, delivery_note, escrow_funded, dhmad_escrow_id
        INTO v_client_id, v_contract_status, v_payment_status, v_completed_at, v_delivery_note, v_escrow_funded, v_dhmad_escrow_id
        FROM public.contracts
        WHERE id = p_contract_id
        FOR UPDATE;
    ELSE
        SELECT client_id, status::text, payment_status::text, completed_at, delivery_note, NULL::boolean, dhmad_escrow_id
        INTO v_client_id, v_contract_status, v_payment_status, v_completed_at, v_delivery_note, v_escrow_funded, v_dhmad_escrow_id
        FROM public.contracts
        WHERE id = p_contract_id
        FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_client_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the client can release payment';
    END IF;

    IF v_has_escrow_funded AND COALESCE(v_escrow_funded, false) = false THEN
        RAISE EXCEPTION 'Escrow must be funded before payment can be released';
    END IF;
    
    IF v_dhmad_escrow_id IS NULL THEN
        RAISE EXCEPTION 'Cannot release payment: Dhmad escrow is missing. Ensure the contract was properly funded via Dhmad.';
    END IF;

    -- If payment is already fully released, return early
    IF v_payment_status = 'released' THEN
        RETURN jsonb_build_object(
            'success', true,
            'contract_id', p_contract_id,
            'status', v_contract_status,
            'payment_status', v_payment_status,
            'existing', true
        );
    END IF;

    IF v_contract_status <> 'delivery_submitted' THEN
        RAISE EXCEPTION 'Payment can only be released after delivery is submitted and under review';
    END IF;

    IF v_delivery_note IS NULL OR length(btrim(v_delivery_note)) = 0 THEN
        RAISE EXCEPTION 'Work must be delivered before payment can be released';
    END IF;

    -- Unlock final assets so client can verify/inspect during the clearance hold
    UPDATE public.contract_delivery_assets a
    SET access_state = 'released'
    FROM public.contract_deliveries d
    WHERE d.contract_id = p_contract_id
      AND d.id = a.delivery_id
      AND a.access_state = 'locked';

    -- Set the contract to completed status but keep payment_status as 'in_escrow'
    -- with a 48-hour clearance hold in the future.
    UPDATE public.contracts
    SET status = 'completed',
        payment_status = 'in_escrow',
        completed_at = COALESCE(completed_at, now()),
        escrow_pending_clearance_until = now() + v_clearance_interval,
        escrow_hold_disputed = false,
        review_due_at = NULL,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', 'completed',
        'payment_status', 'in_escrow',
        'escrow_pending_clearance_until', now() + v_clearance_interval,
        'existing', false
    );
END;
$$;

-- 4. Create RPC function to freeze/hold clearance due to a dispute or issue
CREATE OR REPLACE FUNCTION public.hold_clearance_payment_dispute(
    p_contract_id uuid,
    p_dispute_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_client_id uuid;
    v_contract_status text;
    v_payment_status text;
    v_clearance_until timestamptz;
    v_disputed boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('hold_clearance_payment:' || p_contract_id::text));

    SELECT client_id, status::text, payment_status::text, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_client_id, v_contract_status, v_payment_status, v_clearance_until, v_disputed
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_client_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the client can hold payment clearance';
    END IF;

    IF v_clearance_until IS NULL OR now() >= v_clearance_until THEN
        RAISE EXCEPTION 'Escrow clearance hold window has expired or was never initialized';
    END IF;

    IF v_payment_status = 'released' THEN
        RAISE EXCEPTION 'Payment has already cleared and cannot be held';
    END IF;

    -- Freeze the hold, mark disputed, and revert status to disputed
    UPDATE public.contracts
    SET status = 'disputed',
        escrow_hold_disputed = true,
        updated_at = now()
    WHERE id = p_contract_id;

    -- Insert system/audit message if desired or simply return
    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', 'disputed',
        'escrow_hold_disputed', true
    );
END;
$$;

-- 5. Create RPC function to finalize clearance and release funds to freelancer wallet balance
CREATE OR REPLACE FUNCTION public.finalize_clearance_payment(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_freelancer_id uuid;
    v_amount numeric;
    v_payment_status text;
    v_contract_status text;
    v_clearance_until timestamptz;
    v_hold_disputed boolean;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('finalize_clearance:' || p_contract_id::text));

    SELECT freelancer_id, amount, status::text, payment_status::text, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_freelancer_id, v_amount, v_contract_status, v_payment_status, v_clearance_until, v_hold_disputed
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_payment_status = 'released' THEN
        RETURN jsonb_build_object(
            'success', true,
            'contract_id', p_contract_id,
            'payment_status', 'released',
            'cleared', true,
            'existing', true
        );
    END IF;

    IF v_contract_status <> 'completed' OR v_hold_disputed = true THEN
        RAISE EXCEPTION 'Contract is not in completed state or has an active dispute hold';
    END IF;

    IF v_clearance_until IS NULL OR now() < v_clearance_until THEN
        RAISE EXCEPTION 'Clearance hold period has not expired yet';
    END IF;

    -- Update contract payment status to released
    UPDATE public.contracts
    SET payment_status = 'released',
        updated_at = now()
    WHERE id = p_contract_id;

    -- Credit the freelancer's wallet balance
    UPDATE public.wallets
    SET balance = balance + v_amount,
        updated_at = now()
    WHERE user_id = v_freelancer_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'payment_status', 'released',
        'cleared', true,
        'existing', false
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.release_contract_payment_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hold_clearance_payment_dispute(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) TO service_role;

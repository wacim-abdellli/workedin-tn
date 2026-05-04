-- Migration to enforce Dhmad escrow presence on payment release
-- Fulfills Decision 4 from the Strategic Analysis

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
    
    -- ENFORCE DHMAD ESCROW EXISTENCE
    IF v_dhmad_escrow_id IS NULL THEN
        RAISE EXCEPTION 'Cannot release payment: Dhmad escrow is missing. Ensure the contract was properly funded via Dhmad.';
    END IF;

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

    UPDATE public.contract_delivery_assets a
    SET access_state = 'released'
    FROM public.contract_deliveries d
    WHERE d.contract_id = p_contract_id
      AND d.id = a.delivery_id
      AND a.access_state = 'locked';

    UPDATE public.contracts
    SET status = 'completed',
        payment_status = 'released',
        completed_at = COALESCE(completed_at, now()),
        review_due_at = NULL,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', 'completed',
        'payment_status', 'released',
        'existing', false
    );
END;
$$;

ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS funded_at timestamptz,
    ADD COLUMN IF NOT EXISTS delivery_submitted_at timestamptz,
    ADD COLUMN IF NOT EXISTS review_due_at timestamptz,
    ADD COLUMN IF NOT EXISTS revision_requested_at timestamptz;

CREATE OR REPLACE FUNCTION public.submit_contract_delivery_atomic(
    p_contract_id uuid,
    p_delivery_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_freelancer_id uuid;
    v_contract_status text;
    v_next_status text;
    v_delivery_note text := NULLIF(btrim(COALESCE(p_delivery_note, '')), '');
    v_review_due_at timestamptz := now() + interval '3 days';
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('submit_contract_delivery:' || p_contract_id::text));

    SELECT freelancer_id, status::text
    INTO v_freelancer_id, v_contract_status
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_freelancer_id THEN
        RAISE EXCEPTION 'Only the assigned freelancer can submit delivery';
    END IF;

    IF v_contract_status NOT IN ('active', 'revision_requested') THEN
        RAISE EXCEPTION 'Delivery is not allowed in the current contract state';
    END IF;

    v_next_status := CASE WHEN v_contract_status = 'revision_requested' THEN 'active' ELSE v_contract_status END;

    UPDATE public.contracts
    SET delivery_note = COALESCE(v_delivery_note, 'submitted'),
        status = v_next_status::public.contract_status_enum,
        delivery_submitted_at = now(),
        review_due_at = v_review_due_at,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', v_next_status,
        'delivery_note', COALESCE(v_delivery_note, 'submitted'),
        'delivery_submitted_at', now(),
        'review_due_at', v_review_due_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_contract_revision_atomic(
    p_contract_id uuid,
    p_reason text
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
    v_delivery_note text;
    v_revision_requests_count integer;
    v_max_revision_rounds integer;
    v_revision_requested_at timestamptz := now();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Revision reason is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('request_contract_revision:' || p_contract_id::text));

    SELECT client_id, status::text, delivery_note, revision_requests_count, max_revision_rounds
    INTO v_client_id, v_contract_status, v_delivery_note, v_revision_requests_count, v_max_revision_rounds
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_client_id THEN
        RAISE EXCEPTION 'Only the client can request revisions';
    END IF;

    IF v_contract_status <> 'active' THEN
        RAISE EXCEPTION 'Revisions can only be requested while the contract is active';
    END IF;

    IF v_delivery_note IS NULL OR length(btrim(v_delivery_note)) = 0 THEN
        RAISE EXCEPTION 'A delivery must be submitted before revisions can be requested';
    END IF;

    IF COALESCE(v_revision_requests_count, 0) >= COALESCE(v_max_revision_rounds, 0) THEN
        RAISE EXCEPTION 'Revision limit reached for this contract';
    END IF;

    UPDATE public.contracts
    SET status = 'revision_requested'::public.contract_status_enum,
        revision_requests_count = COALESCE(revision_requests_count, 0) + 1,
        revision_requested_at = v_revision_requested_at,
        review_due_at = NULL,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', 'revision_requested',
        'revision_requests_count', COALESCE(v_revision_requests_count, 0) + 1,
        'max_revision_rounds', COALESCE(v_max_revision_rounds, 0),
        'revision_requested_at', v_revision_requested_at
    );
END;
$$;

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
        SELECT client_id, status::text, payment_status::text, completed_at, delivery_note, escrow_funded
        INTO v_client_id, v_contract_status, v_payment_status, v_completed_at, v_delivery_note, v_escrow_funded
        FROM public.contracts
        WHERE id = p_contract_id
        FOR UPDATE;
    ELSE
        SELECT client_id, status::text, payment_status::text, completed_at, delivery_note, NULL::boolean
        INTO v_client_id, v_contract_status, v_payment_status, v_completed_at, v_delivery_note, v_escrow_funded
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

    IF v_payment_status = 'released' THEN
        RETURN jsonb_build_object(
            'success', true,
            'contract_id', p_contract_id,
            'status', v_contract_status,
            'payment_status', v_payment_status,
            'existing', true
        );
    END IF;

    IF v_contract_status <> 'active' THEN
        RAISE EXCEPTION 'Payment can only be released while the contract is active and under review';
    END IF;

    IF v_delivery_note IS NULL OR length(btrim(v_delivery_note)) = 0 THEN
        RAISE EXCEPTION 'Work must be delivered before payment can be released';
    END IF;

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

CREATE OR REPLACE FUNCTION public.complete_escrow_payment(
    p_transaction_id uuid,
    p_contract_id uuid,
    p_freelancer_id uuid,
    p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
    v_caller uuid := auth.uid();
    v_is_service_role boolean := (v_request_role = 'service_role');
    v_is_admin boolean := false;
    v_contract_row jsonb;
    v_transaction_row jsonb;
    v_contract_client_id uuid;
    v_contract_freelancer_id uuid;
    v_contract_amount numeric;
    v_contract_status text;
    v_contract_payment_status text;
    v_transaction_user_id uuid;
    v_transaction_contract_ref uuid;
    v_transaction_status text;
    v_next_payment_status text := NULL;
    v_has_paid_status boolean := false;
    v_has_in_escrow_status boolean := false;
    v_tx_update_sql text := 'UPDATE public.transactions SET status = ''completed''';
    v_contract_update_sql text := 'UPDATE public.contracts SET ';
    v_has_contract_assignment boolean := false;
BEGIN
    IF p_transaction_id IS NULL THEN
        RAISE EXCEPTION 'Transaction id is required';
    END IF;

    IF p_contract_id IS NULL THEN
        RAISE EXCEPTION 'Contract id is required';
    END IF;

    IF p_freelancer_id IS NULL THEN
        RAISE EXCEPTION 'Freelancer id is required';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    IF NOT v_is_service_role THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
        END IF;

        v_is_admin := public.is_admin();
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('complete_escrow_payment:' || p_transaction_id::text));

    SELECT to_jsonb(c)
    INTO v_contract_row
    FROM public.contracts c
    WHERE c.id = p_contract_id
    FOR UPDATE;

    IF v_contract_row IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    v_contract_client_id := NULLIF(v_contract_row ->> 'client_id', '')::uuid;
    v_contract_freelancer_id := NULLIF(v_contract_row ->> 'freelancer_id', '')::uuid;
    v_contract_amount := NULLIF(v_contract_row ->> 'amount', '')::numeric;
    v_contract_status := COALESCE(v_contract_row ->> 'status', '');
    v_contract_payment_status := COALESCE(v_contract_row ->> 'payment_status', '');

    IF v_contract_freelancer_id IS DISTINCT FROM p_freelancer_id THEN
        RAISE EXCEPTION 'Freelancer mismatch for contract';
    END IF;

    IF v_contract_amount IS NULL OR v_contract_amount <> p_amount THEN
        RAISE EXCEPTION 'Amount mismatch for contract';
    END IF;

    IF NOT v_is_service_role AND NOT v_is_admin AND v_contract_client_id IS DISTINCT FROM v_caller THEN
        RAISE EXCEPTION 'Only the contract client can complete escrow payment';
    END IF;

    SELECT to_jsonb(t)
    INTO v_transaction_row
    FROM public.transactions t
    WHERE t.id = p_transaction_id
    FOR UPDATE;

    IF v_transaction_row IS NULL THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    v_transaction_user_id := NULLIF(v_transaction_row ->> 'user_id', '')::uuid;
    v_transaction_contract_ref := COALESCE(
        NULLIF(v_transaction_row ->> 'contract_id', '')::uuid,
        NULLIF(v_transaction_row ->> 'reference_id', '')::uuid
    );
    v_transaction_status := COALESCE(v_transaction_row ->> 'status', '');

    IF v_transaction_contract_ref IS NOT NULL AND v_transaction_contract_ref <> p_contract_id THEN
        RAISE EXCEPTION 'Transaction is not linked to this contract';
    END IF;

    IF v_transaction_user_id IS NOT NULL AND v_transaction_user_id <> v_contract_client_id THEN
        RAISE EXCEPTION 'Transaction owner does not match contract client';
    END IF;

    IF v_transaction_status NOT IN ('pending', 'processing', 'completed') THEN
        RAISE EXCEPTION 'Transaction cannot be completed from status %', v_transaction_status;
    END IF;

    IF v_transaction_status = 'completed'
       AND (
            COALESCE((v_contract_row ->> 'escrow_funded')::boolean, false)
            OR v_contract_payment_status IN ('paid', 'in_escrow', 'released')
       ) THEN
        RETURN jsonb_build_object(
            'success', true,
            'transaction_id', p_transaction_id,
            'contract_id', p_contract_id,
            'payment_status', v_contract_payment_status,
            'existing', true
        );
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status_enum'
          AND e.enumlabel = 'paid'
    ) INTO v_has_paid_status;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status_enum'
          AND e.enumlabel = 'in_escrow'
    ) INTO v_has_in_escrow_status;

    IF v_has_paid_status THEN
        v_next_payment_status := 'paid';
    ELSIF v_has_in_escrow_status THEN
        v_next_payment_status := 'in_escrow';
    END IF;

    IF v_transaction_row ? 'completed_at' THEN
        v_tx_update_sql := v_tx_update_sql || ', completed_at = COALESCE(completed_at, now())';
    END IF;

    IF v_transaction_row ? 'updated_at' THEN
        v_tx_update_sql := v_tx_update_sql || ', updated_at = now()';
    END IF;

    v_tx_update_sql := v_tx_update_sql || ' WHERE id = $1';
    EXECUTE v_tx_update_sql USING p_transaction_id;

    IF v_contract_row ? 'escrow_funded' THEN
        v_contract_update_sql := v_contract_update_sql || 'escrow_funded = true';
        v_has_contract_assignment := true;
    END IF;

    IF (v_contract_row ? 'payment_status') AND v_next_payment_status IS NOT NULL THEN
        IF v_has_contract_assignment THEN
            v_contract_update_sql := v_contract_update_sql || ', ';
        END IF;

        v_contract_update_sql := v_contract_update_sql || format('payment_status = %L', v_next_payment_status);
        v_has_contract_assignment := true;
    END IF;

    IF v_contract_row ? 'funded_at' THEN
        IF v_has_contract_assignment THEN
            v_contract_update_sql := v_contract_update_sql || ', ';
        END IF;

        v_contract_update_sql := v_contract_update_sql || 'funded_at = COALESCE(funded_at, now())';
        v_has_contract_assignment := true;
    END IF;

    IF v_contract_status = 'pending_payment' THEN
        IF v_has_contract_assignment THEN
            v_contract_update_sql := v_contract_update_sql || ', ';
        END IF;

        v_contract_update_sql := v_contract_update_sql || 'status = ''active''';
        v_has_contract_assignment := true;
    END IF;

    IF v_contract_row ? 'updated_at' THEN
        IF v_has_contract_assignment THEN
            v_contract_update_sql := v_contract_update_sql || ', ';
        END IF;

        v_contract_update_sql := v_contract_update_sql || 'updated_at = now()';
        v_has_contract_assignment := true;
    END IF;

    IF NOT v_has_contract_assignment THEN
        RAISE EXCEPTION 'Contract row is missing escrow/payment columns required for completion';
    END IF;

    v_contract_update_sql := v_contract_update_sql || ' WHERE id = $1';
    EXECUTE v_contract_update_sql USING p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'contract_id', p_contract_id,
        'payment_status', COALESCE(v_next_payment_status, v_contract_payment_status),
        'existing', false
    );
END;
$$;

COMMENT ON COLUMN public.contracts.funded_at IS 'Timestamp when escrow funding was successfully completed for the contract.';
COMMENT ON COLUMN public.contracts.delivery_submitted_at IS 'Timestamp of the latest freelancer delivery submission.';
COMMENT ON COLUMN public.contracts.review_due_at IS 'Timestamp by which the client should review the current delivery submission.';
COMMENT ON COLUMN public.contracts.revision_requested_at IS 'Timestamp of the latest client revision request.';

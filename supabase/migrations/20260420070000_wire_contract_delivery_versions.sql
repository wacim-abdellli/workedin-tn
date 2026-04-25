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
    v_delivery_note text := NULLIF(btrim(COALESCE(p_delivery_note, '')), '');
    v_review_due_at timestamptz := now() + interval '3 days';
    v_version_number integer := 1;
    v_delivery_id uuid;
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

    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM public.contract_deliveries
    WHERE contract_id = p_contract_id;

    INSERT INTO public.contract_deliveries (
        contract_id,
        version_number,
        submitted_by,
        delivery_note,
        review_due_at,
        submitted_at
    )
    VALUES (
        p_contract_id,
        v_version_number,
        v_user_id,
        COALESCE(v_delivery_note, 'submitted'),
        v_review_due_at,
        now()
    )
    RETURNING id INTO v_delivery_id;

    UPDATE public.contracts
    SET delivery_note = COALESCE(v_delivery_note, 'submitted'),
        status = 'delivery_submitted'::public.contract_status_enum,
        delivery_submitted_at = now(),
        review_due_at = v_review_due_at,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'delivery_id', v_delivery_id,
        'version_number', v_version_number,
        'status', 'delivery_submitted',
        'delivery_note', COALESCE(v_delivery_note, 'submitted'),
        'delivery_submitted_at', now(),
        'review_due_at', v_review_due_at
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

COMMENT ON FUNCTION public.submit_contract_delivery_atomic(uuid, text) IS 'Creates a formal versioned contract delivery record and moves the contract into delivery_submitted under-review state.';
COMMENT ON FUNCTION public.release_contract_payment_atomic(uuid) IS 'Releases payment from delivery_submitted state and unlocks any locked final assets on the accepted delivery history.';

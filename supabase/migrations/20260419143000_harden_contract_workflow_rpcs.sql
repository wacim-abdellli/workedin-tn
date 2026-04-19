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
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', v_next_status,
        'delivery_note', COALESCE(v_delivery_note, 'submitted')
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
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Revision reason is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('request_contract_revision:' || p_contract_id::text));

    SELECT client_id, status::text, delivery_note
    INTO v_client_id, v_contract_status, v_delivery_note
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

    UPDATE public.contracts
    SET status = 'revision_requested'::public.contract_status_enum,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', 'revision_requested'
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

CREATE OR REPLACE FUNCTION public.open_dispute_atomic(
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
    v_freelancer_id uuid;
    v_contract_status text;
    v_existing_dispute_id uuid;
    v_dispute_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Dispute reason is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('open_dispute:' || p_contract_id::text));

    SELECT client_id, freelancer_id, status::text
    INTO v_client_id, v_freelancer_id, v_contract_status
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_client_id AND v_user_id <> v_freelancer_id THEN
        RAISE EXCEPTION 'Only contract parties can open a dispute';
    END IF;

    IF v_contract_status NOT IN ('pending_payment', 'active', 'revision_requested') THEN
        RAISE EXCEPTION 'A dispute cannot be opened in the current contract state';
    END IF;

    SELECT id
    INTO v_existing_dispute_id
    FROM public.disputes
    WHERE contract_id = p_contract_id
      AND status = 'open'
    LIMIT 1;

    IF v_existing_dispute_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'existing', true,
            'dispute_id', v_existing_dispute_id
        );
    END IF;

    UPDATE public.contracts
    SET status = 'disputed',
        updated_at = now()
    WHERE id = p_contract_id;

    INSERT INTO public.disputes (contract_id, opened_by, reason, status)
    VALUES (p_contract_id, v_user_id, p_reason, 'open')
    RETURNING id INTO v_dispute_id;

    RETURN jsonb_build_object(
        'success', true,
        'existing', false,
        'dispute_id', v_dispute_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contract_delivery_atomic(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_contract_revision_atomic(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_contract_payment_atomic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.open_dispute_atomic(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_contract_delivery_atomic(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_contract_revision_atomic(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_contract_payment_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_dispute_atomic(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.submit_contract_delivery_atomic(uuid, text) IS 'Atomically records freelancer delivery evidence and reopens revision_requested contracts back to active review.';
COMMENT ON FUNCTION public.request_contract_revision_atomic(uuid, text) IS 'Atomically records a client revision request and blocks revision requests before delivery evidence exists.';
COMMENT ON FUNCTION public.release_contract_payment_atomic(uuid) IS 'Atomically releases contract payment only after client authorization, funded escrow, active review state, and recorded delivery evidence.';
COMMENT ON FUNCTION public.open_dispute_atomic(uuid, text) IS 'Atomically opens disputes only from active workflow states and prevents duplicate open disputes.';

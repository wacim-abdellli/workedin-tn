ALTER TYPE public.contract_status_enum ADD VALUE IF NOT EXISTS 'delivery_submitted';

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
        'status', 'delivery_submitted',
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

    IF v_contract_status <> 'delivery_submitted' THEN
        RAISE EXCEPTION 'Revisions can only be requested after a delivery is submitted';
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

    IF v_contract_status <> 'delivery_submitted' THEN
        RAISE EXCEPTION 'Payment can only be released after delivery is submitted and under review';
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

CREATE OR REPLACE FUNCTION public.get_contract_review_timeout_candidates(
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    contract_id uuid,
    client_id uuid,
    freelancer_id uuid,
    review_due_at timestamptz,
    timeout_stage text,
    job_title text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH candidates AS (
        SELECT
            c.id AS contract_id,
            c.client_id,
            c.freelancer_id,
            c.review_due_at,
            CASE
                WHEN c.review_due_at <= now() AND c.review_overdue_notified_at IS NULL THEN 'overdue'
                WHEN c.review_due_at > now()
                     AND c.review_due_at <= now() + interval '24 hours'
                     AND c.review_reminder_sent_at IS NULL THEN 'reminder'
                ELSE NULL
            END AS timeout_stage,
            j.title AS job_title
        FROM public.contracts c
        LEFT JOIN public.jobs j ON j.id = c.job_id
        WHERE c.status = 'delivery_submitted'
          AND c.delivery_submitted_at IS NOT NULL
          AND c.review_due_at IS NOT NULL
          AND c.payment_status IS DISTINCT FROM 'released'
    )
    SELECT contract_id, client_id, freelancer_id, review_due_at, timeout_stage, COALESCE(job_title, 'Contract')
    FROM candidates
    WHERE timeout_stage IS NOT NULL
    ORDER BY review_due_at ASC
    LIMIT GREATEST(COALESCE(p_limit, 50), 1);
$$;

COMMENT ON FUNCTION public.submit_contract_delivery_atomic(uuid, text) IS 'Atomically records freelancer delivery evidence and moves the contract into delivery_submitted under-review state.';
COMMENT ON FUNCTION public.request_contract_revision_atomic(uuid, text) IS 'Atomically records a client revision request only from delivery_submitted state and blocks abusive revision loops.';
COMMENT ON FUNCTION public.release_contract_payment_atomic(uuid) IS 'Atomically releases contract payment only from delivery_submitted state after client approval and recorded delivery evidence.';
COMMENT ON FUNCTION public.get_contract_review_timeout_candidates(integer) IS 'Lists delivery_submitted contracts with due-soon or overdue review windows that still need timeout processing.';

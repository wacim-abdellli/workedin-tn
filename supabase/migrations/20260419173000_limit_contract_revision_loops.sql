ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS revision_requests_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_revision_rounds integer NOT NULL DEFAULT 2;

ALTER TABLE public.contracts
    DROP CONSTRAINT IF EXISTS contracts_revision_requests_count_check;
ALTER TABLE public.contracts
    ADD CONSTRAINT contracts_revision_requests_count_check CHECK (revision_requests_count >= 0);

ALTER TABLE public.contracts
    DROP CONSTRAINT IF EXISTS contracts_max_revision_rounds_check;
ALTER TABLE public.contracts
    ADD CONSTRAINT contracts_max_revision_rounds_check CHECK (max_revision_rounds >= 0);

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
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'status', 'revision_requested',
        'revision_requests_count', COALESCE(v_revision_requests_count, 0) + 1,
        'max_revision_rounds', COALESCE(v_max_revision_rounds, 0)
    );
END;
$$;

COMMENT ON FUNCTION public.request_contract_revision_atomic(uuid, text) IS 'Atomically records a client revision request, increments the revision counter, and blocks abusive revision loops once the contract limit is reached.';

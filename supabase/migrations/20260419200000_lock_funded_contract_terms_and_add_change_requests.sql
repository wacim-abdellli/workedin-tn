CREATE TABLE IF NOT EXISTS public.contract_change_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    request_summary text NOT NULL,
    request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    response_note text,
    responded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    responded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_change_requests_contract_id
    ON public.contract_change_requests(contract_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_change_requests_pending_unique
    ON public.contract_change_requests(contract_id)
    WHERE status = 'pending';

ALTER TABLE public.contract_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contract_parties_read_change_requests" ON public.contract_change_requests;
CREATE POLICY "contract_parties_read_change_requests"
ON public.contract_change_requests
FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_change_requests.contract_id
          AND auth.uid() IN (c.client_id, c.freelancer_id)
    )
);

DROP POLICY IF EXISTS "admin_manage_change_requests" ON public.contract_change_requests;
CREATE POLICY "admin_manage_change_requests"
ON public.contract_change_requests
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_contract_change_request_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_contract_change_request_updated_at ON public.contract_change_requests;
CREATE TRIGGER trg_touch_contract_change_request_updated_at
BEFORE UPDATE ON public.contract_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.touch_contract_change_request_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_locked_contract_term_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
    v_can_bypass boolean := (v_request_role = 'service_role');
    v_terms_locked boolean := false;
    v_old jsonb := to_jsonb(OLD);
    v_new jsonb := to_jsonb(NEW);
BEGIN
    IF v_can_bypass OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    v_terms_locked := COALESCE(NULLIF(v_old ->> 'funded_at', '') IS NOT NULL, false)
        OR COALESCE((v_old ->> 'escrow_funded')::boolean, false)
        OR COALESCE(v_old ->> 'payment_status', '') IN ('paid', 'in_escrow', 'released')
        OR COALESCE(v_old ->> 'status', '') IN ('active', 'revision_requested', 'completed', 'disputed');

    IF NOT v_terms_locked THEN
        RETURN NEW;
    END IF;

    IF (v_new ->> 'job_id') IS DISTINCT FROM (v_old ->> 'job_id')
        OR (v_new ->> 'client_id') IS DISTINCT FROM (v_old ->> 'client_id')
        OR (v_new ->> 'freelancer_id') IS DISTINCT FROM (v_old ->> 'freelancer_id')
        OR (v_new ->> 'amount') IS DISTINCT FROM (v_old ->> 'amount')
        OR (v_new ->> 'total_amount') IS DISTINCT FROM (v_old ->> 'total_amount')
        OR (v_new ->> 'title') IS DISTINCT FROM (v_old ->> 'title')
        OR (v_new ->> 'description') IS DISTINCT FROM (v_old ->> 'description')
        OR (v_new ->> 'contract_type') IS DISTINCT FROM (v_old ->> 'contract_type')
        OR (v_new ->> 'max_revision_rounds') IS DISTINCT FROM (v_old ->> 'max_revision_rounds')
    THEN
        RAISE EXCEPTION 'Funded contract terms are locked. Submit a formal contract change request instead.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_contract_term_edits ON public.contracts;
CREATE TRIGGER trg_prevent_locked_contract_term_edits
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_contract_term_edits();

CREATE OR REPLACE FUNCTION public.submit_contract_change_request_atomic(
    p_contract_id uuid,
    p_request_summary text,
    p_request_payload jsonb DEFAULT '{}'::jsonb
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
    v_funded_at timestamptz;
    v_request_id uuid;
    v_existing_request_id uuid;
    v_summary text := NULLIF(btrim(COALESCE(p_request_summary, '')), '');
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_summary IS NULL THEN
        RAISE EXCEPTION 'Change request summary is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('submit_contract_change_request:' || p_contract_id::text));

    SELECT client_id, freelancer_id, status::text, funded_at
    INTO v_client_id, v_freelancer_id, v_contract_status, v_funded_at
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_client_id AND v_user_id <> v_freelancer_id THEN
        RAISE EXCEPTION 'Only contract parties can submit change requests';
    END IF;

    IF v_funded_at IS NULL AND v_contract_status = 'pending_payment' THEN
        RAISE EXCEPTION 'Change requests open after funding. Update the proposal or contract draft before payment is secured.';
    END IF;

    IF v_contract_status NOT IN ('active', 'revision_requested', 'completed') THEN
        RAISE EXCEPTION 'Change requests are not available in the current contract state';
    END IF;

    SELECT id
    INTO v_existing_request_id
    FROM public.contract_change_requests
    WHERE contract_id = p_contract_id
      AND status = 'pending'
    LIMIT 1;

    IF v_existing_request_id IS NOT NULL THEN
        RAISE EXCEPTION 'A pending change request already exists for this contract';
    END IF;

    INSERT INTO public.contract_change_requests (
        contract_id,
        requested_by,
        request_summary,
        request_payload
    )
    VALUES (
        p_contract_id,
        v_user_id,
        v_summary,
        COALESCE(p_request_payload, '{}'::jsonb)
    )
    RETURNING id INTO v_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'change_request_id', v_request_id,
        'contract_id', p_contract_id,
        'status', 'pending'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contract_change_request_atomic(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contract_change_request_atomic(uuid, text, jsonb) TO authenticated;

COMMENT ON TABLE public.contract_change_requests IS 'Formal scope/budget/timeline change requests for funded contracts. Prevents silent scope creep in chat.';
COMMENT ON FUNCTION public.prevent_locked_contract_term_edits() IS 'Prevents protected contract terms from being edited once a contract is funded or live.';
COMMENT ON FUNCTION public.submit_contract_change_request_atomic(uuid, text, jsonb) IS 'Atomically creates one pending formal contract change request for a funded/live contract.';

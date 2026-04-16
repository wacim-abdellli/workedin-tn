-- Fix: hire_proposal_atomic was inserting v_job_type (text) into contract_type (job_type_enum)
-- without an explicit cast, causing: "column contract_type is of type job_type_enum but expression is of type text"
-- Solution: rebuild the function with $8::job_type_enum cast in the dynamic SQL.

CREATE OR REPLACE FUNCTION public.hire_proposal_atomic(
    p_proposal_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_job_id uuid;
    v_client_id uuid;
    v_freelancer_id uuid;
    v_amount numeric;
    v_job_title text;
    v_job_description text;
    v_job_type text;
    v_contract_id uuid;
    v_existing_contract_id uuid;
    v_contract_status text := 'active';
    v_has_pending_payment_status boolean := false;
    v_has_title boolean := false;
    v_has_description boolean := false;
    v_has_contract_type boolean := false;
    v_has_payment_status boolean := false;
    v_has_total_amount boolean := false;
    v_insert_sql text;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT
        p.job_id,
        j.client_id,
        p.freelancer_id,
        p.bid_amount,
        j.title,
        j.description,
        j.job_type::text
    INTO
        v_job_id,
        v_client_id,
        v_freelancer_id,
        v_amount,
        v_job_title,
        v_job_description,
        v_job_type
    FROM public.proposals p
    JOIN public.jobs j ON j.id = p.job_id
    WHERE p.id = p_proposal_id
    FOR UPDATE OF p, j;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;

    IF v_client_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the job owner can hire this proposal';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('hire_proposal:' || v_job_id::text));

    SELECT id
    INTO v_existing_contract_id
    FROM public.contracts
    WHERE proposal_id = p_proposal_id
    LIMIT 1;

    IF v_existing_contract_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'contract_id', v_existing_contract_id,
            'job_id', v_job_id,
            'freelancer_id', v_freelancer_id,
            'amount', v_amount,
            'existing', true
        );
    END IF;

    SELECT id
    INTO v_existing_contract_id
    FROM public.contracts
    WHERE job_id = v_job_id
      AND status <> 'cancelled'
    LIMIT 1;

    IF v_existing_contract_id IS NOT NULL THEN
        RAISE EXCEPTION 'A contract already exists for this job';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'contract_status_enum'
          AND e.enumlabel = 'pending_payment'
    ) INTO v_has_pending_payment_status;

    IF v_has_pending_payment_status THEN
        v_contract_status := 'pending_payment';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'title'
    ) INTO v_has_title;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'description'
    ) INTO v_has_description;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'contract_type'
    ) INTO v_has_contract_type;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'payment_status'
    ) INTO v_has_payment_status;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'total_amount'
    ) INTO v_has_total_amount;

    v_insert_sql := 'INSERT INTO public.contracts (job_id, proposal_id, client_id, freelancer_id, amount';

    IF v_has_title THEN
        v_insert_sql := v_insert_sql || ', title';
    END IF;
    IF v_has_description THEN
        v_insert_sql := v_insert_sql || ', description';
    END IF;
    IF v_has_contract_type THEN
        v_insert_sql := v_insert_sql || ', contract_type';
    END IF;
    IF v_has_payment_status THEN
        v_insert_sql := v_insert_sql || ', payment_status';
    END IF;
    IF v_has_total_amount THEN
        v_insert_sql := v_insert_sql || ', total_amount';
    END IF;

    v_insert_sql := v_insert_sql || ', status) VALUES ($1, $2, $3, $4, $5';

    IF v_has_title THEN
        v_insert_sql := v_insert_sql || ', $6';
    END IF;
    IF v_has_description THEN
        v_insert_sql := v_insert_sql || ', $7';
    END IF;
    IF v_has_contract_type THEN
        -- FIXED: explicit cast text -> job_type_enum to avoid implicit cast failure
        v_insert_sql := v_insert_sql || ', $8::job_type_enum';
    END IF;
    IF v_has_payment_status THEN
        v_insert_sql := v_insert_sql || ', $9';
    END IF;
    IF v_has_total_amount THEN
        v_insert_sql := v_insert_sql || ', $10';
    END IF;

    v_insert_sql := v_insert_sql || ', $11) RETURNING id';

    EXECUTE v_insert_sql
    INTO v_contract_id
    USING
        v_job_id,
        p_proposal_id,
        v_client_id,
        v_freelancer_id,
        v_amount,
        COALESCE(v_job_title, 'Contract'),
        v_job_description,
        v_job_type,
        'pending',
        v_amount,
        v_contract_status;

    UPDATE public.proposals
    SET status = CASE WHEN id = p_proposal_id THEN 'accepted' ELSE 'rejected' END
    WHERE job_id = v_job_id
      AND status <> CASE WHEN id = p_proposal_id THEN 'accepted' ELSE 'rejected' END;

    UPDATE public.jobs
    SET status = 'in_progress',
        updated_at = now()
    WHERE id = v_job_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', v_contract_id,
        'job_id', v_job_id,
        'freelancer_id', v_freelancer_id,
        'amount', v_amount,
        'existing', false
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.hire_proposal_atomic(uuid) TO authenticated;

COMMENT ON FUNCTION public.hire_proposal_atomic IS 'Atomically accepts a proposal, rejects competing proposals, creates a contract, and moves the job to in_progress. Fixed: contract_type cast text->job_type_enum.';

ALTER TYPE public.job_status_enum ADD VALUE IF NOT EXISTS 'matched';

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
    v_proposal_status text;
    v_contract_id uuid;
    v_existing_contract_id uuid;
    v_contract_status text := 'active';
    v_has_pending_payment_status boolean := false;
    v_has_title boolean := false;
    v_has_description boolean := false;
    v_has_contract_type boolean := false;
    v_has_payment_status boolean := false;
    v_has_total_amount boolean := false;
    v_job_next_status public.job_status_enum := 'in_progress'::public.job_status_enum;
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
        j.job_type::text,
        p.status::text
    INTO
        v_job_id,
        v_client_id,
        v_freelancer_id,
        v_amount,
        v_job_title,
        v_job_description,
        v_job_type,
        v_proposal_status
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

    IF v_proposal_status NOT IN ('new', 'pending', 'shortlisted') THEN
        RAISE EXCEPTION 'Only new, pending, or shortlisted proposals can be hired';
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
        v_job_next_status := 'matched'::public.job_status_enum;
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
    SET status = v_job_next_status,
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

CREATE OR REPLACE FUNCTION public.sync_job_status_with_contract_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_id uuid := COALESCE(NEW.job_id, OLD.job_id);
    v_latest_status text;
    v_next_status public.job_status_enum;
BEGIN
    IF v_job_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT c.status::text
    INTO v_latest_status
    FROM public.contracts c
    WHERE c.job_id = v_job_id
    ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    LIMIT 1;

    IF NOT FOUND THEN
        UPDATE public.jobs
        SET status = 'open'::public.job_status_enum,
            updated_at = now()
        WHERE id = v_job_id
          AND status::text IN ('open', 'matched', 'in_progress', 'completed', 'cancelled', 'disputed');

        RETURN COALESCE(NEW, OLD);
    END IF;

    v_next_status := CASE
        WHEN v_latest_status = 'pending_payment' THEN 'matched'::public.job_status_enum
        WHEN v_latest_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN v_latest_status = 'cancelled' OR v_latest_status = 'canceled' THEN 'cancelled'::public.job_status_enum
        WHEN v_latest_status = 'disputed' THEN 'disputed'::public.job_status_enum
        ELSE 'in_progress'::public.job_status_enum
    END;

    UPDATE public.jobs
    SET status = v_next_status,
        updated_at = now()
    WHERE id = v_job_id
      AND status IS DISTINCT FROM v_next_status;

    RETURN COALESCE(NEW, OLD);
END;
$$;

UPDATE public.jobs j
SET status = CASE
        WHEN latest.contract_status = 'pending_payment' THEN 'matched'::public.job_status_enum
        WHEN latest.contract_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN latest.contract_status = 'cancelled' OR latest.contract_status = 'canceled' THEN 'cancelled'::public.job_status_enum
        WHEN latest.contract_status = 'disputed' THEN 'disputed'::public.job_status_enum
        ELSE 'in_progress'::public.job_status_enum
    END,
    updated_at = now()
FROM (
    SELECT DISTINCT ON (c.job_id)
        c.job_id,
        c.status::text AS contract_status
    FROM public.contracts c
    ORDER BY c.job_id, COALESCE(c.updated_at, c.created_at) DESC
) AS latest
WHERE j.id = latest.job_id
  AND j.status IS DISTINCT FROM CASE
        WHEN latest.contract_status = 'pending_payment' THEN 'matched'::public.job_status_enum
        WHEN latest.contract_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN latest.contract_status = 'cancelled' OR latest.contract_status = 'canceled' THEN 'cancelled'::public.job_status_enum
        WHEN latest.contract_status = 'disputed' THEN 'disputed'::public.job_status_enum
        ELSE 'in_progress'::public.job_status_enum
    END;

GRANT EXECUTE ON FUNCTION public.hire_proposal_atomic(uuid) TO authenticated;

COMMENT ON FUNCTION public.hire_proposal_atomic IS 'Atomically accepts a proposal, creates a pending-payment contract, and keeps the job in matched state until escrow is funded.';
COMMENT ON FUNCTION public.sync_job_status_with_contract_outcome IS 'Synchronizes jobs.status with latest contract status and keeps pending-payment contracts in matched until funding completes.';

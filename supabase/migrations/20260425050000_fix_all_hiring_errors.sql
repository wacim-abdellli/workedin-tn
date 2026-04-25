-- ====================================================================================
-- FULL FIX FOR HIRING PROPOSALS
-- Copy and paste this ENTIRE file into the Supabase Dashboard SQL Editor and click "Run"
-- ====================================================================================

-- 1) FIX THE TRIGGER THAT USED 'declined' INSTEAD OF 'rejected'
CREATE OR REPLACE FUNCTION public.auto_decline_other_proposals()
RETURNS trigger AS $$
BEGIN
    IF NEW.job_id IS NOT NULL THEN
        -- The correct enum value is 'rejected', not 'declined'
        UPDATE public.proposals
        SET status = 'rejected'
        WHERE job_id = NEW.job_id
          AND freelancer_id != NEW.freelancer_id
          AND status = 'pending';
          
        UPDATE public.jobs
        SET status = 'in_progress'
        WHERE id = NEW.job_id
          AND status = 'open';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is applied
DROP TRIGGER IF EXISTS trg_auto_decline_other_proposals ON public.contracts;
CREATE TRIGGER trg_auto_decline_other_proposals
AFTER INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.auto_decline_other_proposals();


-- 2) FIX THE HIRE FUNCTION THAT WAS MISSING ENUM CASTS FOR payment_status AND status
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
        v_insert_sql := v_insert_sql || ', $9::payment_status_enum';
    END IF;
    IF v_has_total_amount THEN
        v_insert_sql := v_insert_sql || ', $10';
    END IF;

    v_insert_sql := v_insert_sql || ', $11::contract_status_enum) RETURNING id';

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
    SET status = CASE WHEN id = p_proposal_id THEN 'accepted'::proposal_status_enum ELSE 'rejected'::proposal_status_enum END
    WHERE job_id = v_job_id
      AND status <> CASE WHEN id = p_proposal_id THEN 'accepted'::proposal_status_enum ELSE 'rejected'::proposal_status_enum END;

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

GRANT EXECUTE ON FUNCTION public.hire_proposal_atomic(uuid) TO authenticated;

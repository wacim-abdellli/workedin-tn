-- Atomic RPCs for high-risk multi-step flows.
-- Goals:
-- 1. Prevent partial state during hire/create-contract.
-- 2. Prevent partial state during withdrawal creation + balance deduction.
-- 3. Make contract payment release idempotent.

ALTER TABLE public.withdrawals
    ADD COLUMN IF NOT EXISTS client_request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_client_request_id
    ON public.withdrawals (client_request_id)
    WHERE client_request_id IS NOT NULL;

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
        j.job_type
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
        v_insert_sql := v_insert_sql || ', $8';
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

CREATE OR REPLACE FUNCTION public.request_withdrawal_atomic(
    p_wallet_id uuid,
    p_amount numeric,
    p_method text,
    p_client_request_id text,
    p_bank_name text DEFAULT NULL,
    p_bank_account_name text DEFAULT NULL,
    p_bank_iban text DEFAULT NULL,
    p_phone_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_wallet_user_id uuid;
    v_wallet_balance numeric;
    v_withdrawal_id uuid;
    v_existing_withdrawal_id uuid;
    v_has_bank_account_name boolean := false;
    v_has_bank_iban boolean := false;
    v_has_phone_number boolean := false;
    v_has_iban boolean := false;
    v_has_d17_phone boolean := false;
    v_insert_sql text;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be greater than zero';
    END IF;

    IF p_amount < 20 THEN
        RAISE EXCEPTION 'Minimum withdrawal amount is 20 TND';
    END IF;

    IF p_method NOT IN ('bank_transfer', 'd17', 'flouci') THEN
        RAISE EXCEPTION 'Invalid withdrawal method';
    END IF;

    IF p_client_request_id IS NULL OR btrim(p_client_request_id) = '' THEN
        RAISE EXCEPTION 'Client request id is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('withdrawal:' || v_user_id::text || ':' || p_client_request_id));

    SELECT id
    INTO v_existing_withdrawal_id
    FROM public.withdrawals
    WHERE user_id = v_user_id
      AND client_request_id = p_client_request_id
    LIMIT 1;

    IF v_existing_withdrawal_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'withdrawal_id', v_existing_withdrawal_id,
            'existing', true
        );
    END IF;

    SELECT user_id, balance
    INTO v_wallet_user_id, v_wallet_balance
    FROM public.wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_wallet_user_id <> v_user_id THEN
        RAISE EXCEPTION 'You can only withdraw from your own wallet';
    END IF;

    IF v_wallet_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'bank_account_name'
    ) INTO v_has_bank_account_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'bank_iban'
    ) INTO v_has_bank_iban;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'phone_number'
    ) INTO v_has_phone_number;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'iban'
    ) INTO v_has_iban;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'd17_phone'
    ) INTO v_has_d17_phone;

    v_insert_sql := 'INSERT INTO public.withdrawals (user_id, wallet_id, amount, method, status, client_request_id';

    IF p_method = 'bank_transfer' THEN
        v_insert_sql := v_insert_sql || ', bank_name';
        IF v_has_bank_account_name THEN
            v_insert_sql := v_insert_sql || ', bank_account_name';
        END IF;
        IF v_has_bank_iban THEN
            v_insert_sql := v_insert_sql || ', bank_iban';
        ELSIF v_has_iban THEN
            v_insert_sql := v_insert_sql || ', iban';
        END IF;
    ELSE
        IF v_has_phone_number THEN
            v_insert_sql := v_insert_sql || ', phone_number';
        ELSIF v_has_d17_phone THEN
            v_insert_sql := v_insert_sql || ', d17_phone';
        END IF;
    END IF;

    v_insert_sql := v_insert_sql || ') VALUES ($1, $2, $3, $4, ''pending'', $5';

    IF p_method = 'bank_transfer' THEN
        v_insert_sql := v_insert_sql || ', $6';
        IF v_has_bank_account_name THEN
            v_insert_sql := v_insert_sql || ', $7';
        END IF;
        IF v_has_bank_iban OR v_has_iban THEN
            v_insert_sql := v_insert_sql || ', $8';
        END IF;
    ELSE
        IF v_has_phone_number OR v_has_d17_phone THEN
            v_insert_sql := v_insert_sql || ', $9';
        END IF;
    END IF;

    v_insert_sql := v_insert_sql || ') RETURNING id';

    EXECUTE v_insert_sql
    INTO v_withdrawal_id
    USING
        v_user_id,
        p_wallet_id,
        p_amount,
        p_method,
        p_client_request_id,
        p_bank_name,
        p_bank_account_name,
        p_bank_iban,
        p_phone_number;

    UPDATE public.wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_wallet_id;

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'balance_after', v_wallet_balance - p_amount,
        'existing', false
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
        SELECT client_id, status::text, payment_status::text, completed_at, escrow_funded
        INTO v_client_id, v_contract_status, v_payment_status, v_completed_at, v_escrow_funded
        FROM public.contracts
        WHERE id = p_contract_id
        FOR UPDATE;
    ELSE
        SELECT client_id, status::text, payment_status::text, completed_at, NULL::boolean
        INTO v_client_id, v_contract_status, v_payment_status, v_completed_at, v_escrow_funded
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

GRANT EXECUTE ON FUNCTION public.hire_proposal_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal_atomic(uuid, numeric, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_contract_payment_atomic(uuid) TO authenticated;

COMMENT ON FUNCTION public.hire_proposal_atomic IS 'Atomically accepts a proposal, rejects competing proposals, creates a contract, and moves the job to in_progress.';
COMMENT ON FUNCTION public.request_withdrawal_atomic IS 'Atomically creates a withdrawal request and deducts wallet balance, with client-side idempotency via client_request_id.';
COMMENT ON FUNCTION public.release_contract_payment_atomic IS 'Atomically releases contract payment and is safe to retry when the payment is already released.';

-- =============================================================================
-- MIGRATION: Atomic proposal submission with connects deduction (v2)
-- Fixes BUG-10 from Phase 1 audit.
--
-- Problem:
--   createProposal() inserted the proposal row first, then called
--   spendConnects() separately. If spendConnects failed, the proposal existed
--   in the DB but no connects were deducted — effectively a free submission.
--
-- Solution:
--   A single SECURITY DEFINER RPC that, within ONE transaction:
--     1. Asserts auth.uid() is the caller.
--     2. Validates the target job exists and is open.
--     3. Checks the caller is not the job owner.
--     4. Provides idempotency — returns existing proposal if already submitted.
--     5. Locks the freelancer_profiles row and verifies connects balance.
--     6. Inserts the proposal row.
--     7. Deducts connects and logs the transaction.
--   Any failure at any step rolls back the entire transaction.
--
-- Notes:
--   - p_attachments is JSONB to match proposals.attachments column type
--     (schema_v2.sql line 133: `attachments JSONB DEFAULT '[]'::jsonb`).
--     Using TEXT[] would require an implicit cast that Postgres will reject.
--   - Full freelancer profile completeness (bio, skills, etc.) is NOT
--     re-validated here — that logic lives in the JS canApplyToJob() pre-flight.
--     The RPC enforces: auth, open job, not own job, uniqueness, connects balance.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_proposal_atomic(
    p_job_id             UUID,
    p_cover_letter       TEXT,
    p_bid_amount         NUMERIC,
    p_delivery_time_days INTEGER,
    p_attachments        JSONB    DEFAULT '[]'::JSONB,
    p_connects_cost      INTEGER  DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller            UUID    := auth.uid();
    v_job_status        TEXT;
    v_job_client_id     UUID;
    v_existing_proposal UUID;
    v_connects_balance  INTEGER;
    v_proposal_id       UUID;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Auth guard
    -- -------------------------------------------------------------------------
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Validate the target job exists and is open
    -- -------------------------------------------------------------------------
    SELECT status, client_id
    INTO v_job_status, v_job_client_id
    FROM public.jobs
    WHERE id = p_job_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF v_job_status <> 'open' THEN
        RAISE EXCEPTION 'This job is no longer accepting proposals';
    END IF;

    -- A client cannot apply to their own job.
    IF v_job_client_id = v_caller THEN
        RAISE EXCEPTION 'You cannot submit a proposal to your own job';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. Idempotency: return existing proposal if already submitted
    -- -------------------------------------------------------------------------
    SELECT id INTO v_existing_proposal
    FROM public.proposals
    WHERE job_id      = p_job_id
      AND freelancer_id = v_caller
    LIMIT 1;

    IF v_existing_proposal IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success',     true,
            'proposal_id', v_existing_proposal,
            'existing',    true
        );
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. Lock freelancer_profiles row and verify connects balance atomically
    -- -------------------------------------------------------------------------
    SELECT connects_balance
    INTO v_connects_balance
    FROM public.freelancer_profiles
    WHERE id = v_caller
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Freelancer profile not found. Complete onboarding first.';
    END IF;

    IF v_connects_balance < p_connects_cost THEN
        RAISE EXCEPTION 'Insufficient connects. You have % connects, need %.', v_connects_balance, p_connects_cost;
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. Insert proposal
    --    attachments column type is JSONB — p_attachments is passed as JSONB.
    -- -------------------------------------------------------------------------
    INSERT INTO public.proposals (
        job_id,
        freelancer_id,
        cover_letter,
        bid_amount,
        delivery_time_days,
        attachments,
        status
    )
    VALUES (
        p_job_id,
        v_caller,
        p_cover_letter,
        p_bid_amount,
        p_delivery_time_days,
        COALESCE(p_attachments, '[]'::JSONB),
        'pending'
    )
    RETURNING id INTO v_proposal_id;

    -- -------------------------------------------------------------------------
    -- 6. Deduct connects and log — same transaction, rolls back with proposal
    -- -------------------------------------------------------------------------
    UPDATE public.freelancer_profiles
    SET
        connects_balance = connects_balance - p_connects_cost,
        connects_used    = connects_used    + p_connects_cost
    WHERE id = v_caller;

    INSERT INTO public.connects_transactions (
        freelancer_id,
        amount,
        reason,
        proposal_id
    )
    VALUES (
        v_caller,
        -p_connects_cost,
        'proposal_submitted',
        v_proposal_id
    );

    -- -------------------------------------------------------------------------
    -- 7. Return success
    -- -------------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success',     true,
        'proposal_id', v_proposal_id,
        'existing',    false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_proposal_atomic(UUID, TEXT, NUMERIC, INTEGER, JSONB, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_proposal_atomic(UUID, TEXT, NUMERIC, INTEGER, JSONB, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.submit_proposal_atomic IS
    'Atomically submits a proposal and deducts connects in a single transaction. '
    'Any failure at any step rolls back both operations. '
    'Enforces: auth, open job, not own job, uniqueness (idempotent), connects balance. '
    'Does NOT re-validate freelancer profile completeness (bio, skills, etc.) — '
    'that is handled by the JS canApplyToJob() pre-flight guard.';

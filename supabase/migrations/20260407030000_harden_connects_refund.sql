-- =============================================================================
-- MIGRATION: Atomic proposal withdrawal — race-condition-safe (v3)
-- Supersedes all previous versions of this file.
--
-- Problems fixed in this version versus v2:
--
--   RACE-1: no FOR UPDATE on proposal SELECT
--     Two concurrent calls could both read the proposal row simultaneously,
--     both see "no prior refund", both pass validation, and both proceed.
--     Fix: SELECT ... FOR UPDATE acquires an exclusive row lock.
--     A concurrent call now blocks at the SELECT until the first transaction
--     commits. Once the first commits (row deleted), the second sees NOT FOUND
--     and raises "Proposal not found" — no refund is issued.
--
--   RACE-2: idempotency marker stored as proposal_id = NULL in connects_transactions
--     The prior idempotency check was:
--       SELECT EXISTS(...WHERE proposal_id = p_proposal_id AND reason = 'proposal_withdrawn')
--     But connects_transactions.proposal_id has ON DELETE SET NULL, so after
--     the proposal is deleted the stored FK becomes NULL — the check
--     'WHERE proposal_id = p_proposal_id' can never match NULL.
--     Fix: dedicated proposal_withdrawal_log table (UUID PRIMARY KEY on
--     proposal_id, NO FK to proposals) acts as a durable, immutable marker
--     that survives proposal deletion. Its UNIQUE PK makes a double-insert
--     fail with a unique-violation exception before any money moves.
--
--   RACE-3: DELETE row count not verified
--     If FOR UPDATE somehow did not prevent a concurrent delete, the first
--     DELETE would affect 1 row and the second would affect 0 rows. Without
--     a row-count check, the second call still proceeds to refund.
--     Fix: GET DIAGNOSTICS v_deleted = ROW_COUNT immediately after DELETE.
--     If v_deleted != 1, raise an exception — the whole transaction rolls back
--     including the withdrawal_log insert, so replay is impossible.
--
-- Concurrency sequence (with all three fixes):
--   Call A: SELECT proposal FOR UPDATE  → locks row
--   Call B: SELECT proposal FOR UPDATE  → BLOCKS (waiting for A)
--   Call A: INSERT proposal_withdrawal_log(proposal_id) → success (unique)
--   Call A: DELETE proposal (deleted_count = 1) → success
--   Call A: UPDATE connects_balance → success
--   Call A: COMMIT → lock released, proposal row gone
--   Call B: SELECT proposal FOR UPDATE → NOT FOUND → raises "Proposal not found"
--   Call B: ROLLBACK
--   Result: exactly one refund, exactly one deletion.
--
-- refund_connects_for_proposal:
--   Kept but blocks all authenticated callers (auth.uid() IS NOT NULL → raise).
--   Service role may still call it for admin/ops if needed.
--
-- spend_connects_for_proposal:
--   Retained with auth + caller-match guard from Phase 5a.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. proposal_withdrawal_log — durable idempotency anchor
--    Stores the original proposal_id as a plain UUID (no FK to proposals).
--    The PRIMARY KEY constraint prevents any double-insert for the same
--    proposal_id, even across separate transactions.
--    RLS: only the owning freelancer can insert; nobody can delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proposal_withdrawal_log (
    proposal_id  UUID        NOT NULL,
    freelancer_id UUID       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    refunded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT proposal_withdrawal_log_pkey PRIMARY KEY (proposal_id)
    -- proposal_id is intentionally NOT a FK to proposals — the proposal row
    -- will be deleted in this same transaction; we need the record to persist.
);

ALTER TABLE public.proposal_withdrawal_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawal_log_insert_own" ON public.proposal_withdrawal_log;
CREATE POLICY "withdrawal_log_insert_own"
    ON public.proposal_withdrawal_log
    FOR INSERT
    WITH CHECK (auth.uid() = freelancer_id);

DROP POLICY IF EXISTS "withdrawal_log_select_own" ON public.proposal_withdrawal_log;
CREATE POLICY "withdrawal_log_select_own"
    ON public.proposal_withdrawal_log
    FOR SELECT
    USING (auth.uid() = freelancer_id);

-- No UPDATE, no DELETE policies — the log is append-only and immutable.

-- ---------------------------------------------------------------------------
-- 1. withdraw_proposal_atomic (v3) — race-condition-safe
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.withdraw_proposal_atomic(
    p_proposal_id UUID,
    p_refund      INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID    := auth.uid();
    v_freelancer_id UUID;
    v_status        TEXT;
    v_deleted       INTEGER := 0;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Auth guard
    -- -------------------------------------------------------------------------
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Lock the proposal row exclusively before any validation.
    --    FOR UPDATE blocks any concurrent call on the same proposal_id until
    --    this transaction commits or rolls back.
    --    If the row is already deleted (concurrent call won the race), NOT FOUND
    --    is raised immediately — no refund is issued.
    -- -------------------------------------------------------------------------
    SELECT freelancer_id, status::TEXT
    INTO v_freelancer_id, v_status
    FROM public.proposals
    WHERE id = p_proposal_id
    FOR UPDATE;                    -- <-- exclusive row lock

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found or already withdrawn';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. Ownership check
    -- -------------------------------------------------------------------------
    IF v_freelancer_id <> v_caller THEN
        RAISE EXCEPTION 'You can only withdraw your own proposal';
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. Status check — only 'pending' proposals are refundable
    -- -------------------------------------------------------------------------
    IF v_status <> 'pending' THEN
        RAISE EXCEPTION
            'Only pending proposals can be withdrawn (current status: %)', v_status;
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. Durable idempotency anchor — INSERT into proposal_withdrawal_log.
    --    proposal_withdrawal_log.proposal_id is the PRIMARY KEY.
    --    If a prior withdrawal already inserted this proposal_id (even if the
    --    proposal row was subsequently deleted and the FK in connects_transactions
    --    was nullified), this INSERT will fail with a unique-violation exception
    --    and the transaction rolls back — no double-refund.
    --
    --    This INSERT happens BEFORE the DELETE so the row still exists for FK
    --    reference in other tables, and before the balance update so a failure
    --    here rollback everything cleanly.
    -- -------------------------------------------------------------------------
    INSERT INTO public.proposal_withdrawal_log (proposal_id, freelancer_id)
    VALUES (p_proposal_id, v_caller);
    -- Raises unique_violation (23505) if already inserted → txn aborted.

    -- -------------------------------------------------------------------------
    -- 6. Delete the proposal
    --    Belt-and-suspenders: include freelancer_id = v_caller in the WHERE so
    --    even if somehow the ownership check above was bypassed, the DELETE
    --    would affect 0 rows and step 7 would catch it.
    -- -------------------------------------------------------------------------
    DELETE FROM public.proposals
    WHERE id = p_proposal_id
      AND freelancer_id = v_caller;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    IF v_deleted <> 1 THEN
        -- Should never happen because FOR UPDATE + NOT FOUND above guard this,
        -- but raise defensively to ensure we never refund without deleting.
        RAISE EXCEPTION
            'Proposal could not be deleted (rows affected: %). Withdrawal aborted.',
            v_deleted;
    END IF;

    -- -------------------------------------------------------------------------
    -- 7. Refund connects — same transaction as delete and withdrawal_log insert.
    --    All three succeed together or all roll back together.
    -- -------------------------------------------------------------------------
    UPDATE public.freelancer_profiles
    SET
        connects_balance = connects_balance + p_refund,
        connects_used    = GREATEST(0, connects_used - p_refund)
    WHERE id = v_caller;

    -- Log the refund. proposal_id is NULL here because the proposal row is
    -- deleted in this same transaction (ON DELETE SET NULL would eventually
    -- set it to NULL anyway). The durable audit trail is in proposal_withdrawal_log.
    INSERT INTO public.connects_transactions (freelancer_id, amount, reason, proposal_id)
    VALUES (v_caller, p_refund, 'proposal_withdrawn', NULL);

    RETURN jsonb_build_object(
        'success',     true,
        'proposal_id', p_proposal_id,
        'refunded',    p_refund
    );
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_proposal_atomic(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_proposal_atomic(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. refund_connects_for_proposal — blocked for authenticated callers
--    Service role (which has no auth.uid()) can still call this for ops.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_connects_for_proposal(
    p_freelancer_id UUID,
    p_proposal_id   UUID,
    p_refund        INTEGER DEFAULT 2
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION
            'Direct use of refund_connects_for_proposal is not allowed for authenticated users. '
            'Use withdraw_proposal_atomic() instead.';
    END IF;

    UPDATE public.freelancer_profiles
    SET
        connects_balance = connects_balance + p_refund,
        connects_used    = GREATEST(0, connects_used - p_refund)
    WHERE id = p_freelancer_id;

    INSERT INTO public.connects_transactions (freelancer_id, amount, reason, proposal_id)
    VALUES (p_freelancer_id, p_refund, 'proposal_withdrawn', p_proposal_id);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_connects_for_proposal(UUID, UUID, INTEGER) FROM PUBLIC;
-- No GRANT to authenticated — service role only.

-- ---------------------------------------------------------------------------
-- 3. spend_connects_for_proposal — hardened (retained from Phase 5a)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.spend_connects_for_proposal(UUID, UUID, INTEGER) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.spend_connects_for_proposal(
    p_freelancer_id UUID,
    p_proposal_id   UUID,
    p_cost          INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller  UUID    := auth.uid();
    v_balance INTEGER;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_caller <> p_freelancer_id THEN
        RAISE EXCEPTION 'Caller is not the freelancer being charged';
    END IF;

    SELECT connects_balance INTO v_balance
    FROM public.freelancer_profiles
    WHERE id = p_freelancer_id
    FOR UPDATE;

    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Freelancer profile not found');
    END IF;

    IF v_balance < p_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient connects', 'balance', v_balance);
    END IF;

    UPDATE public.freelancer_profiles
    SET
        connects_balance = connects_balance - p_cost,
        connects_used    = connects_used    + p_cost
    WHERE id = p_freelancer_id;

    INSERT INTO public.connects_transactions (freelancer_id, amount, reason, proposal_id)
    VALUES (p_freelancer_id, -p_cost, 'proposal_submitted', p_proposal_id);

    RETURN jsonb_build_object('success', true, 'balance', v_balance - p_cost);
END;
$$;

REVOKE ALL ON FUNCTION public.spend_connects_for_proposal(UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_connects_for_proposal(UUID, UUID, INTEGER) TO authenticated;

-- =============================================================================
-- MIGRATION: Atomic proposal withdrawal - race-condition-safe (v3)
-- Supersedes all previous versions of this file.
--
-- Problems fixed in this version versus v2:
--
--   RACE-1: no FOR UPDATE on proposal SELECT
--     Two concurrent calls could both read the proposal row simultaneously,
--     both see "no prior refund", both pass validation, and both proceed.
--     Fix: SELECT ... FOR UPDATE acquires an exclusive row lock.
--
--   RACE-2: idempotency marker stored as proposal_id = NULL in connects_transactions
--     The prior idempotency check could not survive proposal deletion because
--     connects_transactions.proposal_id uses ON DELETE SET NULL.
--     Fix: dedicated proposal_withdrawal_log table with proposal_id as a
--     durable primary key and no FK to proposals.
--
--   RACE-3: DELETE row count not verified
--     Fix: GET DIAGNOSTICS v_deleted = ROW_COUNT immediately after DELETE.
--
-- Compatibility note:
--   The Supabase remote migration runner treated the original multi-command file
--   as one prepared statement and failed with:
--     cannot insert multiple commands into a prepared statement
--   This migration is therefore emitted as one top-level DO block that
--   dynamically creates the table/policies/functions and applies grants.
-- =============================================================================

DO $migration$
BEGIN
    EXECUTE $table$
        CREATE TABLE IF NOT EXISTS public.proposal_withdrawal_log (
            proposal_id   UUID        NOT NULL,
            freelancer_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            refunded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT proposal_withdrawal_log_pkey PRIMARY KEY (proposal_id)
        )
    $table$;

    EXECUTE 'ALTER TABLE public.proposal_withdrawal_log ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "withdrawal_log_insert_own" ON public.proposal_withdrawal_log';
    EXECUTE $policy$
        CREATE POLICY "withdrawal_log_insert_own"
            ON public.proposal_withdrawal_log
            FOR INSERT
            WITH CHECK (auth.uid() = freelancer_id)
    $policy$;

    EXECUTE 'DROP POLICY IF EXISTS "withdrawal_log_select_own" ON public.proposal_withdrawal_log';
    EXECUTE $policy$
        CREATE POLICY "withdrawal_log_select_own"
            ON public.proposal_withdrawal_log
            FOR SELECT
            USING (auth.uid() = freelancer_id)
    $policy$;

    EXECUTE $function$
        CREATE OR REPLACE FUNCTION public.withdraw_proposal_atomic(
            p_proposal_id UUID,
            p_refund      INTEGER DEFAULT 2
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $body$
        DECLARE
            v_caller        UUID    := auth.uid();
            v_freelancer_id UUID;
            v_status        TEXT;
            v_deleted       INTEGER := 0;
        BEGIN
            IF v_caller IS NULL THEN
                RAISE EXCEPTION 'Authentication required';
            END IF;

            SELECT freelancer_id, status::TEXT
            INTO v_freelancer_id, v_status
            FROM public.proposals
            WHERE id = p_proposal_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Proposal not found or already withdrawn';
            END IF;

            IF v_freelancer_id <> v_caller THEN
                RAISE EXCEPTION 'You can only withdraw your own proposal';
            END IF;

            IF v_status <> 'pending' THEN
                RAISE EXCEPTION
                    'Only pending proposals can be withdrawn (current status: %)', v_status;
            END IF;

            INSERT INTO public.proposal_withdrawal_log (proposal_id, freelancer_id)
            VALUES (p_proposal_id, v_caller);

            DELETE FROM public.proposals
            WHERE id = p_proposal_id
              AND freelancer_id = v_caller;

            GET DIAGNOSTICS v_deleted = ROW_COUNT;

            IF v_deleted <> 1 THEN
                RAISE EXCEPTION
                    'Proposal could not be deleted (rows affected: %). Withdrawal aborted.',
                    v_deleted;
            END IF;

            UPDATE public.freelancer_profiles
            SET
                connects_balance = connects_balance + p_refund,
                connects_used    = GREATEST(0, connects_used - p_refund)
            WHERE id = v_caller;

            INSERT INTO public.connects_transactions (freelancer_id, amount, reason, proposal_id)
            VALUES (v_caller, p_refund, 'proposal_withdrawn', NULL);

            RETURN jsonb_build_object(
                'success',     true,
                'proposal_id', p_proposal_id,
                'refunded',    p_refund
            );
        END;
        $body$;
    $function$;

    EXECUTE 'REVOKE ALL ON FUNCTION public.withdraw_proposal_atomic(UUID, INTEGER) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.withdraw_proposal_atomic(UUID, INTEGER) TO authenticated';

    EXECUTE $function$
        CREATE OR REPLACE FUNCTION public.refund_connects_for_proposal(
            p_freelancer_id UUID,
            p_proposal_id   UUID,
            p_refund        INTEGER DEFAULT 2
        )
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $body$
        BEGIN
            IF auth.uid() IS NOT NULL THEN
                RAISE EXCEPTION
                    'Direct use of refund_connects_for_proposal is not allowed for authenticated users. Use withdraw_proposal_atomic() instead.';
            END IF;

            UPDATE public.freelancer_profiles
            SET
                connects_balance = connects_balance + p_refund,
                connects_used    = GREATEST(0, connects_used - p_refund)
            WHERE id = p_freelancer_id;

            INSERT INTO public.connects_transactions (freelancer_id, amount, reason, proposal_id)
            VALUES (p_freelancer_id, p_refund, 'proposal_withdrawn', p_proposal_id);
        END;
        $body$;
    $function$;

    EXECUTE 'REVOKE ALL ON FUNCTION public.refund_connects_for_proposal(UUID, UUID, INTEGER) FROM PUBLIC';

    EXECUTE 'REVOKE ALL ON FUNCTION public.spend_connects_for_proposal(UUID, UUID, INTEGER) FROM PUBLIC';
    EXECUTE $function$
        CREATE OR REPLACE FUNCTION public.spend_connects_for_proposal(
            p_freelancer_id UUID,
            p_proposal_id   UUID,
            p_cost          INTEGER DEFAULT 2
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $body$
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

            SELECT connects_balance
            INTO v_balance
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
        $body$;
    $function$;

    EXECUTE 'REVOKE ALL ON FUNCTION public.spend_connects_for_proposal(UUID, UUID, INTEGER) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.spend_connects_for_proposal(UUID, UUID, INTEGER) TO authenticated';
END;
$migration$;

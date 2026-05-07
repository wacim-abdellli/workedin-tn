-- ============================================================================
-- Contract Cancellation RPC
-- ============================================================================
-- Handles 3 scenarios:
--   1. pending_payment → simple cancel (no money involved)
--   2. active (funded, no delivery yet) → cancel + flag for Dhmad refund
--   3. delivery_submitted / revision_requested → NOT cancellable (must dispute)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_contract_atomic(
    p_contract_id uuid,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_contract record;
    v_needs_refund boolean := false;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Lock the contract row to prevent concurrent modifications
    PERFORM pg_advisory_xact_lock(hashtext('cancel_contract:' || p_contract_id::text));

    SELECT id, client_id, freelancer_id, status::text, escrow_funded, dhmad_escrow_id,
           payment_status::text
    INTO v_contract
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF v_contract.id IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    -- Only contract parties can cancel
    IF v_user_id <> v_contract.client_id AND v_user_id <> v_contract.freelancer_id THEN
        RAISE EXCEPTION 'Only contract parties can cancel a contract';
    END IF;

    -- ── State validation ──────────────────────────────────────────────────────
    -- Cannot cancel if work has been delivered (must use dispute instead)
    IF v_contract.status IN ('delivery_submitted', 'completed', 'disputed', 'cancelled') THEN
        RAISE EXCEPTION 'This contract cannot be cancelled in its current state ("%"). Use dispute if work has been submitted.', v_contract.status;
    END IF;

    -- At this point, status is either 'pending_payment', 'active', or 'revision_requested'
    -- revision_requested means a delivery was already done once — block cancellation
    IF v_contract.status = 'revision_requested' THEN
        RAISE EXCEPTION 'Cannot cancel a contract with an active revision cycle. Open a dispute instead.';
    END IF;

    -- ── Determine if a refund is needed ───────────────────────────────────────
    IF v_contract.escrow_funded = true AND v_contract.dhmad_escrow_id IS NOT NULL THEN
        v_needs_refund := true;
    END IF;

    -- ── Update the contract ───────────────────────────────────────────────────
    UPDATE public.contracts
    SET status = 'cancelled',
        payment_status = CASE
            WHEN v_needs_refund THEN 'refund_pending'
            ELSE 'cancelled'
        END,
        review_due_at = NULL,
        cancelled_at = now(),
        cancellation_reason = COALESCE(btrim(p_reason), 'Cancelled by ' || 
            CASE WHEN v_user_id = v_contract.client_id THEN 'client' ELSE 'freelancer' END),
        updated_at = now()
    WHERE id = p_contract_id;

    -- ── Restore job to 'open' if it was matched ──────────────────────────────
    UPDATE public.jobs
    SET status = 'open',
        updated_at = now()
    WHERE id = (
        SELECT j.id FROM public.jobs j
        JOIN public.proposals p ON p.job_id = j.id
        JOIN public.contracts c ON c.proposal_id = p.id
        WHERE c.id = p_contract_id
        LIMIT 1
    )
    AND status = 'matched';

    -- ── Send notifications ────────────────────────────────────────────────────
    -- Notify the OTHER party
    IF v_user_id = v_contract.client_id AND v_contract.freelancer_id IS NOT NULL THEN
        PERFORM public.create_notification(
            v_contract.freelancer_id,
            'contract',
            'Contract cancelled',
            COALESCE(p_reason, 'The client has cancelled this contract.'),
            '/messages',
            p_contract_id
        );
    ELSIF v_user_id = v_contract.freelancer_id AND v_contract.client_id IS NOT NULL THEN
        PERFORM public.create_notification(
            v_contract.client_id,
            'contract',
            'Contract cancelled',
            COALESCE(p_reason, 'The freelancer has cancelled this contract.'),
            '/messages',
            p_contract_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'needs_refund', v_needs_refund,
        'dhmad_escrow_id', v_contract.dhmad_escrow_id,
        'cancelled_by', CASE WHEN v_user_id = v_contract.client_id THEN 'client' ELSE 'freelancer' END
    );
END;
$$;


-- ── Add missing columns if they don't exist ──────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.contracts ADD COLUMN cancelled_at timestamptz;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE public.contracts ADD COLUMN cancellation_reason text;
    END IF;
END $$;

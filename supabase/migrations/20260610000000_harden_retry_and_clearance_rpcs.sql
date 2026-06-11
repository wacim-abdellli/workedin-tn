-- ============================================================================
-- Harden Retry and Clearance RPCs
-- Migration: 20260610000000_harden_retry_and_clearance_rpcs.sql
-- ============================================================================

-- 1. Restrict finalize_clearance_payment (Standard Contracts)
-- This function credits the freelancer wallet and should only be called by cron or admin.
REVOKE EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) TO service_role;

-- Add internal admin check for extra safety if called via authenticated (e.g. for manual admin override)
CREATE OR REPLACE FUNCTION public.finalize_clearance_payment(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_freelancer_id uuid;
    v_amount numeric;
    v_payment_status text;
    v_contract_status text;
    v_clearance_until timestamptz;
    v_hold_disputed boolean;
    v_is_admin boolean := false;
BEGIN
    -- Allow service_role OR verified admin
    IF v_caller_id IS NOT NULL THEN
        SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = v_caller_id;
        IF NOT COALESCE(v_is_admin, false) THEN
            RAISE EXCEPTION 'Only admins or service_role can finalize clearance';
        END IF;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('finalize_clearance:' || p_contract_id::text));

    SELECT freelancer_id, amount, status::text, payment_status::text, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_freelancer_id, v_amount, v_contract_status, v_payment_status, v_clearance_until, v_hold_disputed
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_payment_status = 'released' THEN
        RETURN jsonb_build_object(
            'success', true,
            'contract_id', p_contract_id,
            'payment_status', 'released',
            'cleared', true,
            'existing', true
        );
    END IF;

    IF v_contract_status <> 'completed' OR v_hold_disputed = true THEN
        RAISE EXCEPTION 'Contract is not in completed state or has an active dispute hold';
    END IF;

    IF v_clearance_until IS NULL OR now() < v_clearance_until THEN
        RAISE EXCEPTION 'Clearance hold period has not expired yet';
    END IF;

    -- Update contract payment status to released
    UPDATE public.contracts
    SET payment_status = 'released',
        updated_at = now()
    WHERE id = p_contract_id;

    -- Credit the freelancer's wallet balance
    UPDATE public.wallets
    SET balance = balance + v_amount,
        updated_at = now()
    WHERE user_id = v_freelancer_id;

    -- Insert transaction log
    INSERT INTO public.transactions (user_id, contract_id, type, amount, status, description, completed_at)
    VALUES (v_freelancer_id, p_contract_id, 'escrow_release', v_amount, 'completed', 'Contract payment released from escrow hold', now());

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'payment_status', 'released',
        'cleared', true,
        'existing', false
    );
END;
$$;

-- 2. Restrict finalize_milestone_clearance_payment (Milestone-based Contracts)
REVOKE EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_milestone_clearance_payment(
    p_milestone_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_contract_id uuid;
    v_freelancer_id uuid;
    v_amount numeric;
    v_milestone_status text;
    v_clearance_until timestamptz;
    v_hold_disputed boolean;
    v_is_admin boolean := false;
BEGIN
    -- Allow service_role OR verified admin
    IF v_caller_id IS NOT NULL THEN
        SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = v_caller_id;
        IF NOT COALESCE(v_is_admin, false) THEN
            RAISE EXCEPTION 'Only admins or service_role can finalize milestone clearance';
        END IF;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('finalize_milestone_clearance:' || p_milestone_id::text));

    SELECT contract_id, amount, status::text, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_contract_id, v_amount, v_milestone_status, v_clearance_until, v_hold_disputed
    FROM public.milestones
    WHERE id = p_milestone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;

    SELECT freelancer_id INTO v_freelancer_id FROM public.contracts WHERE id = v_contract_id;

    IF v_milestone_status <> 'approved' OR v_hold_disputed = true THEN
        RAISE EXCEPTION 'Milestone is not approved or has an active dispute hold';
    END IF;

    IF v_clearance_until IS NULL OR now() < v_clearance_until THEN
        RAISE EXCEPTION 'Clearance hold period has not expired yet';
    END IF;

    -- Mark milestone escrow as cleared
    UPDATE public.milestones
    SET escrow_pending_clearance_until = NULL,
        escrow_hold_disputed = false
    WHERE id = p_milestone_id;

    -- Credit the freelancer's wallet balance
    UPDATE public.wallets
    SET balance = balance + v_amount,
        updated_at = now()
    WHERE user_id = v_freelancer_id;

    -- Insert transaction log
    INSERT INTO public.transactions (user_id, contract_id, type, amount, status, description, completed_at)
    VALUES (v_freelancer_id, v_contract_id, 'escrow_release', v_amount, 'completed', 'Milestone payment released from escrow hold', now());

    RETURN jsonb_build_object(
        'success', true,
        'milestone_id', p_milestone_id,
        'released_amount', v_amount
    );
END;
$$;

-- 3. Verify complete_escrow_payment is restricted (Audit Task 4)
-- This was already done in 20260604000001, but we reaffirm it here for the audit trail.
COMMENT ON FUNCTION public.complete_escrow_payment(uuid, uuid, uuid, numeric)
IS '[AUDITED 2026-06-10] Restricted to service_role. Authenticated users revoked to prevent unauthorized retry of funding transactions.';

-- 4. Re-grant to authenticated but keep internal admin check for manual admin triggers from the dashboard
GRANT EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) TO authenticated;

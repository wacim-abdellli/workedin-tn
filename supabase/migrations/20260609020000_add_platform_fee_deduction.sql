-- ============================================================================
-- Platform Fee Deduction & Payout Transaction Logging
-- Migration: 20260609020000_add_platform_fee_deduction.sql
-- ============================================================================

-- 1. Update public.finalize_clearance_payment to deduct platform fee and log transactions
CREATE OR REPLACE FUNCTION public.finalize_clearance_payment(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_freelancer_id uuid;
    v_amount numeric;
    v_payment_status text;
    v_contract_status text;
    v_clearance_until timestamptz;
    v_hold_disputed boolean;
    v_fee numeric;
    v_net_amount numeric;
BEGIN
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

    -- Calculate platform fee (5%) and net payout
    v_fee := ROUND(v_amount * 0.05, 2);
    v_net_amount := v_amount - v_fee;

    -- Update contract payment status to released
    UPDATE public.contracts
    SET payment_status = 'released',
        updated_at = now()
    WHERE id = p_contract_id;

    -- Credit the freelancer's wallet balance and total earned
    UPDATE public.wallets
    SET balance = balance + v_net_amount,
        total_earned = total_earned + v_net_amount,
        updated_at = now()
    WHERE user_id = v_freelancer_id;

    -- Insert transaction log for the escrow release (showing fee)
    INSERT INTO public.transactions (user_id, contract_id, type, amount, fee, status, description, completed_at)
    VALUES (v_freelancer_id, p_contract_id, 'escrow_release', v_amount, v_fee, 'completed', 'Contract payment released from escrow hold (5% platform fee deducted)', now());

    -- Insert transaction log for the platform fee deduction itself
    INSERT INTO public.transactions (user_id, contract_id, type, amount, status, description, completed_at)
    VALUES (v_freelancer_id, p_contract_id, 'platform_fee', v_fee, 'completed', 'Platform fee (5%) deducted from contract release', now());

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'payment_status', 'released',
        'released_amount', v_net_amount,
        'fee_amount', v_fee,
        'cleared', true,
        'existing', false
    );
END;
$$;

-- 2. Update public.finalize_milestone_clearance_payment to deduct platform fee and log transactions
CREATE OR REPLACE FUNCTION public.finalize_milestone_clearance_payment(
    p_milestone_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract_id uuid;
    v_freelancer_id uuid;
    v_amount numeric;
    v_milestone_status text;
    v_clearance_until timestamptz;
    v_hold_disputed boolean;
    v_fee numeric;
    v_net_amount numeric;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('finalize_milestone_clearance:' || p_milestone_id::text));

    SELECT contract_id, amount, status::text, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_contract_id, v_amount, v_milestone_status, v_clearance_until, v_hold_disputed
    FROM public.milestones
    WHERE id = p_milestone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;

    -- If milestone already approved and clearance has cleared, check if pending clearance is null
    IF v_milestone_status = 'approved' AND v_clearance_until IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'milestone_id', p_milestone_id,
            'cleared', true,
            'existing', true
        );
    END IF;

    SELECT freelancer_id INTO v_freelancer_id FROM public.contracts WHERE id = v_contract_id;

    IF v_milestone_status <> 'approved' OR v_hold_disputed = true THEN
        RAISE EXCEPTION 'Milestone is not approved or has an active dispute hold';
    END IF;

    IF v_clearance_until IS NULL OR now() < v_clearance_until THEN
        RAISE EXCEPTION 'Clearance hold period has not expired yet';
    END IF;

    -- Calculate platform fee (5%) and net payout
    v_fee := ROUND(v_amount * 0.05, 2);
    v_net_amount := v_amount - v_fee;

    -- Mark milestone escrow as cleared
    UPDATE public.milestones
    SET escrow_pending_clearance_until = NULL,
        escrow_hold_disputed = false
    WHERE id = p_milestone_id;

    -- Credit the freelancer's wallet balance and total earned
    UPDATE public.wallets
    SET balance = balance + v_net_amount,
        total_earned = total_earned + v_net_amount,
        updated_at = now()
    WHERE user_id = v_freelancer_id;

    -- Insert transaction log for the escrow release (showing fee)
    INSERT INTO public.transactions (user_id, contract_id, type, amount, fee, status, description, completed_at)
    VALUES (v_freelancer_id, v_contract_id, 'escrow_release', v_amount, v_fee, 'completed', 'Milestone payment released from escrow hold (5% platform fee deducted)', now());

    -- Insert transaction log for the platform fee deduction itself
    INSERT INTO public.transactions (user_id, contract_id, type, amount, status, description, completed_at)
    VALUES (v_freelancer_id, v_contract_id, 'platform_fee', v_fee, 'completed', 'Platform fee (5%) deducted from milestone release', now());

    RETURN jsonb_build_object(
        'success', true,
        'milestone_id', p_milestone_id,
        'released_amount', v_net_amount,
        'fee_amount', v_fee,
        'cleared', true,
        'existing', false
    );
END;
$$;

-- 3. Update public.auto_release_contract_payment to deduct platform fee and log transactions
CREATE OR REPLACE FUNCTION public.auto_release_contract_payment(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract record;
    v_fee numeric;
    v_net_amount numeric;
BEGIN
    -- Verify contract state and 14-day rule
    SELECT id, status, review_due_at, client_id, freelancer_id, job_title, amount
    INTO v_contract
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF v_contract.id IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_contract.status <> 'delivery_submitted' THEN
        RAISE EXCEPTION 'Contract must be in delivery_submitted state';
    END IF;

    IF v_contract.review_due_at IS NULL OR v_contract.review_due_at > now() - interval '14 days' THEN
        RAISE EXCEPTION 'Contract is not eligible for auto-release yet';
    END IF;

    -- Calculate platform fee (5%) and net payout
    v_fee := ROUND(v_contract.amount * 0.05, 2);
    v_net_amount := v_contract.amount - v_fee;

    -- Update DB state
    UPDATE public.contracts
    SET status = 'completed',
        payment_status = 'released',
        completed_at = COALESCE(completed_at, now()),
        review_due_at = NULL,
        updated_at = now()
    WHERE id = p_contract_id;

    -- Unlock final assets
    UPDATE public.contract_delivery_assets a
    SET access_state = 'released',
        updated_at = now()
    FROM public.contract_deliveries d
    WHERE d.id = a.delivery_id
      AND d.contract_id = p_contract_id
      AND a.asset_kind = 'final_asset'
      AND a.access_state = 'locked';

    -- Credit the freelancer's wallet balance and total earned
    UPDATE public.wallets
    SET balance = balance + v_net_amount,
        total_earned = total_earned + v_net_amount,
        updated_at = now()
    WHERE user_id = v_contract.freelancer_id;

    -- Insert transaction log for the escrow release (showing fee)
    INSERT INTO public.transactions (user_id, contract_id, type, amount, fee, status, description, completed_at)
    VALUES (v_contract.freelancer_id, p_contract_id, 'escrow_release', v_contract.amount, v_fee, 'completed', 'Contract payment auto-released by platform (5% platform fee deducted)', now());

    -- Insert transaction log for the platform fee deduction itself
    INSERT INTO public.transactions (user_id, contract_id, type, amount, status, description, completed_at)
    VALUES (v_contract.freelancer_id, p_contract_id, 'platform_fee', v_fee, 'completed', 'Platform fee (5%) deducted from auto-released contract', now());

    -- Send notifications
    PERFORM public.create_notification(
        v_contract.client_id, 
        'contract', 
        'Payment auto-released', 
        format('The review window for "%s" expired 14 days ago. Payment has been automatically released.', v_contract.job_title), 
        '/messages', 
        p_contract_id
    );

    IF v_contract.freelancer_id IS NOT NULL AND v_contract.freelancer_id <> v_contract.client_id THEN
        PERFORM public.create_notification(
            v_contract.freelancer_id, 
            'contract', 
            'Payment released', 
            format('Payment for "%s" has been automatically released by the platform.', v_contract.job_title), 
            '/messages', 
            p_contract_id
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'contract_id', p_contract_id);
END;
$$;

-- Grant execution permissions explicitly
GRANT EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_clearance_payment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_release_contract_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_release_contract_payment(uuid) TO service_role;

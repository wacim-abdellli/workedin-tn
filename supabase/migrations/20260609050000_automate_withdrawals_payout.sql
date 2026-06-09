-- ============================================================================
-- Automate Withdrawals & Payout Admin RPCs
-- Migration: 20260609050000_automate_withdrawals_payout.sql
-- ============================================================================

-- 1. Create approve_withdrawal_admin function
CREATE OR REPLACE FUNCTION public.approve_withdrawal_admin(
    p_withdrawal_id uuid,
    p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_user_id uuid;
    v_wallet_id uuid;
    v_amount numeric;
    v_status text;
    v_method text;
    v_bank_name text;
    v_fee numeric;
BEGIN
    -- Assert the caller is admin
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can approve withdrawals';
    END IF;

    -- Obtain advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext('withdrawal_process:' || p_withdrawal_id::text));

    -- Select and lock the withdrawal record
    SELECT user_id, wallet_id, amount, status::text, method, bank_name
    INTO v_user_id, v_wallet_id, v_amount, v_status, v_method, v_bank_name
    FROM public.withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF v_status <> 'pending' AND v_status <> 'processing' THEN
        RAISE EXCEPTION 'Withdrawal request is not pending or processing. Current status: %', v_status;
    END IF;

    -- Calculate fee (1%, min 0.5 TND), capped at withdrawal amount
    v_fee := GREATEST(0.50, ROUND(v_amount * 0.01, 2));
    IF v_fee > v_amount THEN
        v_fee := v_amount;
    END IF;

    -- Update withdrawal record
    UPDATE public.withdrawals
    SET status = 'completed',
        fee = v_fee,
        processed_by = v_admin_id,
        processed_at = now(),
        admin_notes = p_admin_notes,
        updated_at = now()
    WHERE id = p_withdrawal_id;

    -- Update wallet stats: increase total_withdrawn
    UPDATE public.wallets
    SET total_withdrawn = total_withdrawn + v_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Log transaction for the withdrawal
    INSERT INTO public.transactions (
        user_id, 
        wallet_id, 
        type, 
        amount, 
        fee, 
        status, 
        payment_gateway, 
        description, 
        completed_at
    ) VALUES (
        v_user_id,
        v_wallet_id,
        'withdrawal',
        v_amount,
        v_fee,
        'completed',
        'dhmad',
        format('Withdrawal of %s TND completed via %s%s', v_amount, v_method, COALESCE(' (' || v_bank_name || ')', '')),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', p_withdrawal_id,
        'status', 'completed',
        'fee', v_fee
    );
END;
$$;

-- 2. Create reject_withdrawal_admin function
CREATE OR REPLACE FUNCTION public.reject_withdrawal_admin(
    p_withdrawal_id uuid,
    p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_user_id uuid;
    v_wallet_id uuid;
    v_amount numeric;
    v_status text;
BEGIN
    -- Assert the caller is admin
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can reject withdrawals';
    END IF;

    -- Obtain advisory lock
    PERFORM pg_advisory_xact_lock(hashtext('withdrawal_process:' || p_withdrawal_id::text));

    -- Select and lock withdrawal record
    SELECT user_id, wallet_id, amount, status::text
    INTO v_user_id, v_wallet_id, v_amount, v_status
    FROM public.withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF v_status <> 'pending' AND v_status <> 'processing' THEN
        RAISE EXCEPTION 'Withdrawal request is not pending or processing. Current status: %', v_status;
    END IF;

    -- Update withdrawal record
    UPDATE public.withdrawals
    SET status = 'rejected',
        processed_by = v_admin_id,
        processed_at = now(),
        admin_notes = p_admin_notes,
        updated_at = now()
    WHERE id = p_withdrawal_id;

    -- Refund balance to wallet
    UPDATE public.wallets
    SET balance = balance + v_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Log transaction for the refund
    INSERT INTO public.transactions (
        user_id, 
        wallet_id, 
        type, 
        amount, 
        status, 
        description, 
        completed_at
    ) VALUES (
        v_user_id,
        v_wallet_id,
        'refund',
        v_amount,
        'completed',
        COALESCE(p_admin_notes, 'Refund from rejected withdrawal request'),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', p_withdrawal_id,
        'status', 'rejected'
    );
END;
$$;

-- Grant execution permissions explicitly
GRANT EXECUTE ON FUNCTION public.approve_withdrawal_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal_admin(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal_admin(uuid, text) TO service_role;

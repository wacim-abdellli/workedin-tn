-- 1. Create a dedicated RPC for auto-releasing a contract's DB state
-- This should ONLY be called by the cron edge function AFTER successfully releasing via Dhmad.
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
BEGIN
    -- Verify contract state and 14-day rule
    SELECT id, status, review_due_at, client_id, freelancer_id, job_title
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


-- 2. Modify process_contract_review_timeouts to NOT auto-release the DB.
-- We revert the overdue branch to just be a notification, since the Edge function handles auto-release.
DROP FUNCTION IF EXISTS public.process_contract_review_timeouts(integer);
CREATE OR REPLACE FUNCTION public.process_contract_review_timeouts(
    p_batch_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_processed integer := 0;
    v_reminders integer := 0;
    v_overdue integer := 0;
    v_row record;
    v_title text;
    v_body text;
BEGIN
    FOR v_row IN
        SELECT contract_id, timeout_stage, client_id, freelancer_id, job_title, review_due_at
        FROM public.get_contract_review_timeout_candidates(p_batch_limit)
        FOR UPDATE SKIP LOCKED
    LOOP
        IF v_row.timeout_stage = 'reminder' THEN
            v_title := 'Review due soon';
            v_body := format('The review window for "%s" ends in less than 24 hours. Please review the submitted work.', v_row.job_title);

            PERFORM public.create_notification(v_row.client_id, 'contract', v_title, v_body, '/messages', v_row.contract_id);

            UPDATE public.contracts
            SET review_reminder_sent_at = now(),
                updated_at = now()
            WHERE id = v_row.contract_id
              AND review_reminder_sent_at IS NULL;

            v_reminders := v_reminders + 1;
            v_processed := v_processed + 1;
        ELSIF v_row.timeout_stage = 'overdue' THEN
            -- We just send the standard overdue notification here.
            -- We don't auto-release the payment; the Edge function handles the 14-day auto-release.
            v_title := 'Contract review overdue';
            v_body := format('The review window for "%s" has expired. The contract now needs follow-up or escalation.', v_row.job_title);

            PERFORM public.create_notification(v_row.client_id, 'contract', v_title, v_body, '/messages', v_row.contract_id);

            IF v_row.freelancer_id IS NOT NULL AND v_row.freelancer_id <> v_row.client_id THEN
                PERFORM public.create_notification(
                    v_row.freelancer_id,
                    'contract',
                    'Contract review overdue',
                    format('The client review window for "%s" has expired. Follow-up may be needed.', v_row.job_title),
                    '/messages',
                    v_row.contract_id
                );
            END IF;

            UPDATE public.contracts
            SET review_overdue_notified_at = now(),
                updated_at = now()
            WHERE id = v_row.contract_id
              AND review_overdue_notified_at IS NULL;

            v_overdue := v_overdue + 1;
            v_processed := v_processed + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed', v_processed,
        'reminders', v_reminders,
        'overdue', v_overdue
    );
END;
$$;

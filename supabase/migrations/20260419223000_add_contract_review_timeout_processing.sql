ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS review_reminder_sent_at timestamptz,
    ADD COLUMN IF NOT EXISTS review_overdue_notified_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_contract_review_timeout_candidates(
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    contract_id uuid,
    client_id uuid,
    freelancer_id uuid,
    review_due_at timestamptz,
    timeout_stage text,
    job_title text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH candidates AS (
        SELECT
            c.id AS contract_id,
            c.client_id,
            c.freelancer_id,
            c.review_due_at,
            CASE
                WHEN c.review_due_at <= now() AND c.review_overdue_notified_at IS NULL THEN 'overdue'
                WHEN c.review_due_at > now()
                     AND c.review_due_at <= now() + interval '24 hours'
                     AND c.review_reminder_sent_at IS NULL THEN 'reminder'
                ELSE NULL
            END AS timeout_stage,
            j.title AS job_title
        FROM public.contracts c
        LEFT JOIN public.jobs j ON j.id = c.job_id
        WHERE c.status = 'active'
          AND c.delivery_submitted_at IS NOT NULL
          AND c.review_due_at IS NOT NULL
          AND c.payment_status IS DISTINCT FROM 'released'
    )
    SELECT
        contract_id,
        client_id,
        freelancer_id,
        review_due_at,
        timeout_stage,
        COALESCE(job_title, 'Contract') AS job_title
    FROM candidates
    WHERE timeout_stage IS NOT NULL
    ORDER BY review_due_at ASC
    LIMIT GREATEST(COALESCE(p_limit, 50), 1);
$$;

CREATE OR REPLACE FUNCTION public.process_contract_review_timeouts(
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
    v_caller uuid := auth.uid();
    v_is_service_role boolean := (v_request_role = 'service_role');
    v_processed integer := 0;
    v_reminders integer := 0;
    v_overdue integer := 0;
    v_row record;
    v_title text;
    v_body text;
BEGIN
    IF NOT v_is_service_role THEN
        IF v_caller IS NULL OR NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only service role or admins can process contract review timeouts';
        END IF;
    END IF;

    FOR v_row IN
        SELECT * FROM public.get_contract_review_timeout_candidates(p_limit)
    LOOP
        PERFORM pg_advisory_xact_lock(hashtext('process_contract_review_timeout:' || v_row.contract_id::text));

        IF v_row.timeout_stage = 'reminder' THEN
            v_title := 'Contract review reminder';
            v_body := format('Review is due soon for "%s". Please approve, request changes, or open a dispute before %s.', v_row.job_title, to_char(v_row.review_due_at, 'YYYY-MM-DD HH24:MI'));

            PERFORM public.create_notification(v_row.client_id, 'contract', v_title, v_body, '/messages', v_row.contract_id);

            IF v_row.freelancer_id IS NOT NULL AND v_row.freelancer_id <> v_row.client_id THEN
                PERFORM public.create_notification(
                    v_row.freelancer_id,
                    'contract',
                    'Client review reminder sent',
                    format('The client review window for "%s" closes at %s.', v_row.job_title, to_char(v_row.review_due_at, 'YYYY-MM-DD HH24:MI')),
                    '/messages',
                    v_row.contract_id
                );
            END IF;

            UPDATE public.contracts
            SET review_reminder_sent_at = now(),
                updated_at = now()
            WHERE id = v_row.contract_id
              AND review_reminder_sent_at IS NULL;

            v_reminders := v_reminders + 1;
            v_processed := v_processed + 1;
        ELSIF v_row.timeout_stage = 'overdue' THEN
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

REVOKE ALL ON FUNCTION public.get_contract_review_timeout_candidates(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_contract_review_timeouts(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_contract_review_timeout_candidates(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_contract_review_timeouts(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_contract_review_timeouts(integer) TO service_role;

COMMENT ON COLUMN public.contracts.review_reminder_sent_at IS 'Timestamp when the due-soon review reminder was sent for the current delivery window.';
COMMENT ON COLUMN public.contracts.review_overdue_notified_at IS 'Timestamp when the overdue review notice was sent for the current delivery window.';
COMMENT ON FUNCTION public.get_contract_review_timeout_candidates(integer) IS 'Lists active contracts with due-soon or overdue review windows that still need timeout processing.';
COMMENT ON FUNCTION public.process_contract_review_timeouts(integer) IS 'Processes due-soon and overdue review windows, sends notifications once, and marks contracts as timeout-processed.';

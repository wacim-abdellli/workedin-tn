-- 1. Redefine open_dispute_atomic to allow delivery_submitted and clear review_due_at
CREATE OR REPLACE FUNCTION public.open_dispute_atomic(
    p_contract_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_client_id uuid;
    v_freelancer_id uuid;
    v_contract_status text;
    v_existing_dispute_id uuid;
    v_dispute_id uuid;
    v_evidence_snapshot jsonb;
    v_evidence_timeline jsonb;
    v_evidence_captured_at timestamptz := now();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Dispute reason is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('open_dispute:' || p_contract_id::text));

    SELECT client_id, freelancer_id, status::text
    INTO v_client_id, v_freelancer_id, v_contract_status
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_client_id AND v_user_id <> v_freelancer_id THEN
        RAISE EXCEPTION 'Only contract parties can open a dispute';
    END IF;

    -- FIX: Allowed 'delivery_submitted'
    IF v_contract_status NOT IN ('pending_payment', 'active', 'delivery_submitted', 'revision_requested') THEN
        RAISE EXCEPTION 'A dispute cannot be opened in the current contract state';
    END IF;

    SELECT id
    INTO v_existing_dispute_id
    FROM public.disputes
    WHERE contract_id = p_contract_id
      AND status = 'open'
    LIMIT 1;

    IF v_existing_dispute_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'existing', true,
            'dispute_id', v_existing_dispute_id
        );
    END IF;

    v_evidence_snapshot := public.build_contract_dispute_evidence_snapshot(p_contract_id);
    v_evidence_timeline := public.build_contract_dispute_evidence_timeline(p_contract_id);

    UPDATE public.contracts
    SET status = 'disputed',
        review_due_at = NULL, -- FIX: kill the review timer on dispute
        updated_at = now()
    WHERE id = p_contract_id;

    INSERT INTO public.disputes (
        contract_id,
        opened_by,
        reason,
        status,
        evidence_snapshot,
        evidence_timeline,
        evidence_captured_at
    )
    VALUES (
        p_contract_id,
        v_user_id,
        p_reason,
        'open',
        COALESCE(v_evidence_snapshot, '{}'::jsonb),
        COALESCE(v_evidence_timeline, '[]'::jsonb),
        v_evidence_captured_at
    )
    RETURNING id INTO v_dispute_id;

    RETURN jsonb_build_object(
        'success', true,
        'existing', false,
        'dispute_id', v_dispute_id,
        'evidence_captured_at', v_evidence_captured_at
    );
END;
$$;


-- 2. Modify process_contract_review_timeouts to handle 14-day auto-release
-- We will replace the entire function to add the auto-release check
CREATE OR REPLACE FUNCTION public.process_contract_review_timeouts(
    p_limit integer DEFAULT 50
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
    v_released integer := 0;
    v_row record;
    v_title text;
    v_body text;
BEGIN
    FOR v_row IN
        SELECT contract_id, timeout_stage, client_id, freelancer_id, job_title, review_due_at
        FROM public.get_contract_review_timeout_candidates(p_limit)
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
            -- Check for auto-release (overdue by > 14 days)
            IF v_row.review_due_at <= now() - interval '14 days' THEN
                -- Auto-release payment!
                UPDATE public.contracts
                SET status = 'completed',
                    payment_status = 'released',
                    completed_at = COALESCE(completed_at, now()),
                    review_due_at = NULL,
                    updated_at = now()
                WHERE id = v_row.contract_id AND status = 'delivery_submitted';
                
                -- Unlock final assets
                UPDATE public.contract_delivery_assets a
                SET access_state = 'released',
                    updated_at = now()
                FROM public.contract_deliveries d
                WHERE d.id = a.delivery_id
                  AND d.contract_id = v_row.contract_id
                  AND a.asset_kind = 'final_asset'
                  AND a.access_state = 'locked';

                v_title := 'Payment auto-released';
                v_body := format('The review window for "%s" expired 14 days ago. Payment has been automatically released.', v_row.job_title);

                PERFORM public.create_notification(v_row.client_id, 'contract', v_title, v_body, '/messages', v_row.contract_id);
                IF v_row.freelancer_id IS NOT NULL AND v_row.freelancer_id <> v_row.client_id THEN
                    PERFORM public.create_notification(v_row.freelancer_id, 'contract', 'Payment released', format('Payment for "%s" has been automatically released by the platform.', v_row.job_title), '/messages', v_row.contract_id);
                END IF;

                v_released := v_released + 1;
                v_processed := v_processed + 1;
            ELSE
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
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed', v_processed,
        'reminders', v_reminders,
        'overdue', v_overdue,
        'released', v_released
    );
END;
$$;

-- 3. Storage immutability policies
DROP POLICY IF EXISTS "contract_files_freelancer_upload" ON storage.objects;
CREATE POLICY "contract_files_freelancer_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'contract-files'
    AND auth.uid() IS NOT NULL
);

-- Block DELETE on submitted deliveries
DROP POLICY IF EXISTS "contract_files_block_delete" ON storage.objects;
CREATE POLICY "contract_files_block_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'contract-files'
    AND (
        public.is_admin()
        OR NOT EXISTS (
            SELECT 1 FROM public.contract_delivery_assets a
            JOIN public.contract_deliveries d ON d.id = a.delivery_id
            JOIN public.contracts c ON c.id = d.contract_id
            WHERE a.storage_path = name
              AND c.status IN ('delivery_submitted', 'completed', 'disputed')
        )
    )
);

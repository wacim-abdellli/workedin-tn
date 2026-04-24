ALTER TABLE public.disputes
    ADD COLUMN IF NOT EXISTS evidence_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS evidence_timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS evidence_captured_at timestamptz;

CREATE OR REPLACE FUNCTION public.build_contract_dispute_evidence_snapshot(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract jsonb;
    v_milestone_total integer := 0;
    v_milestone_completed integer := 0;
    v_attachment_message_count integer := 0;
    v_protected_event_count integer := 0;
    v_latest_message_at timestamptz;
BEGIN
    SELECT to_jsonb(c)
    INTO v_contract
    FROM public.contracts c
    WHERE c.id = p_contract_id;

    IF v_contract IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;

    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE COALESCE(status::text, '') IN ('completed', 'approved', 'paid'))
    INTO v_milestone_total, v_milestone_completed
    FROM public.milestones
    WHERE contract_id = p_contract_id;

    SELECT COUNT(*) FILTER (
               WHERE jsonb_typeof(COALESCE(attachments, '[]'::jsonb)) = 'array'
                 AND jsonb_array_length(COALESCE(attachments, '[]'::jsonb)) > 0
           ),
           COUNT(*) FILTER (
               WHERE content LIKE '[[delivery]]%'
                  OR content LIKE '[[revision_requested]]%'
                  OR content LIKE '[[contract_completed]]%'
                  OR content LIKE '[[dispute_opened]]%'
           ),
           MAX(created_at)
    INTO v_attachment_message_count, v_protected_event_count, v_latest_message_at
    FROM public.messages
    WHERE contract_id = p_contract_id
      AND COALESCE(is_deleted, false) = false;

    RETURN jsonb_build_object(
        'contract', jsonb_build_object(
            'id', v_contract ->> 'id',
            'status', v_contract ->> 'status',
            'payment_status', v_contract ->> 'payment_status',
            'amount', v_contract -> 'amount',
            'total_amount', v_contract -> 'total_amount',
            'title', v_contract -> 'title',
            'description', v_contract -> 'description',
            'delivery_note', v_contract -> 'delivery_note',
            'funded_at', v_contract -> 'funded_at',
            'delivery_submitted_at', v_contract -> 'delivery_submitted_at',
            'review_due_at', v_contract -> 'review_due_at',
            'revision_requested_at', v_contract -> 'revision_requested_at',
            'revision_requests_count', v_contract -> 'revision_requests_count',
            'max_revision_rounds', v_contract -> 'max_revision_rounds',
            'client_id', v_contract -> 'client_id',
            'freelancer_id', v_contract -> 'freelancer_id',
            'job_id', v_contract -> 'job_id',
            'created_at', v_contract -> 'created_at'
        ),
        'milestones', jsonb_build_object(
            'total', v_milestone_total,
            'completed', v_milestone_completed
        ),
        'messages', jsonb_build_object(
            'attachment_message_count', v_attachment_message_count,
            'protected_event_count', v_protected_event_count,
            'latest_message_at', v_latest_message_at
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.build_contract_dispute_evidence_timeline(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract jsonb;
    v_timeline jsonb;
BEGIN
    SELECT to_jsonb(c)
    INTO v_contract
    FROM public.contracts c
    WHERE c.id = p_contract_id;

    IF v_contract IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    WITH contract_events AS (
        SELECT 'contract_created'::text AS event_type,
               NULLIF(v_contract ->> 'created_at', '')::timestamptz AS event_at,
               jsonb_build_object('status', v_contract ->> 'status', 'payment_status', v_contract ->> 'payment_status') AS details
        WHERE NULLIF(v_contract ->> 'created_at', '') IS NOT NULL

        UNION ALL

        SELECT 'contract_funded',
               NULLIF(v_contract ->> 'funded_at', '')::timestamptz,
               jsonb_build_object('status', v_contract ->> 'status', 'payment_status', v_contract ->> 'payment_status')
        WHERE NULLIF(v_contract ->> 'funded_at', '') IS NOT NULL

        UNION ALL

        SELECT 'delivery_submitted',
               NULLIF(v_contract ->> 'delivery_submitted_at', '')::timestamptz,
               jsonb_build_object('delivery_note', v_contract -> 'delivery_note', 'review_due_at', v_contract -> 'review_due_at')
        WHERE NULLIF(v_contract ->> 'delivery_submitted_at', '') IS NOT NULL

        UNION ALL

        SELECT 'revision_requested',
               NULLIF(v_contract ->> 'revision_requested_at', '')::timestamptz,
               jsonb_build_object('revision_requests_count', v_contract -> 'revision_requests_count')
        WHERE NULLIF(v_contract ->> 'revision_requested_at', '') IS NOT NULL

        UNION ALL

        SELECT 'contract_completed',
               NULLIF(v_contract ->> 'completed_at', '')::timestamptz,
               jsonb_build_object('payment_status', v_contract -> 'payment_status')
        WHERE NULLIF(v_contract ->> 'completed_at', '') IS NOT NULL
    ),
    message_events AS (
        SELECT CASE
                   WHEN m.content LIKE '[[delivery]]%' THEN 'delivery_message'
                   WHEN m.content LIKE '[[revision_requested]]%' THEN 'revision_message'
                   WHEN m.content LIKE '[[contract_completed]]%' THEN 'completion_message'
                   WHEN m.content LIKE '[[dispute_opened]]%' THEN 'dispute_message'
                   ELSE 'message'
               END AS event_type,
               m.created_at AS event_at,
               jsonb_build_object(
                   'message_id', m.id,
                   'sender_id', m.sender_id,
                   'message_type', m.message_type,
                   'content', left(COALESCE(m.content, ''), 280),
                   'has_attachments', CASE
                       WHEN jsonb_typeof(COALESCE(m.attachments, '[]'::jsonb)) = 'array'
                           THEN jsonb_array_length(COALESCE(m.attachments, '[]'::jsonb)) > 0
                       ELSE false
                   END
               ) AS details
        FROM public.messages m
        WHERE m.contract_id = p_contract_id
          AND COALESCE(m.is_deleted, false) = false
          AND (
              m.content LIKE '[[delivery]]%'
              OR m.content LIKE '[[revision_requested]]%'
              OR m.content LIKE '[[contract_completed]]%'
              OR m.content LIKE '[[dispute_opened]]%'
              OR (
                  jsonb_typeof(COALESCE(m.attachments, '[]'::jsonb)) = 'array'
                  AND jsonb_array_length(COALESCE(m.attachments, '[]'::jsonb)) > 0
              )
          )
    ),
    combined AS (
        SELECT * FROM contract_events
        UNION ALL
        SELECT * FROM message_events
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'event_type', event_type,
                'event_at', event_at,
                'details', details
            )
            ORDER BY event_at NULLS LAST
        ),
        '[]'::jsonb
    )
    INTO v_timeline
    FROM combined;

    RETURN v_timeline;
END;
$$;

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

    IF v_contract_status NOT IN ('pending_payment', 'active', 'revision_requested') THEN
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

COMMENT ON COLUMN public.disputes.evidence_snapshot IS 'Structured snapshot of contract state and evidence counts captured when the dispute was opened.';
COMMENT ON COLUMN public.disputes.evidence_timeline IS 'Ordered timeline of key contract and message evidence captured when the dispute was opened.';
COMMENT ON COLUMN public.disputes.evidence_captured_at IS 'Timestamp when structured dispute evidence was captured.';
COMMENT ON FUNCTION public.build_contract_dispute_evidence_snapshot(uuid) IS 'Builds a structured contract evidence snapshot for dispute intake.';
COMMENT ON FUNCTION public.build_contract_dispute_evidence_timeline(uuid) IS 'Builds an ordered evidence timeline for dispute intake using contract milestones, timestamps, and key messages.';
COMMENT ON FUNCTION public.open_dispute_atomic(uuid, text) IS 'Atomically opens disputes only from active workflow states, prevents duplicates, and captures a structured evidence snapshot/timeline.';

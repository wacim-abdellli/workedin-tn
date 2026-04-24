CREATE OR REPLACE FUNCTION public.delete_message_atomic(
    p_message_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_sender_id uuid;
    v_conversation_id uuid;
    v_already_deleted boolean;
    v_contract_id uuid;
    v_content text;
    v_attachments jsonb;
    v_contract_status text;
    v_has_attachments boolean := false;
    v_is_protected_system_evidence boolean := false;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT sender_id, conversation_id, COALESCE(is_deleted, false), contract_id, COALESCE(content, ''), attachments
    INTO v_sender_id, v_conversation_id, v_already_deleted, v_contract_id, v_content, v_attachments
    FROM public.messages
    WHERE id = p_message_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Message not found';
    END IF;

    IF v_sender_id <> v_user_id THEN
        RAISE EXCEPTION 'You can only delete your own messages';
    END IF;

    IF v_already_deleted THEN
        RETURN jsonb_build_object(
            'success', true,
            'message_id', p_message_id,
            'conversation_id', v_conversation_id,
            'already_deleted', true
        );
    END IF;

    v_has_attachments := jsonb_typeof(COALESCE(v_attachments, '[]'::jsonb)) = 'array'
        AND jsonb_array_length(COALESCE(v_attachments, '[]'::jsonb)) > 0;

    v_is_protected_system_evidence := v_content LIKE '[[delivery]]%'
        OR v_content LIKE '[[revision_requested]]%'
        OR v_content LIKE '[[contract_completed]]%'
        OR v_content LIKE '[[dispute_opened]]%';

    IF v_is_protected_system_evidence THEN
        RAISE EXCEPTION 'Critical contract evidence messages cannot be deleted';
    END IF;

    IF v_contract_id IS NOT NULL THEN
        SELECT status::text
        INTO v_contract_status
        FROM public.contracts
        WHERE id = v_contract_id;

        IF v_has_attachments AND v_contract_status IN ('disputed', 'completed') THEN
            RAISE EXCEPTION 'Contract evidence attachments cannot be deleted after completion or dispute';
        END IF;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('delete_message:' || p_message_id::text));

    UPDATE public.messages
    SET
        is_deleted = true,
        deleted_at = now(),
        deleted_by = v_user_id,
        attachments = '[]'::jsonb,
        is_read = true
    WHERE id = p_message_id;

    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'conversation_id', v_conversation_id,
        'already_deleted', false
    );
END;
$$;

COMMENT ON FUNCTION public.delete_message_atomic(uuid) IS 'Soft deletes messages while preserving critical contract evidence messages and attachment evidence after dispute/completion.';

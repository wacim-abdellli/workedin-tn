-- Part 5: Create delete_message_atomic RPC function
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
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT sender_id, conversation_id, COALESCE(is_deleted, false)
    INTO v_sender_id, v_conversation_id, v_already_deleted
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

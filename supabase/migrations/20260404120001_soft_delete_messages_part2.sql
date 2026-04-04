-- Part 2: Create function to refresh conversation metadata
CREATE OR REPLACE FUNCTION public.refresh_conversation_metadata(
    p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.conversations c
    SET
        last_message_text = (
            SELECT CASE
                WHEN COALESCE(m.is_deleted, false) THEN 'Message deleted'
                ELSE m.content
            END
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        last_message_at = (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        unread_count_1 = (
            SELECT COUNT(*)::int
            FROM public.messages m
            WHERE m.conversation_id = c.id
              AND m.receiver_id = c.participant_1
              AND m.is_read = false
              AND COALESCE(m.is_deleted, false) = false
        ),
        unread_count_2 = (
            SELECT COUNT(*)::int
            FROM public.messages m
            WHERE m.conversation_id = c.id
              AND m.receiver_id = c.participant_2
              AND m.is_read = false
              AND COALESCE(m.is_deleted, false) = false
        ),
        updated_at = now()
    WHERE c.id = p_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_body text DEFAULT '',
    p_link text DEFAULT NULL,
    p_related_id uuid DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inserted_row public.notifications;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
    VALUES (p_user_id, p_type, p_title, COALESCE(p_body, ''), false, p_link, p_related_id)
    RETURNING * INTO inserted_row;

    RETURN inserted_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO service_role;

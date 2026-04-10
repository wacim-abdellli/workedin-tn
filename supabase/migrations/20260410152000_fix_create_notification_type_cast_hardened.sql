-- Fix notification type casting across environments where notifications.type
-- is notification_type_enum instead of text.

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
AS $function$
DECLARE
    inserted_row public.notifications;
    v_caller uuid := auth.uid();
    v_has_enum boolean;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Notification recipient is required';
    END IF;

    IF v_caller IS NOT NULL AND NOT public.is_admin() AND v_caller <> p_user_id THEN
        RAISE EXCEPTION 'Not allowed to create notifications for other users';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'notification_type_enum'
    ) INTO v_has_enum;

    IF v_has_enum THEN
        EXECUTE '
            INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
            VALUES ($1, $2::notification_type_enum, $3, COALESCE($4, ''''), false, $5, $6)
            RETURNING *
        '
        INTO inserted_row
        USING p_user_id, p_type, p_title, p_body, p_link, p_related_id;
    ELSE
        INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
        VALUES (p_user_id, p_type, p_title, COALESCE(p_body, ''), false, p_link, p_related_id)
        RETURNING * INTO inserted_row;
    END IF;

    RETURN inserted_row;
END;
$function$;

DO $$
BEGIN
    IF to_regprocedure('public.create_notification(uuid,text,text,text,text,uuid)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid) TO service_role;
    END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';

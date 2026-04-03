-- Older environments use notification_type_enum for notifications.type.
-- Cast incoming text explicitly so server-side notification inserts work.

CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_body text,
    p_related_id uuid DEFAULT NULL,
    p_link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, related_id, link)
    VALUES (p_user_id, p_type::notification_type_enum, p_title, p_body, p_related_id, p_link);
END;
$$;

NOTIFY pgrst, 'reload schema';

-- Normalize legacy notification type aliases when notifications.type uses
-- notification_type_enum values like new_proposal / contract_update.

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
    v_enum_labels text[];
    v_normalized_type text := lower(trim(coalesce(p_type, '')));
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Notification recipient is required';
    END IF;

    IF v_caller IS NOT NULL AND NOT public.is_admin() AND v_caller <> p_user_id THEN
        RAISE EXCEPTION 'Not allowed to create notifications for other users';
    END IF;

    IF v_normalized_type = '' THEN
        v_normalized_type := 'system';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'notification_type_enum'
    ) INTO v_has_enum;

    IF v_has_enum THEN
        SELECT array_agg(e.enumlabel::text)
        INTO v_enum_labels
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'notification_type_enum';

        -- Legacy aliases used by older triggers/RPCs.
        IF v_normalized_type = 'proposal' AND 'new_proposal' = ANY(v_enum_labels) THEN
            v_normalized_type := 'new_proposal';
        ELSIF v_normalized_type = 'contract' AND 'contract_update' = ANY(v_enum_labels) THEN
            v_normalized_type := 'contract_update';
        ELSIF v_normalized_type = 'new_proposal' AND 'proposal' = ANY(v_enum_labels) THEN
            v_normalized_type := 'proposal';
        ELSIF v_normalized_type = 'contract_update' AND 'contract' = ANY(v_enum_labels) THEN
            v_normalized_type := 'contract';
        END IF;

        -- Last-resort fallback keeps writes non-breaking.
        IF NOT (v_normalized_type = ANY(v_enum_labels)) THEN
            IF 'system' = ANY(v_enum_labels) THEN
                v_normalized_type := 'system';
            ELSE
                v_normalized_type := coalesce(v_enum_labels[1], 'message');
            END IF;
        END IF;

        EXECUTE '
            INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
            VALUES ($1, $2::notification_type_enum, $3, COALESCE($4, ''''), false, $5, $6)
            RETURNING *
        '
        INTO inserted_row
        USING p_user_id, v_normalized_type, p_title, p_body, p_link, p_related_id;
    ELSE
        -- Legacy text/check-constraint deployments.
        IF v_normalized_type = 'new_proposal' THEN
            v_normalized_type := 'proposal';
        ELSIF v_normalized_type = 'contract_update' THEN
            v_normalized_type := 'contract';
        END IF;

        INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
        VALUES (p_user_id, v_normalized_type, p_title, COALESCE(p_body, ''), false, p_link, p_related_id)
        RETURNING * INTO inserted_row;
    END IF;

    RETURN inserted_row;
END;
$function$;

-- Compatibility overload for legacy positional calls used by older triggers:
-- create_notification(user_id, type, title, body, related_id, link)
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
AS $legacy_function$
BEGIN
    -- Delegate to canonical overload that normalizes notification type aliases.
    PERFORM public.create_notification(
        p_user_id,
        p_type,
        p_title,
        p_body,
        p_link,
        p_related_id
    );
END;
$legacy_function$;

DO $$
BEGIN
    IF to_regprocedure('public.create_notification(uuid,text,text,text,text,uuid)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid) TO service_role;
    END IF;

    IF to_regprocedure('public.create_notification(uuid,text,text,text,uuid,text)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.create_notification(uuid,text,text,text,uuid,text) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,uuid,text) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,uuid,text) TO service_role;
    END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
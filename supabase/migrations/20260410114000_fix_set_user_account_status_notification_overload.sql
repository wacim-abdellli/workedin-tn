-- Resolve ambiguous function overload in admin status updates.
-- Some environments contain two create_notification signatures with swapped
-- argument order (p_link/p_related_id). Explicit casts prevent ambiguity.

CREATE OR REPLACE FUNCTION public.set_user_account_status(
    p_user_id uuid,
    p_next_status text,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_target_is_admin boolean := false;
    v_title text;
    v_body text;
BEGIN
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can update account status';
    END IF;

    IF p_next_status NOT IN ('active', 'suspended', 'archived') THEN
        RAISE EXCEPTION 'Invalid account status: %', p_next_status;
    END IF;

    SELECT COALESCE(is_admin, false)
    INTO v_target_is_admin
    FROM public.profiles
    WHERE id = p_user_id;

    IF p_user_id = v_admin_id AND p_next_status <> 'active' THEN
        RAISE EXCEPTION 'Admins cannot suspend or archive their own account';
    END IF;

    UPDATE public.profiles
    SET account_status = p_next_status,
        updated_at = now()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    v_title := CASE p_next_status
        WHEN 'active' THEN 'Account access restored'
        WHEN 'archived' THEN 'Account archived'
        ELSE 'Account suspended'
    END;

    v_body := CASE p_next_status
        WHEN 'active' THEN 'Your account access has been restored. You can use the platform again.'
        WHEN 'archived' THEN 'Your account has been archived. Please contact support if you believe this is a mistake.'
        ELSE 'Your account has been suspended. Please contact support if you need more information.'
    END;

    PERFORM public.log_admin_action(
        CASE p_next_status
            WHEN 'active' THEN 'user_reactivated'
            WHEN 'archived' THEN 'user_archived'
            ELSE 'user_suspended'
        END,
        p_user_id,
        'profile',
        p_user_id,
        p_reason,
        jsonb_build_object('account_status', p_next_status, 'target_is_admin', v_target_is_admin)
    );

    PERFORM public.create_notification(
        p_user_id,
        'system'::text,
        v_title,
        v_body,
        '/login'::text,
        NULL::uuid
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'account_status', p_next_status
    );
END;
$$;

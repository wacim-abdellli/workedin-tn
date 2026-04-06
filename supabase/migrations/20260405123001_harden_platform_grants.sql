-- Statement boundary

-- Apply security to functions
DO $grants$
BEGIN
    REVOKE ALL ON FUNCTION public.log_admin_action(text, uuid, text, uuid, text, jsonb) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.log_admin_action(text, uuid, text, uuid, text, jsonb) TO authenticated;

    REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO service_role;

    REVOKE ALL ON FUNCTION public.update_verification_status(uuid, text, timestamptz, text) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.revoke_verification_status(uuid, text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.update_verification_status(uuid, text, timestamptz, text) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.revoke_verification_status(uuid, text) TO authenticated;

    REVOKE ALL ON FUNCTION public.set_user_account_status(uuid, text, text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.set_user_account_status(uuid, text, text) TO authenticated;

    REVOKE ALL ON FUNCTION public.open_dispute_atomic(uuid, text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.open_dispute_atomic(uuid, text) TO authenticated;
END;
$grants$;

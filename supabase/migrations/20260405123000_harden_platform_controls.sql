BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_account_status_check'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_account_status_check
            CHECK (account_status IN ('active', 'suspended', 'archived'));
    END IF;
END;
$$;

ALTER TABLE public.identity_verifications
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.identity_verifications
    ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action text NOT NULL,
    target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type text,
    entity_id uuid,
    reason text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON public.admin_audit_logs(target_user_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_logs_select_admin" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_select_admin" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_audit_logs_insert_admin" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_insert_admin" ON public.admin_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() AND admin_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action text,
    p_target_user_id uuid DEFAULT NULL,
    p_entity_type text DEFAULT NULL,
    p_entity_id uuid DEFAULT NULL,
    p_reason text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_log_id uuid;
BEGIN
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can write audit logs';
    END IF;

    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        target_user_id,
        entity_type,
        entity_id,
        reason,
        metadata
    )
    VALUES (
        v_admin_id,
        p_action,
        p_target_user_id,
        p_entity_type,
        p_entity_id,
        p_reason,
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, uuid, text, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, uuid, text, uuid, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    NEW.is_admin := OLD.is_admin;
    NEW.cin_verified := OLD.cin_verified;
    NEW.account_status := OLD.account_status;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_admin_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_admin_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_profile_admin_fields();

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
    v_caller uuid := auth.uid();
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Notification recipient is required';
    END IF;

    IF v_caller IS NOT NULL AND NOT public.is_admin() AND v_caller <> p_user_id THEN
        RAISE EXCEPTION 'Not allowed to create notifications for other users';
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
    VALUES (p_user_id, p_type, p_title, COALESCE(p_body, ''), false, p_link, p_related_id)
    RETURNING * INTO inserted_row;

    RETURN inserted_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO service_role;

DROP FUNCTION IF EXISTS public.update_verification_status(uuid, text, timestamptz);
CREATE OR REPLACE FUNCTION public.update_verification_status(
    p_user_id uuid,
    p_action text,
    p_reviewed_at timestamptz DEFAULT now(),
    p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_cin_verified boolean;
    v_affected_rows int;
    v_verification_id uuid;
BEGIN
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can update verification status';
    END IF;

    IF p_action NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid action: %. Must be "approved" or "rejected"', p_action;
    END IF;

    v_cin_verified := (p_action = 'approved');

    SELECT id
    INTO v_verification_id
    FROM public.identity_verifications
    WHERE user_id = p_user_id
    ORDER BY submitted_at DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 1;

    UPDATE public.identity_verifications
    SET status = p_action,
        reviewed_at = p_reviewed_at,
        reviewed_by = v_admin_id,
        reviewer_notes = CASE
            WHEN p_action = 'rejected' THEN COALESCE(p_admin_note, reviewer_notes)
            ELSE reviewer_notes
        END,
        rejection_reason = CASE
            WHEN p_action = 'rejected' THEN COALESCE(p_admin_note, rejection_reason)
            ELSE NULL
        END
    WHERE user_id = p_user_id
      AND status = 'pending';

    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

    IF v_affected_rows = 0 THEN
        RAISE EXCEPTION 'No pending verification request found for this user';
    END IF;

    UPDATE public.profiles
    SET cin_verified = v_cin_verified,
        updated_at = now()
    WHERE id = p_user_id;

    UPDATE public.freelancer_profiles
    SET cin_verified = v_cin_verified
    WHERE id = p_user_id;

    PERFORM public.log_admin_action(
        CASE WHEN p_action = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
        p_user_id,
        'identity_verification',
        v_verification_id,
        p_admin_note,
        jsonb_build_object('cin_verified', v_cin_verified)
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'action', p_action,
        'cin_verified', v_cin_verified,
        'verification_rows_updated', v_affected_rows
    );
END;
$$;

DROP FUNCTION IF EXISTS public.revoke_verification_status(uuid);
CREATE OR REPLACE FUNCTION public.revoke_verification_status(
    p_user_id uuid,
    p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_verification_id uuid;
    v_reason text := COALESCE(NULLIF(btrim(p_admin_note), ''), 'Verification revoked by admin');
BEGIN
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can revoke verification status';
    END IF;

    SELECT id
    INTO v_verification_id
    FROM public.identity_verifications
    WHERE user_id = p_user_id
    ORDER BY submitted_at DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 1;

    IF v_verification_id IS NOT NULL THEN
        UPDATE public.identity_verifications
        SET status = 'rejected',
            reviewed_at = now(),
            reviewed_by = v_admin_id,
            reviewer_notes = v_reason,
            rejection_reason = v_reason
        WHERE id = v_verification_id;
    END IF;

    UPDATE public.profiles
    SET cin_verified = false,
        updated_at = now()
    WHERE id = p_user_id;

    UPDATE public.freelancer_profiles
    SET cin_verified = false
    WHERE id = p_user_id;

    PERFORM public.log_admin_action(
        'verification_revoked',
        p_user_id,
        'identity_verification',
        v_verification_id,
        v_reason,
        jsonb_build_object('cin_verified', false)
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'cin_verified', false,
        'verification_id', v_verification_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.update_verification_status(uuid, text, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_verification_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_verification_status(uuid, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_verification_status(uuid, text) TO authenticated;

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
        'system',
        v_title,
        v_body,
        '/login',
        NULL
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'account_status', p_next_status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_account_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_account_status(uuid, text, text) TO authenticated;

DROP POLICY IF EXISTS "disputes_insert" ON public.disputes;
CREATE POLICY "disputes_insert" ON public.disputes
    FOR INSERT WITH CHECK (
        auth.uid() = opened_by
        AND EXISTS (
            SELECT 1
            FROM public.contracts c
            WHERE c.id = contract_id
              AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
        )
    );

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
    v_existing_dispute_id uuid;
    v_dispute_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Dispute reason is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('open_dispute:' || p_contract_id::text));

    SELECT client_id, freelancer_id
    INTO v_client_id, v_freelancer_id
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_client_id AND v_user_id <> v_freelancer_id THEN
        RAISE EXCEPTION 'Only contract parties can open a dispute';
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

    UPDATE public.contracts
    SET status = 'disputed',
        updated_at = now()
    WHERE id = p_contract_id;

    INSERT INTO public.disputes (contract_id, opened_by, reason, status)
    VALUES (p_contract_id, v_user_id, p_reason, 'open')
    RETURNING id INTO v_dispute_id;

    RETURN jsonb_build_object(
        'success', true,
        'existing', false,
        'dispute_id', v_dispute_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.open_dispute_atomic(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_dispute_atomic(uuid, text) TO authenticated;

COMMIT;

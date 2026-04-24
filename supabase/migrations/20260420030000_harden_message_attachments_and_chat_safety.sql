-- Hardens message attachment object access and chat safety enforcement paths.

CREATE OR REPLACE FUNCTION public.is_message_attachment_access_allowed(p_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        EXISTS (
            SELECT 1
            FROM public.conversations c
            WHERE c.id::text = split_part(COALESCE(p_object_name, ''), '/', 1)
              AND auth.uid() IN (c.participant_1, c.participant_2)
        )
        OR public.is_admin()
    );
$$;

DROP POLICY IF EXISTS "message_attachments_public_read" ON storage.objects;
DROP POLICY IF EXISTS "message_attachments_insert_conversation_member" ON storage.objects;
DROP POLICY IF EXISTS "message_attachments_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "message_attachments_delete_owner" ON storage.objects;
DROP POLICY IF EXISTS "message_attachments_read_conversation_member" ON storage.objects;
DROP POLICY IF EXISTS "message_attachments_admin_manage" ON storage.objects;

CREATE POLICY "message_attachments_read_conversation_member"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'message_attachments'
    AND public.is_message_attachment_access_allowed(name)
);

CREATE POLICY "message_attachments_insert_conversation_member"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'message_attachments'
    AND split_part(COALESCE(name, ''), '/', 1) <> ''
    AND split_part(COALESCE(name, ''), '/', 2) <> ''
    AND public.is_message_attachment_access_allowed(name)
);

CREATE POLICY "message_attachments_admin_manage"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'message_attachments'
    AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'message_attachments'
    AND public.is_admin()
);

CREATE OR REPLACE FUNCTION public.enforce_contract_chat_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_content text := COALESCE(NEW.content, '');
BEGIN
    IF NEW.contract_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_content ~* '(?:https?:\/\/)?(?:wa\.me|whatsapp|t\.me|telegram|discord(?:app)?|instagram)'
        OR v_content ~* '(^|[^[:alnum:]_])ig([^[:alnum:]_]|$)'
        OR v_content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
        OR v_content ~ '(?:\+?\d[\d\s().-]{7,}\d)'
    THEN
        RAISE EXCEPTION 'Contract chat safety violation: direct contact sharing is not allowed in protected contract conversations';
    END IF;

    IF v_content ~* '(^|[^[:alnum:]_])(pay me|send (me )?money|bank transfer|wire transfer|western union|moneygram)([^[:alnum:]_]|$)'
        OR v_content ~* '(^|[^[:alnum:]_])(crypto|bitcoin|usdt|binance|wallet address|outside the platform|off platform|direct payment)([^[:alnum:]_]|$)'
        OR v_content ~* '(^|[^[:alnum:]_])(d17|rib|iban|swift)([^[:alnum:]_]|$)'
    THEN
        RAISE EXCEPTION 'Contract chat safety violation: off-platform payment requests are not allowed in protected contract conversations';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_contract_chat_safety ON public.messages;
CREATE TRIGGER trg_enforce_contract_chat_safety
BEFORE INSERT OR UPDATE OF content, contract_id ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_contract_chat_safety();

COMMENT ON FUNCTION public.is_message_attachment_access_allowed(text) IS 'Checks whether the current user is one of the conversation participants for a message attachment object path.';
COMMENT ON FUNCTION public.enforce_contract_chat_safety IS 'Blocks contact sharing and off-platform payment attempts in protected contract conversations on insert and content updates.';

NOTIFY pgrst, 'reload schema';

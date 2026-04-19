-- Fix ambiguous get_or_create_conversation overload resolution.
--
-- Postgres treats a function with default arguments as callable with fewer
-- parameters. Once both of these exist:
--   1. get_or_create_conversation(uuid, uuid, uuid)
--   2. get_or_create_conversation(uuid, uuid, uuid, text default null)
-- any SQL call with 3 args becomes ambiguous.
--
-- Keep the 3-arg compatibility wrapper, but remove the default from the 4-arg
-- function and make all internal calls explicit.

DROP FUNCTION IF EXISTS public.get_or_create_contract_conversation(uuid);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_contract_id UUID,
    p_scope TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_participant_1 uuid;
    v_participant_2 uuid;
    v_conversation_id uuid;
    v_scope text;
    v_profile_mode text;
    v_caller_inbox text;
    v_other_inbox text;
    v_inbox_p1 text;
    v_inbox_p2 text;
    v_contract_client_id uuid;
    v_contract_freelancer_id uuid;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_caller <> user1 AND v_caller <> user2 THEN
        RAISE EXCEPTION 'Caller must be one of the conversation participants';
    END IF;

    IF user1 < user2 THEN
        v_participant_1 := user1;
        v_participant_2 := user2;
    ELSE
        v_participant_1 := user2;
        v_participant_2 := user1;
    END IF;

    IF p_contract_id IS NOT NULL THEN
        SELECT client_id, freelancer_id
        INTO v_contract_client_id, v_contract_freelancer_id
        FROM public.contracts
        WHERE id = p_contract_id;

        IF v_contract_client_id IS NULL OR v_contract_freelancer_id IS NULL THEN
            RAISE EXCEPTION 'Contract not found';
        END IF;

        IF NOT (
            (user1 = v_contract_client_id AND user2 = v_contract_freelancer_id)
            OR (user1 = v_contract_freelancer_id AND user2 = v_contract_client_id)
        ) THEN
            RAISE EXCEPTION 'Conversation participants do not match the contract';
        END IF;

        v_scope := 'contract';
        v_inbox_p1 := CASE
            WHEN v_participant_1 = v_contract_client_id THEN 'client'
            WHEN v_participant_1 = v_contract_freelancer_id THEN 'freelancer'
            ELSE NULL
        END;
        v_inbox_p2 := CASE
            WHEN v_participant_2 = v_contract_client_id THEN 'client'
            WHEN v_participant_2 = v_contract_freelancer_id THEN 'freelancer'
            ELSE NULL
        END;

        IF v_inbox_p1 IS NULL OR v_inbox_p2 IS NULL OR v_inbox_p1 = v_inbox_p2 THEN
            RAISE EXCEPTION 'Could not resolve contract inbox roles';
        END IF;
    ELSE
        IF p_scope IN ('client', 'freelancer', 'shared') THEN
            v_scope := p_scope;
        ELSE
            SELECT COALESCE(active_mode::text, 'shared') INTO v_profile_mode
            FROM public.profiles
            WHERE id = v_caller;

            v_scope := CASE
                WHEN v_profile_mode IN ('client', 'freelancer') THEN v_profile_mode
                ELSE 'shared'
            END;
        END IF;

        IF v_scope = 'client' THEN
            v_caller_inbox := 'client';
            v_other_inbox := 'freelancer';
        ELSIF v_scope = 'freelancer' THEN
            v_caller_inbox := 'freelancer';
            v_other_inbox := 'client';
        ELSE
            v_caller_inbox := 'shared';
            v_other_inbox := 'shared';
        END IF;

        IF v_caller = v_participant_1 THEN
            v_inbox_p1 := v_caller_inbox;
            v_inbox_p2 := v_other_inbox;
        ELSE
            v_inbox_p1 := v_other_inbox;
            v_inbox_p2 := v_caller_inbox;
        END IF;
    END IF;

    IF p_contract_id IS NULL THEN
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE participant_1 = v_participant_1
          AND participant_2 = v_participant_2
          AND conversation_scope = v_scope
          AND contract_id IS NULL
        LIMIT 1;
    ELSE
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE participant_1 = v_participant_1
          AND participant_2 = v_participant_2
          AND contract_id = p_contract_id
        LIMIT 1;
    END IF;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (
            participant_1,
            participant_2,
            contract_id,
            conversation_scope,
            inbox_participant_1,
            inbox_participant_2
        )
        VALUES (
            v_participant_1,
            v_participant_2,
            p_contract_id,
            v_scope,
            v_inbox_p1,
            v_inbox_p2
        )
        RETURNING id INTO v_conversation_id;
    ELSE
        UPDATE public.conversations
        SET
            contract_id = COALESCE(public.conversations.contract_id, p_contract_id),
            conversation_scope = v_scope,
            inbox_participant_1 = v_inbox_p1,
            inbox_participant_2 = v_inbox_p2,
            updated_at = now()
        WHERE id = v_conversation_id
          AND (
              public.conversations.contract_id IS DISTINCT FROM COALESCE(public.conversations.contract_id, p_contract_id)
              OR public.conversations.conversation_scope IS DISTINCT FROM v_scope
              OR public.conversations.inbox_participant_1 IS DISTINCT FROM v_inbox_p1
              OR public.conversations.inbox_participant_2 IS DISTINCT FROM v_inbox_p2
          );
    END IF;

    RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_contract_id UUID
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_or_create_conversation(user1, user2, p_contract_id, NULL::text);
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_contract_conversation(
    p_contract_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_contract record;
    v_conversation_id uuid;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT id, client_id, freelancer_id
    INTO v_contract
    FROM public.contracts
    WHERE id = p_contract_id;

    IF v_contract IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_caller <> v_contract.client_id AND v_caller <> v_contract.freelancer_id THEN
        RAISE EXCEPTION 'Not authorized to access this contract conversation';
    END IF;

    SELECT public.get_or_create_conversation(
        v_contract.client_id,
        v_contract.freelancer_id,
        p_contract_id,
        'contract'::text
    )
    INTO v_conversation_id;

    RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_contract_conversation(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_contract_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_contract_conversation(uuid) TO service_role;

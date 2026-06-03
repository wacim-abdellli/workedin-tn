-- Phase 3: conversations as first-class entities

-- 1. Add columns client_id, freelancer_id, and status to conversations table if not exists
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 2. Backfill existing conversations data
DO $$
DECLARE
    rec RECORD;
    v_client_id UUID;
    v_freelancer_id UUID;
    v_user_type_p1 text;
    v_user_type_p2 text;
BEGIN
    FOR rec IN SELECT * FROM public.conversations LOOP
        v_client_id := NULL;
        v_freelancer_id := NULL;

        -- Try resolving by contract_id first
        IF rec.contract_id IS NOT NULL THEN
            SELECT client_id, freelancer_id INTO v_client_id, v_freelancer_id
            FROM public.contracts WHERE id = rec.contract_id;
        END IF;

        -- If not resolved by contract, try inbox roles
        IF v_client_id IS NULL THEN
            IF rec.inbox_participant_1 = 'client' THEN
                v_client_id := rec.participant_1;
                v_freelancer_id := rec.participant_2;
            ELSIF rec.inbox_participant_1 = 'freelancer' THEN
                v_freelancer_id := rec.participant_1;
                v_client_id := rec.participant_2;
            ELSIF rec.inbox_participant_2 = 'client' THEN
                v_client_id := rec.participant_2;
                v_freelancer_id := rec.participant_1;
            ELSIF rec.inbox_participant_2 = 'freelancer' THEN
                v_freelancer_id := rec.participant_2;
                v_client_id := rec.participant_1;
            END IF;
        END IF;

        -- If still null, query profiles to inspect user_types
        IF v_client_id IS NULL THEN
            SELECT user_type::text INTO v_user_type_p1 FROM public.profiles WHERE id = rec.participant_1;
            SELECT user_type::text INTO v_user_type_p2 FROM public.profiles WHERE id = rec.participant_2;

            IF v_user_type_p1 = 'client' OR v_user_type_p2 = 'freelancer' THEN
                v_client_id := rec.participant_1;
                v_freelancer_id := rec.participant_2;
            ELSIF v_user_type_p2 = 'client' OR v_user_type_p1 = 'freelancer' THEN
                v_client_id := rec.participant_2;
                v_freelancer_id := rec.participant_1;
            ELSE
                -- Ultimate fallback
                v_client_id := rec.participant_1;
                v_freelancer_id := rec.participant_2;
            END IF;
        END IF;

        -- Update the conversation row
        UPDATE public.conversations
        SET client_id = v_client_id, freelancer_id = v_freelancer_id
        WHERE id = rec.id;
    END LOOP;
END;
$$;

-- 3. Alter columns to set NOT NULL constraints for first-class schema integrity
ALTER TABLE public.conversations ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN freelancer_id SET NOT NULL;

-- 4. Add status check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_status_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_status_check
      CHECK (status IN ('active', 'archived'));
  END IF;
END;
$$;

-- 5. Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_freelancer_id ON public.conversations(freelancer_id);

-- 6. Update Row Level Security Policies
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

CREATE POLICY "conversations_select" ON public.conversations
    FOR SELECT 
    USING (auth.uid() = client_id OR auth.uid() = freelancer_id OR auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "conversations_insert" ON public.conversations
    FOR INSERT 
    WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id OR auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "conversations_update" ON public.conversations
    FOR UPDATE 
    USING (auth.uid() = client_id OR auth.uid() = freelancer_id OR auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 7. Update get_or_create_conversation RPC
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_contract_id UUID DEFAULT NULL,
    p_scope TEXT DEFAULT NULL
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
    v_client_id uuid;
    v_freelancer_id uuid;
    v_user_type_p1 text;
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

    -- Resolve client_id and freelancer_id
    IF p_contract_id IS NOT NULL THEN
        v_client_id := v_contract_client_id;
        v_freelancer_id := v_contract_freelancer_id;
    ELSE
        IF v_inbox_p1 = 'client' THEN
            v_client_id := v_participant_1;
            v_freelancer_id := v_participant_2;
        ELSIF v_inbox_p1 = 'freelancer' THEN
            v_freelancer_id := v_participant_1;
            v_client_id := v_participant_2;
        ELSIF v_inbox_p2 = 'client' THEN
            v_client_id := v_participant_2;
            v_freelancer_id := v_participant_1;
        ELSIF v_inbox_p2 = 'freelancer' THEN
            v_freelancer_id := v_participant_2;
            v_client_id := v_participant_1;
        ELSE
            SELECT user_type::text INTO v_user_type_p1 FROM public.profiles WHERE id = v_participant_1;
            IF v_user_type_p1 = 'client' THEN
                v_client_id := v_participant_1;
                v_freelancer_id := v_participant_2;
            ELSE
                SELECT user_type::text INTO v_user_type_p1 FROM public.profiles WHERE id = v_participant_2;
                IF v_user_type_p1 = 'client' THEN
                    v_client_id := v_participant_2;
                    v_freelancer_id := v_participant_1;
                ELSE
                    v_client_id := v_participant_1;
                    v_freelancer_id := v_participant_2;
                END IF;
            END IF;
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
            client_id,
            freelancer_id,
            contract_id,
            conversation_scope,
            inbox_participant_1,
            inbox_participant_2,
            status
        )
        VALUES (
            v_participant_1,
            v_participant_2,
            v_client_id,
            v_freelancer_id,
            p_contract_id,
            v_scope,
            v_inbox_p1,
            v_inbox_p2,
            'active'
        )
        RETURNING id INTO v_conversation_id;
    ELSE
        UPDATE public.conversations
        SET
            contract_id = COALESCE(public.conversations.contract_id, p_contract_id),
            client_id = COALESCE(public.conversations.client_id, v_client_id),
            freelancer_id = COALESCE(public.conversations.freelancer_id, v_freelancer_id),
            conversation_scope = v_scope,
            inbox_participant_1 = v_inbox_p1,
            inbox_participant_2 = v_inbox_p2,
            updated_at = now()
        WHERE id = v_conversation_id
          AND (
              public.conversations.contract_id IS DISTINCT FROM COALESCE(public.conversations.contract_id, p_contract_id)
              OR public.conversations.client_id IS DISTINCT FROM COALESCE(public.conversations.client_id, v_client_id)
              OR public.conversations.freelancer_id IS DISTINCT FROM COALESCE(public.conversations.freelancer_id, v_freelancer_id)
              OR public.conversations.conversation_scope IS DISTINCT FROM v_scope
              OR public.conversations.inbox_participant_1 IS DISTINCT FROM v_inbox_p1
              OR public.conversations.inbox_participant_2 IS DISTINCT FROM v_inbox_p2
          );
    END IF;

    RETURN v_conversation_id;
END;
$$;

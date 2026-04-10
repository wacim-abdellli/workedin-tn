-- Add workspace-scoped avatars and workspace-scoped conversations.
-- Fixed version that handles missing functions gracefully

-- Step 1: Add avatar columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url_client text,
  ADD COLUMN IF NOT EXISTS avatar_url_freelancer text;

-- Step 2: Migrate existing avatar data
UPDATE public.profiles
SET
  avatar_url_client = COALESCE(avatar_url_client, avatar_url),
  avatar_url_freelancer = COALESCE(avatar_url_freelancer, avatar_url)
WHERE avatar_url IS NOT NULL
  AND (avatar_url_client IS NULL OR avatar_url_freelancer IS NULL);

-- Step 3: Add conversation_scope column
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS conversation_scope text NOT NULL DEFAULT 'shared';

-- Step 4: Add constraint for conversation_scope
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_scope_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_scope_check
      CHECK (conversation_scope IN ('client', 'freelancer', 'contract', 'shared'));
  END IF;
END;
$$;

-- Step 5: Migrate existing contract conversations
UPDATE public.conversations
SET conversation_scope = 'contract'
WHERE contract_id IS NOT NULL
  AND conversation_scope = 'shared';

-- Step 6: Drop old unique constraint
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_participant_1_participant_2_key;

-- Step 7: Create new unique indexes
DROP INDEX IF EXISTS uq_conversations_pair_scope_no_contract;
DROP INDEX IF EXISTS uq_conversations_pair_scope_contract;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_pair_scope_no_contract
ON public.conversations (participant_1, participant_2, conversation_scope)
WHERE contract_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_pair_scope_contract
ON public.conversations (participant_1, participant_2, conversation_scope, contract_id)
WHERE contract_id IS NOT NULL;

-- Step 8: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant1_scope_activity
ON public.conversations (participant_1, conversation_scope, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversations_participant2_scope_activity
ON public.conversations (participant_2, conversation_scope, last_message_at DESC NULLS LAST);

-- Step 9: Revoke permissions on old functions (if they exist)
DO $$
BEGIN
    REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) FROM PUBLIC;
EXCEPTION
    WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) FROM PUBLIC;
EXCEPTION
    WHEN undefined_function THEN NULL;
END $$;

-- Step 10: Drop old functions (if they exist)
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID, TEXT);

-- Step 11: Create new get_or_create_conversation function with scope support
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
    v_caller UUID := auth.uid();
    v_participant_1 UUID;
    v_participant_2 UUID;
    v_conversation_id UUID;
    v_scope TEXT;
    v_profile_mode TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_caller <> user1 AND v_caller <> user2 THEN
        RAISE EXCEPTION 'Caller must be one of the conversation participants';
    END IF;

    -- Normalize participant order
    IF user1 < user2 THEN
        v_participant_1 := user1;
        v_participant_2 := user2;
    ELSE
        v_participant_1 := user2;
        v_participant_2 := user1;
    END IF;

    -- Determine scope
    IF p_contract_id IS NOT NULL THEN
        v_scope := 'contract';
    ELSIF p_scope IN ('client', 'freelancer', 'shared') THEN
        v_scope := p_scope;
    ELSE
        -- Get caller's active mode
        SELECT active_mode::text INTO v_profile_mode
        FROM public.profiles
        WHERE id = v_caller;

        IF v_profile_mode IN ('client', 'freelancer') THEN
            v_scope := v_profile_mode;
        ELSE
            v_scope := 'client';
        END IF;
    END IF;

    -- Find or create conversation
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
          AND conversation_scope = v_scope
          AND contract_id = p_contract_id
        LIMIT 1;
    END IF;

    -- Create if not found
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_1, participant_2, contract_id, conversation_scope)
        VALUES (v_participant_1, v_participant_2, p_contract_id, v_scope)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- Step 12: Create legacy wrapper function (3 parameters)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_contract_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_or_create_conversation(user1, user2, p_contract_id, NULL);
$$;

-- Step 13: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) TO authenticated;

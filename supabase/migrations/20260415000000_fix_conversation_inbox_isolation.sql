-- =============================================================================
-- FIX: Conversation Inbox Isolation
-- Problem: A single `conversation_scope` cannot represent which inbox each
-- participant should see the conversation in.
--
-- Example:
--   User A (in freelancer mode) messages User B (a client).
--   scope = 'freelancer'
--   • User A sees it in FREELANCER inbox ✓
--   • User B ALSO sees it in their FREELANCER inbox ✗ — should be CLIENT inbox!
--
-- Solution: Two new columns — inbox_participant_1, inbox_participant_2 —
-- that independently track which inbox each participant sees this conversation in.
-- =============================================================================

-- Step 1: Add per-participant inbox columns to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS inbox_participant_1 text NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS inbox_participant_2 text NOT NULL DEFAULT 'shared';

-- Step 2: Add CHECK constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_inbox_p1_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_inbox_p1_check
      CHECK (inbox_participant_1 IN ('client', 'freelancer', 'contract', 'shared'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_inbox_p2_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_inbox_p2_check
      CHECK (inbox_participant_2 IN ('client', 'freelancer', 'contract', 'shared'));
  END IF;
END;
$$;

-- Step 3: Backfill existing conversations
-- Contract conversations: both participants see them in 'contract' inbox
UPDATE public.conversations
SET
  inbox_participant_1 = 'contract',
  inbox_participant_2 = 'contract'
WHERE conversation_scope = 'contract';

-- Old client/freelancer/shared conversations: keep as 'shared' so they appear
-- in all inboxes (safe fallback for legacy data where we can't reconstruct intent)
-- inbox_participant_1 and inbox_participant_2 already defaulted to 'shared', so no
-- extra UPDATE needed for those rows.

-- Step 4: Performance indexes for inbox-based queries
CREATE INDEX IF NOT EXISTS idx_conv_p1_inbox_activity
  ON public.conversations (participant_1, inbox_participant_1, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conv_p2_inbox_activity
  ON public.conversations (participant_2, inbox_participant_2, last_message_at DESC NULLS LAST);

-- Step 5: Drop & recreate get_or_create_conversation with inbox assignment logic

DO $$
BEGIN
    REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) FROM PUBLIC;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) FROM PUBLIC;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID);

-- Core function — determines both scope and per-participant inbox assignments.
--
-- Inbox assignment logic:
--   contract   → both participants: 'contract'
--   client     → caller:      'client'    | other: 'freelancer'
--   freelancer → caller:      'freelancer'| other: 'client'
--   shared     → both participants: 'shared'
--
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
    v_caller        UUID := auth.uid();
    v_other         UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
    v_conversation_id UUID;
    v_scope         TEXT;
    v_profile_mode  TEXT;
    v_caller_inbox  TEXT;
    v_other_inbox   TEXT;
    v_inbox_p1      TEXT;
    v_inbox_p2      TEXT;
BEGIN
    -- Auth guard
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    IF v_caller <> user1 AND v_caller <> user2 THEN
        RAISE EXCEPTION 'Caller must be one of the conversation participants';
    END IF;

    -- Identify the other participant
    v_other := CASE WHEN v_caller = user1 THEN user2 ELSE user1 END;

    -- Normalize participant order (deterministic UUID sort)
    IF user1 < user2 THEN
        v_participant_1 := user1;
        v_participant_2 := user2;
    ELSE
        v_participant_1 := user2;
        v_participant_2 := user1;
    END IF;

    -- ── Resolve scope ────────────────────────────────────────────────────────
    IF p_contract_id IS NOT NULL THEN
        v_scope := 'contract';
    ELSIF p_scope IN ('client', 'freelancer', 'shared') THEN
        v_scope := p_scope;
    ELSE
        -- Use caller's active_mode from the profiles table as fallback
        SELECT COALESCE(active_mode::text, 'shared') INTO v_profile_mode
        FROM public.profiles
        WHERE id = v_caller;

        v_scope := CASE
            WHEN v_profile_mode IN ('client', 'freelancer') THEN v_profile_mode
            ELSE 'shared'
        END;
    END IF;

    -- ── Assign per-participant inbox ─────────────────────────────────────────
    IF v_scope = 'contract' THEN
        v_caller_inbox := 'contract';
        v_other_inbox  := 'contract';
    ELSIF v_scope = 'client' THEN
        -- Caller is acting as a CLIENT reaching out to a freelancer
        v_caller_inbox := 'client';
        v_other_inbox  := 'freelancer';
    ELSIF v_scope = 'freelancer' THEN
        -- Caller is acting as a FREELANCER reaching out to a client
        v_caller_inbox := 'freelancer';
        v_other_inbox  := 'client';
    ELSE -- shared
        v_caller_inbox := 'shared';
        v_other_inbox  := 'shared';
    END IF;

    -- Map caller/other inboxes to the normalized participant_1/participant_2 order
    IF v_caller = v_participant_1 THEN
        v_inbox_p1 := v_caller_inbox;
        v_inbox_p2 := v_other_inbox;
    ELSE
        v_inbox_p1 := v_other_inbox;
        v_inbox_p2 := v_caller_inbox;
    END IF;

    -- ── Find existing conversation ────────────────────────────────────────────
    IF p_contract_id IS NULL THEN
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE participant_1     = v_participant_1
          AND participant_2     = v_participant_2
          AND conversation_scope = v_scope
          AND contract_id IS NULL
        LIMIT 1;
    ELSE
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE participant_1     = v_participant_1
          AND participant_2     = v_participant_2
          AND conversation_scope = v_scope
          AND contract_id       = p_contract_id
        LIMIT 1;
    END IF;

    -- ── Create if not found ───────────────────────────────────────────────────
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (
            participant_1, participant_2, contract_id,
            conversation_scope, inbox_participant_1, inbox_participant_2
        )
        VALUES (
            v_participant_1, v_participant_2, p_contract_id,
            v_scope, v_inbox_p1, v_inbox_p2
        )
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- Step 6: Restore the legacy 3-arg wrapper
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

-- Step 7: Re-grant permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;

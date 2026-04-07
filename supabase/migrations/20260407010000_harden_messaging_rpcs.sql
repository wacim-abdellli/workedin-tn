-- =============================================================================
-- MIGRATION: Harden messaging RPCs (v2 — replaces initial Phase 2 migration)
-- Fixes RISK-7, RISK-8, RISK-9 from Phase 1 audit.
--
-- Problems being fixed:
--   RISK-7: get_or_create_conversation has no auth.uid() caller check.
--           Any authenticated user could forge conversations between two others.
--   RISK-8: mark_conversation_read trusts caller-supplied p_user_id.
--           Any authenticated user could mark another user's messages as read.
--   RISK-9: get_total_unread_count trusts caller-supplied custom_user_id.
--           Any authenticated user could read another user's unread count.
--
-- PostgreSQL function overloading note:
--   CREATE OR REPLACE does NOT remove functions with different argument lists.
--   mark_conversation_read was originally defined with (UUID, UUID) signature.
--   The new hardened version has a (UUID) signature only.
--   We must explicitly DROP the old 2-arg version before creating the new one,
--   otherwise both coexist and callers can still invoke the unsafe variant.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Harden get_or_create_conversation
--    Same signature (UUID, UUID, UUID DEFAULT NULL) — CREATE OR REPLACE is safe.
--    Add auth.uid() assertion: caller must be user1 or user2.
--    SECURITY DEFINER is kept (needed to bypass RLS on INSERT) but the
--    forged-conversation attack vector is now closed before any write.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_contract_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_participant_1 UUID;
    v_participant_2 UUID;
    v_conversation_id UUID;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_caller <> user1 AND v_caller <> user2 THEN
        RAISE EXCEPTION 'Caller must be one of the conversation participants';
    END IF;

    -- Enforce deterministic participant order required by the table CHECK constraint.
    IF user1 < user2 THEN
        v_participant_1 := user1;
        v_participant_2 := user2;
    ELSE
        v_participant_1 := user2;
        v_participant_2 := user1;
    END IF;

    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE participant_1 = v_participant_1
      AND participant_2 = v_participant_2
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_1, participant_2, contract_id)
        VALUES (v_participant_1, v_participant_2, p_contract_id)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Harden mark_conversation_read
--    The original function was created with signature (UUID, UUID) in migration
--    20260327020000_create_conversations.sql. The new hardened version has a
--    (UUID) signature only — no user ID parameter.
--
--    Because PostgreSQL allows overloaded functions, CREATE OR REPLACE on a
--    different signature creates a NEW function; the old (UUID, UUID) variant
--    stays alive. We must DROP it explicitly first.
-- ---------------------------------------------------------------------------

-- Drop the old unsafe 2-arg variant.
DROP FUNCTION IF EXISTS public.mark_conversation_read(UUID, UUID);

-- Revoke any lingering grants on the old signature (no-op if already dropped,
-- but safe to include for clarity in migration history).
-- Note: cannot REVOKE after DROP, so the DROP above is the authoritative removal.

CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_conversation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Reset unread counters only for conversations where the caller is a participant.
    UPDATE public.conversations
    SET
        unread_count_1 = CASE WHEN participant_1 = v_caller THEN 0 ELSE unread_count_1 END,
        unread_count_2 = CASE WHEN participant_2 = v_caller THEN 0 ELSE unread_count_2 END
    WHERE id = p_conversation_id
      AND (participant_1 = v_caller OR participant_2 = v_caller);

    -- Mark all messages in this conversation as read for the caller only.
    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
      AND receiver_id = v_caller
      AND is_read = false;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Harden get_total_unread_count
--    Same signature as original — CREATE OR REPLACE is safe here.
--    The parameter is kept for source-compatibility but silently ignored.
--    The function now always scopes to auth.uid().
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_total_unread_count(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_total_unread_count(custom_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
BEGIN
    IF v_caller IS NULL THEN
        RETURN 0;
    END IF;

    -- Deliberately ignore custom_user_id — always use the authenticated caller.
    RETURN (
        SELECT COALESCE(SUM(
            CASE
                WHEN participant_1 = v_caller THEN unread_count_1
                ELSE unread_count_2
            END
        ), 0)::INTEGER
        FROM public.conversations
        WHERE participant_1 = v_caller
           OR participant_2 = v_caller
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_total_unread_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_total_unread_count(UUID) TO authenticated;

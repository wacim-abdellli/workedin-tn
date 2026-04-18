-- Harden contract conversation consistency.
-- Goals:
-- 1. Backfill missing contract_id values for contract-scoped conversations when
--    the linked messages clearly point to a single contract.
-- 2. Normalize any contract-linked conversation so its scope + inbox metadata
--    stays in the contract lane.
-- 3. Prevent future contract-scoped rows from existing without a contract_id.
-- 4. Ensure the contract-specific resolver always returns a fully-normalized row.

WITH inferred_contracts AS (
    SELECT
        m.conversation_id,
        MIN(m.contract_id) AS contract_id
    FROM public.messages m
    WHERE m.conversation_id IS NOT NULL
      AND m.contract_id IS NOT NULL
    GROUP BY m.conversation_id
    HAVING COUNT(DISTINCT m.contract_id) = 1
)
UPDATE public.conversations c
SET
    contract_id = inferred_contracts.contract_id,
    updated_at = now()
FROM inferred_contracts
WHERE c.id = inferred_contracts.conversation_id
  AND c.contract_id IS NULL
  AND c.conversation_scope = 'contract';

-- If an old "contract" conversation cannot be tied back to a concrete contract,
-- downgrade it to shared instead of leaving an impossible contract-scoped row.
UPDATE public.conversations
SET
    conversation_scope = 'shared',
    inbox_participant_1 = 'shared',
    inbox_participant_2 = 'shared',
    updated_at = now()
WHERE conversation_scope = 'contract'
  AND contract_id IS NULL;

UPDATE public.conversations
SET
    conversation_scope = 'contract',
    inbox_participant_1 = 'contract',
    inbox_participant_2 = 'contract',
    updated_at = now()
WHERE contract_id IS NOT NULL
  AND (
      conversation_scope IS DISTINCT FROM 'contract'
      OR inbox_participant_1 IS DISTINCT FROM 'contract'
      OR inbox_participant_2 IS DISTINCT FROM 'contract'
  );

ALTER TABLE public.conversations
    DROP CONSTRAINT IF EXISTS conversations_contract_scope_requires_contract_id;

ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_contract_scope_requires_contract_id
    CHECK (conversation_scope <> 'contract' OR contract_id IS NOT NULL);

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
        'contract'
    )
    INTO v_conversation_id;

    UPDATE public.conversations
    SET
        contract_id = p_contract_id,
        conversation_scope = 'contract',
        inbox_participant_1 = 'contract',
        inbox_participant_2 = 'contract',
        updated_at = now()
    WHERE id = v_conversation_id
      AND (
          contract_id IS DISTINCT FROM p_contract_id
          OR conversation_scope IS DISTINCT FROM 'contract'
          OR inbox_participant_1 IS DISTINCT FROM 'contract'
          OR inbox_participant_2 IS DISTINCT FROM 'contract'
      );

    RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_contract_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_contract_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_contract_conversation(uuid) TO service_role;

-- Resolve contract conversations from a contract id only.
-- This avoids client-side participant resolution failures and keeps messaging deep-links robust.

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

    -- Use the legacy 3-arg wrapper for maximum compatibility across DB revisions.
    SELECT public.get_or_create_conversation(
        v_contract.client_id,
        v_contract.freelancer_id,
        p_contract_id
    )
    INTO v_conversation_id;

    RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_contract_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_contract_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_contract_conversation(uuid) TO service_role;

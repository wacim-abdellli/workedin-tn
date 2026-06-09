-- Enforce contract state machine at the database level.
-- This mirrors the rules in src/lib/contractWorkflow.ts exactly.
-- No client-side bypass possible after this migration.

CREATE OR REPLACE FUNCTION public.validate_contract_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_allowed text[];
BEGIN
    -- No status change: nothing to validate
    IF OLD.status::text = NEW.status::text THEN
        RETURN NEW;
    END IF;

    -- Define allowed transitions (mirrors contractWorkflow.ts)
    CASE OLD.status::text
        WHEN 'pending_payment'     THEN v_allowed := ARRAY['active', 'cancelled', 'disputed'];
        WHEN 'active'              THEN v_allowed := ARRAY['delivery_submitted', 'cancelled', 'disputed'];
        WHEN 'delivery_submitted'  THEN v_allowed := ARRAY['active', 'revision_requested', 'completed', 'cancelled', 'disputed'];
        WHEN 'revision_requested'  THEN v_allowed := ARRAY['delivery_submitted', 'cancelled', 'disputed'];
        WHEN 'completed'           THEN v_allowed := ARRAY[]::text[];
        WHEN 'cancelled'           THEN v_allowed := ARRAY[]::text[];
        WHEN 'disputed'            THEN v_allowed := ARRAY[]::text[];
        ELSE v_allowed := ARRAY[]::text[];
    END CASE;

    IF NOT (NEW.status::text = ANY(v_allowed)) THEN
        RAISE EXCEPTION
            'Invalid contract status transition: % → %. Allowed from %: [%]',
            OLD.status, NEW.status, OLD.status, array_to_string(v_allowed, ', ');
    END IF;

    RETURN NEW;
END;
$$;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS enforce_contract_status_transition ON public.contracts;

CREATE TRIGGER enforce_contract_status_transition
    BEFORE UPDATE OF status ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_contract_status_transition();

COMMENT ON FUNCTION public.validate_contract_status_transition()
IS 'Enforces the contract state machine at DB level. Mirrors src/lib/contractWorkflow.ts. Added 2026-06-04.';

-- Fix the contract risk guardrails trigger function
-- To avoid "record 'new' has no field 'total_amount'" when inserting into contracts table
-- because the contracts table does not have a total_amount column in this environment.

CREATE OR REPLACE FUNCTION public.apply_contract_risk_guardrails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
    v_assessment jsonb;
    v_total_amount numeric;
BEGIN
    IF v_request_role = 'service_role' OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Extract total_amount dynamically to avoid runtime errors when the column is missing
    SELECT COALESCE(
        (to_jsonb(NEW) ->> 'total_amount')::numeric,
        NEW.amount,
        0
    ) INTO v_total_amount;

    v_assessment := public.build_contract_risk_assessment(NEW.client_id, NEW.freelancer_id, v_total_amount);

    NEW.risk_level := COALESCE(v_assessment ->> 'risk_level', 'low');
    NEW.risk_flags := COALESCE(v_assessment -> 'flags', '[]'::jsonb);

    IF COALESCE((v_assessment ->> 'blocked')::boolean, false) THEN
        RAISE EXCEPTION '%', COALESCE(v_assessment ->> 'reason', 'Contract blocked by risk guardrails.');
    END IF;

    RETURN NEW;
END;
$$;

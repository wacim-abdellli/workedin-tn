ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS risk_level text NOT NULL DEFAULT 'low',
    ADD COLUMN IF NOT EXISTS risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.contracts
    DROP CONSTRAINT IF EXISTS contracts_risk_level_check;
ALTER TABLE public.contracts
    ADD CONSTRAINT contracts_risk_level_check CHECK (risk_level IN ('low', 'medium', 'high'));

CREATE OR REPLACE FUNCTION public.build_contract_risk_assessment(
    p_client_id uuid,
    p_freelancer_id uuid,
    p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_profile jsonb;
    v_freelancer_profile jsonb;
    v_client_age_hours numeric := 999999;
    v_freelancer_age_hours numeric := 999999;
    v_client_cin_verified boolean := false;
    v_freelancer_cin_verified boolean := false;
    v_client_completed_contracts integer := 0;
    v_freelancer_completed_contracts integer := 0;
    v_flags text[] := ARRAY[]::text[];
    v_risk_level text := 'low';
BEGIN
    SELECT to_jsonb(p)
    INTO v_client_profile
    FROM public.profiles p
    WHERE p.id = p_client_id;

    SELECT to_jsonb(p)
    INTO v_freelancer_profile
    FROM public.profiles p
    WHERE p.id = p_freelancer_id;

    IF v_client_profile IS NULL OR v_freelancer_profile IS NULL THEN
        RETURN jsonb_build_object(
            'blocked', true,
            'risk_level', 'high',
            'flags', jsonb_build_array('missing_profile'),
            'reason', 'Missing profile data for contract risk checks.'
        );
    END IF;

    v_client_age_hours := GREATEST(EXTRACT(EPOCH FROM (now() - NULLIF(v_client_profile ->> 'created_at', '')::timestamptz)) / 3600, 0);
    v_freelancer_age_hours := GREATEST(EXTRACT(EPOCH FROM (now() - NULLIF(v_freelancer_profile ->> 'created_at', '')::timestamptz)) / 3600, 0);
    v_client_cin_verified := COALESCE((v_client_profile ->> 'cin_verified')::boolean, false);
    v_freelancer_cin_verified := COALESCE((v_freelancer_profile ->> 'cin_verified')::boolean, false);

    SELECT COUNT(*)
    INTO v_client_completed_contracts
    FROM public.contracts c
    WHERE c.client_id = p_client_id
      AND c.status = 'completed';

    SELECT COUNT(*)
    INTO v_freelancer_completed_contracts
    FROM public.contracts c
    WHERE c.freelancer_id = p_freelancer_id
      AND c.status = 'completed';

    IF v_client_age_hours < 72 THEN
        v_flags := array_append(v_flags, 'client_new_account');
    END IF;
    IF v_freelancer_age_hours < 72 THEN
        v_flags := array_append(v_flags, 'freelancer_new_account');
    END IF;
    IF NOT v_client_cin_verified THEN
        v_flags := array_append(v_flags, 'client_unverified');
    END IF;
    IF NOT v_freelancer_cin_verified THEN
        v_flags := array_append(v_flags, 'freelancer_unverified');
    END IF;
    IF v_client_completed_contracts = 0 THEN
        v_flags := array_append(v_flags, 'client_first_contract');
    END IF;
    IF v_freelancer_completed_contracts = 0 THEN
        v_flags := array_append(v_flags, 'freelancer_first_contract');
    END IF;

    IF p_amount >= 1000 AND (NOT v_client_cin_verified OR NOT v_freelancer_cin_verified) THEN
        v_risk_level := 'high';
        RETURN jsonb_build_object(
            'blocked', true,
            'risk_level', v_risk_level,
            'flags', to_jsonb(v_flags),
            'reason', 'High-value contracts require both client and freelancer identity verification.'
        );
    END IF;

    IF p_amount >= 500 AND (
        (v_client_age_hours < 72 AND v_client_completed_contracts = 0)
        OR (v_freelancer_age_hours < 72 AND v_freelancer_completed_contracts = 0)
    ) THEN
        v_risk_level := 'high';
        RETURN jsonb_build_object(
            'blocked', true,
            'risk_level', v_risk_level,
            'flags', to_jsonb(v_flags),
            'reason', 'New first-time accounts are limited on higher-value contracts until they build trust or complete verification.'
        );
    END IF;

    IF p_amount >= 250 AND v_client_age_hours < 24 AND v_freelancer_age_hours < 24 THEN
        v_risk_level := 'high';
        RETURN jsonb_build_object(
            'blocked', true,
            'risk_level', v_risk_level,
            'flags', to_jsonb(v_flags),
            'reason', 'Two brand-new accounts cannot start a medium/high-value contract immediately.'
        );
    END IF;

    IF p_amount >= 500 AND (NOT v_client_cin_verified OR NOT v_freelancer_cin_verified) THEN
        v_risk_level := 'medium';
    ELSIF p_amount >= 250 AND (v_client_completed_contracts = 0 OR v_freelancer_completed_contracts = 0) THEN
        v_risk_level := 'medium';
    END IF;

    RETURN jsonb_build_object(
        'blocked', false,
        'risk_level', v_risk_level,
        'flags', to_jsonb(v_flags),
        'reason', null
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_contract_risk_guardrails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
    v_assessment jsonb;
BEGIN
    IF v_request_role = 'service_role' OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    v_assessment := public.build_contract_risk_assessment(NEW.client_id, NEW.freelancer_id, COALESCE(NEW.total_amount, NEW.amount, 0));

    NEW.risk_level := COALESCE(v_assessment ->> 'risk_level', 'low');
    NEW.risk_flags := COALESCE(v_assessment -> 'flags', '[]'::jsonb);

    IF COALESCE((v_assessment ->> 'blocked')::boolean, false) THEN
        RAISE EXCEPTION '%', COALESCE(v_assessment ->> 'reason', 'Contract blocked by risk guardrails.');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_contract_risk_guardrails ON public.contracts;
CREATE TRIGGER trg_apply_contract_risk_guardrails
BEFORE INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.apply_contract_risk_guardrails();

COMMENT ON COLUMN public.contracts.risk_level IS 'Calculated trust/risk tier for the contract at creation time.';
COMMENT ON COLUMN public.contracts.risk_flags IS 'Risk flags captured when the contract was created.';
COMMENT ON FUNCTION public.build_contract_risk_assessment(uuid, uuid, numeric) IS 'Evaluates contract trust/risk guardrails using account age, verification, and completed contract history.';
COMMENT ON FUNCTION public.apply_contract_risk_guardrails() IS 'Applies trust/risk guardrails to new contracts and blocks clearly unsafe high-risk combinations.';

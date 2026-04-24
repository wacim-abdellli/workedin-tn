ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS trust_weight numeric NOT NULL DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS integrity_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.reviews
    DROP CONSTRAINT IF EXISTS reviews_trust_weight_check;
ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_trust_weight_check CHECK (trust_weight > 0 AND trust_weight <= 1.0);

CREATE OR REPLACE FUNCTION public.build_review_trust_assessment(
    p_reviewer_id uuid,
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile jsonb;
    v_contract jsonb;
    v_account_age_hours numeric := 999999;
    v_cin_verified boolean := false;
    v_completed_contracts integer := 0;
    v_weight numeric := 1.0;
    v_flags text[] := ARRAY[]::text[];
BEGIN
    SELECT to_jsonb(p)
    INTO v_profile
    FROM public.profiles p
    WHERE p.id = p_reviewer_id;

    SELECT to_jsonb(c)
    INTO v_contract
    FROM public.contracts c
    WHERE c.id = p_contract_id;

    IF v_profile IS NULL OR v_contract IS NULL THEN
        RETURN jsonb_build_object(
            'trust_weight', 0.4,
            'integrity_flags', jsonb_build_array('missing_review_context')
        );
    END IF;

    v_account_age_hours := GREATEST(EXTRACT(EPOCH FROM (now() - NULLIF(v_profile ->> 'created_at', '')::timestamptz)) / 3600, 0);
    v_cin_verified := COALESCE((v_profile ->> 'cin_verified')::boolean, false);

    SELECT COUNT(*)
    INTO v_completed_contracts
    FROM public.contracts c
    WHERE (c.client_id = p_reviewer_id OR c.freelancer_id = p_reviewer_id)
      AND c.status = 'completed';

    IF v_account_age_hours < 72 THEN
        v_weight := v_weight - 0.20;
        v_flags := array_append(v_flags, 'new_account_reviewer');
    END IF;

    IF NOT v_cin_verified THEN
        v_weight := v_weight - 0.20;
        v_flags := array_append(v_flags, 'unverified_reviewer');
    END IF;

    IF v_completed_contracts <= 1 THEN
        v_weight := v_weight - 0.15;
        v_flags := array_append(v_flags, 'low_history_reviewer');
    END IF;

    IF COALESCE(v_contract ->> 'risk_level', 'low') = 'high' THEN
        v_weight := v_weight - 0.15;
        v_flags := array_append(v_flags, 'high_risk_contract_review');
    ELSIF COALESCE(v_contract ->> 'risk_level', 'low') = 'medium' THEN
        v_weight := v_weight - 0.05;
        v_flags := array_append(v_flags, 'medium_risk_contract_review');
    END IF;

    v_weight := GREATEST(0.25, LEAST(1.0, v_weight));

    RETURN jsonb_build_object(
        'trust_weight', v_weight,
        'integrity_flags', to_jsonb(v_flags)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_review_atomic(
    p_contract_id uuid,
    p_rating integer,
    p_comment text DEFAULT NULL
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_client_id uuid;
    v_freelancer_id uuid;
    v_contract_status text;
    v_reviewee_id uuid;
    v_review public.reviews;
    v_comment text := nullif(btrim(p_comment), '');
    v_trust jsonb;
    v_trust_weight numeric;
    v_integrity_flags jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    SELECT client_id, freelancer_id, status::text
    INTO v_client_id, v_freelancer_id, v_contract_status
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_contract_status <> 'completed' THEN
        RAISE EXCEPTION 'Only completed contracts can be reviewed';
    END IF;

    IF v_user_id = v_client_id THEN
        v_reviewee_id := v_freelancer_id;
    ELSIF v_user_id = v_freelancer_id THEN
        v_reviewee_id := v_client_id;
    ELSE
        RAISE EXCEPTION 'Only contract parties can review this contract';
    END IF;

    v_trust := public.build_review_trust_assessment(v_user_id, p_contract_id);
    v_trust_weight := COALESCE((v_trust ->> 'trust_weight')::numeric, 1.0);
    v_integrity_flags := COALESCE(v_trust -> 'integrity_flags', '[]'::jsonb);

    INSERT INTO public.reviews (
        contract_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment,
        trust_weight,
        integrity_flags
    )
    VALUES (
        p_contract_id,
        v_user_id,
        v_reviewee_id,
        p_rating,
        v_comment,
        v_trust_weight,
        v_integrity_flags
    )
    RETURNING * INTO v_review;

    RETURN v_review;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'You have already reviewed this contract';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_client_stats_v2(p_client_id uuid)
RETURNS TABLE(job_count integer, total_spent numeric, avg_rating numeric)
LANGUAGE sql
STABLE
AS $$
SELECT
    (SELECT COUNT(*) FROM jobs WHERE client_id = p_client_id)::int,
    COALESCE((SELECT SUM(amount) FROM contracts WHERE client_id = p_client_id AND status = 'completed'), 0),
    COALESCE((
        SELECT CASE
            WHEN SUM(COALESCE(trust_weight, 1.0)) > 0
                THEN SUM(rating * COALESCE(trust_weight, 1.0)) / SUM(COALESCE(trust_weight, 1.0))
            ELSE 0
        END
        FROM reviews
        WHERE reviewee_id = p_client_id
          AND COALESCE(is_public, true) = true
    ), 0)
$$;

COMMENT ON COLUMN public.reviews.trust_weight IS 'Weight applied to this review in aggregated reputation stats based on reviewer trust and contract risk signals.';
COMMENT ON COLUMN public.reviews.integrity_flags IS 'Review integrity/risk flags captured when the review was submitted.';
COMMENT ON FUNCTION public.build_review_trust_assessment(uuid, uuid) IS 'Computes review trust weighting using reviewer verification, account age, history, and contract risk.';
COMMENT ON FUNCTION public.submit_review_atomic(uuid, integer, text) IS 'Validates review eligibility, stores reviewer-derived trust metadata, and inserts one review per reviewer per contract.';

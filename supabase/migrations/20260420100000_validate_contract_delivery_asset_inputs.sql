-- Reject forged or incomplete protected delivery asset payloads.

CREATE OR REPLACE FUNCTION public.submit_contract_delivery_atomic(
    p_contract_id uuid,
    p_delivery_note text DEFAULT NULL,
    p_review_assets jsonb DEFAULT '[]'::jsonb,
    p_final_assets jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_freelancer_id uuid;
    v_contract_status text;
    v_delivery_note text := NULLIF(btrim(COALESCE(p_delivery_note, '')), '');
    v_review_due_at timestamptz := now() + interval '3 days';
    v_version_number integer := 1;
    v_delivery_id uuid;
    v_review_prefix text;
    v_final_prefix text;
    v_review_asset_count integer := 0;
    v_final_asset_count integer := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('submit_contract_delivery:' || p_contract_id::text));

    SELECT freelancer_id, status::text
    INTO v_freelancer_id, v_contract_status
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    IF v_user_id <> v_freelancer_id THEN
        RAISE EXCEPTION 'Only the assigned freelancer can submit delivery';
    END IF;

    IF v_contract_status NOT IN ('active', 'revision_requested') THEN
        RAISE EXCEPTION 'Delivery is not allowed in the current contract state';
    END IF;

    IF jsonb_typeof(COALESCE(p_review_assets, '[]'::jsonb)) <> 'array'
       OR jsonb_typeof(COALESCE(p_final_assets, '[]'::jsonb)) <> 'array' THEN
        RAISE EXCEPTION 'Delivery assets must be arrays';
    END IF;

    v_review_prefix := v_user_id::text || '/' || p_contract_id::text || '/deliveries/review/';
    v_final_prefix := v_user_id::text || '/' || p_contract_id::text || '/deliveries/final/';

    SELECT COUNT(*)
    INTO v_review_asset_count
    FROM jsonb_array_elements(COALESCE(p_review_assets, '[]'::jsonb)) asset
    WHERE COALESCE(asset->>'storage_path', '') <> '';

    SELECT COUNT(*)
    INTO v_final_asset_count
    FROM jsonb_array_elements(COALESCE(p_final_assets, '[]'::jsonb)) asset
    WHERE COALESCE(asset->>'storage_path', '') <> '';

    IF v_review_asset_count = 0 THEN
        RAISE EXCEPTION 'At least one review file is required';
    END IF;

    IF v_final_asset_count = 0 THEN
        RAISE EXCEPTION 'At least one final locked file is required';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_review_assets, '[]'::jsonb)) asset
        WHERE COALESCE(asset->>'storage_bucket', 'contract-files') <> 'contract-files'
           OR COALESCE(asset->>'storage_path', '') NOT LIKE v_review_prefix || '%'
           OR COALESCE(asset->>'name', '') = ''
    ) THEN
        RAISE EXCEPTION 'Invalid review asset payload';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_final_assets, '[]'::jsonb)) asset
        WHERE COALESCE(asset->>'storage_bucket', 'contract-files') <> 'contract-files'
           OR COALESCE(asset->>'storage_path', '') NOT LIKE v_final_prefix || '%'
           OR COALESCE(asset->>'name', '') = ''
    ) THEN
        RAISE EXCEPTION 'Invalid final asset payload';
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM public.contract_deliveries
    WHERE contract_id = p_contract_id;

    INSERT INTO public.contract_deliveries (
        contract_id,
        version_number,
        submitted_by,
        delivery_note,
        review_due_at,
        submitted_at
    )
    VALUES (
        p_contract_id,
        v_version_number,
        v_user_id,
        COALESCE(v_delivery_note, 'submitted'),
        v_review_due_at,
        now()
    )
    RETURNING id INTO v_delivery_id;

    INSERT INTO public.contract_delivery_assets (
        delivery_id,
        asset_kind,
        access_state,
        name,
        storage_bucket,
        storage_path,
        mime_type,
        size_bytes,
        uploaded_by
    )
    SELECT
        v_delivery_id,
        'review_asset',
        'preview_available',
        asset->>'name',
        'contract-files',
        asset->>'storage_path',
        NULLIF(asset->>'mime_type', ''),
        NULLIF(asset->>'size_bytes', '')::bigint,
        v_user_id
    FROM jsonb_array_elements(COALESCE(p_review_assets, '[]'::jsonb)) asset;

    INSERT INTO public.contract_delivery_assets (
        delivery_id,
        asset_kind,
        access_state,
        name,
        storage_bucket,
        storage_path,
        mime_type,
        size_bytes,
        uploaded_by
    )
    SELECT
        v_delivery_id,
        'final_asset',
        'locked',
        asset->>'name',
        'contract-files',
        asset->>'storage_path',
        NULLIF(asset->>'mime_type', ''),
        NULLIF(asset->>'size_bytes', '')::bigint,
        v_user_id
    FROM jsonb_array_elements(COALESCE(p_final_assets, '[]'::jsonb)) asset;

    UPDATE public.contracts
    SET delivery_note = COALESCE(v_delivery_note, 'submitted'),
        status = 'delivery_submitted'::public.contract_status_enum,
        delivery_submitted_at = now(),
        review_due_at = v_review_due_at,
        updated_at = now()
    WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', p_contract_id,
        'delivery_id', v_delivery_id,
        'version_number', v_version_number,
        'status', 'delivery_submitted',
        'delivery_note', COALESCE(v_delivery_note, 'submitted'),
        'delivery_submitted_at', now(),
        'review_due_at', v_review_due_at,
        'review_asset_count', v_review_asset_count,
        'final_asset_count', v_final_asset_count
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contract_delivery_atomic(uuid, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contract_delivery_atomic(uuid, text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contract_delivery_atomic(uuid, text, jsonb, jsonb) TO service_role;

COMMENT ON FUNCTION public.submit_contract_delivery_atomic(uuid, text, jsonb, jsonb)
IS 'Creates a formal delivery only when review and final assets are present and scoped to the submitting freelancer, contract, and protected contract-files bucket.';

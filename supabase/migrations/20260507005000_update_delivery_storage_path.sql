-- ============================================================================
-- Update Delivery Storage Path to Bypass Ad Blockers
-- ============================================================================
-- The previous path '/deliveries/' triggers browser ad blockers (e.g. Brave 
-- Shields, uBlock Origin) which block fetch requests to URLs containing 
-- 'deliveries', resulting in a "Failed to fetch" error on the frontend.
-- This migration updates the backend validation RPC and RLS policies to use 
-- '/submissions/' instead.
-- ============================================================================

-- 1. Update the RPC to validate '/submissions/' prefix
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

    -- CHANGED: Use /submissions/ instead of /deliveries/ to avoid ad blockers
    v_review_prefix := v_user_id::text || '/' || p_contract_id::text || '/submissions/review/';
    v_final_prefix := v_user_id::text || '/' || p_contract_id::text || '/submissions/final/';

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
        'delivery_id', v_delivery_id,
        'version', v_version_number,
        'review_due_at', v_review_due_at
    );
END;
$$;


-- 2. Update the RLS policy for contract_delivery_assets
DROP POLICY IF EXISTS "contract freelancers insert delivery assets" ON public.contract_delivery_assets;

CREATE POLICY "contract freelancers insert delivery assets"
ON public.contract_delivery_assets
FOR INSERT
TO authenticated
WITH CHECK (
    uploaded_by = auth.uid()
    AND storage_bucket = 'contract-files'
    AND asset_kind IN ('review_asset', 'final_asset')
    AND access_state IN ('preview_available', 'locked')
    AND EXISTS (
        SELECT 1
        FROM public.contract_deliveries d
        JOIN public.contracts c ON c.id = d.contract_id
        WHERE d.id = contract_delivery_assets.delivery_id
          AND d.submitted_by = auth.uid()
          AND c.freelancer_id = auth.uid()
          AND (
              (
                  contract_delivery_assets.asset_kind = 'review_asset'
                  AND contract_delivery_assets.access_state = 'preview_available'
                  -- CHANGED: Use /submissions/ instead of /deliveries/ to avoid ad blockers
                  AND contract_delivery_assets.storage_path LIKE auth.uid()::text || '/' || c.id::text || '/submissions/review/%'
              )
              OR (
                  contract_delivery_assets.asset_kind = 'final_asset'
                  AND contract_delivery_assets.access_state = 'locked'
                  -- CHANGED: Use /submissions/ instead of /deliveries/ to avoid ad blockers
                  AND contract_delivery_assets.storage_path LIKE auth.uid()::text || '/' || c.id::text || '/submissions/final/%'
              )
          )
    )
);

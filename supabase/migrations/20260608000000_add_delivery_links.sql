-- ============================================================================
-- Support Universal Contract Deliverables (External Links)
-- ============================================================================

-- 1. Create table for links
CREATE TABLE IF NOT EXISTS public.contract_delivery_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id uuid NOT NULL REFERENCES public.contract_deliveries(id) ON DELETE CASCADE,
    link_kind text NOT NULL CHECK (link_kind IN ('review_link', 'final_link')),
    url text NOT NULL,
    label text NOT NULL,
    category text NOT NULL CHECK (category IN ('github', 'figma', 'drive', 'loom', 'vercel', 'other')),
    credentials text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing for fast retrieval
CREATE INDEX IF NOT EXISTS idx_contract_delivery_links_delivery_id
    ON public.contract_delivery_links(delivery_id, created_at ASC);

-- Enable RLS
ALTER TABLE public.contract_delivery_links ENABLE ROW LEVEL SECURITY;

-- 2. Select Policy: Contract parties and admin
DROP POLICY IF EXISTS "contract parties read delivery links" ON public.contract_delivery_links;
CREATE POLICY "contract parties read delivery links"
ON public.contract_delivery_links
FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.contract_deliveries d
        JOIN public.contracts c ON c.id = d.contract_id
        WHERE d.id = contract_delivery_links.delivery_id
          AND auth.uid() IN (c.client_id, c.freelancer_id)
    )
);

-- 3. Insert Policy: Authorized freelancers
DROP POLICY IF EXISTS "contract freelancers insert delivery links" ON public.contract_delivery_links;
CREATE POLICY "contract freelancers insert delivery links"
ON public.contract_delivery_links
FOR INSERT
TO authenticated
WITH CHECK (
    link_kind IN ('review_link', 'final_link')
    AND EXISTS (
        SELECT 1
        FROM public.contract_deliveries d
        JOIN public.contracts c ON c.id = d.contract_id
        WHERE d.id = contract_delivery_links.delivery_id
          AND d.submitted_by = auth.uid()
          AND c.freelancer_id = auth.uid()
    )
);

-- Admin policy
DROP POLICY IF EXISTS "admin manage delivery links" ON public.contract_delivery_links;
CREATE POLICY "admin manage delivery links"
ON public.contract_delivery_links
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Update the Atomic Submit RPC to handle links
CREATE OR REPLACE FUNCTION public.submit_contract_delivery_atomic(
    p_contract_id uuid,
    p_delivery_note text DEFAULT NULL,
    p_review_assets jsonb DEFAULT '[]'::jsonb,
    p_final_assets jsonb DEFAULT '[]'::jsonb,
    p_delivery_links jsonb DEFAULT '[]'::jsonb
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
    v_review_link_count integer := 0;
    v_final_link_count integer := 0;
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
       OR jsonb_typeof(COALESCE(p_final_assets, '[]'::jsonb)) <> 'array'
       OR jsonb_typeof(COALESCE(p_delivery_links, '[]'::jsonb)) <> 'array' THEN
        RAISE EXCEPTION 'Delivery assets and links must be arrays';
    END IF;

    v_review_prefix := v_user_id::text || '/' || p_contract_id::text || '/submissions/review/';
    v_final_prefix := v_user_id::text || '/' || p_contract_id::text || '/submissions/final/';

    -- Count physical assets
    SELECT COUNT(*)
    INTO v_review_asset_count
    FROM jsonb_array_elements(COALESCE(p_review_assets, '[]'::jsonb)) asset
    WHERE COALESCE(asset->>'storage_path', '') <> '';

    SELECT COUNT(*)
    INTO v_final_asset_count
    FROM jsonb_array_elements(COALESCE(p_final_assets, '[]'::jsonb)) asset
    WHERE COALESCE(asset->>'storage_path', '') <> '';

    -- Count links
    SELECT COUNT(*)
    INTO v_review_link_count
    FROM jsonb_array_elements(COALESCE(p_delivery_links, '[]'::jsonb)) link
    WHERE COALESCE(link->>'link_kind', '') = 'review_link'
      AND COALESCE(link->>'url', '') <> '';

    SELECT COUNT(*)
    INTO v_final_link_count
    FROM jsonb_array_elements(COALESCE(p_delivery_links, '[]'::jsonb)) link
    WHERE COALESCE(link->>'link_kind', '') = 'final_link'
      AND COALESCE(link->>'url', '') <> '';

    -- Check that at least one deliverable is present for both phases
    IF (v_review_asset_count + v_review_link_count) = 0 THEN
        RAISE EXCEPTION 'At least one review deliverable (file or link) is required';
    END IF;

    IF (v_final_asset_count + v_final_link_count) = 0 THEN
        RAISE EXCEPTION 'At least one final deliverable (file or link) is required';
    END IF;

    -- Validate uploaded physical assets if any exist
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

    -- Validate links
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_delivery_links, '[]'::jsonb)) link
        WHERE COALESCE(link->>'link_kind', '') NOT IN ('review_link', 'final_link')
           OR COALESCE(link->>'url', '') = ''
           OR COALESCE(link->>'label', '') = ''
           OR COALESCE(link->>'category', '') NOT IN ('github', 'figma', 'drive', 'loom', 'vercel', 'other')
    ) THEN
        RAISE EXCEPTION 'Invalid delivery link payload';
    END IF;

    -- Insert delivery version record
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

    -- Insert physical assets
    IF v_review_asset_count > 0 THEN
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
    END IF;

    IF v_final_asset_count > 0 THEN
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
    END IF;

    -- Insert links
    IF (v_review_link_count + v_final_link_count) > 0 THEN
        INSERT INTO public.contract_delivery_links (
            delivery_id,
            link_kind,
            url,
            label,
            category,
            credentials
        )
        SELECT
            v_delivery_id,
            link->>'link_kind',
            link->>'url',
            link->>'label',
            link->>'category',
            NULLIF(link->>'credentials', '')
        FROM jsonb_array_elements(COALESCE(p_delivery_links, '[]'::jsonb)) link;
    END IF;

    -- Update contract state
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
        'review_due_at', v_review_due_at,
        'status', 'delivery_submitted'
    );
END;
$$;

-- 5. Update the retrieval function to aggregates links
CREATE OR REPLACE FUNCTION public.get_latest_contract_delivery(
    p_contract_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_delivery jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', d.id,
        'contract_id', d.contract_id,
        'version_number', d.version_number,
        'submitted_by', d.submitted_by,
        'delivery_note', d.delivery_note,
        'review_due_at', d.review_due_at,
        'submitted_at', d.submitted_at,
        'assets', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'asset_kind', a.asset_kind,
                    'access_state', a.access_state,
                    'name', a.name,
                    'storage_bucket', a.storage_bucket,
                    'storage_path', a.storage_path,
                    'mime_type', a.mime_type,
                    'size_bytes', a.size_bytes,
                    'uploaded_by', a.uploaded_by,
                    'created_at', a.created_at
                )
                ORDER BY a.created_at ASC
            )
            FROM public.contract_delivery_assets a
            WHERE a.delivery_id = d.id
        ), '[]'::jsonb),
        'links', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', l.id,
                    'link_kind', l.link_kind,
                    'url', l.url,
                    'label', l.label,
                    'category', l.category,
                    'credentials', l.credentials,
                    'created_at', l.created_at
                )
                ORDER BY l.created_at ASC
            )
            FROM public.contract_delivery_links l
            WHERE l.delivery_id = d.id
        ), '[]'::jsonb)
    )
    INTO v_delivery
    FROM public.contract_deliveries d
    WHERE d.contract_id = p_contract_id
    ORDER BY d.version_number DESC, d.submitted_at DESC
    LIMIT 1;

    RETURN COALESCE(v_delivery, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_contract_delivery_atomic(uuid, text, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contract_delivery_atomic(uuid, text, jsonb, jsonb, jsonb) TO service_role;

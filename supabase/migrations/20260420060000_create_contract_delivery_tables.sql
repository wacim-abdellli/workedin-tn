CREATE TABLE IF NOT EXISTS public.contract_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    version_number integer NOT NULL,
    submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivery_note text,
    review_due_at timestamptz,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (contract_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_contract_deliveries_contract_id_submitted_at
    ON public.contract_deliveries(contract_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.contract_delivery_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id uuid NOT NULL REFERENCES public.contract_deliveries(id) ON DELETE CASCADE,
    asset_kind text NOT NULL CHECK (asset_kind IN ('review_asset', 'final_asset')),
    access_state text NOT NULL CHECK (access_state IN ('preview_available', 'locked', 'released')),
    name text NOT NULL,
    storage_bucket text NOT NULL DEFAULT 'contract-files',
    storage_path text NOT NULL,
    mime_type text,
    size_bytes bigint,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_delivery_assets_delivery_id
    ON public.contract_delivery_assets(delivery_id, created_at ASC);

ALTER TABLE public.contract_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_delivery_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contract parties read deliveries" ON public.contract_deliveries;
CREATE POLICY "contract parties read deliveries"
ON public.contract_deliveries
FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_deliveries.contract_id
          AND auth.uid() IN (c.client_id, c.freelancer_id)
    )
);

DROP POLICY IF EXISTS "admin manage deliveries" ON public.contract_deliveries;
CREATE POLICY "admin manage deliveries"
ON public.contract_deliveries
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contract parties read delivery assets" ON public.contract_delivery_assets;
CREATE POLICY "contract parties read delivery assets"
ON public.contract_delivery_assets
FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.contract_deliveries d
        JOIN public.contracts c ON c.id = d.contract_id
        WHERE d.id = contract_delivery_assets.delivery_id
          AND auth.uid() IN (c.client_id, c.freelancer_id)
    )
);

DROP POLICY IF EXISTS "admin manage delivery assets" ON public.contract_delivery_assets;
CREATE POLICY "admin manage delivery assets"
ON public.contract_delivery_assets
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

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

REVOKE ALL ON FUNCTION public.get_latest_contract_delivery(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_contract_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_contract_delivery(uuid) TO service_role;

COMMENT ON TABLE public.contract_deliveries IS 'Versioned formal contract delivery submissions used for protected under-review workflow.';
COMMENT ON TABLE public.contract_delivery_assets IS 'Assets attached to a formal contract delivery, split into review and final asset groups with explicit access states.';
COMMENT ON FUNCTION public.get_latest_contract_delivery(uuid) IS 'Returns the latest formal delivery record and its assets for a contract.';

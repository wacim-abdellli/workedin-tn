-- Enforces protected contract delivery visibility at the table, RPC, and storage layers.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contract-files', 'contract-files', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE
SET public = false;

CREATE OR REPLACE FUNCTION public.is_contract_delivery_asset_storage_access_allowed(
    p_bucket text,
    p_object_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.contract_delivery_assets a
            JOIN public.contract_deliveries d ON d.id = a.delivery_id
            JOIN public.contracts c ON c.id = d.contract_id
            WHERE a.storage_bucket = COALESCE(p_bucket, '')
              AND a.storage_path = COALESCE(p_object_name, '')
              AND (
                  auth.uid() = c.freelancer_id
                  OR (
                      auth.uid() = c.client_id
                      AND (
                          a.asset_kind = 'review_asset'
                          OR a.access_state = 'released'
                      )
                  )
              )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.is_contract_delivery_asset_storage_access_allowed(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_contract_delivery_asset_storage_access_allowed(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_contract_delivery_asset_storage_access_allowed(text, text) TO service_role;

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
          AND (
              auth.uid() = c.freelancer_id
              OR (
                  auth.uid() = c.client_id
                  AND (
                      contract_delivery_assets.asset_kind = 'review_asset'
                      OR contract_delivery_assets.access_state = 'released'
                  )
              )
          )
    )
);

DROP POLICY IF EXISTS "contract_files_read_delivery_asset" ON storage.objects;
CREATE POLICY "contract_files_read_delivery_asset"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'contract-files'
    AND public.is_contract_delivery_asset_storage_access_allowed(bucket_id, name)
);

DROP POLICY IF EXISTS "contract_files_admin_manage" ON storage.objects;
CREATE POLICY "contract_files_admin_manage"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'contract-files'
    AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'contract-files'
    AND public.is_admin()
);

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
    v_actor_role text;
BEGIN
    SELECT CASE
        WHEN public.is_admin() THEN 'admin'
        WHEN auth.uid() = c.freelancer_id THEN 'freelancer'
        WHEN auth.uid() = c.client_id THEN 'client'
        ELSE NULL
    END
    INTO v_actor_role
    FROM public.contracts c
    WHERE c.id = p_contract_id
    LIMIT 1;

    IF v_actor_role IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;

    SELECT jsonb_build_object(
        'id', d.id,
        'contract_id', d.contract_id,
        'version_number', d.version_number,
        'submitted_by', d.submitted_by,
        'delivery_note', d.delivery_note,
        'review_due_at', d.review_due_at,
        'submitted_at', d.submitted_at,
        'locked_final_asset_count', COALESCE((
            SELECT COUNT(*)
            FROM public.contract_delivery_assets a
            WHERE a.delivery_id = d.id
              AND a.asset_kind = 'final_asset'
              AND a.access_state <> 'released'
        ), 0),
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
              AND (
                  v_actor_role IN ('admin', 'freelancer')
                  OR a.asset_kind = 'review_asset'
                  OR a.access_state = 'released'
              )
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

COMMENT ON FUNCTION public.is_contract_delivery_asset_storage_access_allowed(text, text)
IS 'Allows contract delivery asset downloads only for review assets, released final assets, the submitting freelancer, or admins.';

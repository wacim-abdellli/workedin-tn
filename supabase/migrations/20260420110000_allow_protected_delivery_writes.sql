-- Allows authenticated freelancers to create protected delivery rows while keeping
-- reads locked down by the existing access policies. Contract-file uploads are
-- handled by the secure-upload Edge Function using the service role, so this
-- migration intentionally does not modify storage.objects policies.

DROP POLICY IF EXISTS "contract freelancers insert deliveries" ON public.contract_deliveries;
CREATE POLICY "contract freelancers insert deliveries"
ON public.contract_deliveries
FOR INSERT
TO authenticated
WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_deliveries.contract_id
          AND c.freelancer_id = auth.uid()
          AND c.status::text IN ('active', 'revision_requested')
    )
);
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
                  AND contract_delivery_assets.storage_path LIKE auth.uid()::text || '/' || c.id::text || '/deliveries/review/%'
              )
              OR (
                  contract_delivery_assets.asset_kind = 'final_asset'
                  AND contract_delivery_assets.access_state = 'locked'
                  AND contract_delivery_assets.storage_path LIKE auth.uid()::text || '/' || c.id::text || '/deliveries/final/%'
              )
          )
    )
);
COMMENT ON POLICY "contract freelancers insert deliveries" ON public.contract_deliveries
IS 'Lets assigned freelancers create delivery headers for active/revision contracts.';

COMMENT ON POLICY "contract freelancers insert delivery assets" ON public.contract_delivery_assets
IS 'Lets assigned freelancers create scoped review/final delivery asset metadata only.';

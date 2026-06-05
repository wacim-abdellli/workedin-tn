-- Security hardening: restrict complete_escrow_payment to service_role only.
-- This function must never be callable from the browser client.
-- It is only invoked by:
--   1. supabase/functions/flouci-verify-payment/index.ts (via supabaseAdmin)
--   2. supabase/functions/reconcile-payment/index.ts (via adminClient)
-- Both use the SUPABASE_SERVICE_ROLE_KEY, which is never exposed to the browser.

REVOKE EXECUTE ON FUNCTION public.complete_escrow_payment(uuid, uuid, uuid, numeric) FROM authenticated;

-- service_role access is preserved (already granted in prior migration)
-- Verify:
COMMENT ON FUNCTION public.complete_escrow_payment(uuid, uuid, uuid, numeric)
IS '[HARDENED 2026-06-04] Callable by service_role only. Authenticated users are explicitly revoked. Invoked exclusively by flouci-verify-payment and reconcile-payment Edge Functions.';

-- Ensure self-report prevention is enforced in the same INSERT policy.
-- Multiple permissive policies are OR-combined in Postgres RLS, so we keep
-- this check inside the authenticated insert policy itself.

DROP POLICY IF EXISTS "no_self_reporting" ON public.reports;
DROP POLICY IF EXISTS "reports_authenticated_insert" ON public.reports;

CREATE POLICY "reports_authenticated_insert" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = reporter_id
        AND NOT (reported_type = 'user' AND reported_id = auth.uid())
    );

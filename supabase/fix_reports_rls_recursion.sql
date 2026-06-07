-- =====================================================
-- FIX REPORTS RLS RECURSION AND CONSOLIDATE POLICIES
-- =====================================================

BEGIN;

-- 1. Drop existing insert policies and recreate a clean, non-recursive insert policy
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
DROP POLICY IF EXISTS "reports_authenticated_insert" ON public.reports;

CREATE POLICY "reports_authenticated_insert" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = reporter_id
        AND NOT (reported_type = 'user' AND reported_id = auth.uid())
    );

-- 2. Consolidate SELECT policies (User select own, Admin select all using is_admin())
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
    FOR SELECT USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "admin_select_all_reports" ON public.reports;
DROP POLICY IF EXISTS "reports_admin_select" ON public.reports;
CREATE POLICY "admin_select_all_reports" ON public.reports
    FOR SELECT USING (public.is_admin());

-- 3. Consolidate UPDATE policies (Only admin can update, using is_admin())
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports
    FOR UPDATE USING (public.is_admin());

-- 4. Recreate rate limit trigger function to securely enforce limit of 3 reports per hour
CREATE OR REPLACE FUNCTION public.check_report_rate_limit()
RETURNS trigger AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.reports
        WHERE reporter_id = NEW.reporter_id
          AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 3 THEN
        RAISE EXCEPTION 'Rate limit exceeded: max 3 reports per hour';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS enforce_report_rate_limit ON public.reports;
CREATE TRIGGER enforce_report_rate_limit
    BEFORE INSERT ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.check_report_rate_limit();

COMMIT;

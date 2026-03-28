-- Enforce report submission rate limiting and self-report protection.

CREATE OR REPLACE FUNCTION public.check_report_rate_limit()
RETURNS trigger AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.reports
        WHERE reporter_id = NEW.reporter_id
          AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 5 THEN
        RAISE EXCEPTION 'Rate limit exceeded: max 5 reports per hour';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_report_rate_limit ON public.reports;

CREATE TRIGGER enforce_report_rate_limit
    BEFORE INSERT ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.check_report_rate_limit();

DROP POLICY IF EXISTS "no_self_reporting" ON public.reports;

CREATE POLICY "no_self_reporting" ON public.reports
    FOR INSERT WITH CHECK (
        NOT (reported_type = 'user' AND reported_id = auth.uid())
    );

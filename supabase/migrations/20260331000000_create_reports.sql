-- Create reports table for flagged content
CREATE TABLE IF NOT EXISTS public.reports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_type   text NOT NULL CHECK (reported_type IN ('job', 'user', 'proposal')),
    reported_id     uuid NOT NULL,
    reason          text NOT NULL,
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    reviewed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at     timestamptz
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_idx ON public.reports(reported_id);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Admins can read all reports
CREATE POLICY "reports_admin_select" ON public.reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Admins can update (review/dismiss) reports
CREATE POLICY "reports_admin_update" ON public.reports
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Authenticated users can insert (report content)
CREATE POLICY "reports_authenticated_insert" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = reporter_id
    );

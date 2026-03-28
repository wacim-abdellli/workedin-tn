-- =====================================================
-- REPORTS RATE LIMITING FIX
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing insert policy
DROP POLICY IF EXISTS "reports_insert_own" ON reports;

-- Create rate-limited insert policy
-- Prevents users from submitting more than 3 reports in 1 hour
-- Also prevents users from reporting their own content
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
    WITH CHECK (
        reporter_id = auth.uid()
        AND reporter_id != reported_id  -- Cannot report yourself
        AND NOT EXISTS (
            SELECT 1 FROM reports r
            WHERE r.reporter_id = auth.uid()
            AND r.created_at > NOW() - INTERVAL '1 hour'
            GROUP BY r.reporter_id
            HAVING COUNT(*) >= 3
        )
    );

-- Ensure users can only read their own reports (for their history)
DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT
    USING (reporter_id = auth.uid());

-- Admin can see all reports
DROP POLICY IF EXISTS "admin_select_all_reports" ON reports;
CREATE POLICY "admin_select_all_reports" ON reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Only admin can update reports
DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

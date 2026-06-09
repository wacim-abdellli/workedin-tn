-- ============================================================================
-- Periodical Timeout Check Schedule (pg_cron)
-- Migration: 20260609030000_register_cron_jobs.sql
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule the database-level contract timeout process to run every hour.
-- This handles sending 24h reminders and marking contract review status as overdue.
SELECT cron.schedule(
    'process-contract-timeouts-hourly',
    '0 * * * *', -- every hour at minute 0
    $$ SELECT public.process_contract_review_timeouts(50) $$
);

-- Note: In production Supabase hosted environments, the 14-day auto-release
-- and 48-hour escrow clearance hold should be triggered by calling the
-- 'cron-process-timeouts' Edge Function via pg_net (net.http_post) or an
-- external HTTP cron trigger (e.g. cron-job.org) to handle third-party
-- payment API calls (Dhmad release/refund).

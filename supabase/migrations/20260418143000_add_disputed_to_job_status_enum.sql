-- Ensure job_status_enum supports 'disputed' before functions/triggers map contract outcomes to job statuses.
-- This fixes contract creation failures on environments that were missing the enum value.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typname = 'job_status_enum'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE n.nspname = 'public'
          AND t.typname = 'job_status_enum'
          AND e.enumlabel = 'disputed'
    ) THEN
        ALTER TYPE public.job_status_enum ADD VALUE 'disputed';
    END IF;
END;
$$;

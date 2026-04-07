-- Make email dispatch logging retry-safe.
-- Previous implementation inserted a dedupe row before attempting delivery,
-- which could permanently suppress retries if the provider call failed.

BEGIN;

ALTER TABLE public.email_dispatch_log
    ADD COLUMN IF NOT EXISTS status text,
    ADD COLUMN IF NOT EXISTS provider_message_id text,
    ADD COLUMN IF NOT EXISTS last_error text,
    ADD COLUMN IF NOT EXISTS sent_at timestamptz;

UPDATE public.email_dispatch_log
SET status = 'failed'
WHERE status IS NULL;

ALTER TABLE public.email_dispatch_log
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'email_dispatch_log_status_check'
          AND conrelid = 'public.email_dispatch_log'::regclass
    ) THEN
        ALTER TABLE public.email_dispatch_log
            ADD CONSTRAINT email_dispatch_log_status_check
            CHECK (status IN ('pending', 'sent', 'failed'));
    END IF;
END $$;

COMMIT;

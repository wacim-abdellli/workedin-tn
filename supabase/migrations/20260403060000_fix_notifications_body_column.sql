-- Ensure the notifications table has the expected `body` column.
-- Some environments were created with an older schema shape and are missing it.

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
          AND column_name = 'content'
    ) THEN
        EXECUTE '
            UPDATE public.notifications
            SET body = COALESCE(NULLIF(body, ''''), content, '''')
            WHERE COALESCE(body, '''') = ''''
        ';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

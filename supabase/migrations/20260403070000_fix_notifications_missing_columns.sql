-- Align older notifications tables with the schema expected by the app and triggers.

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS related_id uuid,
    ADD COLUMN IF NOT EXISTS link text;

NOTIFY pgrst, 'reload schema';

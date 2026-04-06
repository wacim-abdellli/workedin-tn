CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    new_job boolean NOT NULL DEFAULT true,
    messages boolean NOT NULL DEFAULT true,
    payments boolean NOT NULL DEFAULT true,
    reviews boolean NOT NULL DEFAULT true,
    marketing boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_notification_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER trg_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_notification_settings_updated_at();

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_settings_select_own" ON public.notification_settings;
CREATE POLICY "notification_settings_select_own" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_settings_insert_own" ON public.notification_settings;
CREATE POLICY "notification_settings_insert_own" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_settings_update_own" ON public.notification_settings;
CREATE POLICY "notification_settings_update_own" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_settings_delete_own" ON public.notification_settings;
CREATE POLICY "notification_settings_delete_own" ON public.notification_settings
    FOR DELETE USING (auth.uid() = user_id);

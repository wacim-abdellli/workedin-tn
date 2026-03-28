-- Tighten notifications RLS so end users can only read/update their own rows
-- and cannot insert notifications directly.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;

DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;

CREATE POLICY "users_read_own_notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service_insert_notifications" ON public.notifications
    FOR INSERT WITH CHECK (false);

CREATE POLICY "users_update_own_notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

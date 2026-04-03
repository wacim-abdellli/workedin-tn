-- FIX: Allow notifications to be inserted by authenticated users
-- The previous policy blocked ALL inserts with WITH CHECK (false)
-- This prevents the application from creating notifications when users submit verification, etc.
-- 
-- Solution: Allow authenticated users to insert notifications for themselves
-- (they can only insert rows where user_id = their auth.uid())

DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;

CREATE POLICY "users_insert_own_notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

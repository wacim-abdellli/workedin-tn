-- CRITICAL FIX: Force Supabase schema cache refresh for notifications table
-- Error: "Could not find the 'body' column of 'notifications' in the schema cache"
-- 
-- This happens when Supabase's internal schema cache gets out of sync with actual table
-- Solution: Recreate policies and indices to force cache refresh

-- Drop existing policies first
DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_insert_own_notifications" ON public.notifications;

-- Drop old policies that might exist
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;

-- Drop all indexes
DROP INDEX IF EXISTS notifications_user_id_idx;
DROP INDEX IF EXISTS notifications_is_read_idx;
DROP INDEX IF EXISTS notifications_created_at_idx;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx 
    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx 
    ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx 
    ON public.notifications(created_at DESC);

-- Recreate RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_insert_own_notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);


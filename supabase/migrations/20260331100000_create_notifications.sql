-- Notifications table for real-time push engine
CREATE TABLE IF NOT EXISTS public.notifications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type        text NOT NULL CHECK (type IN ('message', 'proposal', 'contract', 'payment', 'system', 'review')),
    title       text NOT NULL,
    body        text NOT NULL DEFAULT '',
    is_read     boolean NOT NULL DEFAULT false,
    related_id  uuid,          -- FK to the related entity (message_id, job_id, contract_id, etc.)
    link        text,          -- Optional deep-link path e.g. /contracts/abc
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx    ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role / triggers can insert (no auth.uid() check needed for SECURITY DEFINER functions)
CREATE POLICY "notifications_insert_service" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Phase 5: Message Ownership System - RLS Policy for messages deletion

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sender can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Only sender can delete their messages" ON public.messages;

CREATE POLICY "Only sender can delete their messages" ON public.messages
    FOR DELETE
    USING (auth.uid() = sender_id);

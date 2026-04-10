-- Enforce suspension at database layer for messaging operations.

CREATE OR REPLACE FUNCTION public.is_account_active(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT account_status = 'active'
      FROM public.profiles
      WHERE id = p_user_id
    ),
    false
  );
$$;

-- Conversations: suspended/archived users cannot create/update conversations
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND public.is_account_active(auth.uid())
  );

DROP POLICY IF EXISTS conversations_update ON public.conversations;
CREATE POLICY conversations_update ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND public.is_account_active(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND public.is_account_active(auth.uid())
  );

-- Messages: suspended/archived senders cannot send new messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_account_active(auth.uid())
  );

-- Receivers can mark read only while active (prevents post-suspension activity)
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
CREATE POLICY "Receivers can mark messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    receiver_id = auth.uid()
    AND public.is_account_active(auth.uid())
  )
  WITH CHECK (
    receiver_id = auth.uid()
    AND public.is_account_active(auth.uid())
  );

NOTIFY pgrst, 'reload schema';

-- Keep unread message counts in inbox only and stop surfacing them as notifications.

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.notify_new_message();

DROP TRIGGER IF EXISTS trg_update_notification_on_message_delete ON public.messages;
DROP FUNCTION IF EXISTS public.update_notification_on_message_delete();

DELETE FROM public.notifications
WHERE type = 'message';

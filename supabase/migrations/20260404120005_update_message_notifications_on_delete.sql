-- Update message notifications when message is soft-deleted
-- When a message is marked as deleted, update the related notification body to show "Message deleted"

CREATE OR REPLACE FUNCTION public.update_notification_on_message_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only act when is_deleted changes from false to true
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
        -- Update any notification that references this message
        UPDATE public.notifications
         SET 
             body = 'Message deleted'
         WHERE related_id = NEW.id 
           AND type = 'message';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_notification_on_message_delete ON public.messages;
CREATE TRIGGER trg_update_notification_on_message_delete
    AFTER UPDATE OF is_deleted ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_notification_on_message_delete();
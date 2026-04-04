-- Part 4: Set up triggers for message changes
DROP TRIGGER IF EXISTS trigger_refresh_conversation_on_message_delete ON public.messages;
DROP TRIGGER IF EXISTS trigger_refresh_conversation_on_message_update ON public.messages;

CREATE TRIGGER trigger_refresh_conversation_on_message_delete
    AFTER DELETE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.refresh_conversation_on_message_change();

CREATE TRIGGER trigger_refresh_conversation_on_message_update
    AFTER UPDATE OF content, attachments, is_read, is_deleted, deleted_at, deleted_by ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.refresh_conversation_on_message_change();

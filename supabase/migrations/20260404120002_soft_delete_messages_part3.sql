-- Part 3: Create trigger function for conversation refresh
CREATE OR REPLACE FUNCTION public.refresh_conversation_on_message_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF COALESCE(NEW.conversation_id, OLD.conversation_id) IS NOT NULL THEN
        PERFORM public.refresh_conversation_metadata(COALESCE(NEW.conversation_id, OLD.conversation_id));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

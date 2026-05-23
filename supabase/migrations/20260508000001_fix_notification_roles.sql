-- Update contract triggers to append role to notification links for strict workspace separation
CREATE OR REPLACE FUNCTION public.notify_contract_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_title text;
    v_title     text;
    v_body      text;
    v_link      text := '/workspace/' || NEW.id;
BEGIN
    -- Only fire when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    SELECT title INTO v_job_title FROM public.jobs WHERE id = NEW.job_id;

    v_title := CASE NEW.status
        WHEN 'active'    THEN 'Contract accepted'
        WHEN 'completed' THEN 'Contract completed'
        WHEN 'cancelled' THEN 'Contract cancelled'
        WHEN 'disputed'  THEN 'Contract disputed'
        ELSE 'Contract updated'
    END;

    v_body := coalesce(v_job_title, 'Contract') || ' — ' || v_title;

    -- Notify client
    IF NEW.client_id IS NOT NULL THEN
        PERFORM public.create_notification(NEW.client_id, 'contract_update', v_title, v_body, NEW.id, v_link || '?role=client');
    END IF;

    -- Notify freelancer
    IF NEW.freelancer_id IS NOT NULL THEN
        PERFORM public.create_notification(NEW.freelancer_id, 'contract_update', v_title, v_body, NEW.id, v_link || '?role=freelancer');
    END IF;

    RETURN NEW;
END;
$$;

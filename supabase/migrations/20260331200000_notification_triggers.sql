-- ============================================================
-- Notification triggers: message → proposal → contract change
-- ============================================================

-- Helper: insert a notification row (SECURITY DEFINER so it bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id   uuid,
    p_type      text,
    p_title     text,
    p_body      text,
    p_related_id uuid DEFAULT NULL,
    p_link      text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, related_id, link)
    VALUES (p_user_id, p_type, p_title, p_body, p_related_id, p_link);
END;
$$;

-- ── 1. New message → notify recipient ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_name text;
BEGIN
    -- Get sender name
    SELECT full_name INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Notify the receiver (not the sender)
    IF NEW.receiver_id IS NOT NULL AND NEW.receiver_id <> NEW.sender_id THEN
        PERFORM public.create_notification(
            NEW.receiver_id,
            'message',
            'رسالة جديدة من ' || coalesce(v_sender_name, 'مستخدم'),
            coalesce(left(NEW.content, 120), ''),
            NEW.id,
            '/messages'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_message();

-- ── 2. New proposal → notify job owner ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_owner_id  uuid;
    v_job_title     text;
    v_freelancer    text;
BEGIN
    SELECT j.client_id, j.title INTO v_job_owner_id, v_job_title
    FROM public.jobs j
    WHERE j.id = NEW.job_id;

    SELECT full_name INTO v_freelancer
    FROM public.profiles
    WHERE id = NEW.freelancer_id;

    IF v_job_owner_id IS NOT NULL AND v_job_owner_id <> NEW.freelancer_id THEN
        PERFORM public.create_notification(
            v_job_owner_id,
            'proposal',
            'عرض جديد على وظيفتك',
            coalesce(v_freelancer, 'مستقل') || ' قدّم عرضاً على "' || coalesce(v_job_title, 'وظيفة') || '"',
            NEW.id,
            '/client/jobs'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_proposal ON public.proposals;
CREATE TRIGGER trg_notify_new_proposal
    AFTER INSERT ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_proposal();

-- ── 3. Contract status change → notify both parties ────────────────────────
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
    v_link      text := '/contracts/' || NEW.id;
BEGIN
    -- Only fire when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    SELECT title INTO v_job_title FROM public.jobs WHERE id = NEW.job_id;

    v_title := CASE NEW.status
        WHEN 'active'    THEN 'تم قبول العقد'
        WHEN 'completed' THEN 'تم إكمال العقد'
        WHEN 'cancelled' THEN 'تم إلغاء العقد'
        WHEN 'disputed'  THEN 'نزاع على العقد'
        ELSE 'تحديث على العقد'
    END;

    v_body := coalesce(v_job_title, 'عقد') || ' — ' || v_title;

    -- Notify client
    IF NEW.client_id IS NOT NULL THEN
        PERFORM public.create_notification(NEW.client_id, 'contract', v_title, v_body, NEW.id, v_link);
    END IF;

    -- Notify freelancer
    IF NEW.freelancer_id IS NOT NULL AND NEW.freelancer_id <> NEW.client_id THEN
        PERFORM public.create_notification(NEW.freelancer_id, 'contract', v_title, v_body, NEW.id, v_link);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_contract_update ON public.contracts;
CREATE TRIGGER trg_notify_contract_update
    AFTER UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_contract_update();

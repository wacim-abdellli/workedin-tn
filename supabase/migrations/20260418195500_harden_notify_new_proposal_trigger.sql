-- Ensure proposal inserts are never blocked by notification failures.
-- If notification plumbing is outdated/misconfigured, proposal creation must still succeed.

CREATE OR REPLACE FUNCTION public.notify_new_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_owner_id uuid;
    v_job_title text;
    v_freelancer text;
BEGIN
    SELECT j.client_id, j.title
    INTO v_job_owner_id, v_job_title
    FROM public.jobs j
    WHERE j.id = NEW.job_id;

    SELECT full_name
    INTO v_freelancer
    FROM public.profiles
    WHERE id = NEW.freelancer_id;

    IF v_job_owner_id IS NOT NULL AND v_job_owner_id <> NEW.freelancer_id THEN
        BEGIN
            -- Use canonical notification type when available.
            PERFORM public.create_notification(
                v_job_owner_id,
                'new_proposal',
                'New proposal on your job',
                COALESCE(v_freelancer, 'A freelancer') || ' submitted a proposal on "' || COALESCE(v_job_title, 'your job') || '"',
                NEW.id,
                '/client/jobs'
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Never block proposal creation due to notification failures.
                RAISE WARNING '[notify_new_proposal] Notification skipped for proposal %, reason: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Final guard: trigger errors must not abort proposal inserts.
        RAISE WARNING '[notify_new_proposal] Trigger fallback for proposal %, reason: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';

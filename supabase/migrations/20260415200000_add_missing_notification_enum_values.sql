-- =============================================================================
-- FIX: notification_type_enum missing 'proposal' and 'contract' values
--
-- Problem:
--   The notify_new_proposal trigger passes 'proposal' to create_notification,
--   and notify_contract_update passes 'contract'. Neither value exists in
--   notification_type_enum, causing:
--     ERROR: invalid input value for enum notification_type_enum: "proposal"
--
-- Solution (two-pronged, belt-and-suspenders):
--   1. Add 'proposal' and 'contract' directly to the enum so the triggers
--      work regardless of which version of create_notification is deployed.
--   2. Rewrite the trigger functions to use the canonical enum values
--      ('new_proposal', 'contract_update') so both old and new callers work.
-- =============================================================================

-- Step 1: Add the missing enum values (IF NOT EXISTS — idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'notification_type_enum'
          AND e.enumlabel = 'proposal'
    ) THEN
        ALTER TYPE notification_type_enum ADD VALUE 'proposal';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'notification_type_enum'
          AND e.enumlabel = 'contract'
    ) THEN
        ALTER TYPE notification_type_enum ADD VALUE 'contract';
    END IF;
END;
$$;

-- Step 2: Update notify_new_proposal to use canonical value 'new_proposal'
-- Both 'proposal' (now added above) and 'new_proposal' are valid.
-- Using 'new_proposal' aligns with the intended canonical set.
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
            'new_proposal',
            'New proposal on your job',
            coalesce(v_freelancer, 'A freelancer') || ' submitted a proposal on "' || coalesce(v_job_title, 'your job') || '"',
            NEW.id,
            '/client/jobs'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Step 3: Update notify_contract_update to use canonical value 'contract_update'
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
        WHEN 'active'    THEN 'Contract accepted'
        WHEN 'completed' THEN 'Contract completed'
        WHEN 'cancelled' THEN 'Contract cancelled'
        WHEN 'disputed'  THEN 'Contract disputed'
        ELSE 'Contract updated'
    END;

    v_body := coalesce(v_job_title, 'Contract') || ' — ' || v_title;

    -- Notify client
    IF NEW.client_id IS NOT NULL THEN
        PERFORM public.create_notification(NEW.client_id, 'contract_update', v_title, v_body, NEW.id, v_link);
    END IF;

    -- Notify freelancer
    IF NEW.freelancer_id IS NOT NULL AND NEW.freelancer_id <> NEW.client_id THEN
        PERFORM public.create_notification(NEW.freelancer_id, 'contract_update', v_title, v_body, NEW.id, v_link);
    END IF;

    RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';

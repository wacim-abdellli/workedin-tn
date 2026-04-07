-- Creates a narrowly scoped server-side RPC for notifying freelancers of proposal acceptance
-- Resolves the cross-user notification restriction issue while maintaining strict security boundaries

CREATE OR REPLACE FUNCTION public.notify_proposal_accepted(
    p_contract_id uuid
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_caller uuid := auth.uid();
    v_contract record;
    v_job record;
    v_inserted public.notifications;
BEGIN
    -- 1. Derive required contract and job metadata
    SELECT * INTO v_contract
    FROM public.contracts
    WHERE id = p_contract_id;

    IF v_contract IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    -- 2. Validate authorization strictly
    IF v_caller IS NULL OR v_caller <> v_contract.client_id THEN
        RAISE EXCEPTION 'Not authorized to send proposal acceptance notification';
    END IF;

    SELECT * INTO v_job
    FROM public.jobs
    WHERE id = v_contract.job_id;

    IF v_job IS NULL THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    -- 3. Construct and insert the notification server-side
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        body,
        is_read,
        link,
        related_id
    )
    VALUES (
        v_contract.freelancer_id,
        'proposal',
        'تم قبول العرض',
        'تم قبول عرضك على المشروع: ' || COALESCE(v_job.title, ''),
        false,
        '/contracts/' || p_contract_id,
        p_contract_id
    )
    RETURNING * INTO v_inserted;

    RETURN v_inserted;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_proposal_accepted(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_proposal_accepted(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_proposal_accepted(uuid) TO service_role;

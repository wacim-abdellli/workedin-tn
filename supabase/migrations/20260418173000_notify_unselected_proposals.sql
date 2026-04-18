-- Notify freelancers whose proposals were not selected after a hire decision.

CREATE OR REPLACE FUNCTION public.notify_unselected_proposals(
    p_job_id uuid,
    p_accepted_proposal_id uuid,
    p_contract_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_job record;
    v_rows_inserted integer := 0;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT id, client_id, title
    INTO v_job
    FROM public.jobs
    WHERE id = p_job_id;

    IF v_job IS NULL THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF v_job.client_id <> v_caller THEN
        RAISE EXCEPTION 'Only the job owner can notify unselected applicants';
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, is_read, link, related_id)
    SELECT
        p.freelancer_id,
        'proposal',
        'Proposal update',
        'Another freelancer was selected for project: ' || COALESCE(v_job.title, ''),
        false,
        '/jobs/' || p_job_id,
        p_job_id
    FROM public.proposals p
    WHERE p.job_id = p_job_id
      AND p.id <> p_accepted_proposal_id
      AND p.status::text = 'rejected'
      AND NOT EXISTS (
          SELECT 1
          FROM public.notifications n
          WHERE n.user_id = p.freelancer_id
            AND n.type::text = 'proposal'
            AND n.related_id = p_job_id
            AND n.title = 'Proposal update'
      );

    GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;
    RETURN v_rows_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_unselected_proposals(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_unselected_proposals(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_unselected_proposals(uuid, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_job_views(p_job_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job public.jobs%ROWTYPE;
    v_caller uuid := auth.uid();
BEGIN
    IF p_job_id IS NULL THEN
        RAISE EXCEPTION 'Job id is required';
    END IF;

    SELECT *
    INTO v_job
    FROM public.jobs
    WHERE id = p_job_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF v_job.visibility <> 'public' OR v_job.status <> 'open' THEN
        RETURN v_job.views_count;
    END IF;

    IF v_caller IS NOT NULL AND v_caller = v_job.client_id THEN
        RETURN v_job.views_count;
    END IF;

    UPDATE public.jobs
    SET
        views_count = COALESCE(views_count, 0) + 1,
        updated_at = CASE
            WHEN v_job.updated_at IS NOT NULL THEN now()
            ELSE v_job.updated_at
        END
    WHERE id = p_job_id
    RETURNING views_count INTO v_job.views_count;

    RETURN v_job.views_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_job_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_job_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_job_views(uuid) TO authenticated;

COMMENT ON FUNCTION public.increment_job_views(uuid)
IS 'Atomically increments views_count for public open jobs, while skipping owner self-views.';

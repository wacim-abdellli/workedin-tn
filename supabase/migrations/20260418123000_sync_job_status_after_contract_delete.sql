-- Keep jobs.status consistent when contracts are inserted, updated, or deleted.
-- If a job no longer has any contracts, it returns to open.

CREATE OR REPLACE FUNCTION public.sync_job_status_with_contract_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_id uuid := COALESCE(NEW.job_id, OLD.job_id);
    v_latest_status text;
    v_next_status public.job_status_enum;
BEGIN
    IF v_job_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT c.status::text
    INTO v_latest_status
    FROM public.contracts c
    WHERE c.job_id = v_job_id
    ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    LIMIT 1;

    IF NOT FOUND THEN
        UPDATE public.jobs
        SET status = 'open'::public.job_status_enum,
            updated_at = now()
        WHERE id = v_job_id
          AND status::text IN ('in_progress', 'completed', 'cancelled', 'disputed');

        RETURN COALESCE(NEW, OLD);
    END IF;

    v_next_status := CASE
        WHEN v_latest_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN v_latest_status = 'cancelled' OR v_latest_status = 'canceled' THEN 'cancelled'::public.job_status_enum
        WHEN v_latest_status = 'disputed' THEN 'disputed'::public.job_status_enum
        ELSE 'in_progress'::public.job_status_enum
    END;

    UPDATE public.jobs
    SET status = v_next_status,
        updated_at = now()
    WHERE id = v_job_id
      AND status IS DISTINCT FROM v_next_status;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_job_status_with_contract_outcome ON public.contracts;
CREATE TRIGGER trg_sync_job_status_with_contract_outcome
AFTER INSERT OR UPDATE OF status OR DELETE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.sync_job_status_with_contract_outcome();

-- Backfill existing jobs that have stale non-open status but no contracts.
UPDATE public.jobs j
SET status = 'open'::public.job_status_enum,
    updated_at = now()
WHERE j.status::text IN ('in_progress', 'completed', 'cancelled', 'disputed')
  AND NOT EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.job_id = j.id
  );

COMMENT ON FUNCTION public.sync_job_status_with_contract_outcome IS
'Synchronizes jobs.status with latest contract status and reopens jobs when all linked contracts are deleted.';

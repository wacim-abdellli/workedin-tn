-- Keep job lifecycle aligned with contract lifecycle.
-- This prevents stale `jobs.status` values when contracts are completed, cancelled, or disputed.

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
        RETURN COALESCE(NEW, OLD);
    END IF;

    v_next_status := CASE
        WHEN v_latest_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN v_latest_status = 'cancelled' THEN 'cancelled'::public.job_status_enum
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
AFTER INSERT OR UPDATE OF status ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.sync_job_status_with_contract_outcome();

-- Backfill current rows so existing data is aligned immediately after migration.
WITH latest_contract_per_job AS (
    SELECT DISTINCT ON (c.job_id)
        c.job_id,
        c.status::text AS contract_status
    FROM public.contracts c
    ORDER BY c.job_id, COALESCE(c.updated_at, c.created_at) DESC
)
UPDATE public.jobs j
SET status = CASE
        WHEN l.contract_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN l.contract_status = 'cancelled' THEN 'cancelled'::public.job_status_enum
        WHEN l.contract_status = 'disputed' THEN 'disputed'::public.job_status_enum
        ELSE 'in_progress'::public.job_status_enum
    END,
    updated_at = now()
FROM latest_contract_per_job l
WHERE j.id = l.job_id
  AND j.status IS DISTINCT FROM CASE
        WHEN l.contract_status = 'completed' THEN 'completed'::public.job_status_enum
        WHEN l.contract_status = 'cancelled' THEN 'cancelled'::public.job_status_enum
        WHEN l.contract_status = 'disputed' THEN 'disputed'::public.job_status_enum
        ELSE 'in_progress'::public.job_status_enum
    END;

COMMENT ON FUNCTION public.sync_job_status_with_contract_outcome IS
'Synchronizes jobs.status with the latest related contract status (in_progress, completed, cancelled, disputed).';

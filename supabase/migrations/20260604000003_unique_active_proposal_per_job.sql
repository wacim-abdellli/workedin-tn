-- Prevent a freelancer from having more than one active proposal per job.
-- Uses a partial unique index so rejected/withdrawn proposals are excluded,
-- allowing re-application if a previous proposal was rejected.

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_proposal_per_job
    ON public.proposals (freelancer_id, job_id)
    WHERE status NOT IN ('rejected', 'withdrawn');

COMMENT ON INDEX idx_unique_active_proposal_per_job
IS 'Prevents duplicate active proposals from the same freelancer on the same job. Added 2026-06-04.';

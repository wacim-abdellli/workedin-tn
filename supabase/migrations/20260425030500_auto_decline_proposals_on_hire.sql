-- Migration: Auto-decline pending proposals when a contract is created
-- This trigger automatically updates all pending proposals for a job to 'declined' 
-- when a client hires a freelancer (i.e. a contract is inserted).

CREATE OR REPLACE FUNCTION public.auto_decline_other_proposals()
RETURNS trigger AS $$
BEGIN
    -- Only proceed if the contract is linked to a job
    IF NEW.job_id IS NOT NULL THEN
        
        -- Update other pending proposals for the same job to declined
        -- Note: The hired freelancer's proposal should be marked as 'accepted'
        -- either before or during this process, so it won't be in 'pending' status.
        -- We also ensure we don't decline the hired freelancer's proposal just in case.
        UPDATE public.proposals
        SET status = 'rejected'
        WHERE job_id = NEW.job_id
          AND freelancer_id != NEW.freelancer_id
          AND status = 'pending';
          
        -- Optionally, mark the job as 'in_progress' if it is still 'open'
        UPDATE public.jobs
        SET status = 'in_progress'
        WHERE id = NEW.job_id
          AND status = 'open';
          
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to allow idempotent runs
DROP TRIGGER IF EXISTS trg_auto_decline_other_proposals ON public.contracts;

-- Create the trigger on the contracts table
CREATE TRIGGER trg_auto_decline_other_proposals
AFTER INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.auto_decline_other_proposals();

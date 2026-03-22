-- ============================================
-- Server-side business logic validation
-- Date: 2026-03-22
-- Purpose: Critical business rules enforced at DB level
-- ============================================

-- 1. SECURE PROPOSAL SUBMISSION
-- Validates: job is open, freelancer hasn't already applied, bid is within budget
CREATE OR REPLACE FUNCTION submit_proposal(
    p_job_id UUID,
    p_freelancer_id UUID,
    p_cover_letter TEXT,
    p_bid_amount DECIMAL,
    p_delivery_days INT
) RETURNS UUID AS $$
DECLARE
    v_job jobs%ROWTYPE;
    v_existing_count INT;
    v_proposal_id UUID;
BEGIN
    -- Check job exists and is open
    SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;
    IF v_job.status != 'open' THEN
        RAISE EXCEPTION 'Job is not open for proposals';
    END IF;

    -- Check freelancer hasn't already submitted
    SELECT COUNT(*) INTO v_existing_count
    FROM proposals
    WHERE job_id = p_job_id AND freelancer_id = p_freelancer_id;
    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'You have already submitted a proposal for this job';
    END IF;

    -- Check freelancer is not the job owner
    IF v_job.client_id = p_freelancer_id THEN
        RAISE EXCEPTION 'You cannot submit a proposal on your own job';
    END IF;

    -- Validate bid amount (if fixed price, check within budget range)
    IF v_job.job_type = 'fixed_price' AND v_job.budget_min IS NOT NULL THEN
        IF p_bid_amount < v_job.budget_min * 0.5 THEN
            RAISE EXCEPTION 'Bid amount is too low';
        END IF;
    END IF;

    -- Rate limit: max 10 proposals per hour
    SELECT COUNT(*) INTO v_existing_count
    FROM proposals
    WHERE freelancer_id = p_freelancer_id
    AND created_at > NOW() - INTERVAL '1 hour';
    IF v_existing_count >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting more proposals.';
    END IF;

    -- Insert proposal
    INSERT INTO proposals (job_id, freelancer_id, cover_letter, bid_amount, delivery_days, status)
    VALUES (p_job_id, p_freelancer_id, p_cover_letter, p_bid_amount, p_delivery_days, 'pending')
    RETURNING id INTO v_proposal_id;

    RETURN v_proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. SECURE CONTRACT CREATION (from accepted proposal)
CREATE OR REPLACE FUNCTION create_contract_from_proposal(
    p_proposal_id UUID,
    p_client_id UUID
) RETURNS UUID AS $$
DECLARE
    v_proposal proposals%ROWTYPE;
    v_job jobs%ROWTYPE;
    v_contract_id UUID;
BEGIN
    -- Get proposal
    SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;
    IF v_proposal.status != 'pending' THEN
        RAISE EXCEPTION 'Proposal is no longer pending';
    END IF;

    -- Get job and verify ownership
    SELECT * INTO v_job FROM jobs WHERE id = v_proposal.job_id;
    IF v_job.client_id != p_client_id THEN
        RAISE EXCEPTION 'You are not the owner of this job';
    END IF;

    -- Create contract
    INSERT INTO contracts (job_id, client_id, freelancer_id, amount, status)
    VALUES (v_proposal.job_id, p_client_id, v_proposal.freelancer_id, v_proposal.bid_amount, 'active')
    RETURNING id INTO v_contract_id;

    -- Update proposal status
    UPDATE proposals SET status = 'accepted' WHERE id = p_proposal_id;

    -- Update job status
    UPDATE jobs SET status = 'in_progress' WHERE id = v_proposal.job_id;

    RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

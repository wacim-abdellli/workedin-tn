-- Server-side rate limiting for proposals and contract messages

CREATE OR REPLACE FUNCTION check_proposal_rate_limit(p_freelancer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM proposals
    WHERE freelancer_id = p_freelancer_id
      AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: max 10 proposals per hour';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION check_message_rate_limit(p_sender_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM messages
    WHERE sender_id = p_sender_id
      AND created_at > NOW() - INTERVAL '1 minute'
  ) >= 30 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: max 30 messages per minute';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION submit_proposal(
  p_job_id UUID,
  p_freelancer_id UUID,
  p_cover_letter TEXT,
  p_bid_amount DECIMAL,
  p_delivery_days INT,
  p_attachments TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_existing_count INT;
  v_proposal_id UUID;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.status != 'open' THEN
    RAISE EXCEPTION 'Job is not open for proposals';
  END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM proposals
  WHERE job_id = p_job_id AND freelancer_id = p_freelancer_id;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'You have already submitted a proposal for this job';
  END IF;

  IF v_job.client_id = p_freelancer_id THEN
    RAISE EXCEPTION 'You cannot submit a proposal on your own job';
  END IF;

  IF v_job.job_type = 'fixed_price' AND v_job.budget_min IS NOT NULL THEN
    IF p_bid_amount < v_job.budget_min * 0.5 THEN
      RAISE EXCEPTION 'Bid amount is too low';
    END IF;
  END IF;

  PERFORM check_proposal_rate_limit(p_freelancer_id);

  INSERT INTO proposals (job_id, freelancer_id, cover_letter, bid_amount, delivery_days, attachments, status)
  VALUES (
    p_job_id,
    p_freelancer_id,
    p_cover_letter,
    p_bid_amount,
    p_delivery_days,
    COALESCE(p_attachments, ARRAY[]::TEXT[]),
    'pending'
  )
  RETURNING id INTO v_proposal_id;

  RETURN v_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION send_message(
  p_contract_id UUID,
  p_sender_id UUID,
  p_receiver_id UUID,
  p_content TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb,
  p_message_type TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  PERFORM check_message_rate_limit(p_sender_id);

  INSERT INTO messages (
    contract_id,
    sender_id,
    receiver_id,
    content,
    attachments,
    message_type
  )
  VALUES (
    p_contract_id,
    p_sender_id,
    p_receiver_id,
    p_content,
    COALESCE(p_attachments, '[]'::jsonb),
    p_message_type
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_proposal(UUID, UUID, TEXT, DECIMAL, INT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message(UUID, UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;

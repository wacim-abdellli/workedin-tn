-- ============================================
-- ATOMIC PAYMENT COMPLETION FUNCTION
-- Created: 2026-01-31
-- Purpose: Ensures payment completion is atomic - all steps succeed or all fail
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS complete_escrow_payment(UUID, UUID, UUID, DECIMAL);

-- Create atomic payment completion function
CREATE OR REPLACE FUNCTION complete_escrow_payment(
  p_transaction_id UUID,
  p_contract_id UUID,
  p_freelancer_id UUID,
  p_amount DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_wallet_id UUID;
BEGIN
  -- All updates in single transaction (atomic)
  -- If any step fails, everything rolls back automatically
  
  -- 1. Update transaction status to completed
  UPDATE transactions 
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_transaction_id
    AND status = 'pending'; -- Only update if still pending (idempotency)
  
  IF NOT FOUND THEN
    -- Check if already completed (idempotent)
    IF EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id AND status = 'completed') THEN
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Payment already completed',
        'idempotent', true
      );
    END IF;
    RAISE EXCEPTION 'Transaction not found or already processed: %', p_transaction_id;
  END IF;
  
  -- 2. Update contract escrow status
  UPDATE contracts 
  SET 
    escrow_funded = true,
    escrow_amount = COALESCE(escrow_amount, 0) + p_amount,
    funded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found: %', p_contract_id;
  END IF;
  
  -- 3. Update or create freelancer wallet
  UPDATE wallets 
  SET 
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_freelancer_id
  RETURNING id INTO v_wallet_id;
  
  IF NOT FOUND THEN
    -- Create wallet if doesn't exist
    INSERT INTO wallets (user_id, balance, pending_balance, total_earned, total_withdrawn)
    VALUES (p_freelancer_id, 0, p_amount, 0, 0)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- 4. Create notification for freelancer
  INSERT INTO notifications (user_id, type, title, content, is_read)
  VALUES (
    p_freelancer_id,
    'payment',
    'تم تمويل الضمان',
    format('تم تمويل الضمان بمبلغ %s د.ت. يمكنك بدء العمل الآن.', p_amount),
    false
  );
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', p_transaction_id,
    'contract_id', p_contract_id,
    'freelancer_id', p_freelancer_id,
    'wallet_id', v_wallet_id,
    'amount', p_amount,
    'completed_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error rolls back entire transaction
    RAISE EXCEPTION 'Payment completion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_escrow_payment TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION complete_escrow_payment IS 
'Atomically completes an escrow payment: updates transaction status, marks contract as funded, 
updates freelancer wallet pending balance, and creates notification. 
All steps succeed or all fail together, preventing money loss.';

-- ============================================
-- RELEASE ESCROW FUNCTION (for when work is approved)
-- ============================================

DROP FUNCTION IF EXISTS release_escrow_payment(UUID, UUID, UUID, DECIMAL);

CREATE OR REPLACE FUNCTION release_escrow_payment(
  p_contract_id UUID,
  p_freelancer_id UUID,
  p_amount DECIMAL,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 1. Update freelancer wallet: move from pending to available balance
  UPDATE wallets 
  SET 
    pending_balance = pending_balance - p_amount,
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE user_id = p_freelancer_id
    AND pending_balance >= p_amount; -- Ensure sufficient pending balance
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient pending balance or wallet not found for user: %', p_freelancer_id;
  END IF;
  
  -- 2. Update milestone if provided
  IF p_milestone_id IS NOT NULL THEN
    UPDATE milestones
    SET 
      status = 'completed',
      paid_at = NOW(),
      updated_at = NOW()
    WHERE id = p_milestone_id;
  END IF;
  
  -- 3. Create transaction record for the release
  INSERT INTO transactions (
    user_id, 
    contract_id, 
    type, 
    amount, 
    status, 
    description
  ) VALUES (
    p_freelancer_id,
    p_contract_id,
    'escrow_release',
    p_amount,
    'completed',
    'تم تحويل المبلغ من الضمان إلى رصيدك المتاح'
  );
  
  -- 4. Create notification
  INSERT INTO notifications (user_id, type, title, content, is_read)
  VALUES (
    p_freelancer_id,
    'payment',
    'تم تحويل الأموال',
    format('تم تحويل %s د.ت إلى رصيدك المتاح. يمكنك سحب الأموال الآن.', p_amount),
    false
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'contract_id', p_contract_id,
    'freelancer_id', p_freelancer_id,
    'amount_released', p_amount,
    'released_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Escrow release failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION release_escrow_payment TO authenticated;

COMMENT ON FUNCTION release_escrow_payment IS 
'Atomically releases escrow funds to freelancer: moves pending_balance to available balance,
updates milestone if provided, creates transaction record and notification.';

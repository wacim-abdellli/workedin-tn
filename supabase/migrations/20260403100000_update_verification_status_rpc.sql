-- Create RPC function to atomically update verification status
-- This prevents race conditions from parallel updates to multiple tables

CREATE OR REPLACE FUNCTION update_verification_status(
  p_user_id uuid,
  p_action text, -- 'approved' or 'rejected'
  p_reviewed_at timestamptz DEFAULT NOW()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cin_verified boolean;
  v_affected_rows int;
BEGIN
  -- Validate action parameter
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be "approved" or "rejected"', p_action;
  END IF;

  -- Determine cin_verified value based on action
  v_cin_verified := (p_action = 'approved');

  -- Update identity_verifications table
  UPDATE identity_verifications
  SET 
    status = p_action,
    reviewed_at = p_reviewed_at
  WHERE user_id = p_user_id
    AND status = 'pending';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  -- Update profiles table (always exists)
  UPDATE profiles
  SET 
    cin_verified = v_cin_verified,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update freelancer_profiles table (may not exist for clients)
  UPDATE freelancer_profiles
  SET cin_verified = v_cin_verified
  WHERE id = p_user_id;

  -- Return success with affected rows count
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'action', p_action,
    'cin_verified', v_cin_verified,
    'verification_rows_updated', v_affected_rows
  );
END;
$$;

-- Create RPC function to atomically revoke verification
CREATE OR REPLACE FUNCTION revoke_verification_status(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_rows int;
BEGIN
  -- Delete from identity_verifications
  DELETE FROM identity_verifications
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;

  -- Update profiles table
  UPDATE profiles
  SET 
    cin_verified = false,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update freelancer_profiles table (may not exist for clients)
  UPDATE freelancer_profiles
  SET cin_verified = false
  WHERE id = p_user_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'cin_verified', false,
    'verification_rows_deleted', v_deleted_rows
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_verification_status(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_verification_status(uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION update_verification_status IS 'Atomically updates verification status across all related tables to prevent state divergence';
COMMENT ON FUNCTION revoke_verification_status IS 'Atomically revokes verification status and removes verification records';

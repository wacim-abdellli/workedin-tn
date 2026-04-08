DO $migration$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "wallets_update" ON public.wallets';
  EXECUTE 'DROP POLICY IF EXISTS "users_insert_own_withdrawal" ON public.withdrawals';
  EXECUTE 'DROP POLICY IF EXISTS "conversations_update" ON public.conversations';
  EXECUTE 'DROP POLICY IF EXISTS "connects_insert_service" ON public.connects_transactions';
  EXECUTE 'DROP POLICY IF EXISTS "Contract parties can create reviews" ON public.reviews';

  EXECUTE $fn$
  CREATE OR REPLACE FUNCTION public.submit_review_atomic(
      p_contract_id uuid,
      p_rating integer,
      p_comment text DEFAULT NULL
  )
  RETURNS public.reviews
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $function$
  DECLARE
      v_user_id uuid := auth.uid();
      v_client_id uuid;
      v_freelancer_id uuid;
      v_contract_status text;
      v_reviewee_id uuid;
      v_review public.reviews;
      v_comment text := nullif(btrim(p_comment), '');
  BEGIN
      IF v_user_id IS NULL THEN
          RAISE EXCEPTION 'Authentication required';
      END IF;

      IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
          RAISE EXCEPTION 'Rating must be between 1 and 5';
      END IF;

      SELECT client_id, freelancer_id, status::text
      INTO v_client_id, v_freelancer_id, v_contract_status
      FROM public.contracts
      WHERE id = p_contract_id
      FOR UPDATE;

      IF NOT FOUND THEN
          RAISE EXCEPTION 'Contract not found';
      END IF;

      IF v_contract_status <> 'completed' THEN
          RAISE EXCEPTION 'Only completed contracts can be reviewed';
      END IF;

      IF v_user_id = v_client_id THEN
          v_reviewee_id := v_freelancer_id;
      ELSIF v_user_id = v_freelancer_id THEN
          v_reviewee_id := v_client_id;
      ELSE
          RAISE EXCEPTION 'Only contract parties can review this contract';
      END IF;

      INSERT INTO public.reviews (
          contract_id,
          reviewer_id,
          reviewee_id,
          rating,
          comment
      )
      VALUES (
          p_contract_id,
          v_user_id,
          v_reviewee_id,
          p_rating,
          v_comment
      )
      RETURNING * INTO v_review;

      RETURN v_review;
  EXCEPTION
      WHEN unique_violation THEN
          RAISE EXCEPTION 'You have already reviewed this contract';
  END;
  $function$;
  $fn$;

  EXECUTE 'REVOKE ALL ON FUNCTION public.submit_review_atomic(uuid, integer, text) FROM PUBLIC';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.submit_review_atomic(uuid, integer, text) TO authenticated';
  EXECUTE 'COMMENT ON FUNCTION public.submit_review_atomic(uuid, integer, text) IS ''Atomically validates contract review eligibility, derives the reviewee server-side, and inserts one review per reviewer per contract.''';
END;
$migration$;

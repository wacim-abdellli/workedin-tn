DO $migration$
BEGIN
  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.resolve_dispute(
        p_dispute_id uuid,
        p_resolution text,
        p_admin_note text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        v_admin_id uuid := auth.uid();
        v_is_admin boolean := false;
        v_contract_id uuid;
        v_dispute_status text;
        v_contract_status text;
        v_payment_status text;
        v_escrow_funded boolean := false;
        v_has_escrow_funded boolean := false;
        v_updated_count integer := 0;
    BEGIN
        IF v_admin_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
        END IF;

        SELECT is_admin
        INTO v_is_admin
        FROM public.profiles
        WHERE id = v_admin_id;

        IF NOT COALESCE(v_is_admin, false) THEN
            RAISE EXCEPTION 'Only admins can resolve disputes';
        END IF;

        IF p_resolution NOT IN ('resolved_client', 'resolved_freelancer', 'resolved_split', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid dispute resolution: %', p_resolution;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtext('resolve_dispute:' || p_dispute_id::text));

        SELECT d.contract_id, d.status::text
        INTO v_contract_id, v_dispute_status
        FROM public.disputes d
        WHERE d.id = p_dispute_id
        FOR UPDATE;

        IF NOT FOUND OR v_contract_id IS NULL THEN
            RAISE EXCEPTION 'Dispute not found';
        END IF;

        IF v_dispute_status <> 'open' THEN
            RAISE EXCEPTION 'Dispute is already resolved';
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'contracts'
              AND column_name = 'escrow_funded'
        ) INTO v_has_escrow_funded;

        IF v_has_escrow_funded THEN
            SELECT c.status::text, c.payment_status::text, COALESCE(c.escrow_funded, false)
            INTO v_contract_status, v_payment_status, v_escrow_funded
            FROM public.contracts c
            WHERE c.id = v_contract_id
            FOR UPDATE;
        ELSE
            SELECT c.status::text, c.payment_status::text, false
            INTO v_contract_status, v_payment_status, v_escrow_funded
            FROM public.contracts c
            WHERE c.id = v_contract_id
            FOR UPDATE;
        END IF;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Contract not found';
        END IF;

        IF p_resolution = 'resolved_freelancer'
           AND NOT (
                COALESCE(v_escrow_funded, false)
                OR COALESCE(v_payment_status, '') IN ('paid', 'in_escrow', 'released')
           ) THEN
            RAISE EXCEPTION 'Escrow must be funded before resolving in favor of freelancer';
        END IF;

        UPDATE public.disputes
        SET status = p_resolution,
            admin_note = p_admin_note,
            resolved_by = v_admin_id,
            resolved_at = now()
        WHERE id = p_dispute_id
          AND status = 'open';

        GET DIAGNOSTICS v_updated_count = ROW_COUNT;

        IF v_updated_count <> 1 THEN
            RAISE EXCEPTION 'Dispute could not be resolved';
        END IF;

        CASE p_resolution
            WHEN 'resolved_client' THEN
                UPDATE public.contracts
                SET status = 'cancelled',
                    updated_at = now()
                WHERE id = v_contract_id;

            WHEN 'resolved_freelancer' THEN
                UPDATE public.contracts
                SET status = 'completed',
                    payment_status = 'released',
                    completed_at = COALESCE(completed_at, now()),
                    updated_at = now()
                WHERE id = v_contract_id;

            WHEN 'resolved_split', 'cancelled' THEN
                UPDATE public.contracts
                SET status = 'cancelled',
                    updated_at = now()
                WHERE id = v_contract_id;
        END CASE;
    END;
    $$;
  $fn$;

  EXECUTE 'REVOKE ALL ON FUNCTION public.resolve_dispute(uuid, text, text) FROM PUBLIC';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.resolve_dispute(uuid, text, text) TO authenticated';
  EXECUTE 'COMMENT ON FUNCTION public.resolve_dispute(uuid, text, text) IS ''Admin-only dispute resolution RPC hardened with locking, open-state checks, and escrow validation before freelancer payout release.''';
END;
$migration$;

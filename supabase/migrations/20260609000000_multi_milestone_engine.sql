-- ============================================================================
-- Multi-Milestone Contract Engine
-- Migration: 20260609000000_multi_milestone_engine.sql
-- ============================================================================

-- 1. Alter public.contract_deliveries to support linking to a specific milestone
ALTER TABLE public.contract_deliveries
    ADD COLUMN IF NOT EXISTS milestone_id uuid REFERENCES public.milestones(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contract_deliveries_milestone_id 
    ON public.contract_deliveries(milestone_id);

-- 2. Alter public.milestones to support escrow, payment links, and clearance holds
ALTER TABLE public.milestones
    ADD COLUMN IF NOT EXISTS dhmad_escrow_id text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS dhmad_payment_url text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS escrow_pending_clearance_until timestamptz DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS escrow_hold_disputed boolean DEFAULT false;

-- 3. Create RPC to submit delivery for a specific milestone
CREATE OR REPLACE FUNCTION public.submit_milestone_delivery_atomic(
    p_contract_id uuid,
    p_milestone_id uuid,
    p_delivery_note text,
    p_review_assets jsonb,
    p_final_assets jsonb,
    p_delivery_links jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_freelancer_id uuid;
    v_client_id uuid;
    v_contract_status text;
    v_payment_status text;
    v_milestone_status text;
    v_delivery_id uuid;
    v_version_number integer;
    v_review_prefix text;
    v_final_prefix text;
    v_review_asset_count integer;
    v_final_asset_count integer;
    v_review_link_count integer;
    v_final_link_count integer;
    v_asset jsonb;
    v_link jsonb;
    v_review_due_interval interval := interval '3 days';
    v_review_due_at timestamptz := now() + v_review_due_interval;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_delivery_note IS NULL OR length(btrim(p_delivery_note)) = 0 THEN
        RAISE EXCEPTION 'Delivery note is required';
    END IF;

    IF jsonb_typeof(COALESCE(p_review_assets, '[]'::jsonb)) <> 'array' 
       OR jsonb_typeof(COALESCE(p_final_assets, '[]'::jsonb)) <> 'array'
       OR jsonb_typeof(COALESCE(p_delivery_links, '[]'::jsonb)) <> 'array' THEN
        RAISE EXCEPTION 'Delivery assets and links must be arrays';
    END IF;

    -- Lock both contract and milestone
    PERFORM pg_advisory_xact_lock(hashtext('submit_milestone_delivery:' || p_milestone_id::text));

    SELECT client_id, freelancer_id, status::text, payment_status::text
    INTO v_client_id, v_freelancer_id, v_contract_status, v_payment_status
    FROM public.contracts
    WHERE id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;

    SELECT status::text
    INTO v_milestone_status
    FROM public.milestones
    WHERE id = p_milestone_id AND contract_id = p_contract_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;

    IF v_freelancer_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the freelancer can submit work';
    END IF;

    IF v_contract_status NOT IN ('active', 'revision_requested', 'delivery_submitted') THEN
        RAISE EXCEPTION 'Contract is not in a deliverable state';
    END IF;

    IF v_milestone_status NOT IN ('pending', 'rejected') THEN
        RAISE EXCEPTION 'Milestone is not in a deliverable state';
    END IF;

    v_review_prefix := v_user_id::text || '/' || p_contract_id::text || '/submissions/review/';
    v_final_prefix := v_user_id::text || '/' || p_contract_id::text || '/submissions/final/';

    -- Count deliverables
    SELECT COUNT(*) INTO v_review_asset_count FROM jsonb_array_elements(COALESCE(p_review_assets, '[]'::jsonb)) a WHERE COALESCE(a->>'storage_path', '') <> '';
    SELECT COUNT(*) INTO v_final_asset_count FROM jsonb_array_elements(COALESCE(p_final_assets, '[]'::jsonb)) a WHERE COALESCE(a->>'storage_path', '') <> '';
    SELECT COUNT(*) INTO v_review_link_count FROM jsonb_array_elements(COALESCE(p_delivery_links, '[]'::jsonb)) l WHERE COALESCE(l->>'link_kind', '') = 'review_link' AND COALESCE(l->>'url', '') <> '';
    SELECT COUNT(*) INTO v_final_link_count FROM jsonb_array_elements(COALESCE(p_delivery_links, '[]'::jsonb)) l WHERE COALESCE(l->>'link_kind', '') = 'final_link' AND COALESCE(l->>'url', '') <> '';

    IF (v_review_asset_count + v_review_link_count) = 0 THEN
        RAISE EXCEPTION 'At least one review deliverable (file or link) is required';
    END IF;
    IF (v_final_asset_count + v_final_link_count) = 0 THEN
        RAISE EXCEPTION 'At least one final deliverable (file or link) is required';
    END IF;

    -- Validate paths
    IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(p_review_assets, '[]'::jsonb)) a
        WHERE COALESCE(a->>'storage_bucket', 'contract-files') <> 'contract-files' OR COALESCE(a->>'storage_path', '') NOT LIKE v_review_prefix || '%'
    ) THEN
        RAISE EXCEPTION 'Invalid review asset payload';
    END IF;

    IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(p_final_assets, '[]'::jsonb)) a
        WHERE COALESCE(a->>'storage_bucket', 'contract-files') <> 'contract-files' OR COALESCE(a->>'storage_path', '') NOT LIKE v_final_prefix || '%'
    ) THEN
        RAISE EXCEPTION 'Invalid final asset payload';
    END IF;

    -- Compute delivery version
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM public.contract_deliveries WHERE contract_id = p_contract_id;

    -- Insert delivery record linked to the milestone
    INSERT INTO public.contract_deliveries (
        contract_id,
        milestone_id,
        version_number,
        submitted_by,
        delivery_note,
        review_due_at
    )
    VALUES (
        p_contract_id,
        p_milestone_id,
        v_version_number,
        v_user_id,
        p_delivery_note,
        v_review_due_at
    )
    RETURNING id INTO v_delivery_id;

    -- Insert assets
    FOR v_asset IN SELECT * FROM jsonb_array_elements(p_review_assets) LOOP
        INSERT INTO public.contract_delivery_assets (delivery_id, asset_kind, access_state, name, storage_bucket, storage_path, mime_type, size_bytes, uploaded_by)
        VALUES (v_delivery_id, 'review_asset', 'preview_available', v_asset->>'name', 'contract-files', v_asset->>'storage_path', v_asset->>'mime_type', (v_asset->>'size_bytes')::bigint, v_user_id);
    END LOOP;

    FOR v_asset IN SELECT * FROM jsonb_array_elements(p_final_assets) LOOP
        INSERT INTO public.contract_delivery_assets (delivery_id, asset_kind, access_state, name, storage_bucket, storage_path, mime_type, size_bytes, uploaded_by)
        VALUES (v_delivery_id, 'final_asset', 'locked', v_asset->>'name', 'contract-files', v_asset->>'storage_path', v_asset->>'mime_type', (v_asset->>'size_bytes')::bigint, v_user_id);
    END LOOP;

    -- Insert links
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_delivery_links) LOOP
        INSERT INTO public.contract_delivery_links (delivery_id, link_kind, url, label, category, credentials)
        VALUES (v_delivery_id, v_link->>'link_kind', v_link->>'url', v_link->>'label', v_link->>'category', v_link->>'credentials');
    END LOOP;

    -- Update milestone and contract status
    UPDATE public.milestones SET status = 'submitted' WHERE id = p_milestone_id;
    UPDATE public.contracts SET status = 'delivery_submitted', review_due_at = v_review_due_at, updated_at = now() WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'delivery_id', v_delivery_id,
        'version_number', v_version_number,
        'milestone_status', 'submitted',
        'contract_status', 'delivery_submitted'
    );
END;
$$;

-- 4. Create RPC to release payment for a specific milestone
CREATE OR REPLACE FUNCTION public.release_milestone_payment_atomic(
    p_milestone_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_contract_id uuid;
    v_client_id uuid;
    v_amount numeric;
    v_milestone_status text;
    v_dhmad_escrow_id text;
    v_clearance_interval interval := interval '48 hours';
    v_all_approved boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('release_milestone:' || p_milestone_id::text));

    SELECT contract_id, amount, status::text, dhmad_escrow_id
    INTO v_contract_id, v_amount, v_milestone_status, v_dhmad_escrow_id
    FROM public.milestones
    WHERE id = p_milestone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;

    SELECT client_id INTO v_client_id FROM public.contracts WHERE id = v_contract_id;

    IF v_client_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the client can release milestone payments';
    END IF;

    IF v_milestone_status <> 'submitted' THEN
        RAISE EXCEPTION 'Milestone must be submitted before payment can be released';
    END IF;

    -- Unlock final assets associated with this milestone's deliveries
    UPDATE public.contract_delivery_assets a
    SET access_state = 'released'
    FROM public.contract_deliveries d
    WHERE d.milestone_id = p_milestone_id
      AND d.id = a.delivery_id
      AND a.access_state = 'locked';

    -- Set milestone status to approved and initiate 48-hour hold
    UPDATE public.milestones
    SET status = 'approved',
        escrow_pending_clearance_until = now() + v_clearance_interval,
        escrow_hold_disputed = false
    WHERE id = p_milestone_id;

    -- Check if all milestones for this contract are now approved
    SELECT NOT EXISTS (
        SELECT 1 FROM public.milestones
        WHERE contract_id = v_contract_id AND status <> 'approved'
    ) INTO v_all_approved;

    IF v_all_approved THEN
        UPDATE public.contracts
        SET status = 'completed',
            payment_status = 'released',
            completed_at = now(),
            review_due_at = NULL,
            updated_at = now()
        WHERE id = v_contract_id;
    ELSE
        -- Revert contract status to active so other milestones can progress
        UPDATE public.contracts
        SET status = 'active',
            review_due_at = NULL,
            updated_at = now()
        WHERE id = v_contract_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'milestone_id', p_milestone_id,
        'milestone_status', 'approved',
        'contract_completed', v_all_approved
    );
END;
$$;

-- 5. Create RPC to suspend milestone payment clearance (dispute)
CREATE OR REPLACE FUNCTION public.hold_milestone_clearance_payment(
    p_milestone_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_contract_id uuid;
    v_client_id uuid;
    v_clearance_until timestamptz;
    v_disputed boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Dispute reason is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('hold_milestone_clearance:' || p_milestone_id::text));

    SELECT contract_id, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_contract_id, v_clearance_until, v_disputed
    FROM public.milestones
    WHERE id = p_milestone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;

    SELECT client_id INTO v_client_id FROM public.contracts WHERE id = v_contract_id;

    IF v_client_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the client can hold payment clearance';
    END IF;

    IF v_clearance_until IS NULL OR now() >= v_clearance_until THEN
        RAISE EXCEPTION 'Clearance window has expired or was never initialized';
    END IF;

    -- Revert milestone to disputed state
    UPDATE public.milestones
    SET escrow_hold_disputed = true
    WHERE id = p_milestone_id;

    UPDATE public.contracts
    SET status = 'disputed',
        updated_at = now()
    WHERE id = v_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'milestone_id', p_milestone_id,
        'escrow_hold_disputed', true
    );
END;
$$;

-- 6. Create RPC to finalize milestone payout (releasing from hold to wallet balance)
CREATE OR REPLACE FUNCTION public.finalize_milestone_clearance_payment(
    p_milestone_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contract_id uuid;
    v_freelancer_id uuid;
    v_amount numeric;
    v_milestone_status text;
    v_clearance_until timestamptz;
    v_hold_disputed boolean;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('finalize_milestone_clearance:' || p_milestone_id::text));

    SELECT contract_id, amount, status::text, escrow_pending_clearance_until, escrow_hold_disputed
    INTO v_contract_id, v_amount, v_milestone_status, v_clearance_until, v_hold_disputed
    FROM public.milestones
    WHERE id = p_milestone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;

    SELECT freelancer_id INTO v_freelancer_id FROM public.contracts WHERE id = v_contract_id;

    IF v_milestone_status <> 'approved' OR v_hold_disputed = true THEN
        RAISE EXCEPTION 'Milestone is not approved or has an active dispute hold';
    END IF;

    IF v_clearance_until IS NULL OR now() < v_clearance_until THEN
        RAISE EXCEPTION 'Clearance hold period has not expired yet';
    END IF;

    -- Mark milestone escrow as cleared (which we can represent by setting escrow_pending_clearance_until = NULL and clearing the hold)
    UPDATE public.milestones
    SET escrow_pending_clearance_until = NULL,
        escrow_hold_disputed = false
    WHERE id = p_milestone_id;

    -- Credit the freelancer's wallet balance
    UPDATE public.wallets
    SET balance = balance + v_amount,
        updated_at = now()
    WHERE user_id = v_freelancer_id;

    -- Insert transaction log
    INSERT INTO public.transactions (user_id, contract_id, type, amount, status, description, completed_at)
    VALUES (v_freelancer_id, v_contract_id, 'escrow_release', v_amount, 'completed', 'Milestone payment released from escrow hold', now());

    RETURN jsonb_build_object(
        'success', true,
        'milestone_id', p_milestone_id,
        'released_amount', v_amount
    );
END;
$$;

-- 7. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.submit_milestone_delivery_atomic(uuid, uuid, text, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_milestone_payment_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hold_milestone_clearance_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_milestone_clearance_payment(uuid) TO service_role;

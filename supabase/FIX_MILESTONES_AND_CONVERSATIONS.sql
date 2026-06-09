-- ============================================================================
-- SQL Script: Fix Milestones RLS & Auto-Bootstrap Contract Conversations
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Enable RLS on public.milestones (ensuring it is active)
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on public.milestones to avoid duplicates/collisions
DROP POLICY IF EXISTS "Milestones viewable by contract parties" ON public.milestones;
DROP POLICY IF EXISTS "Clients can create milestones" ON public.milestones;
DROP POLICY IF EXISTS "Contract parties can update milestones" ON public.milestones;
DROP POLICY IF EXISTS "milestones_select_all" ON public.milestones;

-- 3. Create explicit, qualified policies to prevent Postgres scope resolution issues

-- SELECT POLICY: Contract parties can view milestones
CREATE POLICY "Milestones viewable by contract parties" 
    ON public.milestones FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c 
            WHERE c.id = milestones.contract_id 
            AND (c.freelancer_id = auth.uid() OR c.client_id = auth.uid())
        )
    );

-- INSERT POLICY: Clients can create milestones for their own contracts
CREATE POLICY "Clients can create milestones" 
    ON public.milestones FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts c 
            WHERE c.id = milestones.contract_id 
            AND c.client_id = auth.uid()
        )
    );

-- UPDATE POLICY: Involved parties can update milestone statuses/fields
CREATE POLICY "Contract parties can update milestones" 
    ON public.milestones FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c 
            WHERE c.id = milestones.contract_id 
            AND (c.freelancer_id = auth.uid() OR c.client_id = auth.uid())
        )
    );


-- 4. Redefine hire_proposal_atomic to automatically pre-create contract conversations

CREATE OR REPLACE FUNCTION public.hire_proposal_atomic(
    p_proposal_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_job_id uuid;
    v_client_id uuid;
    v_freelancer_id uuid;
    v_amount numeric;
    v_job_title text;
    v_job_description text;
    v_job_type text;
    v_proposal_status text;
    v_contract_id uuid;
    v_existing_contract_id uuid;
    v_contract_status text := 'active';
    v_has_pending_payment_status boolean := false;
    v_has_title boolean := false;
    v_has_description boolean := false;
    v_has_contract_type boolean := false;
    v_has_payment_status boolean := false;
    v_has_total_amount boolean := false;
    v_job_next_status public.job_status_enum := 'in_progress'::public.job_status_enum;
    v_insert_sql text;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT
        p.job_id,
        j.client_id,
        p.freelancer_id,
        p.bid_amount,
        j.title,
        j.description,
        j.job_type::text,
        p.status::text
    INTO
        v_job_id,
        v_client_id,
        v_freelancer_id,
        v_amount,
        v_job_title,
        v_job_description,
        v_job_type,
        v_proposal_status
    FROM public.proposals p
    JOIN public.jobs j ON j.id = p.job_id
    WHERE p.id = p_proposal_id
    FOR UPDATE OF p, j;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;

    IF v_client_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the job owner can hire this proposal';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('hire_proposal:' || v_job_id::text));

    SELECT id
    INTO v_existing_contract_id
    FROM public.contracts
    WHERE proposal_id = p_proposal_id
    LIMIT 1;

    IF v_existing_contract_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'contract_id', v_existing_contract_id,
            'job_id', v_job_id,
            'freelancer_id', v_freelancer_id,
            'amount', v_amount,
            'existing', true
        );
    END IF;

    SELECT id
    INTO v_existing_contract_id
    FROM public.contracts
    WHERE job_id = v_job_id
      AND status <> 'cancelled'
    LIMIT 1;

    IF v_existing_contract_id IS NOT NULL THEN
        RAISE EXCEPTION 'A contract already exists for this job';
    END IF;

    IF v_proposal_status NOT IN ('new', 'pending', 'shortlisted') THEN
        RAISE EXCEPTION 'Only new, pending, or shortlisted proposals can be hired';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'contract_status_enum'
          AND e.enumlabel = 'pending_payment'
    ) INTO v_has_pending_payment_status;

    IF v_has_pending_payment_status THEN
        v_contract_status := 'pending_payment';
        v_job_next_status := 'matched'::public.job_status_enum;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'title'
    ) INTO v_has_title;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'description'
    ) INTO v_has_description;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'contract_type'
    ) INTO v_has_contract_type;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'payment_status'
    ) INTO v_has_payment_status;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'total_amount'
    ) INTO v_has_total_amount;

    v_insert_sql := 'INSERT INTO public.contracts (job_id, proposal_id, client_id, freelancer_id, amount';

    IF v_has_title THEN
        v_insert_sql := v_insert_sql || ', title';
    END IF;
    IF v_has_description THEN
        v_insert_sql := v_insert_sql || ', description';
    END IF;
    IF v_has_contract_type THEN
        v_insert_sql := v_insert_sql || ', contract_type';
    END IF;
    IF v_has_payment_status THEN
        v_insert_sql := v_insert_sql || ', payment_status';
    END IF;
    IF v_has_total_amount THEN
        v_insert_sql := v_insert_sql || ', total_amount';
    END IF;

    v_insert_sql := v_insert_sql || ', status) VALUES ($1, $2, $3, $4, $5';

    IF v_has_title THEN
        v_insert_sql := v_insert_sql || ', $6';
    END IF;
    IF v_has_description THEN
        v_insert_sql := v_insert_sql || ', $7';
    END IF;
    IF v_has_contract_type THEN
        v_insert_sql := v_insert_sql || ', $8::job_type_enum';
    END IF;
    IF v_has_payment_status THEN
        v_insert_sql := v_insert_sql || ', $9::payment_status_enum';
    END IF;
    IF v_has_total_amount THEN
        v_insert_sql := v_insert_sql || ', $10';
    END IF;

    v_insert_sql := v_insert_sql || ', $11::contract_status_enum) RETURNING id';

    EXECUTE v_insert_sql
    INTO v_contract_id
    USING
        v_job_id,
        p_proposal_id,
        v_client_id,
        v_freelancer_id,
        v_amount,
        COALESCE(v_job_title, 'Contract'),
        v_job_description,
        v_job_type,
        'pending',
        v_amount,
        v_contract_status;

    -- Automatically pre-create the conversation for this contract so that it exists in the workspace
    DECLARE
        v_conv_p1 UUID;
        v_conv_p2 UUID;
        v_conv_inbox_p1 TEXT;
        v_conv_inbox_p2 TEXT;
    BEGIN
        IF v_client_id < v_freelancer_id THEN
            v_conv_p1 := v_client_id;
            v_conv_p2 := v_freelancer_id;
            v_conv_inbox_p1 := 'client';
            v_conv_inbox_p2 := 'freelancer';
        ELSE
            v_conv_p1 := v_freelancer_id;
            v_conv_p2 := v_client_id;
            v_conv_inbox_p1 := 'freelancer';
            v_conv_inbox_p2 := 'client';
        END IF;

        INSERT INTO public.conversations (
            participant_1,
            participant_2,
            client_id,
            freelancer_id,
            contract_id,
            conversation_scope,
            inbox_participant_1,
            inbox_participant_2,
            status
        ) VALUES (
            v_conv_p1,
            v_conv_p2,
            v_client_id,
            v_freelancer_id,
            v_contract_id,
            'contract',
            v_conv_inbox_p1,
            v_conv_inbox_p2,
            'active'
        )
        ON CONFLICT DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            -- Suppress exceptions to avoid failing the hiring process if conversation bootstrapping fails
            NULL;
    END;

    UPDATE public.proposals
    SET status = CASE WHEN id = p_proposal_id THEN 'accepted'::proposal_status_enum ELSE 'rejected'::proposal_status_enum END
    WHERE job_id = v_job_id
      AND status <> CASE WHEN id = p_proposal_id THEN 'accepted'::proposal_status_enum ELSE 'rejected'::proposal_status_enum END;

    UPDATE public.jobs
    SET status = v_job_next_status,
        updated_at = now()
    WHERE id = v_job_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', v_contract_id,
        'job_id', v_job_id,
        'freelancer_id', v_freelancer_id,
        'amount', v_amount,
        'existing', false
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.hire_proposal_atomic(uuid) TO authenticated;


-- 5. Backfill missing conversations for ALL existing contracts in the database

DO $$
DECLARE
    v_contract RECORD;
    v_participant_1 UUID;
    v_participant_2 UUID;
    v_inbox_p1 TEXT;
    v_inbox_p2 TEXT;
    v_conv_exists BOOLEAN;
BEGIN
    FOR v_contract IN SELECT id, client_id, freelancer_id FROM public.contracts LOOP
        -- Check if conversation already exists for this contract
        SELECT EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE contract_id = v_contract.id
        ) INTO v_conv_exists;
        
        IF NOT v_conv_exists THEN
            -- Order participants
            IF v_contract.client_id < v_contract.freelancer_id THEN
                v_participant_1 := v_contract.client_id;
                v_participant_2 := v_contract.freelancer_id;
                v_inbox_p1 := 'client';
                v_inbox_p2 := 'freelancer';
            ELSE
                v_participant_1 := v_contract.freelancer_id;
                v_participant_2 := v_contract.client_id;
                v_inbox_p1 := 'freelancer';
                v_inbox_p2 := 'client';
            END IF;
            
            -- Insert the contract conversation
            INSERT INTO public.conversations (
                participant_1,
                participant_2,
                client_id,
                freelancer_id,
                contract_id,
                conversation_scope,
                inbox_participant_1,
                inbox_participant_2,
                status
            ) VALUES (
                v_participant_1,
                v_participant_2,
                v_contract.client_id,
                v_contract.freelancer_id,
                v_contract.id,
                'contract',
                v_inbox_p1,
                v_inbox_p2,
                'active'
            );
        END IF;
    END LOOP;
END;
$$;


-- 6. Reload PostgREST schema cache to ensure the changes are instantly active
NOTIFY pgrst, 'reload schema';

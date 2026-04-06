-- P0-2 negative authorization checks for high-risk Supabase resources.
-- Safe to run in SQL Editor: the script opens a transaction and ends with ROLLBACK.
-- Preconditions:
-- 1. The target DB must already contain at least one non-admin client/freelancer contract.
-- 2. The target DB must already contain wallets for those users.
-- 3. Run this as a privileged SQL editor session so role switching and JWT claim overrides work.

BEGIN;

CREATE OR REPLACE FUNCTION public._audit_set_authenticated_actor(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
    PERFORM set_config(
        'request.jwt.claims',
        json_build_object('role', 'authenticated', 'sub', p_user_id::text)::text,
        true
    );
END;
$$;

CREATE OR REPLACE FUNCTION public._audit_assert(p_condition boolean, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT COALESCE(p_condition, false) THEN
        RAISE EXCEPTION 'AUDIT ASSERT FAILED: %', p_label;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._audit_expect_count_eq(p_sql text, p_expected bigint, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count bigint;
BEGIN
    EXECUTE format('SELECT count(*) FROM (%s) AS audit_q', p_sql) INTO v_count;

    IF v_count <> p_expected THEN
        RAISE EXCEPTION 'AUDIT ASSERT FAILED: %, expected count %, got %', p_label, p_expected, v_count;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._audit_expect_error(p_sql text, p_label text, p_message_fragment text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE p_sql;
    RAISE EXCEPTION 'AUDIT ASSERT FAILED: %, expected statement to fail', p_label;
EXCEPTION
    WHEN OTHERS THEN
        IF position('AUDIT ASSERT FAILED:' IN SQLERRM) = 1 THEN
            RAISE;
        END IF;

        IF p_message_fragment IS NOT NULL AND position(lower(p_message_fragment) IN lower(SQLERRM)) = 0 THEN
            RAISE EXCEPTION 'AUDIT ASSERT FAILED: %, expected error containing "%", got "%"', p_label, p_message_fragment, SQLERRM;
        END IF;
END;
$$;

CREATE TEMP TABLE audit_fixture_ctx AS
WITH shared_contract AS (
    SELECT
        c.id AS shared_contract_id,
        c.client_id,
        c.freelancer_id,
        c.job_id,
        c.proposal_id
    FROM public.contracts c
    JOIN public.profiles client_profile ON client_profile.id = c.client_id
    JOIN public.profiles freelancer_profile ON freelancer_profile.id = c.freelancer_id
    WHERE COALESCE(client_profile.is_admin, false) = false
      AND COALESCE(freelancer_profile.is_admin, false) = false
    ORDER BY c.created_at
    LIMIT 1
),
shared_proposal AS (
    SELECT
        COALESCE(sc.proposal_id, p.id) AS shared_proposal_id
    FROM shared_contract sc
    LEFT JOIN public.proposals p
        ON p.job_id = sc.job_id
       AND p.freelancer_id = sc.freelancer_id
    LIMIT 1
),
other_user AS (
    SELECT p.id AS other_user_id
    FROM public.profiles p
    CROSS JOIN shared_contract sc
    WHERE COALESCE(p.is_admin, false) = false
      AND p.id <> sc.client_id
      AND p.id <> sc.freelancer_id
    ORDER BY p.created_at
    LIMIT 1
),
admin_user AS (
    SELECT id AS admin_user_id
    FROM public.profiles
    WHERE COALESCE(is_admin, false) = true
    ORDER BY created_at
    LIMIT 1
),
shared_transaction AS (
    SELECT
        t.id AS shared_transaction_id,
        t.amount AS shared_transaction_amount
    FROM public.transactions t
    CROSS JOIN shared_contract sc
    WHERE COALESCE(to_jsonb(t) ->> 'contract_id', to_jsonb(t) ->> 'reference_id') = sc.shared_contract_id::text
    ORDER BY t.created_at
    LIMIT 1
),
message_fixture AS (
    SELECT m.id AS shared_message_id
    FROM public.messages m
    CROSS JOIN shared_contract sc
    WHERE (m.sender_id = sc.client_id AND m.receiver_id = sc.freelancer_id)
       OR (m.sender_id = sc.freelancer_id AND m.receiver_id = sc.client_id)
    ORDER BY m.created_at
    LIMIT 1
)
SELECT
    sc.shared_contract_id,
    sc.client_id AS client_user_id,
    sc.freelancer_id AS freelancer_user_id,
    sp.shared_proposal_id,
    ou.other_user_id,
    au.admin_user_id,
    (SELECT w.id FROM public.wallets w WHERE w.user_id = sc.client_id ORDER BY w.created_at LIMIT 1) AS client_wallet_id,
    (SELECT w.id FROM public.wallets w WHERE w.user_id = sc.freelancer_id ORDER BY w.created_at LIMIT 1) AS freelancer_wallet_id,
    (SELECT st.shared_transaction_id FROM shared_transaction st) AS shared_transaction_id,
    (SELECT st.shared_transaction_amount FROM shared_transaction st) AS shared_transaction_amount,
    (SELECT mf.shared_message_id FROM message_fixture mf) AS shared_message_id
FROM shared_contract sc
LEFT JOIN shared_proposal sp ON true
LEFT JOIN other_user ou ON true
LEFT JOIN admin_user au ON true;

GRANT SELECT ON audit_fixture_ctx TO authenticated;

SELECT public._audit_assert(shared_contract_id IS NOT NULL, 'fixture: require one non-admin contract')
FROM audit_fixture_ctx;
SELECT public._audit_assert(shared_proposal_id IS NOT NULL, 'fixture: require one proposal linked to the shared contract/job')
FROM audit_fixture_ctx;
SELECT public._audit_assert(other_user_id IS NOT NULL, 'fixture: require one unrelated authenticated user')
FROM audit_fixture_ctx;
SELECT public._audit_assert(admin_user_id IS NOT NULL, 'fixture: require one admin user')
FROM audit_fixture_ctx;
SELECT public._audit_assert(client_wallet_id IS NOT NULL, 'fixture: require a wallet for the client actor')
FROM audit_fixture_ctx;
SELECT public._audit_assert(freelancer_wallet_id IS NOT NULL, 'fixture: require a wallet for the freelancer actor')
FROM audit_fixture_ctx;
SELECT public._audit_assert(shared_transaction_id IS NOT NULL, 'fixture: require a transaction linked to the shared contract')
FROM audit_fixture_ctx;

SET LOCAL ROLE authenticated;

-- Unrelated authenticated user cannot read or mutate foreign contract data.
SELECT public._audit_set_authenticated_actor(other_user_id) FROM audit_fixture_ctx;

SELECT public._audit_expect_count_eq(
    format('SELECT 1 FROM public.contracts WHERE id = %L::uuid', shared_contract_id),
    0,
    'other user cannot read unrelated contract'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_count_eq(
    format('SELECT 1 FROM public.proposals WHERE id = %L::uuid', shared_proposal_id),
    0,
    'other user cannot read unrelated proposal'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_count_eq(
    format('SELECT 1 FROM public.wallets WHERE id = %L::uuid', freelancer_wallet_id),
    0,
    'other user cannot read freelancer wallet'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format('SELECT public.hire_proposal_atomic(%L::uuid)', shared_proposal_id),
    'other user cannot hire another client''s proposal',
    'Only the job owner'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.open_dispute_atomic(%L::uuid, 'audit unauthorized dispute probe')$sql$, shared_contract_id),
    'other user cannot open dispute on unrelated contract',
    'Only contract parties'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.set_user_account_status(%L::uuid, 'suspended', 'audit probe')$sql$, client_user_id),
    'non-admin cannot change account status',
    'Only admins'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.update_verification_status(%L::uuid, 'approved', now(), 'audit probe')$sql$, freelancer_user_id),
    'non-admin cannot approve identity verification',
    'Only admins'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.revoke_verification_status(%L::uuid, 'audit probe')$sql$, freelancer_user_id),
    'non-admin cannot revoke identity verification',
    'Only admins'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.create_notification(%L::uuid, 'system', 'audit title', 'audit body', NULL, NULL)$sql$, freelancer_user_id),
    'non-admin cannot create notification for another user',
    'Not allowed to create notifications for other users'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format(
        $sql$SELECT public.complete_escrow_payment(%L::uuid, %L::uuid, %L::uuid, %s)$sql$,
        shared_transaction_id,
        shared_contract_id,
        freelancer_user_id,
        shared_transaction_amount::text
    ),
    'other user cannot complete another client''s escrow payment',
    'Only the contract client'
)
FROM audit_fixture_ctx;

-- Contract party but wrong actor cannot release payment or withdraw from someone else's wallet.
SELECT public._audit_set_authenticated_actor(freelancer_user_id) FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format('SELECT public.release_contract_payment_atomic(%L::uuid)', shared_contract_id),
    'freelancer cannot release contract payment',
    'Only the client'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format(
        $sql$SELECT public.complete_escrow_payment(%L::uuid, %L::uuid, %L::uuid, %s)$sql$,
        shared_transaction_id,
        shared_contract_id,
        freelancer_user_id,
        shared_transaction_amount::text
    ),
    'freelancer cannot complete escrow funding for the contract',
    'Only the contract client'
)
FROM audit_fixture_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.request_withdrawal_atomic(%L::uuid, 20, 'd17', 'audit-foreign-wallet', NULL, NULL, NULL, '55123456')$sql$, client_wallet_id),
    'freelancer cannot withdraw from client wallet',
    'only withdraw from your own wallet'
)
FROM audit_fixture_ctx;

-- Create or reuse a dispute as the client, then ensure unrelated and non-admin actors cannot resolve it.
CREATE TEMP TABLE audit_runtime_ctx (opened_dispute_id uuid NOT NULL);
GRANT SELECT ON audit_runtime_ctx TO authenticated;

SELECT public._audit_set_authenticated_actor(client_user_id) FROM audit_fixture_ctx;

INSERT INTO audit_runtime_ctx (opened_dispute_id)
SELECT (public.open_dispute_atomic(shared_contract_id, 'audit unauthorized resolution probe')->>'dispute_id')::uuid
FROM audit_fixture_ctx;

SELECT public._audit_assert(opened_dispute_id IS NOT NULL, 'fixture: require dispute id for resolution checks')
FROM audit_runtime_ctx;

SELECT public._audit_set_authenticated_actor(other_user_id) FROM audit_fixture_ctx;

SELECT public._audit_expect_count_eq(
    format('SELECT 1 FROM public.disputes WHERE id = %L::uuid', opened_dispute_id),
    0,
    'other user cannot read unrelated dispute'
)
FROM audit_runtime_ctx;

SELECT public._audit_expect_error(
    format($sql$SELECT public.resolve_dispute(%L::uuid, 'resolved_client', 'audit probe')$sql$, opened_dispute_id),
    'non-admin cannot resolve dispute',
    'Only admins'
)
FROM audit_runtime_ctx;

-- Optional message delete check if fixture data exists.
DO $$
DECLARE
    v_message_id uuid;
    v_other_user_id uuid;
BEGIN
    SELECT shared_message_id, other_user_id
    INTO v_message_id, v_other_user_id
    FROM audit_fixture_ctx;

    IF v_message_id IS NULL THEN
        RAISE NOTICE 'Skipping delete_message_atomic negative test because no shared message fixture was found.';
        RETURN;
    END IF;

    PERFORM public._audit_set_authenticated_actor(v_other_user_id);
    PERFORM public._audit_expect_error(
        format('SELECT public.delete_message_atomic(%L::uuid)', v_message_id),
        'other user cannot delete someone else''s message',
        'only delete your own messages'
    );
END;
$$;

DO $$
BEGIN
    RAISE NOTICE 'P0-2 negative authorization checks completed without assertion failure.';
END;
$$;

ROLLBACK;

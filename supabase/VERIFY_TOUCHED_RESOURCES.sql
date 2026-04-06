-- P0-2 coverage check for every Supabase table/view/RPC touched by app code.
-- Run in Supabase SQL Editor or psql against the target database.

CREATE TEMP TABLE audit_touched_tables (
    resource_name text PRIMARY KEY,
    resource_type text NOT NULL,
    sensitivity text NOT NULL
);

INSERT INTO audit_touched_tables (resource_name, resource_type, sensitivity) VALUES
    ('category_job_counts', 'view', 'low'),
    ('connects_transactions', 'table', 'medium'),
    ('contracts', 'table', 'critical'),
    ('conversations', 'table', 'high'),
    ('disputes', 'table', 'critical'),
    ('favorites', 'table', 'low'),
    ('freelancer_profiles', 'table', 'high'),
    ('identity_verifications', 'table', 'critical'),
    ('jobs', 'table', 'high'),
    ('messages', 'table', 'critical'),
    ('milestones', 'table', 'high'),
    ('notification_settings', 'table', 'medium'),
    ('notifications', 'table', 'high'),
    ('payment_methods', 'table', 'critical'),
    ('portfolio_items', 'table', 'low'),
    ('profiles', 'table', 'critical'),
    ('proposals', 'table', 'critical'),
    ('reports', 'table', 'critical'),
    ('reviews', 'table', 'medium'),
    ('transactions', 'table', 'critical'),
    ('wallets', 'table', 'critical'),
    ('withdrawals', 'table', 'critical');

CREATE TEMP TABLE audit_touched_rpcs (
    resource_name text PRIMARY KEY,
    sensitivity text NOT NULL,
    expected_authenticated_execute boolean NOT NULL DEFAULT true,
    expected_service_role_execute boolean NOT NULL DEFAULT false
);

INSERT INTO audit_touched_rpcs (resource_name, sensitivity, expected_authenticated_execute, expected_service_role_execute) VALUES
    ('complete_escrow_payment', 'critical', true, true),
    ('create_notification', 'high', true, true),
    ('delete_message_atomic', 'high', true, false),
    ('get_client_stats_v2', 'medium', true, false),
    ('get_or_create_conversation', 'high', true, false),
    ('get_total_unread_count', 'medium', true, false),
    ('hire_proposal_atomic', 'critical', true, false),
    ('mark_conversation_read', 'medium', true, false),
    ('open_dispute_atomic', 'critical', true, false),
    ('refund_connects_for_proposal', 'medium', true, false),
    ('release_contract_payment_atomic', 'critical', true, false),
    ('request_withdrawal_atomic', 'critical', true, false),
    ('resolve_dispute', 'critical', true, false),
    ('revoke_verification_status', 'critical', true, false),
    ('set_user_account_status', 'critical', true, false),
    ('set_user_type_rpc', 'high', true, false),
    ('spend_connects_for_proposal', 'medium', true, false),
    ('update_verification_status', 'critical', true, false);

WITH rels AS (
    SELECT
        c.relname AS resource_name,
        CASE c.relkind
            WHEN 'r' THEN 'table'
            WHEN 'v' THEN 'view'
            WHEN 'm' THEN 'materialized view'
            ELSE c.relkind::text
        END AS actual_type,
        c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'v', 'm')
),
policies AS (
    SELECT
        tablename AS resource_name,
        COUNT(*) AS policy_count,
        string_agg(DISTINCT cmd, ', ' ORDER BY cmd) AS policy_ops
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
)
SELECT
    t.resource_name,
    t.resource_type,
    t.sensitivity,
    r.actual_type,
    CASE
        WHEN r.resource_name IS NULL THEN 'MISSING'
        WHEN t.resource_type = 'table' AND COALESCE(r.rls_enabled, false) = false THEN 'NO_RLS'
        WHEN t.resource_type = 'table' AND COALESCE(p.policy_count, 0) = 0 THEN 'NO_POLICIES'
        ELSE 'OK'
    END AS status,
    COALESCE(r.rls_enabled, false) AS rls_enabled,
    COALESCE(p.policy_count, 0) AS policy_count,
    COALESCE(p.policy_ops, '') AS policy_ops
FROM audit_touched_tables t
LEFT JOIN rels r ON r.resource_name = t.resource_name
LEFT JOIN policies p ON p.resource_name = t.resource_name
ORDER BY
    CASE
        WHEN r.resource_name IS NULL THEN 0
        WHEN t.resource_type = 'table' AND COALESCE(r.rls_enabled, false) = false THEN 1
        WHEN t.resource_type = 'table' AND COALESCE(p.policy_count, 0) = 0 THEN 2
        ELSE 3
    END,
    t.resource_name;

WITH funcs AS (
    SELECT
        p.oid,
        p.proname AS resource_name,
        p.prosecdef AS security_definer,
        pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
),
rpc_report AS (
    SELECT
        r.resource_name,
        r.sensitivity,
        f.args,
        f.security_definer,
        CASE
            WHEN f.resource_name IS NULL THEN 'MISSING'
            WHEN r.expected_authenticated_execute AND NOT has_function_privilege('authenticated', f.oid, 'EXECUTE') THEN 'NO_AUTH_EXECUTE'
            WHEN r.expected_service_role_execute AND NOT has_function_privilege('service_role', f.oid, 'EXECUTE') THEN 'NO_SERVICE_EXECUTE'
            ELSE 'OK'
        END AS status,
        COALESCE(has_function_privilege('authenticated', f.oid, 'EXECUTE'), false) AS authenticated_can_execute,
        COALESCE(has_function_privilege('service_role', f.oid, 'EXECUTE'), false) AS service_role_can_execute
    FROM audit_touched_rpcs r
    LEFT JOIN funcs f ON f.resource_name = r.resource_name
)
SELECT
    resource_name,
    sensitivity,
    COALESCE(args, '') AS args,
    COALESCE(security_definer, false) AS security_definer,
    status,
    authenticated_can_execute,
    service_role_can_execute
FROM rpc_report
ORDER BY
    CASE status WHEN 'MISSING' THEN 0 WHEN 'NO_AUTH_EXECUTE' THEN 1 WHEN 'NO_SERVICE_EXECUTE' THEN 2 ELSE 3 END,
    resource_name;

WITH table_report AS (
    WITH rels AS (
        SELECT
            c.relname AS resource_name,
            CASE c.relkind
                WHEN 'r' THEN 'table'
                WHEN 'v' THEN 'view'
                WHEN 'm' THEN 'materialized view'
                ELSE c.relkind::text
            END AS actual_type,
            c.relrowsecurity AS rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v', 'm')
    ),
    policies AS (
        SELECT tablename AS resource_name, COUNT(*) AS policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
    )
    SELECT
        t.resource_name,
        CASE
            WHEN r.resource_name IS NULL THEN 'MISSING'
            WHEN t.resource_type = 'table' AND COALESCE(r.rls_enabled, false) = false THEN 'NO_RLS'
            WHEN t.resource_type = 'table' AND COALESCE(p.policy_count, 0) = 0 THEN 'NO_POLICIES'
            ELSE 'OK'
        END AS status,
        'table/view coverage' AS source
    FROM audit_touched_tables t
    LEFT JOIN rels r ON r.resource_name = t.resource_name
    LEFT JOIN policies p ON p.resource_name = t.resource_name AND t.resource_type = 'table'
),
rpc_report AS (
    WITH funcs AS (
        SELECT p.oid, p.proname AS resource_name
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    )
    SELECT
        r.resource_name,
        CASE
            WHEN f.resource_name IS NULL THEN 'MISSING'
            WHEN r.expected_authenticated_execute AND NOT has_function_privilege('authenticated', f.oid, 'EXECUTE') THEN 'NO_AUTH_EXECUTE'
            WHEN r.expected_service_role_execute AND NOT has_function_privilege('service_role', f.oid, 'EXECUTE') THEN 'NO_SERVICE_EXECUTE'
            ELSE 'OK'
        END AS status,
        'rpc coverage' AS source
    FROM audit_touched_rpcs r
    LEFT JOIN funcs f ON f.resource_name = r.resource_name
)
SELECT source, resource_name, status
FROM (
    SELECT * FROM table_report
    UNION ALL
    SELECT * FROM rpc_report
) all_report
WHERE status <> 'OK'
ORDER BY source, resource_name;

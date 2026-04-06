# Supabase Security Policy Matrix (P0-2)

Purpose: document the app's touched Supabase tables and RPCs, the intended allow/deny model, and the repo evidence backing each rule.

Scope notes:
- This matrix covers tables, views, and RPCs touched by application code under `src/`.
- Storage buckets (`avatars`, `attachments`, `identity-documents`) are intentionally excluded from this artifact because P0-2 is about DB table/RPC authorization proof.
- Status values:
  - `covered`: repo contains clear policy/function evidence for the resource.
  - `partial`: resource is covered mostly from baseline/schema artifacts, but not from newer hardening migrations or dedicated proof scripts.
  - `gap`: application touches the resource, but the repo does not currently contain enough schema/policy evidence.

Actor legend:
- `anon`: unauthenticated browser user.
- `owner`: authenticated user acting on their own row.
- `party`: authenticated user who is one side of a contract/conversation/proposal relationship.
- `other auth user`: authenticated user with no ownership/party relationship.
- `admin`: authenticated user with `profiles.is_admin = true`.
- `service/definer`: server-side or `SECURITY DEFINER` execution path.

## Current hard gaps

No unresolved repo-local table/RPC proof gaps remain after the current migration set.

Remaining work is execution proof:
- run the verification SQL against the real Supabase database
- fix anything the database reports as missing/drifted from repo state

## Tables and views

| Resource | Sensitivity | Allowed actions | Deny expectations | Admin exception | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `category_job_counts` (view) | Low | Read-only aggregate used for public job counts | No writes expected | None documented | `supabase/migrations/20260401020000_category_job_counts.sql` | partial |
| `connects_transactions` | Medium | Freelancer reads own rows; connects RPC path writes rows tied to the same freelancer id | Other users must not read another freelancer's ledger | No explicit admin policy found | `supabase/migrations/20260327010000_connects_system.sql` | covered |
| `contracts` | Critical | Contract parties read/update; client inserts own contract; admin all via admin policy | Other auth users and anon must not read or mutate unrelated contracts | `admin_all_contracts` | `supabase/schema_v2.sql`, `supabase/migrations/20260329020000_fix_rls_recursion.sql`, `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql` | covered |
| `conversations` | High | Participants read/insert/update their own conversation threads | Other users must not read or update foreign conversations | None documented | `supabase/migrations/20260327020000_create_conversations.sql` | covered |
| `disputes` | Critical | Contract parties read their own disputes; contract parties insert only for their contract; admins update/resolve | Non-parties must not read/open disputes; non-admins must not resolve | Admin read/update policy and `resolve_dispute` RPC | `supabase/migrations/20260328020000_disputes_system.sql`, `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `favorites` | Low | User reads/manages own favorites | Other users must not read or modify another user's saved entities | No explicit admin policy found | `supabase/schema_v2.sql` | partial |
| `freelancer_profiles` | High | Public read; owner insert/update own profile; admin all | Other users must not mutate another freelancer profile | `admin_all_freelancer_profiles` | `supabase/schema_v2.sql`, `supabase/FIX_FREELANCER_PROFILES.sql`, `supabase/FIX_PROFILE_UPDATES.sql`, `supabase/migrations/20260402020000_fix_admin_verification_revoke.sql` | covered |
| `identity_verifications` | Critical | Owner read/insert own verification; owner delete pending own request; admin all | Other users must not read or delete another user's verification; non-admins must not review or revoke | Admin all policy and admin RPCs | `supabase/migrations/20260326100000_create_identity_verifications.sql`, `supabase/migrations/20260329020000_fix_rls_recursion.sql`, `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `jobs` | High | `anon` and auth users read public/open jobs; client reads own jobs and inserts/updates/deletes own jobs; admin all | Other auth users must not mutate another client's jobs | `admin_all_jobs` | `supabase/schema_v2.sql`, `supabase/migrations/20260325150000_fix_jobs_rls.sql`, `supabase/migrations/20260329020000_fix_rls_recursion.sql` | covered |
| `messages` | Critical | Sender/receiver read; sender inserts own message; receiver updates read state; sender-only delete via atomic RPC | Other users must not read or delete messages outside the conversation | No direct admin path documented | `supabase/schema_v2.sql`, `supabase/SECURITY_FIX.sql`, `supabase/migrations/20260404120004_soft_delete_messages_part5.sql` | covered |
| `milestones` | High | Contract parties read/update; client of contract inserts | Other users must not read or mutate milestones for unrelated contracts | No explicit admin policy found in hardening migrations | `supabase/schema_v2.sql` | partial |
| `notification_settings` | Medium | Owner-only read/insert/update/delete from settings UI | Other users must not read or mutate another user's notification preferences | No explicit admin policy found | `supabase/migrations/20260406050000_create_notification_settings.sql` | covered |
| `notifications` | High | Owner read/update/delete; owner can insert own rows; `create_notification` RPC can target self or admin-targeted users; admin all | Other users must not read/update/delete another user's notifications; non-admins must not create cross-user notifications | `admin_all_notifications` | `supabase/migrations/20260331100000_create_notifications.sql`, `supabase/migrations/20260401010000_fix_notifications_rls.sql`, `supabase/migrations/20260403000000_fix_notifications_insert_policy.sql`, `supabase/migrations/20260403090000_add_delete_notification_rls.sql`, `supabase/migrations/20260402020000_fix_admin_verification_revoke.sql`, `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `payment_methods` | Critical | Owner manages own payment methods | Other users must not read or mutate another user's payout methods | No explicit admin policy found | `supabase/schema_v2.sql`, `supabase/SECURITY_FIX.sql` | partial |
| `portfolio_items` | Low | Public read; freelancer manages own portfolio items | Other users must not mutate another freelancer's portfolio | No explicit admin policy found | `supabase/schema_v2.sql` | partial |
| `profiles` | Critical | Public read; owner insert/update own profile; trigger strips non-admin edits to admin-only fields; admin all | Other users must not mutate another profile; non-admin updates must not change `is_admin`, `cin_verified`, or `account_status` | `admin_all_profiles` plus trigger guard | `supabase/schema_v2.sql`, `supabase/migrations/20260326010000_fix_profiles_rls.sql`, `supabase/migrations/20260329020000_fix_rls_recursion.sql`, `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `proposals` | Critical | Freelancer inserts own proposal; freelancer or job owner reads/updates; freelancer deletes pending own; admin all | Other auth users must not read/hire/update proposals on jobs they do not own and did not submit | `admin_all_proposals` | `supabase/schema_v2.sql`, `supabase/migrations/20260325150000_fix_jobs_rls.sql`, `supabase/migrations/20260329020000_fix_rls_recursion.sql`, `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql` | covered |
| `reports` | Critical | Reporter inserts own report; admins read/update all | Non-admins must not read the moderation queue; reporter cannot self-report user rows | Admin select/update policies | `supabase/migrations/20260331000000_create_reports.sql`, `supabase/migrations/20260401000000_add_reports_rate_limit.sql`, `supabase/migrations/20260402000000_harden_reports_insert_policy.sql` | covered |
| `reviews` | Medium | Public reads public reviews; reviewer/reviewee read own related rows; contract party inserts after completed contract | Non-parties must not see private review rows; users must not review outside completed contracts | No explicit admin policy found | `supabase/schema_v2.sql` | partial |
| `transactions` | Critical | Owner reads own transactions; owner insert path exists in baseline; payment flows update through approved paths; admin select all | Other users must not read another user's transactions | Admin select policy exists; RPC coverage for one escrow path is missing in repo | `supabase/schema_v2.sql`, `supabase/SECURITY_FIX.sql`, `supabase/migrations/20260329010000_admin_dashboard_fixes.sql` | partial |
| `wallets` | Critical | Owner reads/inserts/updates own wallet; delete blocked; admin all | Other users must not read or mutate another user's wallet | `admin_all_wallets` | `supabase/schema_v2.sql`, `supabase/migrations/20260325120000_fix_wallets_rls.sql`, `supabase/migrations/20260329020000_fix_rls_recursion.sql`, `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql` | covered |
| `withdrawals` | Critical | Owner reads own withdrawals and requests own withdrawal; atomic RPC enforces wallet ownership, min amount, and balance | Other users must not read or request withdrawals from another user's wallet | Admin select policy exists in older security artifact only | `supabase/schema_v2.sql`, `supabase/migrations/20260328010000_add_withdrawal_min_constraint.sql`, `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql`, `supabase/SECURITY_FIX.sql` | covered |

## RPCs

| RPC | Sensitivity | Intended caller rule | Deny expectation | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| `complete_escrow_payment` | Critical | Service role, admin, or contract client can complete escrow funding for the contract's transaction; function is idempotent | Unrelated authenticated user and wrong contract actor must receive denial | `supabase/migrations/20260406060000_restore_complete_escrow_payment_rpc.sql`, `src/services/payments.ts`, `supabase/functions/flouci-verify-payment/index.ts`, `supabase/functions/reconcile-payment/index.ts` | covered |
| `create_notification` | High | Authenticated user may create notifications for self; admin may create for others; service role may execute | Non-admin authenticated user must not create notifications for another user | `supabase/migrations/20260403040000_create_notification_rpc.sql`, `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `delete_message_atomic` | High | Sender deletes only own message | Non-sender must receive denial | `supabase/migrations/20260404120004_soft_delete_messages_part5.sql` | covered |
| `get_client_stats_v2` | Medium | Aggregate stats helper for profile views | Should not expose unauthorized raw rows; function evidence exists | `supabase/migrations/20260401040000_get_client_stats.sql` | covered |
| `get_or_create_conversation` | High | Participants create/reuse only their conversation thread | Other users must not create foreign conversation pairings in a way that bypasses RLS expectations | `supabase/migrations/20260327020000_create_conversations.sql` | covered |
| `get_total_unread_count` | Medium | Owner-only unread aggregate | Other users must not obtain another user's unread totals | `supabase/migrations/20260401050000_get_total_unread_count.sql` | covered |
| `hire_proposal_atomic` | Critical | Only the job owner may hire the proposal; function handles contract/job/proposal state atomically | Any non-owner must receive denial | `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql` | covered |
| `mark_conversation_read` | Medium | Participant marks own conversation/messages read | Non-participant must not reset another user's unread state | `supabase/migrations/20260327020000_create_conversations.sql` | covered |
| `open_dispute_atomic` | Critical | Only contract parties may open disputes on their contract | Non-party must receive denial | `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `refund_connects_for_proposal` | Medium | Controlled system path for returning connects | Arbitrary user should not be able to refund another freelancer outside approved flow | `supabase/migrations/20260327010000_connects_system.sql` | covered |
| `release_contract_payment_atomic` | Critical | Only the client on the contract may release payment | Freelancer or unrelated user must receive denial | `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql` | covered |
| `request_withdrawal_atomic` | Critical | Only wallet owner may request a withdrawal from that wallet | Foreign wallet caller must receive denial | `supabase/migrations/20260403110000_atomic_contract_and_withdrawal_rpcs.sql` | covered |
| `resolve_dispute` | Critical | Admin-only dispute resolution path | Non-admin must receive denial | `supabase/migrations/20260328020000_disputes_system.sql` | covered |
| `revoke_verification_status` | Critical | Admin-only verification revoke path | Non-admin must receive denial | `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `set_user_account_status` | Critical | Admin-only suspend/archive/reactivate path | Non-admin must receive denial | `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |
| `set_user_type_rpc` | High | Authenticated caller may only mutate own profile and own derived freelancer profile row | Caller must not be able to target another user | `supabase/migrations/20260326010000_fix_profiles_rls.sql` | covered |
| `spend_connects_for_proposal` | Medium | Controlled proposal-submission path for the same freelancer | Other users must not charge another freelancer's balance | `supabase/migrations/20260327010000_connects_system.sql` | covered |
| `update_verification_status` | Critical | Admin-only verification review path | Non-admin must receive denial | `supabase/migrations/20260403100000_update_verification_status_rpc.sql`, `supabase/migrations/20260405123000_harden_platform_controls.sql` | covered |

## Required verification steps

Run these repo-local SQL artifacts against the target Supabase database:

1. `supabase/VERIFY_TOUCHED_RESOURCES.sql`
   - Confirms touched tables/views/functions exist.
   - Confirms touched tables have RLS and at least one policy.
   - Confirms touched RPCs exist and are executable by the expected roles.

2. `supabase/VERIFY_NEGATIVE_AUTHZ_TESTS.sql`
   - Runs deny-path checks for high-risk cross-user/admin-only flows.
   - Safe by design: starts a transaction and ends with `ROLLBACK`.

Release rule for P0-2:
- No touched table/view may remain in `gap` state.
- No touched admin/money/identity/messaging RPC may remain in `gap` state.
- Coverage query must report no missing touched table/view/function and no touched table without RLS.
- Negative authz SQL pack must complete without assertion failure.

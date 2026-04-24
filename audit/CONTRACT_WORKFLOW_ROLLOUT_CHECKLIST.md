# Contract Workflow Rollout Checklist

## Purpose

This document defines the safest rollout order for the contract workflow security hardening.

Use it when applying the contract workflow migrations to staging or production.

## Pre-Deploy Rules

1. Stop local admin/manual SQL experimentation against production while rollout is in progress.
2. Prefer applying one migration at a time for live systems.
3. Keep the app closed or traffic minimized when applying enum/storage/policy changes.
4. Verify each migration before moving to the next.
5. If a migration had to be applied manually in chunks, record that in release notes.

## Recommended Apply Order

Apply in this order:

1. `20260419152000_harden_pending_payment_job_state.sql`
2. `20260419165000_enforce_contract_chat_safety_on_messages.sql`
3. `20260419173000_limit_contract_revision_loops.sql`
4. `20260419181000_preserve_contract_evidence_messages.sql`
5. `20260419190000_add_contract_timeout_tracking.sql`
6. `20260419200000_lock_funded_contract_terms_and_add_change_requests.sql`
7. `20260419213000_add_dispute_evidence_snapshot.sql`
8. `20260419223000_add_contract_review_timeout_processing.sql`
9. `20260419233000_secure_message_attachments_bucket.sql`
10. `20260420000000_add_contract_risk_guardrails.sql`
11. `20260420013000_add_review_trust_weighting.sql`
12. `20260420030000_harden_message_attachments_and_chat_safety.sql`

## Special Notes Per Migration

### 1. Pending Payment Job State

Migration:
- `20260419152000_harden_pending_payment_job_state.sql`

Notes:
- if `job_status_enum` does not yet contain `matched`, add it first in a separate execution
- then run the rest of the migration/function updates

Verify:
- new hires create `pending_payment` contracts
- jobs show `matched` until funding completes

### 2. Contract Chat Safety Trigger

Migration:
- `20260419165000_enforce_contract_chat_safety_on_messages.sql`

Verify:
- contract chat blocks off-platform payment/contact messages at DB level

### 3. Revision Loop Limit

Migration:
- `20260419173000_limit_contract_revision_loops.sql`

Verify:
- `contracts.revision_requests_count` exists
- `contracts.max_revision_rounds` exists
- revision requests stop at cap

### 4. Evidence Message Preservation

Migration:
- `20260419181000_preserve_contract_evidence_messages.sql`

Verify:
- delivery/dispute/completion system messages cannot be deleted

### 5. Timeout Tracking Columns

Migration:
- `20260419190000_add_contract_timeout_tracking.sql`

Verify:
- funded, delivery, review, and revision timestamps populate correctly

### 6. Funded Contract Locks / Change Requests

Migration:
- `20260419200000_lock_funded_contract_terms_and_add_change_requests.sql`

Notes:
- if the live DB is busy, apply in smaller chunks to avoid deadlocks

Verify:
- funded contract terms cannot be edited directly
- `contract_change_requests` table exists

### 7. Dispute Evidence Snapshot

Migration:
- `20260419213000_add_dispute_evidence_snapshot.sql`

Notes:
- if legacy contract columns are missing, use the schema-tolerant function version already prepared in repo history/workspace

Verify:
- new disputes capture `evidence_snapshot`, `evidence_timeline`, `evidence_captured_at`

### 8. Review Timeout Processing

Migration:
- `20260419223000_add_contract_review_timeout_processing.sql`

Verify:
- `get_contract_review_timeout_candidates()` returns expected records
- `process_contract_review_timeouts()` sends notifications only once

### 9. Message Attachments Bucket Security

Migration:
- `20260419233000_secure_message_attachments_bucket.sql`

Verify:
- bucket exists with expected MIME whitelist and size limit

### 10. Contract Risk Guardrails

Migration:
- `20260420000000_add_contract_risk_guardrails.sql`

Verify:
- high-risk contract creation is blocked for fresh/unverified combinations
- `contracts.risk_level` and `contracts.risk_flags` populate

### 11. Review Trust Weighting

Migration:
- `20260420013000_add_review_trust_weighting.sql`

Verify:
- new reviews store `trust_weight` and `integrity_flags`
- weighted stats are reflected in app surfaces

### 12. Final Attachment/Chat Hardening

Migration:
- `20260420030000_harden_message_attachments_and_chat_safety.sql`

Verify:
- attachment reads are limited to conversation participants/admins
- chat safety trigger applies on insert and content update

## Post-Deploy Smoke Checks

Run after all migrations:

1. Hire proposal
2. Fund escrow
3. Submit delivery
4. Request revision
5. Re-deliver
6. Accept and release payment
7. Submit both reviews
8. Open dispute on a fresh active contract
9. Delete a normal message
10. Try deleting a protected contract evidence message
11. Try sending WhatsApp/off-platform payment text in contract chat
12. Try uploading a mismatched fake attachment

## Required RPC Checks

Verify these all exist and execute:

1. `hire_proposal_atomic`
2. `complete_escrow_payment`
3. `submit_contract_delivery_atomic`
4. `request_contract_revision_atomic`
5. `release_contract_payment_atomic`
6. `open_dispute_atomic`
7. `submit_contract_change_request_atomic`
8. `get_contract_review_timeout_candidates`
9. `process_contract_review_timeouts`
10. `submit_review_atomic`

## Scheduler Follow-Up

Not mandatory for schema rollout, but required for full timeout automation:

1. Schedule `process_contract_review_timeouts(50)` via cron/job runner
2. Run at least hourly
3. Log processed counts and alert on repeated failures

## Rollback Guidance

If something fails mid-rollout:

1. stop applying further migrations
2. validate schema cache reload state
3. test only the already-applied workflow pieces
4. do not manually remove columns/functions unless rollback was pre-planned
5. prefer forward-fix migrations over destructive rollback on live data

## Production Sign-Off

Do not sign off until:

1. all migrations are applied successfully
2. smoke checks pass
3. admin overview shows risk/timeout/dispute evidence panels correctly
4. review stats still render normally
5. contract chat/send flow still works for safe traffic
6. staged QA from `audit/CONTRACT_WORKFLOW_SECURITY_QA.md` passes

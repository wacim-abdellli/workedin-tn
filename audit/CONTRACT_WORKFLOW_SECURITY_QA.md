# Contract Workflow Security QA

## Purpose

This document is the verification playbook for the client/freelancer contract workflow.

Use it before production rollout, after major workflow migrations, and after any change touching:

- contracts
- payments
- disputes
- reviews
- messages
- message attachments
- admin moderation tooling

## Covered Protections

The current workflow hardening includes:

1. Shared contract state-machine rules
2. Role/action gating for client and freelancer actions
3. Atomic contract workflow RPCs
4. Funded-before-active enforcement
5. Pending-payment job state isolation
6. Off-platform scam blocking in contract chat
7. Server-side contract chat safety enforcement
8. Revision loop limits
9. Protected evidence message deletion rules
10. Delivery/review timeout tracking
11. Funded contract term locking
12. Formal contract change request foundation
13. Structured dispute evidence capture
14. Review timeout processing foundation
15. Message attachment security hardening
16. Contract trust/risk guardrails
17. Admin risk/ops watchboard
18. Review trust-weighting

## Test Roles

Prepare at least these accounts:

1. Verified client with prior completed contracts
2. Verified freelancer with prior completed contracts
3. New unverified client
4. New unverified freelancer
5. Admin account
6. Suspended account for negative checks

## Core Workflow Matrix

### A. Contract Creation And Funding

1. Verified client hires verified freelancer on low-value job
Expected:
- contract created successfully
- status starts as `pending_payment`
- job becomes `matched`, not `in_progress`

2. Escrow payment completes for pending-payment contract
Expected:
- contract becomes `active`
- `funded_at` is written
- job becomes `in_progress`

3. New unverified client tries to create high-value contract
Expected:
- contract creation blocked
- user sees risk/verification message
- no contract row inserted

4. Two very new accounts attempt medium/high-value contract
Expected:
- creation blocked by risk guardrails

5. Direct fallback contract creation path
Expected:
- still defaults to `pending_payment`
- still respects DB risk trigger

### B. Delivery And Review Flow

1. Freelancer delivers while contract is `active`
Expected:
- no immediate completion
- `delivery_note` recorded
- `delivery_submitted_at` recorded
- `review_due_at` recorded
- contract remains reviewable

2. Freelancer re-delivers after `revision_requested`
Expected:
- contract returns to `active`
- new delivery timestamps update

3. Client tries to accept before delivery exists
Expected:
- blocked in UI
- blocked in DB if bypassed

4. Client accepts after delivery exists
Expected:
- payment release RPC succeeds
- contract becomes `completed`
- `review_due_at` cleared

5. Client requests changes before delivery exists
Expected:
- blocked in UI
- blocked in DB if bypassed

### C. Revision Abuse Protection

1. Client requests changes within allowed rounds
Expected:
- status becomes `revision_requested`
- `revision_requests_count` increments
- `revision_requested_at` recorded

2. Client exceeds revision limit
Expected:
- request blocked in UI
- request blocked in DB
- no state change

3. Sidebar revision allowance display
Expected:
- remaining rounds shown accurately
- request button disabled at limit

### D. Dispute Integrity

1. Client opens dispute from active contract
Expected:
- contract becomes `disputed`
- one open dispute row inserted
- `evidence_snapshot` populated
- `evidence_timeline` populated
- `evidence_captured_at` populated

2. Duplicate dispute attempt on same contract
Expected:
- existing dispute returned
- no second open dispute created

3. Dispute from completed/cancelled contract
Expected:
- blocked

4. Admin dispute list
Expected:
- evidence captured badge visible
- milestone and evidence counts visible

### E. Evidence Preservation

1. Sender deletes normal non-contract message
Expected:
- soft delete still allowed

2. Sender deletes `[[delivery]]` message
Expected:
- blocked in UI affordance
- blocked in DB

3. Sender deletes contract attachment message after dispute/completion
Expected:
- blocked in DB

### F. Contract Term Locking

1. Update amount/title/description before funding
Expected:
- allowed if workflow still pre-funding and valid

2. Update amount/title/description after funding or active work
Expected:
- blocked in DB
- error instructs formal change request

3. Submit formal change request after funding
Expected:
- one pending request created
- duplicate pending request blocked

### G. Contract Chat Safety

1. Send WhatsApp/Telegram/email/phone in contract chat
Expected:
- blocked in UI
- blocked at DB insert if bypassed

2. Send off-platform payment language in contract chat
Expected:
- blocked in UI
- blocked in DB insert if bypassed

3. Send normal project communication
Expected:
- allowed

### H. Attachment Security

1. Upload normal pdf/doc/image/audio/video allowed by policy
Expected:
- passes

2. Upload blocked extension like `.exe`, `.js`, `.bat`
Expected:
- blocked before upload

3. Upload file with fake MIME/extension mismatch
Expected:
- blocked by payload signature validation

4. Upload oversized file
Expected:
- rejected with clear message

### I. Timeout Processing

1. Active delivered contract due within 24h and not yet reminded
Expected:
- candidate appears in timeout query as `reminder`

2. Active delivered contract past `review_due_at` and not yet notified
Expected:
- candidate appears as `overdue`

3. Run timeout processor once
Expected:
- notifications created
- `review_reminder_sent_at` or `review_overdue_notified_at` set

4. Run timeout processor again
Expected:
- no duplicate reminder spam

5. Admin watchboard
Expected:
- overdue reviews appear in overview/jobs surfaces

### J. Review Integrity

1. Completed contract review by legitimate party
Expected:
- review inserted
- trust metadata recorded

2. Second review by same reviewer on same contract
Expected:
- blocked

3. Review on non-completed contract
Expected:
- blocked

4. Weighted stats
Expected:
- reputation stats use `trust_weight`
- low-trust reviews reduce influence, not eligibility

## Negative Security Checks

Run these directly against DB/API where possible, not just UI:

1. Insert contract as `active` without funding
Expected: blocked by workflow/risk rules or corrected path not used

2. Force contract term update after funding
Expected: blocked by trigger

3. Insert scam contract chat message directly into `messages`
Expected: blocked by trigger

4. Delete protected evidence message through RPC
Expected: blocked

5. Request revision after max rounds reached via RPC
Expected: blocked

6. Release payment without delivery via RPC
Expected: blocked

## Production Rollout Checklist

1. Apply migrations in dependency order
2. Refresh PostgREST schema cache where required
3. Verify RPC grants after each migration
4. Re-test one full happy path:
client -> fund -> freelancer deliver -> client accept -> both review
5. Re-test one dispute path:
fund -> deliver -> request changes -> re-deliver -> dispute
6. Re-test one risk-blocked path with new/unverified accounts
7. Re-test contract chat scam blocking in UI and DB
8. Re-test attachment validation with safe and unsafe payloads
9. Re-test timeout processor dry run and single execution
10. Re-test admin watchboard data population

## Required Manual SQL/RPC Smoke Checks

1. `hire_proposal_atomic`
2. `complete_escrow_payment`
3. `submit_contract_delivery_atomic`
4. `request_contract_revision_atomic`
5. `release_contract_payment_atomic`
6. `open_dispute_atomic`
7. `submit_contract_change_request_atomic`
8. `process_contract_review_timeouts`
9. `submit_review_atomic`

## Sign-Off Criteria

Do not consider this workflow production-safe until all are true:

1. No invalid state transitions found
2. No direct-write bypasses found for protected actions
3. Scam contract chat messages blocked in UI and DB
4. Evidence deletion protections verified
5. Risk guardrails verified on high-risk account combinations
6. Timeout processing verified to be idempotent
7. Review weighting verified in visible reputation surfaces
8. Admin surfaces show dispute/risk/timeout signals correctly

## Next Enhancements

These are optional advanced follow-ups, not missing foundations:

1. External malware scanning integration
2. Richer moderator evidence viewer
3. Scheduled cron wiring for timeout processor
4. More advanced fraud scoring dashboards

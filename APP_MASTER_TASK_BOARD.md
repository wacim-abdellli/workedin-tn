# Khedma TN App Master Task Board

Date: 2026-04-09
Purpose: Convert the current app status into an execution-ready task board.

## How To Use This Board

- `Must do now` = launch blockers or near-blockers
- `Before launch` = should be done before public release
- `Can wait until after launch` = important, but not launch-blocking
- `Paused external` = not a coding task right now, depends on outside credentials, providers, or business setup

---

## Must Do Now

### Payment Strategy

- [ ] Decide the immediate payment path for launch
  - Option A: Finish Flouci and keep Khedma's internal payment architecture
  - Option B: Add Dhmad as a fallback external escrow mode
  - Owner: Product/CEO
  - Status: Open

- [ ] Timebox the Flouci decision
  - Set a short deadline (48-72 hours) to obtain real production credentials
  - If not resolved, move to Dhmad fallback mode
  - Owner: Product/CEO
  - Status: Open

### Flouci Enablement (Primary Path)

- [ ] Obtain real `FLOUCI_APP_TOKEN`
  - Owner: Business/Ops
  - Status: Blocked externally

- [ ] Obtain real `FLOUCI_APP_SECRET`
  - Owner: Business/Ops
  - Status: Blocked externally

- [ ] Set Flouci secrets in the live Supabase project
  - Command:
  ```powershell
  npx -y supabase secrets set FLOUCI_APP_TOKEN=... FLOUCI_APP_SECRET=...
  ```
  - Owner: Ops
  - Status: Pending

- [ ] Redeploy payment Edge Functions
  - Commands:
  ```powershell
  npx -y supabase functions deploy flouci-initiate-payment
  npx -y supabase functions deploy flouci-verify-payment
  ```
  - Owner: Ops
  - Status: Pending

- [ ] Run final live payment-initiation smoke
  - Goal: prove payment initiation works live without JWT/config failure
  - Owner: QA/Ops
  - Status: Pending

### Dhmad Fallback (Only if Flouci is still blocked)

- [ ] Decide whether to launch with Dhmad as external escrow fallback
  - This is a product/business decision, not just code
  - Owner: Product/CEO
  - Status: Open

- [ ] If Dhmad fallback is chosen, define MVP scope
  - Redirect users to Dhmad
  - Store external reference and status in Khedma
  - Do not pretend Khedma is holding/releasing the money internally
  - Owner: Product + Engineering
  - Status: Open

- [ ] If Dhmad fallback is chosen, specify manual admin reconciliation flow
  - funded externally
  - released externally
  - refunded externally
  - disputed externally
  - Owner: Product/Ops
  - Status: Open

### Frontend / Live State

- [ ] Confirm latest frontend is deployed
  - Includes:
    - wallet deposit fix
    - contract release cleanup
    - payment-method/settings fixes
  - Owner: Ops
  - Status: Pending

- [ ] Run a final critical smoke pack on the deployed app
  - login
  - client dashboard
  - freelancer dashboard
  - settings payment methods
  - secure-upload
  - payment initiation
  - Owner: QA/Ops
  - Status: Pending

### Email Scope

- [ ] Decide the email lane now
  - Option A: finish Resend/domain setup before launch
  - Option B: explicitly remove email from launch scope for now
  - Owner: Product/CEO
  - Status: Open

---

## Before Launch

### Product / Business Readiness

- [ ] Freeze the launch payment model
  - One clear source of truth for how money moves
  - One clear explanation to users
  - Owner: Product/CEO
  - Status: Pending

- [ ] Make payment UX honest
  - Do not imply automatic in-app escrow if using external/manual mode
  - Explain provider responsibilities clearly
  - Owner: Product + Design
  - Status: Pending

- [ ] Confirm dispute ownership
  - If Flouci path: Khedma dispute/release model remains primary
  - If Dhmad path: Dhmad's dispute model must be explained
  - Owner: Product/Legal
  - Status: Pending

### Admin / Ops Readiness

- [ ] Confirm admin can review key launch flows
  - verifications
  - disputes
  - payments
  - external/manual reconciliations if needed
  - Owner: Ops/Admin
  - Status: Pending

- [ ] Create a release checklist
  - frontend deploy
  - function deploy
  - migration check
  - smoke tests
  - rollback path
  - Owner: Ops
  - Status: Pending

- [ ] Create a secrets inventory
  - Supabase
  - Vercel
  - payment provider
  - email provider
  - Owner: Ops
  - Status: Pending

- [ ] Write a launch-day rollback checklist
  - Owner: Ops
  - Status: Pending

### Legal / Trust Clarity

- [ ] Confirm terms/privacy/payment wording matches the real launch model
  - especially around escrow, disputes, and who holds funds
  - Owner: Product/Legal
  - Status: Pending

- [ ] Confirm user-facing help/FAQ copy for payments
  - funding
  - release
  - refund/dispute
  - withdrawal/payout
  - Owner: Product/Content
  - Status: Pending

### Verification

- [ ] Run one full pre-launch verification pass
  - auth
  - roles/workspaces
  - proposals
  - contracts
  - uploads
  - payments
  - admin checks
  - Owner: QA/Ops
  - Status: Pending

---

## Can Wait Until After Launch

### Engineering / Quality

- [ ] Expand automated regression coverage for more long-tail flows
  - Owner: Engineering
  - Status: Later

- [ ] Improve performance profiling and optimization
  - Owner: Engineering
  - Status: Later

- [ ] Improve accessibility audit depth
  - Owner: Engineering/Design
  - Status: Later

- [ ] Continue selective repo cleanup only when it has real value
  - Owner: Engineering
  - Status: Later

### Observability / Operations

- [ ] Improve monitoring dashboards
  - frontend errors
  - Edge Function failures
  - payment failures
  - upload failures
  - Owner: Ops/Engineering
  - Status: Later

- [ ] Improve alerting and incident handling
  - Owner: Ops
  - Status: Later

- [ ] Create richer post-launch runbooks
  - Owner: Ops
  - Status: Later

### Product / Growth

- [ ] Improve onboarding conversion
  - Owner: Product
  - Status: Later

- [ ] Improve trust signals
  - verified badges
  - payment explanation
  - contract clarity
  - Owner: Product/Design
  - Status: Later

- [ ] Add analytics/reporting for marketplace health
  - Owner: Product/Ops
  - Status: Later

---

## Paused External

- [ ] Resend sender-domain setup
  - Owner: Business/Ops
  - Status: Paused externally

- [ ] Dhmad partner/API discovery
  - Only relevant if deeper integration becomes a real strategic path
  - Owner: Business
  - Status: Paused externally

---

## Suggested Immediate Order

1. Decide Flouci vs Dhmad fallback for launch
2. If Flouci is still viable, obtain secrets and enable live payment initiation
3. Confirm latest frontend is live
4. Decide email scope
5. Run final smoke pack
6. Freeze launch scope

---

## Done Baseline

The following major areas are already materially improved and should not be reopened casually:

- Auth/session hardening
- RLS/RPC trust-boundary hardening
- Legacy JWT cleanup
- Secure-upload hardening and live verification
- Profile/wallet bootstrap repair
- Workspace/role routing fixes
- Job view counting fix
- Settings payment-method fix
- Wallet deposit repo fix
- Contract payment release client-gate cleanup
- Env/docs/test hygiene cleanup

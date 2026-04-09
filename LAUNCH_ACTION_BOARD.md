# Khedma TN Launch Action Board

Date: 2026-04-08

## Must Do Now

1. Deploy the latest frontend if the newest repo fixes are not live yet.
   Includes:
   - wallet deposit fix in `src/pages/Wallet.tsx`
   - contract release cleanup in `src/hooks/useContractState.ts`

2. Obtain the real Flouci production credentials.
   Required secrets:
   - `FLOUCI_APP_TOKEN`
   - `FLOUCI_APP_SECRET`

3. Set the Flouci secrets in the live Supabase project.
   Example:
   ```powershell
   npx -y supabase secrets set FLOUCI_APP_TOKEN=... FLOUCI_APP_SECRET=...
   ```

4. Redeploy the payment Edge Functions.
   ```powershell
   npx -y supabase functions deploy flouci-initiate-payment
   npx -y supabase functions deploy flouci-verify-payment
   ```

5. Run one final live payment-initiation smoke.
   Goal:
   - prove payment initiation no longer fails because of missing live secrets
   - confirm no JWT regression

## Before Launch

1. Decide the email lane clearly.
   Choose one:
   - finish Resend/domain setup and verify live email sending
   - or explicitly remove email from launch scope for now

2. Do one final launch-readiness pass across the most important live flows.
   Recommended minimum:
   - login
   - client dashboard
   - freelancer dashboard
   - settings payment method
   - secure-upload
   - payment initiation

3. Confirm deployment state matches repo state.
   Verify:
   - latest frontend is live
   - latest Supabase functions are live
   - latest migrations are applied

4. Freeze the remediation wave.
   After the remaining blockers are resolved:
   - stop broad cleanup
   - stop random audit loops
   - move to launch discipline and normal product iteration

## Can Wait Until After Launch

1. Broader observability maturity.
   Examples:
   - deeper alerting
   - better dashboards
   - richer incident runbooks

2. Wider end-to-end smoke coverage.
   Examples:
   - more role permutations
   - more onboarding permutations
   - more long-tail flow verification

3. Additional repo cleanup that is not tied to live blockers.
   Only do this later if it still provides real value.

4. Performance and accessibility hardening beyond the current critical baseline.
   Good to improve, but not the main blocker today.

5. Documentation refinement beyond current operational accuracy.
   Current docs are much better and good enough for this phase.

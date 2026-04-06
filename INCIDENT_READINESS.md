# Incident Readiness

This document is the P3-3 source of truth for incident severity, error taxonomy, alert routing, and rollback execution in `khedma-tn`.

## Severity Model

### S0 — Critical outage

Conditions:

- production unavailable for a large portion of users
- payment or auth flows broken globally
- data loss or security exposure in progress

Response target:

- acknowledge immediately
- begin rollback or containment within 10 minutes

### S1 — Major degradation

Conditions:

- critical journey broken for a meaningful subset of users
- severe latency or persistent 5xx errors
- payment/reconciliation instability without confirmed data loss

Response target:

- acknowledge within 15 minutes
- mitigation plan within 30 minutes

### S2 — Moderate issue

Conditions:

- non-core feature degraded
- dashboard, notifications, or messaging issues with viable workaround
- repeated CI/release-control failures that block release readiness

Response target:

- acknowledge within 1 business hour
- mitigation plan same day

### S3 — Minor issue

Conditions:

- cosmetic or low-risk defect
- isolated operational warning without user-facing impact

Response target:

- triage in backlog

## Error Taxonomy

Use these categories when logging, triaging, creating incidents, or writing postmortems.

| Category | Typical source | Default severity | Primary owner |
| --- | --- | --- | --- |
| `auth_session` | Supabase auth/session refresh, sign-in/out, OTP | S1 | Engineering owner |
| `authorization_policy` | RLS failures, RPC permission denials, route guard bypass risk | S0-S1 | Security owner |
| `input_validation` | Upload validation, sanitization rejection, schema validation | S2 | Engineering owner |
| `payment_provider` | Flouci callback, escrow completion, withdrawal/reconcile failures | S0-S1 | Engineering + product owner |
| `realtime_transport` | message delivery, websocket/realtime subscription failures | S2 | Engineering owner |
| `deployment_config` | headers, env vars, release-control, preview/prod drift | S1 | Engineering owner |
| `dependency_supply_chain` | dependency audit failure, vulnerable transitive package | S1 | Security owner |
| `observability` | Sentry misconfiguration, missing alerts, logging blind spots | S1-S2 | Engineering owner |
| `data_integrity` | migration mismatch, backup/restore failure, unexpected destructive state | S0-S1 | Database owner |
| `ui_accessibility` | critical route contrast/focus/a11y regressions | S2 | QA owner |

## Alert Routes

These routes are mandatory and role-based even if the exact external tool changes later.

| Trigger | Detection source | Route | Required responders |
| --- | --- | --- | --- |
| Uncaught production frontend error | Sentry project alerts | Engineering on-call route | Engineering owner |
| Security header / dependency / policy release failure | `release:control`, CI, manual verification workflows | Release-control evidence + security review route | Engineering owner, security owner |
| Payment/provider failures | Sentry + business telemetry + support reports | Incident issue + product escalation route | Engineering owner, product owner |
| DB backup/restore or migration failure | backup workflow, restore test, DB validation scripts | Database ops route | Database owner, engineering owner |
| Accessibility/visual regression failure on critical routes | Playwright CI artifacts | QA verification route | QA owner, engineering owner |
| Production rollback initiated | deployment operator / incident commander | Incident issue + deployment channel | Engineering owner, QA owner, security owner if security-related |

## Canonical Alerting Tools In This Repo

- Runtime error capture: `src/lib/sentry.ts`
- Structured local/runtime logging: `src/lib/logger.ts`
- Release gate evidence: `scripts/release-control.mjs`
- Security header verification: `.github/workflows/verify-security-headers.yml`
- Release-control workflow: `.github/workflows/release-control.yml`
- Backup workflow: `.github/workflows/backup-database.yml`

## Rollback Checklist

Use this exact checklist for S0/S1 deployment incidents.

1. Declare severity and incident commander.
2. Open the `Incident Report` issue template and record the release label, affected systems, and current evidence.
3. Freeze further deploys and migrations.
4. Confirm rollback target:
   - previous Vercel deployment, or
   - previous container/image rollout, or
   - previous `dist` backup on VPS
5. Execute rollback using the deployment method in `DEPLOYMENT_GUIDE_PRODUCTION.md`.
6. Verify rollback health:
   - homepage responds
   - auth path works
   - payment callback routes load
   - header verification still passes
7. Record exact rollback timestamp and operator.
8. Keep heightened monitoring active until metrics normalize.
9. Create remediation follow-up work before any re-release.

## Required Incident Evidence

Every S0/S1 incident record must include:

- severity
- affected environment
- affected release label / deployment URL
- impacted journeys or systems
- first detection source
- evidence links (Sentry, workflow run, release-control report, screenshots)
- rollback decision and outcome
- owner sign-off for closure

## Related Canonical Docs

- `RELEASE_POLICY.md`
- `DEPLOYMENT_GUIDE_PRODUCTION.md`
- `BACKUP_RESTORE_PROCEDURE.md`
- `REPOSITORY_GOVERNANCE.md`

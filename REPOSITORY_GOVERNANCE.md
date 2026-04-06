# Repository Governance

This document is the P3-1 source of truth for canonical docs, canonical scripts, canonical page entrypoints, and deprecated repository artifacts.

## Canonical Docs

- `README.md`
  - primary repository entrypoint
- `REPOSITORY_GOVERNANCE.md`
  - governance source of truth
- `audit/STRICT_FULL_AUDIT_DOSSIER.md`
  - phase/task backlog
- `audit/*.md`
  - current enforced policies and audit artifacts
- `DEPLOYMENT_GUIDE_PRODUCTION.md`
  - production deployment guidance
- `scripts/README.md`
  - canonical script registry
- `e2e/README.md`
  - E2E test architecture and operator guidance
- `design-system/README.md`
  - canonical design-system overview

## Canonical Scripts

These are the maintained scripts currently wired to package scripts, CI, or active operations.

- `scripts/check-bundle-budgets.mjs`
- `scripts/check-avatar-consistency.mjs`
- `scripts/check-design-token-compliance.mjs`
- `scripts/dependency-audit.mjs`
- `scripts/i18n-audit.mjs`
- `scripts/verify-security-headers.mjs`
- `scripts/setup-e2e-test-accounts.mjs`
- `scripts/update-e2e-test-accounts.mjs`
- `scripts/backup-database.sh`
- `design-system/build/token-compiler.js`
- `design-system/scripts/audit-tokens.js`
- `design-system/scripts/migrate-colors.js`

## Canonical Pages

- Route-backed page files referenced from `src/routes/` are canonical.
- Examples of current canonical route entrypoints:
  - `src/pages/Home.tsx`
  - `src/pages/Login.tsx`
  - `src/pages/Signup.tsx`
  - `src/pages/JobBoard.tsx`
  - `src/pages/JobDetail.tsx`
  - `src/pages/ClientDashboard.tsx`
  - `src/pages/FreelancerDashboard.tsx`
  - `src/pages/JobPost.tsx`
  - `src/pages/Settings.tsx`
  - `src/pages/AdminDashboard.tsx`
- Non-routed alternates, suffixed variants, scratch pages, or empty backups are not canonical.

## Deprecated Docs

These remain in the repo only as historical context and should not be treated as current instructions:

- `START_HERE.md`
- `SETTINGS_COMPLETE_REDESIGN.md`
- `VIBRANT_REDESIGN_COMPLETE.md`
- `ALL_PAGES_COLOR_FIX_COMPLETE.md`
- `FINAL_COLOR_FIX_SUMMARY.md`
- `ALL_PAGES_STRICT_UI_UX_AUDIT.md`
- `migration-report.md`
- `admin-migration-report.md`
- `admin-migration-report-applied.md`
- `token-audit-report.md`
- `design-system/scripts/README.md`
- `design-system/scripts/MIGRATION_GUIDE.md`
- `design-system/scripts/IMPLEMENTATION_SUMMARY.md`

## Deprecated Scripts

These are ad hoc fixer/debug scripts and are not canonical operational entrypoints:

- `scripts/fix-dark-mode.cjs`
- `scripts/fix-dark-mode-better.cjs`
- `scripts/fix-dark-mode-final.cjs`
- `scripts/fix_i18n.cjs`
- `scripts/generate_page_audit.js`
- `scripts/test-join.mjs`
- `scripts/check-freelancers.cjs`
- `scripts/fix-logging.ps1`

## Governance Rules

1. New long-lived documentation belongs in a canonical location, not as a root-level “COMPLETE” or “SUMMARY” file.
2. New scripts must either be wired through `package.json`, referenced by CI/workflows, or documented as operational scripts in `scripts/README.md`.
3. New page files must be route-backed and referenced from `src/routes/`.
4. Deprecated docs/scripts should be labeled immediately rather than silently left ambiguous.
5. Historical/generated reports may remain for traceability, but they must not compete with canonical instructions.

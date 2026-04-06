# Script Registry

This file is the canonical script registry for repository operations.

## Canonical Scripts

Package or CI-wired scripts:

- `check-avatar-consistency.mjs`
- `check-bundle-budgets.mjs`
- `check-design-token-compliance.mjs`
- `dependency-audit.mjs`
- `i18n-audit.mjs`
- `verify-security-headers.mjs`
- `setup-e2e-test-accounts.mjs`
- `update-e2e-test-accounts.mjs`

Operational script:

- `backup-database.sh`
  - referenced by the backup workflow

## Deprecated Scripts

These files are retained only as historical or ad hoc migration/debug artifacts and should not be used as canonical entrypoints:

- `fix-dark-mode.cjs`
- `fix-dark-mode-better.cjs`
- `fix-dark-mode-final.cjs`
- `fix_i18n.cjs`
- `generate_page_audit.js`
- `test-join.mjs`
- `check-freelancers.cjs`
- `fix-logging.ps1`

If one of these scripts is still needed operationally, it should be promoted by:

1. documenting purpose and inputs,
2. wiring it through `package.json` or a workflow,
3. removing the deprecated label.

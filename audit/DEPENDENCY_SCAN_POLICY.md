# Dependency Scan Policy

This document is the P1-4 source of truth for npm supply-chain scanning in `khedma-tn`.

## Gate

- Command: `npm run deps:audit`
- Scanner: `npm audit --json`
- Fail-fast threshold: `high`

CI fails if any dependency in the lockfile reports a `high` or `critical` vulnerability.

## Scope

- Scans the full npm dependency graph resolved by `package-lock.json`
- Covers direct and transitive dependencies used by application and build/test tooling
- Writes a machine-readable artifact to `artifacts/dependency-audit/report.json`

## Policy

- `critical`: always block merge/release
- `high`: block merge/release
- `moderate` and below: tracked, but do not fail the gate by default

## CI Enforcement

- GitHub Actions workflow: `.github/workflows/ci.yml`
- Step: `Dependency Vulnerability Audit`
- Artifact upload is always attempted so failed scans still leave evidence

## Local Verification

```bash
npm run deps:audit
```

If the command fails, inspect `artifacts/dependency-audit/report.json` and remediate before release.

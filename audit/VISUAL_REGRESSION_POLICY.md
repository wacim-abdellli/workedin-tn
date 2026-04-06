# Visual Regression Policy

This document is the P2-2 source of truth for screenshot-diff gating in `khedma-tn`.

## Baseline scope

The baseline covers a small set of high-signal flows and role-sensitive states:

- login shell
- client job-post shell
- client dashboard
- freelancer dashboard
- admin access denied state
- suspended account gate

## Why the suite is narrow

- It prioritizes critical navigation and account states over broad page coverage.
- It uses mocked Supabase reads for deterministic rendering.
- It avoids unstable legacy pages until they are intentionally cleaned up.

## Gate

- Command: `npm run test:e2e:visual`
- Snapshot update command: `npm run test:e2e:visual:update`
- Browser/project: `chromium-public`
- CI runner: Windows, so committed baselines match the platform that generates them.

## Review process

1. Make the UI change.
2. Run `npm run test:e2e:visual`.
3. If the diff is intentional, run `npm run test:e2e:visual:update`.
4. Review the changed snapshots in `e2e/visual-regression.spec.ts-snapshots/`.
5. Commit code and updated snapshots together.

## CI evidence

- Workflow: `.github/workflows/visual-regression.yml`
- Failure artifacts:
  - `playwright-report/`
  - `test-results/`

No visual change should be merged without either:

- a passing baseline diff, or
- an intentional snapshot update reviewed in the pull request.

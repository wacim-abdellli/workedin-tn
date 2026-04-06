# A11y Strict Matrix

This document is the P2-3 source of truth for route-level accessibility gating in `khedma-tn`.

## Covered routes

- `/login`
- `/client/dashboard`
- `/freelancer/dashboard`
- `/jobs/new`
- `/admin` as a non-admin user
- `/dashboard` with a suspended account

## Assertions enforced

Each route must satisfy the following checks in Playwright:

- keyboard entry exposes a visible skip-link focus state
- expected landmarks are present (`main`, and where applicable `banner` and `nav`)
- exactly one visible `h1` exists for the route shell
- Axe reports no `serious` or `critical` violations for `wcag2a` and `wcag2aa`

## Gate

- Command: `npm run test:e2e:a11y:strict`
- Current implementation combines:
  - `e2e/auth-protection-a11y.spec.ts`
  - `e2e/a11y-matrix.spec.ts`

## Why these routes

They cover the highest-risk route categories in the product:

- public authentication
- role-specific dashboards
- authenticated creation flow
- authorization denial state
- account-status lockout state

Additional routes can be added as the UI becomes more stable or more critical flows are identified.

# Khedma.tn

Khedma.tn is a Tunisian freelance marketplace built with React, TypeScript, Vite, Supabase, and Playwright.

This is the canonical repository entrypoint.

## Canonical Docs

- `README.md`
  - project overview and day-1 commands
- `REPOSITORY_GOVERNANCE.md`
  - canonical docs, scripts, pages, and deprecated artifacts
- `audit/STRICT_FULL_AUDIT_DOSSIER.md`
  - master audit backlog and phase definitions
- `audit/*.md`
  - current enforced policy and verification artifacts
- `DEPLOYMENT_GUIDE_PRODUCTION.md`
  - production deployment and verification
- `scripts/README.md`
  - canonical script registry
- `e2e/README.md`
  - end-to-end test architecture and operator guidance

If a root markdown file is not listed above and carries a legacy banner, treat it as historical context only.

## Canonical Commands

```bash
npm install
npm run dev
npm run test:run
npm run audit:strict
```

Additional enforced quality/security commands:

```bash
npm run deps:audit
npm run headers:verify -- --base-url <url>
npm run tokens:compliance -- --staged
npm run test:e2e:a11y:strict
npm run test:e2e:visual
```

## Canonical App Structure

- `src/routes/`
  - canonical route graph and route ownership
- `src/pages/`
  - route-backed page entrypoints only
- `src/components/`
  - shared UI and feature components
- `src/lib/`
  - shared client utilities, policies, and query/cache setup
- `supabase/`
  - migrations, verification SQL, and Edge Functions

## Current Governance Rule

- Prefer canonical docs over historical summaries.
- Prefer package/workflow-wired scripts over ad hoc fixer scripts.
- Prefer route-backed page files referenced from `src/routes/`.
- Do not add alternate page files like `*-NEW.tsx` or one-off root summary docs for ongoing work.

See `REPOSITORY_GOVERNANCE.md` for the audited source-of-truth list.

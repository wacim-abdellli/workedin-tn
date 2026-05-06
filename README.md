# WorkedIn TN

WorkedIn TN is a Tunisian freelance marketplace built with React, TypeScript, Vite, Supabase, and Playwright.

This repository contains the production web client, design tokens, test suites, and operational scripts for the WorkedIn TN product. Some legacy files in the repo may contain older project names (for example `Khedma`/`Khedmetna`); the runtime source of truth is the `src/` code (not legacy README text).

Quick links
- App entry: [src/main.tsx](src/main.tsx)
- App shell: [src/App.tsx](src/App.tsx)
- Routes: [src/routes/index.tsx](src/routes/index.tsx)
- Auth & profile: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
- Supabase client: [src/lib/supabase.ts](src/lib/supabase.ts)
- Design tokens: [design-system/README.md](design-system/README.md)
- E2E docs: [e2e/README.md](e2e/README.md)

## Day‑1 Commands

```bash
npm install
npm run dev
npm run test:run
```

Quality & verification (CI/maintainers):

```bash
npm run audit:strict
npm run deps:audit
npm run build:budget
npm run test:e2e
```

## High-level structure

- `src/` – application code (preferred source of truth)
  - `src/routes/` – route graph and route definitions
  - `src/pages/` – route-backed page entrypoints
  - `src/components/` – UI components and layout
  - `src/lib/` – shared utilities, policy modules, and infra wiring
- `design-system/` – token sources and token compiler
- `e2e/` – Playwright end-to-end tests and setup
- `scripts/` – operational scripts (audit, token checks, release control)
- `supabase/` – DB migrations, RLS, and helper SQL

## Important operational rules

- Prefer `src/` code and the governance docs (`REPOSITORY_GOVERNANCE.md`, `RELEASE_POLICY.md`, `INCIDENT_READINESS.md`, `scripts/README.md`) as the canonical sources.
- Do not rely on legacy top-level docs for runtime behavior; they may contain historical names or retired guidance.
- When changing auth, profile, or routing code, preserve the workspace hydration and cache behavior to avoid workspace flip-flops.

## For new contributors / agents

Start here:

1. Read `src/main.tsx` and `src/App.tsx` to understand bootstrap order and providers.
2. Inspect `src/routes/index.tsx` and `src/routes/routeDefinitions.tsx` for route guards and wrappers.
3. Review `src/contexts/AuthContext.tsx` and `src/lib/workspaceRoutes.ts` for workspace and onboarding behavior.
4. Run unit tests and the e2e suite (`npm run test:run`, `npm run test:e2e`) before proposing workflow or routing changes.

If you want a compact agent-friendly brief or an architecture map (file→responsibility), ask and I will generate it.

# Strict technical audit — WorkedIn (khedma-tn) web app

**Scope:** Frontend (Vite/React), Supabase Edge Functions, CI, migrations surface area.  
**Method:** Static review of repository + configuration (no live penetration test, no production Supabase console review).  
**Date context:** Audit reflects repo state at time of generation.

---

## Executive summary

| Area | Rating | One-line verdict |
|------|--------|------------------|
| Engineering discipline | **Strong** | CI gates (lint, tsc, coverage, bundle budgets, deps audit, i18n strict, token compliance, security headers) are above average for a product this size. |
| Application security (design) | **Good** | Admin checks avoid client-only secrets; HTML goes through `SanitizedHtml`; upload path uses Edge + policy module + audit log pattern. |
| Application security (ops) | **Needs verification** | CORS defaults split across `workedin.tn` vs `khedmetna.tn`; must be unified via `ALLOWED_ORIGIN` in every environment. |
| Payments / escrow | **Conditional** | Flouci functions show real integration patterns; DhMad escrow functions **mock** when `!DHMAD_API_KEY` or dev — production readiness depends on secrets + real API paths. |
| CI truthfulness | **Risk** | Main `ci.yml` runs Playwright a11y with `E2E_BASE_URL=http://localhost:5173` but `playwright.config.ts` disables `webServer` when `CI=true` — **no dev server is started in that workflow snippet** → E2E may not exercise the app unless another mechanism exists. |
| Accessibility | **Mixed** | Dedicated axe E2E suites exist; `index.html` sets `user-scalable=no` / `maximum-scale=1` which **harms zoom accessibility**. |
| Assets / branding | **Gap** | Several references to `/workedin-logos/*` without guaranteed `public/` copy — favicon/OG may 404 on static hosts unless fixed or deployed with those files. |

**Overall:** **B+** engineering process, **B-** production hardening until payments, CI E2E wiring, CORS/asset drift, and viewport meta are resolved.

---

## 1. Repository scale (quantified)

| Metric | Approximate count |
|--------|-------------------|
| `src` TS/TSX modules | ~335 |
| SQL migrations | ~78 |
| Edge Functions | 10 (`flouci-*`, `dhmad-*`, `secure-upload`, `send-email`, `reconcile-payment`) |
| Automated test files (Vitest + Playwright) | ~61 |

---

## 2. Security findings

### 2.1 P0 — Payments & escrow truthfulness

- **DhMad (`dhmad-create-escrow` and related):** Code documents `TODO` and uses **mock escrow** when `DENO_ENV === 'development'` or **`!DHMAD_API_KEY`**.  
  - **Risk:** Misconfigured production secrets → **silent mock behavior** and fake escrow IDs.  
  - **Remediation:** Fail closed in production if `DHMAD_API_KEY` missing; alert/metric on mock path; integration tests against sandbox.

- **Flouci (`flouci-verify-payment`, `flouci-initiate-payment`):** Uses server-side secrets, auth check, structured errors, payment audit logging — **stronger** pattern.  
  - **Still verify:** Idempotency, webhook authenticity if used, and alignment with DB RPCs.

### 2.2 P1 — CORS / origin drift

Default `Access-Control-Allow-Origin` fallbacks differ:

- `https://workedin.tn` — several `dhmad-*` functions, `dhmad-get-escrow-status`, etc.
- `https://khedmetna.tn` — `flouci-*`, `secure-upload`, `send-email`, `reconcile-payment`

**Risk:** Browser CORS failures or emergency “`*`” loosening if env not set consistently.  
**Remediation:** Single canonical production origin; set `ALLOWED_ORIGIN` in all Supabase secrets; remove or align hardcoded fallbacks after migration.

### 2.3 P1 — Service role usage (Edge only — good)

- `secure-upload` uses **anon client for `getUser()`** and **service role for storage/policy checks** — appropriate split.  
- **No** `SERVICE_ROLE` or `supabase.auth.admin` matches under `src/` (grep) — **good** (client bundle must never ship service role).

### 2.4 P2 — Admin authorization model — good design

- `hasAdminAccess` uses **`profile.is_admin`** and **`app_metadata`** only; explicitly **excludes `user_metadata`** — correct (user-metadata is user-writable).

### 2.5 P2 — XSS surface

- `SanitizedHtml` pipes through `sanitizeHtml` with default `plainText` policy — **good default**.  
- **Action:** Grep for `SanitizedHtml` / `policy=` usages; any `rich` policy needs review.

### 2.6 P2 — Information in `index.html`

- Hardcoded Supabase host in `<link rel="preconnect" href="https://…supabase.co">` — **minor** (project ref exposure); update if project changes.

### 2.7 P3 — Rate limiting

- Client-side auth rate limit keys (`useAuthRateLimit`) — **supplements only**; ensure **server-side** auth throttling (Supabase / WAF) for brute force.

---

## 3. Row-level security & database

- **78 migrations** including many `harden_*`, `fix_*notifications*`, `fix_jobs_rls`, `harden_financial_*`, messaging RPCs — indicates **active security iteration**.  
- **Strict audit limitation:** This document does **not** certify each policy; a full audit needs **policy inventory + test matrix** (per table: SELECT/INSERT/UPDATE/DELETE for guest, user, other user, admin).

**Recommended:** Maintain automated SQL policy tests or Supabase advisory checks in CI if not already.

---

## 4. CI/CD & test honesty

### 4.1 Main CI (`/.github/workflows/ci.yml`)

Runs: token compliance, dependency audit, lint, avatar audit, i18n strict, `tsc`, Vitest coverage, build + bundle budgets, preview server on **4173** for **security headers**, Playwright install with `continue-on-error: true`, then `test:e2e:a11y:strict` with `E2E_BASE_URL=http://localhost:5173`.

### 4.2 Playwright config

```ts
webServer: process.env.CI ? undefined : { command: 'npm run dev', url: 'http://localhost:5173', ... }
```

When `CI=true`, **Playwright does not start the dev server.**

**Finding:** Unless a step not shown starts Vite on 5173, **strict a11y E2E in `ci.yml` may hit an empty host** or rely on flaky timing.  
**Contrast:** Separate `e2e-tests.yml` runs `npm run test:e2e` with `CI: true` — same `webServer: undefined` issue unless Playwright is configured elsewhere.

**Remediation:** In CI, either:

1. `webServer: { command: 'npm run dev', ... }` **even when CI=true**, or  
2. `webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173', ... }` and set `E2E_BASE_URL` to match, or  
3. Use `npx serve dist` after build.

Also reconsider `continue-on-error: true` on Playwright browser install — can **hide** broken E2E.

---

## 5. Accessibility

- **Positive:** `test:e2e:a11y:strict` and axe integration exist.  
- **Negative:** `index.html` viewport:

  `maximum-scale=1.0, user-scalable=no` — **fails WCAG expectations** for low-vision users who need zoom.

**Remediation:** Remove `user-scalable=no` and `maximum-scale=1` unless a documented exception exists.

---

## 6. Performance & bundles

- `scripts/check-bundle-budgets.mjs`: entry ~750 KB, chunk ~385 KB, total JS ~2600 KB (with exemptions for charts/sentry/analytics).  
- **Good:** Forces awareness of bundle growth.  
- **Follow-up:** Profile LCP on `/messages`, `/jobs`, dashboards; ensure React Query `staleTime` and virtualization where lists are large.

---

## 7. Internationalization

- `npm run i18n:audit:strict` in CI — **strong**.  
- **Follow-up:** Ensure new UI strings (especially admin, payments errors) stay in sync across `ar` / `fr` / `en`.

---

## 8. Operational / branding consistency

- Legal/support emails reference `@workedin.tn`; some Edge email templates reference `khedmetna.tn`.  
- **Remediation:** Single brand/domain strategy in code and DNS.

---

## 9. Prioritized remediation backlog

| ID | Priority | Item | Owner suggestion |
|----|----------|------|------------------|
| R1 | P0 | Production guard: **refuse** DhMad mock path when `DENO_ENV` is production | Backend |
| R2 | P0 | Verify **Flouci + contract** RPC chain under load and dispute edge cases | Backend + QA |
| R3 | P1 | Fix **CI E2E** server startup + base URL alignment | DevOps |
| R4 | P1 | Unify **`ALLOWED_ORIGIN`** secrets; align code fallbacks | DevOps |
| R5 | P1 | Fix **static assets** (`/workedin-logos` in `index.html` / manifest / AuthCallback) — copy to `public/` or change URLs | Frontend |
| R6 | P2 | Relax **viewport** meta for a11y | Frontend |
| R7 | P2 | Remove `continue-on-error` on Playwright install **or** document why | DevOps |
| R8 | P2 | Resolve **flaky unit test** (`useAuthRateLimit` / localStorage) if still failing | Frontend |
| R9 | P3 | Replace preconnect hardcoded Supabase URL with env-driven or remove | Frontend |

---

## 10. What this audit is not

- No OWASP ZAP / Burp run on deployed URLs.  
- No review of Supabase Dashboard settings (MFA, leaked keys, backup policies).  
- No legal/compliance sign-off (payments, data retention, Tunisia regulations).  
- No full RLS formal verification.

---

## 11. Sign-off block (for humans)

- [ ] R1–R3 addressed or risk accepted in writing  
- [ ] Production secrets checklist completed  
- [ ] E2E green on CI with proof artifact  
- [ ] Security headers verified on **production** URL (not only preview)

---

*Generated as a strict static audit artifact for the WorkedIn codebase.*

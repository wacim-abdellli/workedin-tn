# DEEP AUDIT REPORT: WorkedIn TN
**Date:** June 12, 2026
**Scope:** Full security, architecture, database, and publish-readiness audit
**Status:** Pre-publication stabilization

---

## CRITICAL ISSUES (Must fix before publish)

### 1. `public/test-admin.html` ships to production

**Severity: CRITICAL**
**File:** `public/test-admin.html`

This is a debug/test page that exposes admin query patterns. It:
- Ships to production via Vercel (anything in `public/` is deployed)
- Shows attackers the data model (`profiles` table, `is_admin` column)
- Could be filled with real credentials by someone with browser inspector access

**Fix:** Delete `public/test-admin.html` or add it to `.vercelignore`.

---

### 2. Domain mismatch: `workedin.tn` vs `khedmetna.tn`

**Severity: CRITICAL**
**Files:** `public/sitemap.xml`, `public/robots.txt`, `.env.example`, `supabase/functions/*/index.ts`

- `sitemap.xml` and `robots.txt` reference `https://khedmetna.tn/`
- `VITE_APP_URL` in `.env.example` says `https://workedin.tn`
- The Vercel project is named `workedin-tn`
- CORS allowed origins in edge functions reference `workedin.tn` and `workedin-tn.vercel.app`

This causes SEO confusion (search engines see wrong canonical domain) and potential CORS failures.

**Fix:** Decide on final production domain. Update `sitemap.xml`, `robots.txt`, and all CORS origin configs to match.

---

### 3. Service Role Key exposed in `.env.local`

**Severity: CRITICAL**
**File:** `.env.local`

The file contains `VITE_SUPABASE_SERVICE_ROLE_KEY` — this key bypasses ALL Row Level Security policies and gives full database read/write access to every table.

While `.env*.local` is in `.gitignore`, if this file was ever committed or shared:
- The key must be rotated immediately via Supabase Dashboard > Project Settings > API
- Check git history: `git log --all --full-history -- .env.local`

Additionally, `.env.local` contains a full Vercel OIDC JWT token exposing team ID, project ID, and user ID.

**Fix:** Rotate service role key if uncertain about exposure history. Never prefix service role key with `VITE_` (Vite exposes all `VITE_*` vars to the browser bundle).

---

### 4. Accessibility: `user-scalable=no` in viewport meta

**Severity: HIGH**
**File:** `index.html` (line 14)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

This violates WCAG 2.1 Success Criterion 1.4.4 (Resize text). Users with low vision cannot zoom. Many app stores and accessibility audits will flag this.

**Fix:** Remove `maximum-scale=1.0, user-scalable=no` from the viewport meta tag.

---

### 5. `scratch/` directory in repository

**Severity: MEDIUM**
**Directory:** `scratch/` (32 files)

Contains debug scripts, reflog analysis, schema checks, and internal investigation tools. These:
- Expose internal architecture decisions to anyone with repo access
- Clutter the repository
- Could confuse future developers or AI agents

**Fix:** Add `scratch/` to `.gitignore` and remove from tracking: `git rm -r --cached scratch/`

---

### 6. `AUDIT.md` content is duplicated

**Severity: LOW**
**File:** `AUDIT.md`

The entire audit content appears twice in the file (lines 1-55 repeated at lines 56-120). Looks unprofessional in a public repo.

**Fix:** Remove the duplicate section.

---

## SECURITY ASSESSMENT

### Confirmed good practices:
- **XSS prevention**: All HTML rendering goes through DOMPurify via `SanitizedHtml` component (`src/components/ui/SanitizedHtml.tsx`). No raw `dangerouslySetInnerHTML` anywhere.
- **Sanitization policies**: Defined in `src/lib/sanitization.ts` — `plainText` strips all tags, `limitedHtml` allows only safe formatting tags.
- **Auth flow**: PKCE flow (best practice for SPAs), session persistence, stale token purge on page load (`src/lib/supabase.ts`).
- **Edge function auth**: All Supabase edge functions verify `supabase.auth.getUser()` before processing.
- **Webhook security**: `dhmad-webhook` uses HMAC-SHA256 signature verification with constant-time comparison to prevent timing attacks.
- **Admin verification**: `admin-user-control` function checks `is_admin` flag AND `account_status` before allowing operations.
- **Upload security**: Multi-layer — blocked extensions (exe, sh, bat, js, php, etc.), mime-type validation, size limits, rate limiting, path sanitization, scope validation for message attachments. Defined in `src/lib/uploadPolicy.ts`.
- **RLS**: All tables have Row Level Security enabled. Admin policies use `SECURITY DEFINER` function to prevent infinite recursion (`supabase/migrations/20260329020000_fix_rls_recursion.sql`).
- **Audit logging**: Admin actions logged to `admin_audit_logs` table, file uploads logged to `upload_audit_log`.
- **Security headers**: CSP, HSTS, X-Frame-Options DENY, nosniff, strict referrer-policy, permissions-policy all configured in `vercel.json`.
- **No type safety bypasses**: Zero `@ts-ignore` or `@ts-expect-error` in the entire codebase.
- **Service role key isolation**: Service role key is NOT imported or used in any frontend code (confirmed via grep).

### Security concerns:
- **`unsafe-inline` in CSP script-src**: Weakens XSS protection. Consider nonce-based approach for stricter CSP in future.
- **CORS localhost bypass**: `secure-upload/index.ts` line 21 — `isLocalDevOrigin()` allows any `localhost:*` origin. Verify this cannot be triggered in production.
- **Console logging in edge functions**: Payment-related edge functions log request details. Ensure Supabase function logs are access-controlled.

---

## ARCHITECTURE & CODE QUALITY

### Stack:
- **Frontend:** React 19 + TypeScript 5.9 + Vite 6 + Tailwind CSS 3
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- **State:** Zustand (client state) + React Query (server state) + Context (auth/theme/workspace)
- **Payments:** Dhmad (escrow) + Flouci (direct) via Edge Functions
- **Deployment:** Vercel
- **Monitoring:** Sentry (errors) + PostHog (analytics)
- **i18n:** i18next with Arabic (RTL), French, English

### Strengths:
| Area | Assessment |
|------|-----------|
| TypeScript strictness | 0 tsc errors, 0 ts-ignore directives |
| Route protection | Multi-layer guards: `ProtectedRoute`, `AdminRoute`, `WorkspaceRoute`, `OnboardingRoute` |
| Error boundaries | Every route wrapped + component-level boundaries in critical sections |
| Code splitting | Lazy loading per route + manual vendor chunk strategy in vite.config.ts |
| i18n/RTL | Logical CSS properties (ms-/pe-), strict audit passing, Arabic-first |
| Upload security | Edge function + client policy + audit log + scope validation |
| Testing | 400+ tests covering critical paths (auth, jobs, chat, payments, contracts) |
| Accessibility | Skip links, route focus management, axe-core E2E tests |

### Concerns:

#### God Components
- `src/pages/Messages.tsx` — **5,410 lines**. Single largest risk for regressions. Should be decomposed into:
  - `useConversations` hook (already partially extracted to `src/pages/messages/useConversations.ts`)
  - `useMessageThread` hook
  - `ConversationSidebar` component
  - `MessageThread` component
  - `MessageModals` component
  
  Note: Some extraction has begun in `src/pages/messages/` but the main file still dominates.

#### Type Safety Gaps
- **30+ files use `: any`** type annotations. Key offenders:
  - `src/pages/Wallet.tsx`
  - `src/pages/JobBoard.tsx`
  - `src/pages/JobDetail.tsx`
  - `src/services/jobs.ts`
  - `src/pages/admin/PaymentsTab.tsx`
  - `src/components/settings/ProfileSettings.tsx`

#### Build Issues
- **Circular chunk dependency**: `form-vendor -> react-vendor -> form-vendor` flagged by Vite during build.
  - Root cause: react-hook-form imports React, and the chunk strategy separates them into different groups that reference each other.
  - Fix: Merge `form-vendor` into `react-vendor` or let Vite handle the split automatically.

#### Dev Artifacts
- `src/components/ui/LoadingStates.example.tsx` — example/demo file with `console.log` calls. Should not ship.
- `i18n-audit-report.txt` — generated report at project root (already in .gitignore, confirm not tracked).

---

## DATABASE & SUPABASE

### Schema design (from migrations):
- **90+ migrations** showing mature iterative development
- Core tables: `profiles`, `freelancer_profiles`, `jobs`, `proposals`, `contracts`, `wallets`, `conversations`, `messages`, `notifications`, `identity_verifications`, `disputes`, `admin_audit_logs`, `upload_audit_log`
- Proper foreign keys with `ON DELETE CASCADE` / `ON DELETE SET NULL`
- Check constraints on enums (`account_status`, contract status, etc.)
- Indexes on common query patterns (`idx_jobs_filter_combo`, messages performance indexes)

### Edge Functions (15 total):
| Function | Purpose | Auth |
|----------|---------|------|
| `secure-upload` | File upload with validation | Bearer token |
| `admin-user-control` | Admin operations (suspend, restore, delete) | Admin check |
| `dhmad-create-escrow` | Create payment escrow | Bearer token |
| `dhmad-release-escrow` | Release funds to freelancer | Bearer token |
| `dhmad-refund-escrow` | Refund to client | Bearer token |
| `dhmad-webhook` | Payment event notifications | HMAC signature |
| `dhmad-checkout-session` | Initiate checkout | Bearer token |
| `dhmad-get-escrow-status` | Check escrow state | Bearer token |
| `dhmad-process-payout` | Process freelancer payout | Bearer token |
| `flouci-initiate-payment` | Start Flouci payment | Bearer token |
| `flouci-verify-payment` | Verify payment completion | Bearer token |
| `reconcile-payment` | Payment reconciliation | Bearer token |
| `hire-proposal-fallback` | Backup hire flow | Bearer token |
| `send-email` | Transactional emails | Service role |
| `cron-process-timeouts` | Timeout expired contracts | Cron/service role |

### Contract State Machine (`src/lib/contractWorkflow.ts`):
```
pending_payment -> [active, cancelled, disputed]
active -> [delivery_submitted, cancelled, disputed]
delivery_submitted -> [active, revision_requested, completed, cancelled, disputed]
revision_requested -> [delivery_submitted, cancelled, disputed]
completed -> [] (terminal)
cancelled -> [] (terminal)
disputed -> [] (terminal)
```
State machine is correctly defined with no impossible transitions.

### Concerns:
- Migration count (90+) may slow fresh deployments. Consider squashing baseline migrations.
- No documented backup/restore strategy for production data.
- `notification_triggers` and various notification-related migrations (20260403*) suggest the notification schema went through heavy iteration — verify final state is clean.

---

## FRONTEND & UX

### SEO:
- OpenGraph tags present in `index.html`
- `sitemap.xml` exists (but wrong domain — see Critical Issue #2)
- `robots.txt` properly blocks private routes
- `react-helmet-async` used for per-page meta tags

### PWA:
- `manifest.json` exists but minimal (missing `start_url`, `scope`, multiple icon sizes)
- No service worker detected — app requires internet connection
- Theme color and display mode configured

### Performance:
- Preconnect to Supabase and Google Fonts
- Vendor chunk splitting (12 chunks: react, router, query, supabase, radix, date, form, i18n, ui, virtual, sentry, analytics, charts)
- Lazy-loaded routes
- Source maps disabled in production
- `optimizeDeps.include` for faster dev startup

### Accessibility:
- Skip links component (`SkipLinks`)
- Route focus management (`useRouteFocus`)
- axe-core E2E tests (`test:e2e:a11y:strict`)
- BUT: `user-scalable=no` blocks zoom (Critical Issue #4)

---

## PUBLISH CHECKLIST (Priority order)

### Must fix (blockers):
- [ ] Delete `public/test-admin.html`
- [ ] Fix domain in `sitemap.xml` and `robots.txt` (choose `workedin.tn` or `khedmetna.tn`)
- [ ] Confirm service role key was never committed; rotate if uncertain
- [ ] Remove `VITE_` prefix from service role key in `.env.local` (prevents accidental bundle exposure)
- [ ] Remove `user-scalable=no` from viewport meta in `index.html`
- [ ] Fix `AUDIT.md` duplication

### Should fix (quality):
- [ ] Add `scratch/` to `.gitignore`, remove from tracking
- [ ] Delete or move `src/components/ui/LoadingStates.example.tsx`
- [ ] Resolve circular chunk dependency in vite.config.ts
- [ ] Add `start_url: "/"` and more icon sizes to `manifest.json`
- [ ] Remove `console.log` calls from production code paths (admin tabs)

### Post-launch improvements:
- [ ] Decompose `Messages.tsx` (5,410 lines) into smaller modules
- [ ] Replace `: any` with proper types in 30+ files
- [ ] Consider migration squashing for cleaner fresh deploys
- [ ] Implement nonce-based CSP to remove `unsafe-inline`
- [ ] Add service worker for offline support / install prompt
- [ ] Document backup/restore procedures

---

## FILES REFERENCED IN THIS AUDIT

```
.env                          — Supabase config (anon key, URL)
.env.local                    — Secrets (SERVICE_ROLE_KEY, Vercel OIDC, PostHog, Sentry)
.env.example                  — Template for environment setup
.gitignore                    — Exclusion rules
index.html                    — Entry HTML with meta tags
vercel.json                   — Deployment config, security headers, rewrites
vite.config.ts                — Build config, chunk strategy, CSP
package.json                  — Dependencies, scripts
public/test-admin.html        — DEBUG FILE TO DELETE
public/sitemap.xml            — SEO sitemap (wrong domain)
public/robots.txt             — Crawler rules (wrong domain)
public/manifest.json          — PWA manifest (minimal)
src/App.tsx                   — App root, providers, routing
src/routes/index.tsx           — Route aggregation
src/routes/routeDefinitions.tsx — Route guards (Protected, Admin, Workspace)
src/routes/adminRoutes.tsx     — Admin-only routes with guard
src/lib/supabase.ts           — Supabase client init, upload helpers
src/lib/uploadPolicy.ts       — Upload validation rules
src/lib/sanitization.ts       — DOMPurify wrapper
src/lib/contractWorkflow.ts   — Contract state machine
src/lib/logger.ts             — Dev-only logger (silent in prod)
src/components/ui/SanitizedHtml.tsx — Safe HTML rendering
src/contexts/AuthContext.tsx   — Auth state, profile caching
src/pages/Messages.tsx         — God component (5,410 lines)
supabase/functions/secure-upload/index.ts — File upload edge function
supabase/functions/dhmad-webhook/index.ts — Payment webhook handler
supabase/functions/admin-user-control/index.ts — Admin operations
supabase/migrations/           — 90+ database migrations
scratch/                       — Debug scripts (32 files)
audit/                         — Contract workflow audit docs
AUDIT.md                       — Previous audit (duplicated content)
```

---

## AGENT INSTRUCTIONS

When working on this project:
1. **Read this file first** for full context on known issues and architecture decisions.
2. **Never expose service role keys** in frontend code or VITE_-prefixed variables.
3. **All HTML rendering must go through `SanitizedHtml`** — never use raw `dangerouslySetInnerHTML`.
4. **Follow the contract state machine** in `src/lib/contractWorkflow.ts` — no transitions outside defined paths.
5. **Upload changes must validate against `uploadPolicy.ts`** — both client and edge function enforce this.
6. **Admin operations require** `is_admin()` check at database level — never trust frontend-only guards.
7. **i18n**: All user-facing strings must use translation keys. Run `npm run i18n:audit:strict` after changes.
8. **Testing**: Run `npm run test:run` for unit tests, `npm run test:e2e` for E2E. Critical paths: auth, payments, contracts, messaging.
9. **Build verification**: Run `npm run build:budget` to check bundle sizes stay within limits.
10. **The project targets Tunisia** — Arabic (RTL) is primary, French secondary, English tertiary. Use logical CSS properties (ms-/me-/ps-/pe-) not physical (ml-/mr-/pl-/pr-).

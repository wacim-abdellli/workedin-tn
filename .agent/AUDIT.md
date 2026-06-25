# Full Codebase Audit — WorkedIn TN (June 2026)

> Generated from a comprehensive deep-dive by opencode. Covers architecture, code quality, security, testing, i18n, a11y, state management, services, hooks, and infrastructure.

---

## OVERALL SCORE: **8.2 / 10** — Production-Grade

| Category | Score (0–10) | Verdict |
|---|---|---|
| Architecture & Organization | **9.5** | Domain-driven, clean separation, composable guards, barrel exports |
| TypeScript Quality | **9.0** | `strict: true`, type-only imports, Zod. Some `any` in service layer |
| Security | **9.5** | Defense-in-depth: RLS + SECURITY DEFINER RPCs + magic-byte uploads + HMAC webhooks + PKCE + CSP |
| Testing | **7.5** | 69 unit test files, 745+ tests. Coverage 23.1% (up from 20%). Needs more tests |
| Performance | **8.0** | Code-split pages, React Query cache, Zustand sync init, singleton channels. Missing `useMemo` in spots |
| i18n | **9.0** | Full custom system, 3 languages (5.5k lines each), pluralization, RTL, cross-tab sync |
| Accessibility | **8.0** | Extensive ARIA, focus trapping, SkipLinks, axe-core E2E. Color contrast skipped as debt |
| Error Handling | **6.5** | 4 inconsistent patterns across services. `console.error` in prod code. 7/9 services lack timeouts |
| UI/Component Design | **9.0** | 37 reusable primitives, design tokens, Framer Motion, forwardRef, compound components |
| State Management | **8.5** | Right tool per job: Zustand (workspace), Context (auth), React Query (server). AuthContext 903 lines |
| DevOps & CI | **9.0** | 7 GH Actions workflows: CI gates, E2E, visual regression, security headers, DB backup, release control |
| Code Consistency | **7.0** | Mixed error patterns, 3 duplicate ErrorBoundaries, inconsistent timeouts, incomplete barrel exports |

---

## PROJECT SNAPSHOT

| Property | Value |
|---|---|
| Name | WorkedIn TN |
| Type | Tunisian freelance marketplace |
| Stack | React 19 + TypeScript 5.9 + Vite + Supabase + Tailwind CSS |
| Languages | Arabic (RTL primary), French, English |
| Domain | workedin.tn (sitemap/robots conflict: khedmetna.tn) |
| Deploy | Vercel (SPA) |
| State | Zustand + React Query + Context |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions — 15 functions) |
| E2E | Playwright |
| Unit | Vitest (jsdom) |
| CI | GitHub Actions (7 workflows) |

### Directory Layout (src/)

| Path | Files | Purpose |
|---|---|---|
| `src/components/` | 80+ | UI components organized by domain (auth, chat, contracts, dashboard, job-post, layout, navigation, payment, routing, settings) |
| `src/components/ui/` | 37 | Reusable primitives: Button, Input, Modal, Select, Badge, Toast, etc. |
| `src/pages/` | 46 | Route-level page components |
| `src/routes/` | 9 | Route definitions with composable guard system |
| `src/lib/` | 49 | Utilities: Supabase client, auth, sanitization, upload policy, contract workflow, permission engine, constants |
| `src/services/` | 12 | Data access layer — all DB queries go here (never inline in components) |
| `src/hooks/` | 23 | Custom React hooks |
| `src/contexts/` | 4 | React Context providers (Auth, Theme, Notifications, Workspace) |
| `src/types/` | 11 | TypeScript type definitions (barrel + domain files) |
| `src/i18n/` | 4 | Internationalization (ar 5.5k lines, fr 5.5k, en 5.5k, provider) |
| `src/styles/` | 2 | Global styles |
| `src/config/` | 1 | App configuration |
| `src/test/` | 4 | Test setup & utilities |
| `supabase/` | — | 100+ migrations, 15 edge functions |
| `design-system/` | — | Token compiler, compliance audits, migration scripts |
| `e2e/` | 11 spec files | Playwright E2E tests |

---

## KEY ARCHITECTURE DECISIONS

### Data Flow
```
Page → Service → Lib → Supabase (DB/Auth/Storage)
```
Components NEVER call `supabase.from()` directly. All DB access goes through `src/services/`.

### Route Guard System (Composable HOCs)
| Guard | Purpose |
|---|---|
| `public` | No auth needed |
| `public-redirect` | Redirect to dashboard if logged in |
| `protected` | Must be authenticated → `ProtectedRoute` + `ProtectedGate` |
| `protected-workspace` | Auth + workspace context → `WorkspaceRoute` |
| `protected-onboarding` | Auth + onboarding step → `OnboardingRoute` |
| `admin` | Auth + `is_admin` check → `AdminRoute` |

All guards are composable factories: `withProtected()`, `withWorkspace()`, `withAdmin()`, etc. Each wraps the page in a lazy-loaded React.Suspense boundary.

### Contract State Machine (`src/lib/contractWorkflow.ts`)
```
pending_payment → [active, cancelled, disputed]
active → [delivery_submitted, cancelled, disputed]
delivery_submitted → [active, revision_requested, completed, cancelled, disputed]
revision_requested → [delivery_submitted, cancelled, disputed]
completed → [] (TERMINAL)
cancelled → [] (TERMINAL)
disputed → [] (TERMINAL)
```
Enforced client-side AND server-side via SECURITY DEFINER atomic RPCs with row-level locking + advisory locks.

### Security Layers (top to bottom)
1. **CSP headers** (Vercel config) — HSTS, X-Frame-Options DENY, nosniff
2. **Client permission engine** — `src/lib/permissionEngine.ts` with audit logging
3. **Input sanitization** — DOMPurify with two policies (plainText, limitedHtml)
4. **Upload validation** — MIME type normalization + magic byte signature verification + extension blocklist + rate limiting + path sanitization
5. **Supabase RLS** — On all tables, with SECURITY DEFINER `is_admin()` to avoid recursion
6. **Atomic RPCs** — `pg_advisory_xact_lock` + `FOR UPDATE` row locking for all financial mutations
7. **Edge functions** — Two-client pattern (user-scoped auth + service-role DB), CORS restricted, audit logging
8. **Webhook HMAC** — SHA-256 with constant-time comparison for payment callbacks

---

## STRENGTHS (Top 10)

1. **Security architecture is exceptional** — Magic-byte upload validation, SECURITY DEFINER RPCs with locking, comprehensive RLS, CSP, PKCE, HMAC webhooks. Rare to see this rigor in a Supabase project.
2. **Design system & tokens** — Full pipeline: compiler, compliance audits, migration scripts. CSS custom properties + Tailwind + `cn()` utility. Workspace-aware theming.
3. **Routing guard system** — Composable HOCs with lazy loading, dev-mode validation, route graph metadata.
4. **i18n implementation** — Fully custom zero-dependency. Pluralization via `Intl.PluralRules`. Fallback chain. Cross-tab sync. All type-checked.
5. **CI/CD pipeline** — 7 workflows: lint, type-check, unit tests, E2E, visual regression, a11y strict, security headers, DB backup, release control.
6. **Separation of concerns** — Clear domain-driven folder structure. Services layer isolates all DB access. Components never touch Supabase directly.
7. **Upload security** — MIME normalization + magic byte checking + extension blocklist + rate limiting + path sanitization + audit logging. Best upload policy I've seen.
8. **Contract workflow** — State machine enforced at client AND DB level. Risk guardrails on contract creation. Term locking post-funding. Revision loop limits.
9. **Performance patterns** — Code-split pages, React Query caching, Zustand with sync init for flash-free workspace, singleton Realtime channels, debounce/throttle.
10. **TypeScript strict mode** — `strict: true`, `verbatimModuleSyntax`, type-only imports, Zod for form validation.

---

## ISSUES & TECHNICAL DEBT

### CRITICAL (Fix Before Publish)

| # | Issue | File(s) | Detail |
|---|---|---|---|
| 1 | `test-admin.html` deploys to production | `public/test-admin.html` | ✅ ALREADY RESOLVED — file does not exist on disk |
| 2 | Domain mismatch | `sitemap.xml`, `robots.txt` | ✅ ALREADY RESOLVED — both use `workedin.tn` |
| 3 | Service role key with `VITE_` prefix | `.env`, `scripts/inspect_db.js`, `scripts/reseed_database.js`, `.env.payments.example` | ✅ FIXED — renamed to `SUPABASE_SERVICE_ROLE_KEY` in .env + both scripts. Removed `VITE_FLOUCI_APP_SECRET` from .env.payments.example |
| 4 | `user-scalable=no` in viewport | `index.html:14` | ✅ ALREADY RESOLVED — viewport has `width=device-width, initial-scale=1.0, viewport-fit=cover` only |

### HIGH

| # | Issue | File(s) | Detail |
|---|---|---|---|
| 5 | No timeouts in 7/9 services | `services/profiles.ts`, `contracts.ts`, `proposals.ts`, `notifications.ts`, `payments.ts`, `reviews.ts`, `dhmad.ts` | ✅ FIXED — added `supabaseWithRetry` to profiles, contracts, proposals, notifications, payments, reviews. `dhmad.ts` skipped (uses edge functions, not DB queries) |
| 6 | Error handling inconsistency — 4 patterns | All `src/services/*.ts` | Some throw, some return `{data,error}`, some return defaults silently, some normalize+rethrow. Pick one |
| 7 | `console.error` in production code | `services/jobs.ts` lines 100,115,163,187,208,229 | ✅ FIXED — replaced all 6 with `logger.error()` |
| 8 | `scratch/` directory (32 debug scripts) | `scratch/` | ✅ FIXED — `git rm -r --cached scratch/` removes from tracking. Already in `.gitignore` |
| 9 | Duplicate AUDIT.md content | `.agent/AUDIT.md` | Same text duplicated (lines 1-55 = lines 56-120) |
| 10 | `LoadingStates.example.tsx` | `src/components/ui/` | ✅ ALREADY RESOLVED — file does not exist |
| 11 | Incomplete barrel exports | `services/index.ts` | ✅ FIXED — added `reviews`, `reports`, `dhmad` |

### MEDIUM

| # | Issue | File(s) | Detail |
|---|---|---|---|
| 12 | AuthContext is 903 lines | `src/contexts/AuthContext.tsx` | Split into `useProfileCache`, `useAuthSession`, `useWorkspaceSync` |
| 13 | Duplicate ErrorBoundary (3 versions) | `ui/`, `common/`, root `components/` | ✅ FIXED — consolidated to `ui/ErrorBoundary.tsx` only. Added error details section. Updated 7 imports. Deleted `common/ErrorBoundary.tsx` and `components/ErrorBoundary.tsx` |
| 14 | God components | `Messages.tsx` (5,410 lines), `ContractWorkspacePage.tsx` (~2,000) | High regression risk |
| 15 | `: any` type usage | 30+ files inc. `Wallet.tsx`, `JobBoard.tsx`, `JobDetail.tsx`, `services/jobs.ts` | Use `unknown` + type guards |
| 16 | Low test coverage thresholds | `vitest.config.ts` | CI passes at 20% statements / 15% branches. Currently 22.4% statements. Needs more tests to reach 60% |
| 17 | Some shallow tests | `services/__tests__/*.test.ts` | Check table name only, not query params |
| 18 | ~~Flaky E2E patterns~~ | ~~`wallet.spec.ts`~~ | ✅ Replaced `if (!isDisabled)` skips with explicit `test.skip` annotations |
| 19 | ~~`waitForTimeout` in E2E~~ | ~~`job-post.spec.ts`~~ | ✅ Replaced with proper wait conditions |
| 20 | Circular chunk dependency | `vite.config.ts` build output | `form-vendor → react-vendor → form-vendor` |
| 21 | `connects_transactions` misleading comment | Migration | Says "server-side only" but policy allows client inserts |

### LOW

| # | Issue | File(s) | Detail |
|---|---|---|---|
| 22 | ~~SkipLinks hardcoded English~~ | ~~`components/layout/SkipLinks.tsx`~~ | ✅ Now uses `tx()` from `useTranslation()` |
| 23 | Color contrast testing skipped | `e2e/a11y-matrix.spec.ts:71` | Tracked as V1.1 design debt |
| 24 | ~~`useMediaQuery` optimization~~ | ~~`hooks/useMediaQuery.ts`~~ | ✅ Removed `matches` from dependency array |
| 25 | ~~Missing `useMemo` for computed booleans~~ | ~~`hooks/useContractState.ts`~~ | ✅ Added `useMemo` for `canDeliver`, `canAccept`, `canDispute`, `canCancel` |
| 26 | ~~Duplicate debounce implementation~~ | ~~`hooks/useDebounce.ts`, `hooks/useAutosave.tsx`~~ | ✅ Extracted callback debounce to `useDebouncedCallback.ts` |
| 27 | ~~Unused `infrastructure.test.ts`~~ | ~~`src/test/`~~ | ✅ Deleted (tested `true === true`) |
| 28 | Hardcoded admin email in migration | `20260326020000_grant_admin.sql` | `wacimabdelli01@gmail.com` committed to repo |
| 29 | `VITE_FLOUCI_APP_SECRET` in example | `.env.payments.example:12` | TODO says move to server-side. If used naively, secret leaks in client bundle |
| 30 | Hardcoded Supabase fallback URL | `lib/supabase.ts:20-21` | `'https://your-project.supabase.co'` — fails open in dev |
| 31 | `Message` type duplicated | `types/index.ts` + `services/messages.ts` | Keep one source of truth |
| 32 | ~~`types/index.ts` is 537 lines~~ | ~~Mixes types, constants, helpers~~ | ✅ Split into `enums.ts`, `attachments.ts`, `profile.ts`, `job.ts`, `messaging.ts`, `constants.ts` — barrel `index.ts` re-exports |
| 33 | `services/messages.ts` is 844 lines | Too dense | Split conversations / messages / realtime |

---

## SERVICES LAYER ANALYSIS

### Files
| File | Lines | Timeouts? | Retry? | Error Pattern |
|---|---|---|---|---|
| `jobs.ts` | 247 | Manual Promise.race (8s) | No | Returns defaults on error |
| `proposals.ts` | 265 | ❌ | No | Normalizes + returns result object |
| `contracts.ts` | 217 | ❌ | Custom schema retry | Returns result object |
| `messages.ts` | 844 | ✅ via supabaseWithRetry | 401-only | Normalizes + returns result object |
| `payments.ts` | 236 | ❌ | No | Raw Supabase — minimal error handling |
| `profiles.ts` | 236 | ❌ | No | Mixed (some throw, some return null) |
| `notifications.ts` | 99 | ❌ | No | Throws |
| `reports.ts` | 91 | ✅ via supabaseWithRetry | 401-only | Normalizes + returns result object |
| `reviews.ts` | 13 | ❌ | No | Raw RPC result |
| `dhmad.ts` | 236 | ❌ | No | Raw response |

### Global Fix Needed
- Standardize ALL services on `{ data, error }` return pattern (Go-style)
- Replace `Promise.race` boilerplate in `jobs.ts` with `withTimeout()` from `lib/supabase.ts`
- Add `supabaseWithRetry` to ALL services (timeout + 401 retry)
- Add transient error retry (5xx, network) with exponential backoff
- Add error normalization to `payments.ts` and `contracts.ts`

---

## HOOKS LAYER ANALYSIS

23 custom hooks. Key findings:

| Hook | Lines | Quality |
|---|---|---|
| `useContractState.ts` | 756 | **Needs splitting** — handles entire contract lifecycle |
| `useRealtimeChat.ts` | 362 | Solid — optimistic sending, exponential backoff retry |
| `useAuthRateLimit.ts` | Medium | Stale closure bug: `attempts` in dependency array |
| `useMediaQuery.ts` | Low | `matches` in deps — causes unnecessary re-subscription |
| `useDebounce.ts` | 15 | Clean and reusable |
| `useInfiniteScroll.ts` | 17 | Clean and reusable |

### Patterns
- All async actions wrapped in `useCallback`
- Proper cleanup: `supabase.removeChannel`, `clearTimeout`, `URL.revokeObjectURL`
- Most hooks use `logger` (not `console.error`)
- Inconsistent error typing: most use `Error | null`, some use `string | null`
- `useMemo` underused: only 2 instances across all hooks

---

## STATE MANAGEMENT

| Layer | Tool | File(s) |
|---|---|---|
| Auth | React Context | `contexts/AuthContext.tsx` |
| Workspace mode | Zustand | `lib/workspaceState.ts` |
| Server state | React Query | `lib/queryClient.ts` |
| Theme | React Context | `contexts/ThemeContext.tsx` |
| Notifications | React Context | `contexts/NotificationsContext.tsx` |
| Presence | Singleton (module-level) | `hooks/usePresence.ts` |

### Cache Strategy (Auth)
1. First render: hydrate from `sessionStorage` profile cache (instant)
2. Background: fetch fresh profile from Supabase
3. On change: update localStorage + sync to `profiles` table
4. 12-second safety timeout forces `isProfileReady = true`

---

## SECURITY POSTURE

### Confirmed Good
- DOMPurify sanitization on all HTML rendering
- HMAC-SHA256 webhook verification with constant-time comparison
- RLS on all tables with SECURITY DEFINER admin function
- PKCE auth flow (no implicit flow)
- Upload policy: blocked extensions + MIME normalization + magic byte validation + rate limiting
- CSP headers: HSTS, X-Frame-Options DENY, nosniff, upgrade-insecure-requests
- Zero `@ts-ignore` in entire codebase
- Service role key never in frontend source

### Monitor
- `unsafe-inline` in CSP script-src (required by Vite, weakens XSS protection)
- `isLocalDevOrigin()` allows any localhost — verify unreachable in production
- Console logging in edge functions may log sensitive request data

---

## TESTING SUMMARY

| Layer | Framework | Count |
|---|---|---|
| Unit/Integration | Vitest + testing-library | 69 files, 745+ tests |
| E2E | Playwright | 11 spec files |
| Visual Regression | Playwright | 6 screenshots |
| Accessibility | Playwright + axe-core | 6 flows |

### CI Pipeline (`.github/workflows/ci.yml`)
1. Design Token Compliance
2. Dependency Vulnerability Audit
3. ESLint
4. Avatar Consistency Audit
5. i18n Strict Audit
6. TypeScript Type Check (`tsc --noEmit`)
7. Unit Tests with Coverage (18% function threshold, ~22% actual)
8. Build with Bundle Budgets
9. Preview Server + Security Headers
10. Strict Accessibility E2E

---

## QUICK REFERENCE

| What | Where |
|---|---|
| Supabase client | `src/lib/supabase.ts` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Contract logic | `src/lib/contractWorkflow.ts` |
| Upload policies | `src/lib/uploadPolicy.ts` |
| Sanitization | `src/lib/sanitization.ts` |
| Permission engine | `src/lib/permissionEngine.ts` |
| Route definitions | `src/routes/routeDefinitions.tsx` |
| Route constants | `src/lib/routes.ts` |
| Design tokens | `design-system/` |
| Edge functions | `supabase/functions/*/index.ts` |
| Migrations | `supabase/migrations/*.sql` |
| Tests | `src/**/*.test.{ts,tsx}` + `e2e/*.spec.ts` |
| Logger | `src/lib/logger.ts` |
| Validation | `src/lib/validateEnv.ts` |
| Query client | `src/lib/queryClient.ts` |
| Workspace state | `src/lib/workspaceState.ts` |
| Barrel services | `src/services/index.ts` |
| Barrel UI | `src/components/ui/index.ts` |
| i18n provider | `src/i18n/index.tsx` |

---

## FIX ROADMAP (Suggested Order)

### Phase 1 — Safety (before publish)
- [ ] Delete `public/test-admin.html`
- [ ] Fix domain in `sitemap.xml` and `robots.txt`
- [ ] Remove `VITE_` prefix from service role key, rotate
- [ ] Remove `user-scalable=no` from `index.html`
- [ ] Add `scratch/` to `.gitignore`
- [ ] Add `start_url: "/"` to `manifest.json`

### Phase 2 — Consistency (medium effort, high quality impact)
- [ ] Standardize error handling across all services (`{data, error}` pattern)
- [ ] Add `supabaseWithRetry` + timeouts to ALL 9 services
- [ ] Replace `console.error` with `logger.error` in `services/jobs.ts`
- [ ] Complete barrel exports in `services/index.ts`
- [ ] Consolidate 3 ErrorBoundary components into 1
- [ ] Delete `LoadingStates.example.tsx`

### Phase 3 — Maintainability (when touching related code)
- [x] Split `types/index.ts` into domain files ✅
- [x] Remove duplicate `useDebounce` in `useAutosave.tsx` ✅
- [ ] Split `AuthContext.tsx` into smaller hooks
- [ ] Split `useContractState.ts` (756 lines)
- [ ] Fix `: any` types incrementally
- [ ] Split `services/messages.ts` (844 lines)

### Phase 4 — Quality (ongoing)
- [x] Fix `useMediaQuery` dependency array ✅
- [x] Add `useMemo` for computed booleans in `useContractState.ts` ✅
- [x] Add missing a11y: `aria-label` on RatingStars, `role="status"` on FullScreenLoader ✅
- [x] Extract `withTimeout` into `lib/withTimeout.ts` — fixes 30+ broken test mocks ✅
- [x] Exclude `src/types/` from coverage (type-only files) ✅
- [x] Replace `waitForTimeout` in E2E with proper wait conditions ✅
- [x] Write comprehensive tests for lib files: phone, permissionEngine, profileCompletion, marketplaceAccess, workspaceRoutes, colors, uploadPolicy, schemaValidation, notificationDisplay, contractEvidence, contractChatSafety, adminAccess, jobLinks, errorMessage, timeUtils, jobCategories, avatar, contractWorkflow, audioProcessing, governorates ✅
- [ ] Raise coverage thresholds to 60% (currently 22.4% statements — needs more tests)
- [x] Fix `wallet.spec.ts` flaky skip patterns ✅
- [x] SkipLinks i18n ✅
- [x] Delete unused `infrastructure.test.ts` ✅
- [ ] Add RTL visual regression tests

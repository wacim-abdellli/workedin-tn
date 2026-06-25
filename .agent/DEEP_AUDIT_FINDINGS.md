# Agent Audit Findings — Raw Deep Dives (June 2026)

> These are the raw findings from 4 parallel agent deep-dives. Use as reference for fixing issues.

---

# AGENT 1: SECURITY & INFRASTRUCTURE

## Supabase Migrations — Database Schema & RLS

### Key Tables and RLS Posture

| Table | RLS Enabled | Policy Quality | Notes |
|---|---|---|---|
| `profiles` | Yes | Good — per-owner + admin_all via `is_admin()` SECURITY DEFINER | email, phone, is_admin, account_status protected by view layer |
| `public_profiles` (VIEW) | N/A | Excellent — only safe columns exposed | Omits email, phone, is_admin, account_status, cin_submitted, onboarding_completed, preferred_language |
| `jobs` | Yes | Good — public read for open/visible, owner CRUD, admin all | |
| `proposals` | Yes | Good — uses `is_job_owner()` SECURITY DEFINER to avoid recursion | |
| `contracts` | Yes | Excellent — admin_all, risk guardrails before insert | |
| `messages` | Yes | Good — chat safety trigger blocks contact sharing/off-platform payments | |
| `disputes` | Yes | Good — parties see own, admin only can update/resolve | |
| `identity_verifications` | Yes | Good — users see own, admin delete | cin_number, docs URLs exposed |
| `wallets` | Yes | Good — users see own, admin all | |
| `withdrawals` | Yes | Good — own inserts, own reads | |
| `payment_audit_log` | Yes | Excellent — SELECT own only, NO INSERT/UPDATE/DELETE from client | |
| `security_audit_logs` | Yes | Good — server-side insert, users can read own | |
| `notifications` | Yes | Good — own select/update, admin all | |
| `reports` | Yes | Good — rate-limited (5/hr), self-report blocked at DB trigger level | |
| `contract_change_requests` | Yes | Good — contract parties read, admin all | |
| `conversations` | Yes | Good — participant-only access | |
| `connects_transactions` | Yes | Good — freelancer sees own, service role inserts | |

### Critical RLS Architecture Decisions

- **`is_admin()` SECURITY DEFINER function** — Bypasses RLS recursion that originally caused `42P17 infinite recursion` errors. Used across all `admin_all_*` policies.
- **`public_profiles` view** — Intentionally omits sensitive columns. Recommended Supabase pattern.
- **`caller_can_post_jobs()`** — Prevents freelancer-only accounts from posting jobs via direct API calls by checking `user_type IN ('client', 'both')`.
- **Self-report prevention** — `NOT (reported_type = 'user' AND reported_id = auth.uid())` enforced in RLS.
- **Report rate limiting** — Max 5 reports per hour per user via `BEFORE INSERT` trigger.
- **Contract risk guardrails** — Blocks high-risk combinations (new accounts + high value + unverified identities) at DB level.
- **Contract term locking** — Once funded, core terms are immutable; changes require formal change request.
- **Revision loop limits** — Hard limit of 2 revision rounds per contract by default.
- **Contract chat safety trigger** — Blocks contact sharing (WhatsApp, Telegram, email, phone) and off-platform payment requests at DB insert time.
- **Withdrawal minimum constraint** — `amount >= 20` enforced at DB constraint level.
- **Atomic RPCs** — All state-changing operations are `SECURITY DEFINER` functions with `auth.uid()` verification, `FOR UPDATE` row locking, `pg_advisory_xact_lock` for concurrency, strict status/role guards.

### Migration Concerns

1. **`profiles` table still has `SELECT USING (true)` policy** in earlier migrations (`20260326010000_fix_profiles_rls.sql` line 20-22). Hardened by view-based approach but verify the old policy is dropped.
2. **Several admin RLS policies use `EXISTS` subquery** instead of `public.is_admin()` SECURITY DEFINER — could recurse if profiles RLS queries back.
3. **`connects_transactions` INSERT policy** comment says "server-side only" but policy allows `auth.uid() = freelancer_id`.
4. **Seed file has hardcoded test client UUID** and `demo-client@khedma.tn` — should be in production.
5. **`grant_admin.sql`** has hardcoded admin email `wacimabdelli01@gmail.com` committed to repo.

---

## Permission Engine (`src/lib/permissionEngine.ts`)

- Comprehensive client-side access control layer
- **Audit logging**: Every access violation logged to `security_audit_logs`
- **Workspace spoofing detection**: `resolveWorkspace()` detects unauthorized workspace mode requests
- **Suspension check**: `isSuspended()` checks `account_status` in `{'suspended', 'archived'}`
- **Concern**: Client-side only (defense-in-depth). Fire-and-forget audit log calls can be silently lost.

---

## Sanitization (`src/lib/sanitization.ts`)

- Uses DOMPurify (well-maintained XSS prevention library)
- Two policies: `plainText` (strip all tags) and `limitedHtml` (allow safe tags: b, strong, i, em, u, br, p, ul, ol, li, a, code)
- `ALLOW_DATA_ATTR: false`, `ALLOW_UNKNOWN_PROTOCOLS: false`
- `FORBID_TAGS: ['style', 'script']`, `FORBID_ATTR: ['style']`
- **Potential risk**: `href` on `a` tags allows `javascript:` protocol. Mitigated by `ALLOW_UNKNOWN_PROTOCOLS: false` but consider explicit `ALLOWED_URI_REGEXP`.

---

## Upload Policy (`src/lib/uploadPolicy.ts`)

**One of the strongest security layers in the project.**

- **5 distinct bucket policies**: avatars (5MB, image-only), attachments (10MB), contract-files (100MB, not public), message_attachments (15MB, public), identity-documents (8MB, not public)
- **Extension blocklist**: html, htm, js, mjs, cjs, jsx, ts, tsx, php, exe, dll, sh, bat, cmd, ps1, jar, msi, apk, com, scr
- **MIME type normalization**: canonicalizes aliases (e.g., `audio/x-wav` → `audio/wav`)
- **Magic byte signature verification**: validates file content against expected headers for 30+ file types
- **Path sanitization**: strips path traversal characters, limits to 80 chars, removes leading dots
- **User scope enforcement**: `requireUserPrefix` forces paths under user ID
- **Rate limiting**: avatars 8/10min, identity-documents 6/60min

### Upload Policy Concerns
- `message_attachments` bucket is public-read + any authenticated user can upload → potential abuse for arbitrary file hosting
- `contract-files` has broad MIME type list including `application/octet-stream`
- `message_attachments` rate limit is generous (40 per 10 min)
- Edge function fallback (`uploadFileDirectly`) bypasses magic-byte validation

---

## Contract Workflow (`src/lib/contractWorkflow.ts`)

Clear state machine:
```
pending_payment → [active, cancelled, disputed]
active → [delivery_submitted, cancelled, disputed]
delivery_submitted → [active, revision_requested, completed, cancelled, disputed]
revision_requested → [delivery_submitted, cancelled, disputed]
completed → [] (TERMINAL)
cancelled → [] (TERMINAL)
disputed → [] (TERMINAL)
```
Client-side state machine. Real enforcement is in DB RPCs. Correct architecture.

---

## Supabase Client (`src/lib/supabase.ts`)

- **Two clients**: `supabaseAnon` (no session persistence) + `supabase` (PKCE flow, session persistence)
- **PKCE flow** (`flowType: 'pkce'`) — most secure OAuth flow for SPAs
- **Stale session purging** — proactively removes expired tokens on init
- **`withTimeout()` wrapper** — all async ops have 15s default timeout
- **File upload through Edge Function** — routes through `secure-upload` rather than direct upload
- **Smart fallback**: direct upload only for specific buckets if edge function fails
- **Dynamic timeout**: scales with file size `min(max(5000 + (fileSizeKB * 5), 15000), 600000)`

### Concerns
- Hardcoded fallback URL/keys at lines 20-21 (`'https://your-project.supabase.co'`)
- `uploadFileDirectly` fallback bypasses edge function's magic-byte validation

---

## Edge Functions (Supabase)

### Common Security Patterns
- CORS restricted to ALLOWED_ORIGINS env var
- Two-client pattern: user-scoped for auth + service-role for DB ops
- 401 on auth failure, 403 on permission failure, 400 on validation
- Structured JSON error responses
- Audit logging to appropriate tables

### `secure-upload`
- Rate limiting via `upload_audit_log`
- Magic byte validation via `validateUploadPayload`
- Scope validation (conversation membership for message_attachments, path structure for contract-files)
- Path sanitization server-side
- IP address tracking via `x-forwarded-for`

### `admin-user-control`
- `assertAdmin()` checks `is_admin` flag
- Audit logging via `logAdminAction()`
- Soft delete: nulls sensitive fields, anonymizes username, bans auth user for 100 years
- Hard delete guard: only super admins, checks for contracts/transactions/disputes
- Self-deletion protection + super admin protection

### `dhmad-webhook`
- HMAC-SHA256 signature verification with constant-time comparison
- Production-only enforcement (dev skips verification)
- Idempotent processing (unknown escrows return 200, not 404)

### `flouci-verify-payment`
- Contract ownership verification
- Freelancer match verification
- Transaction integrity checks
- Idempotency guard for already-completed payments
- Audit logging

### `cron-process-timeouts`
- CRON_SECRET authentication
- 14-day auto-release, 72-hour pending payment expiry, review reminders, 48-hour escrow clearance

---

## Vercel Deployment & Security Headers

### CSP
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://*.supabase.co https://app.posthog.com https://*.sentry.io;
worker-src 'self' blob:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://app.posthog.com https://*.sentry.io wss://*.supabase.co;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
media-src 'self' blob:;
object-src 'none';
upgrade-insecure-requests;
```

### Headers
| Header | Value |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(self), geolocation=()` |

### CSP Analysis
- `'unsafe-inline'` in script-src required by Vite/React (weakens XSS but accepted tradeoff)
- `frame-ancestors 'none'` prevents clickjacking
- `upgrade-insecure-requests` forces HTTPS

---

## Environment & Secrets

- `.env` and `.env*.local` in `.gitignore` — prevents secret leakage
- `.env.example` clearly separates client vs server secrets
- `validateEnv.ts` throws in production if VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing

### Concerns
- `.env.payments.example` has `VITE_FLOUCI_APP_SECRET` with TODO to move server-side — if used in production, secret leaks in client bundle
- Hardcoded placeholder fallback values in `supabase.ts`

---

# AGENT 2: i18n & ACCESSIBILITY

## i18n Architecture (`src/i18n/index.tsx`)

### Pattern
- React Context-based i18n (no third-party library like react-intl or i18next)
- Provider at app root with `defaultLanguage='ar'` (Arabic primary)

### Languages
| Code | File | Lines | Role |
|---|---|---|---|
| `ar` | `src/i18n/ar.ts` | 5541 | Source of truth, defines `Translations` type |
| `fr` | `src/i18n/fr.ts` | 5538 | Fully mirrored |
| `en` | `src/i18n/en.ts` | 5538 | Fully mirrored |

### Features
- **Dot-notation key lookup** via `getNestedValue()` — supports `pages.errorBoundary.title` style paths
- **String interpolation** with `{{varName}}` syntax
- **Robust fallback chain**: primary language → en → ar → fr → explicit fallback → raw key
- **DEV-mode missing key warnings** — warns once per key per language
- **Pluralization** via `txPlural()` using native `Intl.PluralRules` — supports zero/one/two/few/many/other
- **localStorage persistence** with key `i18n-language`, migration from legacy `language` key
- **Browser language detection** via `navigator.language`
- **Cross-tab sync** via `StorageEvent` listener
- **SSR-safe** with `typeof window` / `typeof document` / `typeof navigator` guards

### Type Safety
`Translations` type inferred from `typeof ar` — all other languages typed against it. TypeScript catches missing keys at compile time.

### Context Shape
```typescript
{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  tx: (key, params?, fallback?) => string;
  txPlural: (key, count, params?, fallback?) => string;
  dir: 'rtl' | 'ltr';
}
```

---

## Translation Quality

- Extremely comprehensive — pages, auth, admin, jobs, messages, contracts, payments, settings, onboarding, proposals, filters, verification, support tickets
- Some admin tab labels remain in English across all languages
- **SkipLinks component** has hardcoded English labels — NOT translated
- Some `aria-label` fallback strings hardcoded in English

---

## RTL Support

### Strategy
- `dir = language === 'ar' ? 'rtl' : 'ltr'`
- Applied at document, SEO (Helmet), component, and context levels

### RTL-Aware CSS Patterns Used
- Tailwind logical properties: `start-0`, `end-0`, `ps-11`, `pe-11`, `text-start`, `ms-1`
- `rtl:rotate-180` on directional icons
- Dynamic icon swapping: `dir === 'rtl' ? ArrowLeft : ArrowRight`
- LTR overrides for currency/numbers with `<span dir="ltr">`

### RTL Problem Areas
- `HeaderSearch.tsx` uses `dir === 'rtl' ? 'border-r' : 'border-l'` instead of logical properties
- `NotificationBell.tsx` uses verbose `ltr:-right-2 ltr:sm:right-0 rtl:-left-2 rtl:sm:left-0`
- Some components still use hardcoded `border-l`/`border-r` without RTL equivalent

---

## Accessibility Patterns

### ARIA Attributes Usage
| Attribute | Components |
|---|---|
| `aria-label` | ChatInputArea, MessageBubbleItem, ImageLightbox, ConversationListPanel, MessageAudioPlayer, DocumentUpload, ContractModalsBundle, UserMenu, Header, SearchModal, MobileHeader, AccountPanel, etc. |
| `aria-expanded` | UserMenu, LanguageMenu, ContractContextBar, CustomSelect |
| `aria-haspopup` | UserMenu, LanguageMenu, CustomSelect |
| `aria-modal="true"` | ImageLightbox, ContractDetailsSidebar, MobileHeader, ContractModals |
| `aria-labelledby` | AccountStatusGate, ContractModals, PaymentModal |
| `aria-describedby` | Input, Checkbox, Radio, CustomSelect |
| `aria-invalid` | Input, Checkbox, Radio, CustomSelect |
| `aria-busy` | Button, ProgressBar |
| `aria-selected` | PaymentModal, CustomSelect |
| `aria-checked` | UserMenu |
| `aria-valuenow/min/max` | ProgressBar |
| `aria-live` | ChatSection ("polite"), PaymentModal ("assertive"/"polite") |
| `aria-hidden` | CustomCursor, MessageBubbleItem, HeroSection, ProfileHeader |
| `aria-controls` | PaymentModal |
| `aria-disabled` | PaymentMethodCard |

### Landmark Roles
| Role | Components |
|---|---|
| `role="dialog"` | Modal, ImageLightbox, ContractDetailsSidebar, ContractModals, MobileHeader |
| `role="tablist"` / `"tab"` / `"tabpanel"` | PaymentModal |
| `role="menu"` / `"menuitem"` | UserMenu, LanguageMenu |
| `role="switch"` | UserMenu (online status, dark mode) |
| `role="progressbar"` | ProgressBar |
| `role="listbox"` / `"option"` | CustomSelect, ProposalFiltersSidebar |
| `role="alert"` | Input, Checkbox, Radio, Select, Toggle, CustomSelect, ReportButton |
| `role="status"` | ChatSection, PaymentModal, Spinner, Skeleton, Toast |
| `role="log"` | ChatSection (chat messages) |
| `role="group"` | Reviews, UserMenu |
| `role="button"` | ConversationListPanel, SimilarJobCard, OnboardingStep1, PaymentMethodCard |

### Focus Management

**SkipLinks**: Two links (`#main-content`, `#main-nav`), hidden off-screen, slides into view on `:focus`. Labels hardcoded English.

**Modal**: Full focus trapping (Tab/Shift+Tab), Escape closes, moves focus to first element on open, restores on close, `tabIndex={-1}` on dialog, `useId()` for accessible title.

**UserMenu**: ArrowUp/Down navigation, Escape closes + returns focus, Tab trapping, proper `aria-expanded`/`aria-haspopup`.

**LanguageMenu**: ArrowUp/Down, Escape, Enter/Space toggle, full role pattern.

**Focus Styles**: `focus-visible:ring-2` pattern consistently used.

---

## A11y E2E Tests (`e2e/a11y-matrix.spec.ts`)

### Coverage (6 test cases)
1. Login shell — landmarks + keyboard + axe scan
2. Client dashboard
3. Freelancer dashboard
4. Job post flow
5. Admin access denied
6. Suspended account gate

### Custom Helpers
- `expectGlobalKeyboardEntry(page)` — Tabs from body, asserts focused element is focusable tag with visible indicator
- `expectLandmarks(page, expected)` — Asserts `<main>`, `<h1>`, `<nav>`, `<header>` counts
- `expectNoSeriousAxeViolations(page, label, skipColorContrast?)` — Runs axe-core with wcag2a + wcag2aa tags

### Gaps
- Color contrast violations explicitly skipped (tracked as V1.1 design debt)
- No RTL a11y tests
- No automated RTL visual regression

---

## ErrorBoundary — 3 Duplicates

| Version | File | Lines | Notes |
|---|---|---|---|
| A (App.tsx) | `components/ui/ErrorBoundary.tsx` | 158 | Full-page premium screen, Sentry, workspace-aware, RTL |
| B (deprecated) | `components/common/ErrorBoundary.tsx` | 95 | Manual if/else language detection, hardcoded strings, no RTL dir |
| C (enhanced) | `components/ErrorBoundary.tsx` | 121 | Similar to A, no Sentry, different retry approach |

**Recommendation**: Consolidate to version A only.

---

# AGENT 3: HOOKS & CODING PATTERNS

## Hooks Directory (`src/hooks/`)

23 custom hooks total. Key files:

| Hook | Lines | Complexity |
|---|---|---|
| `useContractState.ts` | 756 | High — entire contract lifecycle |
| `useRealtimeChat.ts` | 362 | High — chat with optimistic sending, typing, pagination |
| `useRealtimeNotifications.ts` | High | Realtime + React Query hybrid |
| `useAdminData.ts` | Medium | Admin dashboard stats |
| `useAudioRecorder.ts` | Medium | Audio recording with pause/resume |
| `useAuthRateLimit.ts` | Medium | Brute-force rate limiting |
| `useAuthRealtime.ts` | Medium | Profile changes subscription |
| `useAutosave.tsx` | Medium | Debounced localStorage persistence |
| `useFileUpload.ts` | Medium | Single/multi-file upload with validation |
| `usePresence.ts` | Medium | Global real-time online presence (singleton) |
| `useReadReceipts.ts` | Low | Mark messages as read |
| `useTypingIndicator.ts` | Medium | Broadcast-based typing indicators |
| `useTusUpload.ts` | Medium | Resumable TUS protocol uploads |
| `useVoiceRecording.ts` | Medium | Full voice recording + upload pipeline |
| `useDebounce.ts` | 15 | Low — generic value debouncing |
| `useInfiniteScroll.ts` | 17 | Low — Intersection-based infinite scroll |
| `useMediaQuery.ts` | Low | CSS media query matching |
| `useRouteFocus.ts` | Low | A11y focus management on route changes |
| `useScrollReveal.ts` | Low | IntersectionObserver-based scroll animations |
| `useSessionTimeout.ts` | Low | 30-min idle session timeout |
| `useAnimatedCounter.ts` | Low | Animated number counting |

**No standalone `useAuth.ts`** — auth provided through `AuthContext` via `useAuth()` hook.

---

## Hook Quality

### Strengths
- **Well-defined TypeScript interfaces** — every hook has explicit input options and return types
- **Consistent state shape** — `isLoading` / `is[Action]ing` flags, `error: Error | null`, `reset()` function
- **Comprehensive cleanup** — realtime channels (`removeChannel`), timers (`clearTimeout`), object URLs (`revokeObjectURL`), event listeners (`removeEventListener`)
- **Optimistic updates with rollback** — `useRealtimeChat` implements temp IDs + exponential backoff retry (1s, 2s, 4s)
- **Singleton channel** in `usePresence.ts` — module-level singletons with reference counting avoids multiple WebSocket connections
- **Consistent `logger` usage** — no raw `console.log`

### Issues
- **Inconsistent error typing** — most use `Error | null`, `useVoiceRecording.ts` uses `string | null` with localized Arabic strings
- **`useAuthRateLimit.ts` stale closure bug** — `attempts` in dependency array causes unnecessary re-renders
- **`useContractState.ts` too large (756 lines)** — mixes data fetching, state management, business logic
- **`useMediaQuery.ts` optimization** — `matches` in dependency array causes re-subscription on every match change

---

## State Management Patterns

### Pattern 1: Local useState + Callbacks (Most Common)
Used by: useFileUpload, useVoiceRecording, useTusUpload, useAnimatedCounter, useAuthRateLimit

### Pattern 2: Zustand Global Store
Used by: `workspaceState.ts` — seeds from localStorage, saves changes to localStorage + database asynchronously

### Pattern 3: React Query + Realtime Hybrid
Used by: `useRealtimeNotifications` — combines React Query cache with Supabase Realtime subscriptions. Manipulates query cache via `setQueryData` on incoming events.

### Pattern 4: Context + Hooks (AuthContext)
8 `useState` variables, 5 `useRef` variables (to avoid stale closures in `onAuthStateChange`), multi-layered caching (sessionStorage → localStorage → DB), 12-second safety timeout.

### Pattern 5: Singleton Module-Level State
Used by: `usePresence.ts` — module-level singletons with reference counting for shared WebSocket connection.

---

## Performance Optimizations

### useCallback
Used extensively — 61 instances across all hooks. Every async action wrapped.

### useMemo
Only 2 instances found:
1. `AuthContext.tsx:847` — `availableModes`
2. `useRealtimeNotifications.ts:117` — deduped notifications

**Opportunity**: `canDeliver`, `canAccept`, etc. in `useContractState.ts` should be memoized.

### Other Performance Patterns
- **Debouncing**: `useDebounce.ts`, `useAutosave.tsx` (duplicate), `useReadReceipts.ts` (400ms), `useRealtimeChat` exponential backoff
- **Throttling**: `useTypingIndicator.ts` throttles broadcasts to 3 seconds
- **Caching**: `senderCacheRef` (Map) in `useRealtimeChat`, `conversationIdCache` (Map) in `messages.ts`, `sessionStorage` profile cache in AuthContext
- **Query invalidation**: `useContractState.ts` invalidates `['contract', contractId]` after mutations

---

## Error Handling: Hooks vs Services

### Services Layer
**Pattern: Return-error, never throw**
```typescript
return { data, count, error: null }; // success
return { data: null, count: 0, error: normalizeMessageError(error) }; // failure
```
Go-style error handling. Always returns `{ data, error }` tuples.

### Hooks Layer
**Pattern: Catch and set state, then re-throw**
```typescript
try { ... } catch (err) { setError(err as Error); throw err; }
```
Both catches errors for local state AND re-throws for calling component.

### Asymmetry Issue
Services return `{ data, error }` while hooks throw → error caught twice (once in hook, once in component).

---

# AGENT 4: SERVICES & DATA LAYER

## Services Files

| File | Lines | Purpose |
|---|---|---|
| `index.ts` | 10 | Barrel (namespace re-export) |
| `jobs.ts` | 247 | Job CRUD, filtering, category counts |
| `proposals.ts` | 265 | Proposals CRUD, daily limit, RPC fallback |
| `contracts.ts` | 217 | Contracts + milestones, status workflow |
| `messages.ts` | 844 | Conversations, messaging, attachments, Realtime |
| `payments.ts` | 236 | Wallets, transactions, withdrawals, payment methods, escrow |
| `profiles.ts` | 236 | User profiles, freelancer profiles, favorites, reviews |
| `notifications.ts` | 99 | Notifications CRUD + Realtime subscription |
| `reports.ts` | 91 | Reports CRUD with SupabaseWithRetry |
| `reviews.ts` | 13 | Review submission via RPC |
| `dhmad.ts` | 236 | Third-party escrow (Dhmad), dev-mode mocks |

---

## Error Handling — 4 Inconsistent Patterns

### Pattern A: Throw on error
Used by: `notifications.ts`, `supabase.ts` helpers
```typescript
if (error) throw new Error(error.message);
```

### Pattern B: Return `{ data, error }` result objects
Used by: `messages.ts`, `jobs.ts` (most), `contracts.ts` (some), `proposals.ts` (`createProposal`)
```typescript
return { data: conversations, count: count || 0, error: null };
return { data: null, count: 0, error: normalizeMessageError(error) };
```

### Pattern C: Return defaults on error
Used by: `getJobs`, `getCategoryCounts`, `getFreelancerReviewStats`, `getClientStats`, `getStuckTransactions`
```typescript
return { data: [], count: 0 }; // silent degradation
```

### Pattern D: Normalize and return custom errors
Used by: `reports.ts`, `proposals.ts`, `messages.ts` — dedicated error-normalizer functions convert PostgREST errors to user-friendly messages.

---

## Timeout Handling — 2 Mechanisms

### Mechanism 1: Manual `Promise.race` (legacy, jobs.ts only)
```typescript
const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('getJobs timed out after 8s')), 8000)
);
return await Promise.race([fetchPromise(), timeout]);
```
Hardcoded 8s. Copy-pasted in 4 functions.

### Mechanism 2: `withTimeout()` from `lib/supabase`
```typescript
export async function withTimeout<T>(promise, timeoutMs = 15000, operationName)
```
Used by: `supabaseWithRetry.ts`, `supabase.ts` upload.

### Which services have timeouts?

| Service | Timeout? | Value |
|---|---|---|
| `jobs.ts` | ✅ Manual Promise.race | 8s |
| `messages.ts` | ✅ via supabaseWithRetry | 10-20s |
| `reports.ts` | ✅ via supabaseWithRetry | 15s |
| `contracts.ts` | ❌ | — |
| `proposals.ts` | ❌ | — |
| `profiles.ts` | ❌ | — |
| `notifications.ts` | ❌ | — |
| `payments.ts` | ❌ | — |
| `reviews.ts` | ❌ | — |

**7 of 9 services have NO timeout protection.**

---

## Retry Patterns — `supabaseWithRetry`

Only retry mechanism: retries once after 401 (token expiry) with singleton refresh to prevent concurrent refresh storms.

**Used by**: `messages.ts` (heavy), `reports.ts` (light). **All other services: NOT used at all.**

No retry for transient failures (5xx), no exponential backoff, no network error retry.

---

## Barrel Export Pattern

```typescript
export * as jobsService from './jobs';
export * as proposalsService from './proposals';
export * as contractsService from './contracts';
export * as profilesService from './profiles';
export * as messagesService from './messages';
export * as notificationsService from './notifications';
export * as paymentsService from './payments';
```

### Missing from barrel
- `reviews.ts` ❌
- `reports.ts` ❌
- `dhmad.ts` ❌

---

## Cross-Service Consistency

| Aspect | Assessment |
|---|---|
| File header comment | Consistent — JSDoc per file |
| Import style | Inconsistent — some import `supabase` only, others import `supabaseAnon`, `uploadFile`, `supabaseWithRetry` |
| Function naming | Consistent — `get*`, `create*`, `update*`, `delete*` |
| Return style | Inconsistent — some return `{ data, error }`, some throw, some return raw result |
| Input types | Inconsistent — some typed interfaces, some inline types |
| Constants | Inconsistent — `messages.ts` uses module-level consts, `jobs.ts` hardcodes 8000, others have none |

---

## Notable Service Details

### `messages.ts` (844 lines) — Most Mature
- Comprehensive error normalization (`normalizeMessageError`)
- Consistent `{ data, error }` returns
- Realtime subscriptions
- Permission checks (`canSendMessage`, `canDeleteMessage`)
- Attachment validation
- Rate limit handling

### `contracts.ts` — Clever Two-Phase Hydration
Attempts direct query, falls back to manual hydration when schema cache issues occur (`canRetryWithManualHydration`). Custom retry for PostgREST join syntax failures.

### `dhmad.ts` — Dev-Mode Mocks
Excellent offline development support — full mock implementation of Dhmad escrow API for local testing.

### `payments.ts` — Minimal Error Handling
Most functions return raw Supabase responses with no normalization or fallback. Weakest error handling in the services layer.

---

# SUMMARY OF ALL FINDINGS

## By Severity

### CRITICAL (4 items)
1. `test-admin.html` deploys to production
2. Domain mismatch (khedmetna.tn vs workedin.tn)
3. Service role key with `VITE_` prefix
4. `user-scalable=no` in viewport

### HIGH (7 items)
5. No timeouts in 7/9 services
6. 4 inconsistent error handling patterns across services
7. `console.error` in production code (jobs.ts)
8. `scratch/` directory not in gitignore
9. Duplicate AUDIT.md content
10. `LoadingStates.example.tsx` with console.log
11. Incomplete barrel exports (3 missing)

### MEDIUM (12 items)
12. AuthContext 903 lines
13. 3 duplicate ErrorBoundary components
14. God components (Messages 5,410 lines)
15. `: any` types in 30+ files
16. Low test coverage thresholds (20%)
17. Some shallow tests
18. Flaky E2E patterns
19. `waitForTimeout` in E2E
20. Circular chunk dependency
21. `connects_transactions` misleading comment
22. Duplicate `useDebounce` in `useAutosave`
23. SkipLinks hardcoded English

### LOW (11 items)
24. Color contrast testing skipped
25. `useMediaQuery` optimization
26. Missing `useMemo` for computed booleans
27. Unused `infrastructure.test.ts`
28. Hardcoded admin email in migration
29. `VITE_FLOUCI_APP_SECRET` in example file
30. Hardcoded Supabase fallback URL
31. `Message` type duplicated
32. `types/index.ts` too large (537 lines)
33. `services/messages.ts` too large (844 lines)
34. `services/reviews.ts` not in barrel export

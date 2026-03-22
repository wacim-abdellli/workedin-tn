# KHEDMA TN — Production Roadmap

**Generated:** 2026-03-22  
**Based on:** Full project audit (25 findings)  
**Goal:** Bring Khedma TN from pre-launch MVP to production-ready

---

## PHASE 0 — CRITICAL SECURITY PATCHES
**Do before ANY deployment. No exceptions.**

> [!CAUTION]
> Every task in Phase 0 is a security vulnerability that can be exploited in production. Ship nothing until all 5 are resolved.

---

### 0.1 — Lock Down `send-email` Edge Function

**Files:** [send-email/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/send-email/index.ts)

**Steps:**
1. Add CORS headers (restrict to production domain `https://khedma.tn`)
2. Add auth check — create Supabase client with `Authorization` header, call [getUser()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#124-135), reject if unauthenticated
3. Add input validation — verify `to`, `subject`, [html](file:///c:/Users/pc/Desktop/khedma-tn/stats.html) are present and valid (email format, max length)
4. Add rate limiting header check or use Supabase's built-in function invocation limits
5. Add `@ts-check` — remove `@ts-nocheck` and fix any type errors

**Estimated time:** 1h  
**Dependencies:** None

---

### 0.2 — Add Auth Check to `flouci-verify-payment` Edge Function

**Files:** [flouci-verify-payment/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/flouci-verify-payment/index.ts)

**Steps:**
1. Create a Supabase client using the request's `Authorization` header
2. Call `supabase.auth.getUser()` and reject if not authenticated
3. When `complete_payment` flag is set, verify the authenticated user is actually the `client_id` on the contract before calling the atomic RPC with the service role key
4. Add input validation — `payment_id` must be a non-empty string

**Estimated time:** 1h  
**Dependencies:** None

---

### 0.3 — Add Admin Role Guard to Admin Routes

**Files:**
- [App.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx) (lines 222–235)
- New file: `src/components/routing/AdminRoute.tsx`

**Steps:**
1. Create `AdminRoute` component that wraps [ProtectedRoute](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx#56-70) and additionally checks `profile.user_type` or a dedicated `is_admin` field
   - If no `is_admin` field exists in the DB, add one to the `profiles` table via a new migration
2. Replace `<ProtectedRoute>` wrapper on `/admin` and `/admin/verifications` routes with `<AdminRoute>`
3. Add a redirect to `/` or a "403 Forbidden" page for non-admin users

**Estimated time:** 1h (or 1.5h if adding `is_admin` column + migration)  
**Dependencies:** None

---

### 0.4 — Wrap Payment Routes in ProtectedRoute

**Files:** [App.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx) (lines 198–199)

**Steps:**
1. Change:
```diff
-<Route path="/payment/success" element={<PaymentSuccess />} />
-<Route path="/payment/failed" element={<PaymentFailed />} />
+<Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
+<Route path="/payment/failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />
```

**Estimated time:** 5 min  
**Dependencies:** None

---

### 0.5 — Restrict CORS on Flouci Edge Functions

**Files:**
- [flouci-initiate-payment/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/flouci-initiate-payment/index.ts) (line 11)
- [flouci-verify-payment/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/flouci-verify-payment/index.ts) (line 11)

**Steps:**
1. Replace `'Access-Control-Allow-Origin': '*'` with:
```typescript
'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://khedma.tn'
```
2. Add `ALLOWED_ORIGIN` to Supabase Edge Function secrets (set to `http://localhost:5173` for dev)

**Estimated time:** 15 min  
**Dependencies:** None

---

### Phase 0 Total: ~4.5 hours

---

## PHASE 1 — BUG FIXES
**Fix broken core features.**

---

### 1.1 — Fix Skills Type Mismatch

**Files:**
- [src/types/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/types/index.ts) (lines 49–55, 72–89)
- [src/pages/FreelancerOnboarding.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/FreelancerOnboarding.tsx)
- [src/components/freelancer/profile/SkillsSection.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/components/freelancer/profile/SkillsSection.tsx)
- [supabase/schema_v2.sql](file:///c:/Users/pc/Desktop/khedma-tn/supabase/schema_v2.sql) (line 54 — `skills JSONB` comment)

**Steps:**
1. Decide on canonical format — **recommend keeping the DB format** `{name: string, level: string}` since it's simpler, and mapping to localized names at the UI layer using `PREDEFINED_SKILLS`
2. Create a `SkillEntry` type:
```typescript
export interface SkillEntry {
  name: string; // skill ID or name key
  level: 'beginner' | 'intermediate' | 'expert';
}
```
3. Update `FreelancerProfile.skills` from `Skill[]` to `SkillEntry[]`
4. Update all components that read/write skills to use mapping:
   - On save: convert UI [Skill](file:///c:/Users/pc/Desktop/khedma-tn/src/types/index.ts#49-56) objects to `SkillEntry[]` before writing to DB
   - On load: map `SkillEntry.name` back to full [Skill](file:///c:/Users/pc/Desktop/khedma-tn/src/types/index.ts#49-56) objects using `PREDEFINED_SKILLS` lookup
5. Test: save skills in onboarding, verify they appear on profile page

**Estimated time:** 2h  
**Dependencies:** None

---

### 1.2 — Add INSERT Policy for Notifications

**Files:**
- New migration: `supabase/migrations/20260322_fix_notifications_insert.sql`
- [supabase/schema_v2.sql](file:///c:/Users/pc/Desktop/khedma-tn/supabase/schema_v2.sql) (sync)

**Steps:**
1. Create migration:
```sql
-- Option A: Allow authenticated users to insert notifications (for system-triggered events)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Option B (more secure): Only allow via SECURITY DEFINER function
-- Create function create_user_notification() with SECURITY DEFINER
```
2. Update [schema_v2.sql](file:///c:/Users/pc/Desktop/khedma-tn/supabase/schema_v2.sql) to include the new policy
3. Test: trigger a notification-creating action (e.g., submit a proposal) and verify the notification row appears

**Estimated time:** 30 min  
**Dependencies:** None

---

### 1.3 — Fix Profile Fallback Name for Non-Arabic Users

**Files:**
- [supabase/schema_v2.sql](file:///c:/Users/pc/Desktop/khedma-tn/supabase/schema_v2.sql) (line 575 — `handle_new_user()`)
- New migration to update the trigger

**Steps:**
1. Update `handle_new_user()` to use the user's preferred language:
```sql
COALESCE(
  NEW.raw_user_meta_data->>'full_name',
  CASE COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
    WHEN 'fr' THEN 'Nouvel utilisateur'
    WHEN 'en' THEN 'New User'
    ELSE 'مستخدم جديد'
  END
)
```
2. Create a migration with `CREATE OR REPLACE FUNCTION handle_new_user()` containing the fix
3. Test: sign up with `preferred_language: 'en'` and verify profile name is "New User"

**Estimated time:** 30 min  
**Dependencies:** None

---

### 1.4 — Remove Duplicate `/post-job` Route

**Files:** [App.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx) (lines 160–164)

**Steps:**
1. Remove the duplicate route:
```diff
-<Route path="/post-job" element={
-  <ProtectedRoute>
-    <JobPost />
-  </ProtectedRoute>
-} />
```
2. Search codebase for any `<Link to="/post-job">` references and replace with `/jobs/new`
3. Add a redirect in case old bookmarks exist:
```tsx
<Route path="/post-job" element={<Navigate to="/jobs/new" replace />} />
```

**Estimated time:** 15 min  
**Dependencies:** None

---

### 1.5 — Remove [directInsert()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#53-116) Hack (Investigate + Fix)

**Files:** [src/lib/supabase.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts) (lines 57–115)

**Steps:**
1. Identify all call sites of [directInsert()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#53-116) — grep the codebase
2. Test if the official Supabase `.insert()` works now (the original bug may have been caused by an old `@supabase/supabase-js` version)
3. If the official client works:
   - Replace all [directInsert()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#53-116) calls with standard `.insert()` calls
   - Delete the [directInsert()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#53-116) function and the [withTimeout()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#25-52) wrapper if no longer needed
4. If the official client still hangs:
   - Update `@supabase/supabase-js` to latest version
   - Check Supabase Realtime config (`eventsPerSecond: 10`) — reduce or disable if causing issues
   - If still broken, keep [directInsert()](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#53-116) but add proper error handling and token refresh logic
5. Test: perform a freelancer onboarding save multiple times in a row

**Estimated time:** 2h  
**Dependencies:** None

---

### Phase 1 Total: ~5.5 hours

---

## PHASE 2 — ARCHITECTURE REFACTOR
**Reduce long-term pain. Do after bugs are fixed.**

---

### 2.1 — Create API/Service Layer

**Files:**
- New directory: `src/services/`
- New files: `src/services/jobs.ts`, `src/services/proposals.ts`, `src/services/contracts.ts`, `src/services/profiles.ts`, `src/services/payments.ts`, `src/services/messages.ts`, `src/services/notifications.ts`

**Steps:**
1. Create `src/services/` directory
2. For each domain, extract all `supabase.from('table')` calls from page components into service functions:
```typescript
// src/services/jobs.ts
export async function getJobs(filters: JobFilters) { ... }
export async function getJobById(id: string) { ... }
export async function createJob(data: CreateJobInput) { ... }
export async function updateJob(id: string, data: Partial<Job>) { ... }
```
3. Update all 33 page components to import from `src/services/` instead of calling `supabase` directly
4. Pages should only have import from `@/services/*` — never from `@/lib/supabase` directly

**Estimated time:** 6h  
**Dependencies:** 1.5 (directInsert removal)

---

### 2.2 — Add React Query for Data Fetching

**Files:**
- [package.json](file:///c:/Users/pc/Desktop/khedma-tn/package.json) (add `@tanstack/react-query`)
- [src/App.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx) (add `QueryClientProvider`)
- All page components (refactor `useState` + `useEffect` to `useQuery`)

**Steps:**
1. Install: `npm install @tanstack/react-query`
2. Create `src/lib/queryClient.ts` with default config:
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});
```
3. Wrap [App](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx#269-288) in `<QueryClientProvider>`
4. Convert page-level data fetching to `useQuery`:
```typescript
// Before:
const [jobs, setJobs] = useState([]);
useEffect(() => { fetchJobs().then(setJobs) }, []);

// After:
const { data: jobs, isLoading, error } = useQuery({
  queryKey: ['jobs', filters],
  queryFn: () => jobsService.getJobs(filters),
});
```
5. Start with the 5 most-visited pages: `JobBoard`, `JobDetail`, `FreelancerDashboard`, `ClientDashboard`, [FreelancerProfile](file:///c:/Users/pc/Desktop/khedma-tn/src/types/index.ts#72-90)
6. Use `useMutation` for write operations (job creation, proposal submission)

**Estimated time:** 6h  
**Dependencies:** 2.1 (service layer)

---

### 2.3 — Add Server-Side Business Logic Validation

**Files:**
- New Edge Functions or Supabase DB functions
- New migration(s)

**Steps:**
1. Identify the 3 most critical business rules that must be server-side:
   - **Proposal submission**: Verify freelancer hasn't already submitted, verify job is still `open`, validate `bid_amount` is within `budget_min`/`budget_max`
   - **Contract creation**: Verify proposal exists and is `pending`, verify caller is the job's `client_id`
   - **Escrow release**: Verify milestone is `submitted`, verify caller is the contract's `client_id`
2. Implement as PostgreSQL functions with `SECURITY DEFINER`:
```sql
CREATE OR REPLACE FUNCTION submit_proposal(
  p_job_id UUID, p_freelancer_id UUID,
  p_cover_letter TEXT, p_bid_amount DECIMAL, p_delivery_days INT
) RETURNS UUID AS $$
DECLARE
  v_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job.status != 'open' THEN RAISE EXCEPTION 'Job is not open'; END IF;
  IF p_bid_amount < v_job.budget_min THEN RAISE EXCEPTION 'Bid too low'; END IF;
  -- ... insert and return
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
3. Update frontend service layer to call `supabase.rpc()` instead of direct `.insert()`

**Estimated time:** 4h  
**Dependencies:** 2.1 (service layer)

---

### 2.4 — Remove Zustand (Dead Dependency)

**Files:** [package.json](file:///c:/Users/pc/Desktop/khedma-tn/package.json)

**Steps:**
1. Verify zero imports: `grep -r "zustand" src/` (already confirmed)
2. Run `npm uninstall zustand`
3. Verify build passes: `npm run build`

**Estimated time:** 5 min  
**Dependencies:** None

---

### 2.5 — Add Pagination to List Views

**Files:**
- [src/pages/JobBoard.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/JobBoard.tsx)
- [src/pages/FindFreelancers.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/FindFreelancers.tsx)
- [src/pages/Messages.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/Messages.tsx)
- Service layer files from 2.1

**Steps:**
1. Add `.range(from, to)` to all list queries in the service layer
2. Create a `usePagination` hook or use React Query's `useInfiniteQuery`
3. Add UI pagination controls (or infinite scroll using existing `useInfiniteScroll` hook)
4. Start with `JobBoard` (highest traffic), then `FindFreelancers`, then [Messages](file:///c:/Users/pc/Desktop/khedma-tn/src/lib/supabase.ts#191-205)

**Estimated time:** 3h  
**Dependencies:** 2.1, 2.2

---

### 2.6 — Add Rate Limiting

**Files:**
- New Edge Functions or Supabase DB functions
- Or: implement client-side throttle as a stopgap

**Steps:**
1. **Stopgap (client-side):** Add debounce/throttle to:
   - Proposal submission — disable button after submit, prevent double-click
   - Message sending — throttle to 1 message/second
   - Job creation — disable after first submission
2. **Proper solution (server-side):** Add a `rate_limits` table or use PostgreSQL function that checks `created_at` timestamps:
```sql
-- In submit_proposal():
IF (SELECT COUNT(*) FROM proposals
    WHERE freelancer_id = p_freelancer_id
    AND created_at > NOW() - INTERVAL '1 minute') > 5
THEN RAISE EXCEPTION 'Rate limit exceeded';
END IF;
```

**Estimated time:** 2h  
**Dependencies:** 2.3 (server-side validation)

---

### 2.7 — Add Payment Retry/Reconciliation

**Files:**
- [src/pages/PaymentSuccess.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/PaymentSuccess.tsx)
- New admin tool or Edge Function

**Steps:**
1. Add a "stuck payment" detection query in `AdminDashboard`:
```sql
SELECT * FROM transactions
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';
```
2. Add a manual "retry" button in the admin panel that re-calls `complete_escrow_payment` RPC
3. Add [PaymentSuccess](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/PaymentSuccess.tsx#12-298) error recovery: if atomic RPC fails, save the error to the transaction record and show a "contact support" message with the transaction ID
4. Add an Edge Function `reconcile-payment` that admins can call to retry failed completions

**Estimated time:** 3h  
**Dependencies:** 0.2, 0.3 (auth on Edge Functions, admin role guard)

---

### Phase 2 Total: ~24 hours

---

## PHASE 3 — CODE QUALITY & TESTING
**Prevent regressions. Build confidence.**

---

### 3.1 — Enforce i18n Key Sync with Shared TypeScript Interface

**Files:**
- [src/i18n/ar.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/ar.ts)
- [src/i18n/en.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/en.ts)
- [src/i18n/fr.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/fr.ts)
- [src/i18n/index.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/index.tsx)

**Steps:**
1. Define [ar.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/ar.ts) as the source of truth and export its type:
```typescript
// ar.ts
const ar = { ... } as const;
export type Translations = typeof ar;
export default ar;
```
2. Make [en.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/en.ts) and [fr.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/fr.ts) satisfy the type:
```typescript
// en.ts
import type { Translations } from './ar';
const en: Translations = { ... };
export default en;
```
3. Run `npx tsc --noEmit` — TypeScript will flag every missing key as a compile error
4. Fill in all missing keys in [en.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/en.ts) and [fr.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/fr.ts)
5. Add a CI check that i18n types compile

**Estimated time:** 3h (mostly filling missing translations)  
**Dependencies:** None

---

### 3.2 — Remove `@ts-nocheck` Directives

**Files:**
- [vite.config.ts](file:///c:/Users/pc/Desktop/khedma-tn/vite.config.ts) (line 1)
- [send-email/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/send-email/index.ts) (line 1)

**Steps:**
1. Remove `// @ts-nocheck` from [vite.config.ts](file:///c:/Users/pc/Desktop/khedma-tn/vite.config.ts)
2. Fix any resulting type errors (likely `import.meta.dirname` or `visualizer` plugin types)
3. Remove `// @ts-nocheck` from [send-email/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/send-email/index.ts) (already addressed in 0.1 with proper types)

**Estimated time:** 30 min  
**Dependencies:** 0.1

---

### 3.3 — Add Page-Level Tests for Critical Paths

**Files:**
- New: `src/pages/__tests__/PaymentSuccess.test.tsx`
- New: `src/pages/__tests__/ContractWorkspace.test.tsx`
- New: `src/pages/__tests__/FreelancerOnboarding.test.tsx`
- New: `src/pages/__tests__/JobPost.test.tsx`
- New: `src/pages/__tests__/JobBoard.test.tsx`

**Steps:**
1. Set up test utilities — ensure [src/test/utils.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/test/utils.tsx) has proper Supabase mocks, router wrappers, and auth context mocks (it already has some of this)
2. For each page, write tests covering:
   - **PaymentSuccess**: idempotency check works, success state renders, failed state renders, redirect fires
   - **ContractWorkspace**: loads contract data, sends message, renders milestones
   - **FreelancerOnboarding**: multi-step form navigation, form validation, submit calls supabase
   - **JobPost**: wizard navigation, validation, submit success
   - **JobBoard**: renders job list, filters work, empty state
3. Run: `npm run test:run`

**Estimated time:** 6h  
**Dependencies:** None (tests mock Supabase)

---

### 3.4 — Add Coverage Threshold to CI

**Files:**
- [vitest.config.ts](file:///c:/Users/pc/Desktop/khedma-tn/vitest.config.ts)
- [.github/workflows/ci.yml](file:///c:/Users/pc/Desktop/khedma-tn/.github/workflows/ci.yml)

**Steps:**
1. Add coverage config to [vitest.config.ts](file:///c:/Users/pc/Desktop/khedma-tn/vitest.config.ts):
```typescript
test: {
  coverage: {
    thresholds: {
      statements: 20, // Start low, increase over time
      branches: 15,
      functions: 20,
      lines: 20,
    }
  }
}
```
2. Update CI to run `npm run test:coverage` instead of `npm run test:run`
3. Gradually increase thresholds as coverage improves

**Estimated time:** 30 min  
**Dependencies:** 3.3

---

### 3.5 — Add E2E Test for Payment Flow

**Files:**
- New: `e2e/` directory
- [package.json](file:///c:/Users/pc/Desktop/khedma-tn/package.json) (add Playwright or similar)

**Steps:**
1. Install Playwright: `npm install -D @playwright/test`
2. Create `e2e/payment-flow.spec.ts`:
   - Login as client
   - Navigate to a contract
   - Click "Fund Escrow"
   - Verify mock payment redirect (dev mode)
   - Verify success page renders
   - Verify redirect to contract
3. Add `npm run test:e2e` script
4. Add to CI (optional for now — can be manual)

**Estimated time:** 4h  
**Dependencies:** 0.4, 3.3

---

### 3.6 — Create Database Seed File

**Files:**
- New: `supabase/seed.sql`

**Steps:**
1. Create seed data for:
   - 3 users (1 admin, 1 client, 1 freelancer) with known credentials
   - 5 sample jobs across different categories
   - 3 proposals
   - 1 active contract with milestones
   - Sample messages and notifications
2. Document seed credentials in [.env.example](file:///c:/Users/pc/Desktop/khedma-tn/.env.example) or [README.md](file:///c:/Users/pc/Desktop/khedma-tn/README.md)
3. Add npm script: `"db:seed": "supabase db reset"` or manual instructions

**Estimated time:** 2h  
**Dependencies:** None

---

### 3.7 — Lint and Format Cleanup

**Files:**
- [eslint.config.js](file:///c:/Users/pc/Desktop/khedma-tn/eslint.config.js)

**Steps:**
1. Run `npm run lint` and fix all warnings/errors
2. Consider adding Prettier for consistent formatting
3. Add `lint-staged` + `husky` for pre-commit hooks:
```bash
npm install -D husky lint-staged
npx husky init
```

**Estimated time:** 1.5h  
**Dependencies:** None

---

### 3.8 — Document API/Service Layer

**Files:**
- New: `src/services/README.md`
- Update: [README.md](file:///c:/Users/pc/Desktop/khedma-tn/README.md)

**Steps:**
1. Replace the boilerplate Vite README with project-specific documentation
2. Document:
   - Project overview and tech stack
   - Setup instructions (env vars, Supabase config, seed data)
   - Architecture overview (service layer, contexts, routing)
   - Deployment instructions
3. Add JSDoc comments to all service layer functions

**Estimated time:** 2h  
**Dependencies:** 2.1

---

### Phase 3 Total: ~20 hours

---

## PHASE 4 — PRODUCTION HARDENING
**Final checks before real users touch it.**

---

### 4.1 — Tighten Vercel CSP Headers

**Files:** [vercel.json](file:///c:/Users/pc/Desktop/khedma-tn/vercel.json) (line 11)

**Steps:**
1. Remove `'unsafe-eval'` from `script-src` — this is used by some dev tools but should not be in production
2. If removing `'unsafe-eval'` breaks Sentry or PostHog, add their specific script hashes instead:
```
script-src 'self' 'unsafe-inline' https://*.supabase.co https://app.posthog.com https://*.sentry.io;
```
3. Consider adding a nonce-based strategy for inline scripts in the future
4. Test: deploy to preview, verify Sentry and PostHog still load

**Estimated time:** 1h  
**Dependencies:** None

---

### 4.2 — Add Error Boundary to All Unprotected Detail Pages

**Files:** [App.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/App.tsx) (lines 175, 207–209)

**Steps:**
1. Wrap these routes in `<ErrorBoundary>`:
   - `/jobs/:jobId` (JobDetail)
   - `/freelancer/:usernameOrId` (FreelancerProfile)
   - `/payment/success` and `/payment/failed`
2. Already wrapped: `FreelancerDashboard`, `ClientDashboard`, `ContractWorkspace`, `AdminDashboard`, onboarding routes

**Estimated time:** 15 min  
**Dependencies:** None

---

### 4.3 — Verify All Supabase Migrations Are Idempotent

**Files:** All 12 files in `supabase/migrations/`

**Steps:**
1. Review each migration for idempotency:
   - Ensure `CREATE TABLE IF NOT EXISTS` instead of `CREATE TABLE`
   - Ensure `DROP POLICY IF EXISTS` before `CREATE POLICY`
   - Ensure `CREATE OR REPLACE FUNCTION` for all functions
2. Test: run all migrations in order against a fresh Supabase project and verify no errors
3. Ensure `schema_v2.sql` is the full, up-to-date superset of all migrations

**Estimated time:** 2h  
**Dependencies:** 1.2, 1.3 (new migrations)

---

### 4.4 — Set Up Monitoring & Alerting

**Files:**
- Sentry dashboard (external configuration)
- PostHog dashboard (external configuration)
- New: `src/lib/monitoring.ts`

**Steps:**
1. Verify Sentry is capturing errors in production builds (currently `console` is stripped in prod — check if Sentry's `captureException` still works)
2. Set up Sentry alerts for:
   - Any error in `PaymentSuccess.tsx` or `flouci.ts`
   - Error rate > 5% on any page
3. Set up PostHog feature flags for:
   - Gradual rollout of new features
   - Kill switch for payment processing
4. Create a health check endpoint or Edge Function that tests Supabase connectivity

**Estimated time:** 2h  
**Dependencies:** None

---

### 4.5 — Pre-Launch Load Testing

**Files:** None (external tooling)

**Steps:**
1. Use a tool like `k6` or `artillery` to simulate:
   - 100 concurrent users browsing job board
   - 20 concurrent proposal submissions
   - 5 concurrent payment flows
2. Monitor Supabase dashboard for:
   - Connection pool exhaustion
   - RLS policy performance (slow queries)
   - Realtime channel limits
3. Note bottlenecks and optimize (add indexes, adjust connection pool)

**Estimated time:** 3h  
**Dependencies:** All previous phases

---

### Phase 4 Total: ~9 hours

---

## PHASE 5 — GROWTH FEATURES
**Post-launch. Nice to have.**

---

### 5.1 — Proposal "Connects" System

**Files:**
- New migration: add `connects` column to `profiles` or `wallets`
- New service: `src/services/connects.ts`
- Update: `FreelancerDashboard`, proposal submission flow

**Steps:**
1. Add `connects` column to `wallets` table (default: 20 for new users)
2. Create DB function `submit_proposal_with_connects()` that:
   - Checks `connects >= 2` (or whatever cost)
   - Deducts connects
   - Inserts proposal
   - All in one transaction
3. Add UI: show connect balance in dashboard, warning when low

**Estimated time:** 4h  
**Dependencies:** 2.3 (server-side validation)

---

### 5.2 — Real-Time Notifications UI

**Files:**
- [src/components/ui/NotificationBell.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/components/ui/NotificationBell.tsx)
- New: `src/hooks/useNotifications.ts`

**Steps:**
1. Subscribe to Supabase Realtime on the `notifications` table filtered by user
2. Show badge count of unread notifications
3. Mark as read on click
4. Toast notification on new incoming notification

**Estimated time:** 3h  
**Dependencies:** 1.2 (notifications INSERT policy)

---

### 5.3 — Freelancer Search & Matching Algorithm

**Files:**
- New Edge Function or DB function: `match_freelancers()`
- [src/pages/JobMatches.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/JobMatches.tsx)

**Steps:**
1. Create a PostgreSQL function that scores freelancers based on:
   - Skill overlap with job requirements
   - Success rate
   - Availability
   - Location match
2. Surface top-10 matches when a job is created
3. Send notification to matched freelancers

**Estimated time:** 6h  
**Dependencies:** 1.1 (skills fix), 2.3

---

### 5.4 — PWA & Offline Support

**Files:**
- New: `public/service-worker.js` or use `vite-plugin-pwa`

**Steps:**
1. Install `vite-plugin-pwa`
2. Configure with `manifest.json` (app name, icons, theme color)
3. Add offline fallback page
4. Cache critical routes (job board, dashboard)
5. Add install prompt banner

**Estimated time:** 4h  
**Dependencies:** None

---

### 5.5 — Analytics Dashboard for Clients & Freelancers

**Files:**
- New: `src/pages/Analytics.tsx`
- New: `src/services/analytics.ts`

**Steps:**
1. Client analytics: job views, proposal receive rate, average time to hire
2. Freelancer analytics: profile views, proposal win rate, earnings over time
3. Use Supabase views or materialized views for aggregation
4. Chart library: `recharts` or `chart.js`

**Estimated time:** 8h  
**Dependencies:** 2.1, 2.2

---

### 5.6 — Email Notification System

**Files:**
- [send-email/index.ts](file:///c:/Users/pc/Desktop/khedma-tn/supabase/functions/send-email/index.ts) (after 0.1 fix)
- New: email templates

**Steps:**
1. Create HTML email templates for:
   - New proposal received
   - Proposal accepted
   - Payment received
   - Contract completed
2. Add triggers or scheduled functions that send emails on key events
3. Add user preferences for email notification opt-out

**Estimated time:** 5h  
**Dependencies:** 0.1 (email function security)

---

### Phase 5 Total: ~30 hours

---

## Summary

| Phase | Description | Tasks | Estimated Time |
|:-----:|-------------|:-----:|:--------------:|
| **0** | Critical Security Patches | 5 | **4.5h** |
| **1** | Bug Fixes | 5 | **5.5h** |
| **2** | Architecture Refactor | 7 | **24h** |
| **3** | Code Quality & Testing | 8 | **20h** |
| **4** | Production Hardening | 5 | **9h** |
| **5** | Growth Features (post-launch) | 6 | **30h** |
| | | | |
| | **GRAND TOTAL** | **36 tasks** | **~93 hours** |

### Recommended Timeline (solo dev, ~6h/day productive)

| Phase | Calendar Days | Milestone |
|:-----:|:------------:|-----------|
| Phase 0 | Day 1 | ✅ Safe to deploy to staging |
| Phase 1 | Day 2 | ✅ Core features working |
| Phase 2 | Day 3–6 | ✅ Clean architecture |
| Phase 3 | Day 7–10 | ✅ Tests + quality |
| Phase 4 | Day 11–12 | ✅ **Production-ready** |
| Phase 5 | Post-launch | ✅ Growth mode |

> [!IMPORTANT]
> **Phases 0–4 = ~63 hours = ~10–12 working days** to reach production readiness. Phase 5 is entirely post-launch and should be prioritized based on user feedback.

---

## Verification Plan

### Automated Tests
- **Existing tests:** Run `npm run test:run` after every phase to verify no regressions (9 existing tests)
- **New tests from 3.3:** Run `npm run test:run` to verify 5 new page-level test files pass
- **CI pipeline:** Every push to `main` triggers lint + typecheck + test + build via `.github/workflows/ci.yml`
- **Coverage gate (after 3.4):** `npm run test:coverage` enforces minimum thresholds

### Manual Verification
After each phase, manually verify in the browser (`npm run dev`):
- **Phase 0:** Try accessing `/admin` as a non-admin user → should redirect. Try invoking Edge Functions without auth → should return 401.
- **Phase 1:** Complete freelancer onboarding with skills → verify skills appear on profile. Submit a proposal → verify notification is created.
- **Phase 2:** Browse job board → verify only 1 page of results loads. Submit a proposal → verify server-side validation rejects invalid bids.
- **Phase 4:** Deploy to Vercel preview → verify CSP doesn't block Sentry/PostHog. Check Sentry for any errors.

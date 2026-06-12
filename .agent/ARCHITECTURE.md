# Architecture — WorkedIn TN

## Stack
- Frontend: React 19 + TypeScript 5.9 + Vite 6 + Tailwind 3
- Backend: Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- State: Zustand (client) + React Query (server) + Context (auth/theme)
- Payments: Dhmad (escrow) + Flouci (direct) via Edge Functions
- Deploy: Vercel | Monitoring: Sentry + PostHog

## Core files (read these first for any task)
```
src/App.tsx                    — Root, providers, routing
src/routes/index.tsx           — Route aggregation
src/routes/routeDefinitions.tsx — Guards (Protected, Admin, Workspace, Onboarding)
src/lib/supabase.ts            — Client init, upload helpers
src/contexts/AuthContext.tsx   — Auth state, profile caching, sign in/out
src/lib/contractWorkflow.ts    — Contract state machine
```

## Directory structure
```
src/
  pages/          → Route-level UI (one file per page)
  components/     → Reusable UI components
  services/       → Business logic (Supabase queries)
  lib/            → Core utilities (supabase, auth, sanitization, upload)
  contexts/       → React contexts (Auth, Theme, Workspace, Notifications)
  hooks/          → Custom hooks
  i18n/           → Translation files (ar.ts, fr.ts, en.ts)
  types/          → Shared TypeScript types
  routes/         → Route definitions and guards
supabase/
  functions/      → 15 Edge Functions (server-side logic)
  migrations/     → 90+ SQL migrations
design-system/    → Token compiler, docs, build scripts
e2e/              → Playwright E2E tests
```

## Route protection layers
| Guard | Who can access | Component |
|-------|----------------|-----------|
| public | Everyone | Direct render |
| public-redirect | Unauthenticated only (redirect if logged in) | Login/Signup |
| protected | Authenticated users | `ProtectedRoute` → `ProtectedGate` |
| protected-workspace | Auth + workspace selected | `WorkspaceRoute` |
| protected-onboarding | Auth + onboarding step | `OnboardingRoute` |
| admin | Auth + `is_admin=true` | `AdminRoute` |

## Database model (Supabase PostgreSQL)
```
profiles ──1:1──► freelancer_profiles
profiles ──1:N──► jobs
jobs ──1:N──► proposals
proposals ──1:1──► contracts
contracts ──1:N──► messages
contracts ──1:N──► milestones
profiles ──1:1──► wallets
wallets ──1:N──► transactions
profiles ──1:N──► notifications
profiles ──1:N──► identity_verifications
contracts ──0:1──► disputes
```
ALL tables have RLS enabled. Admin access uses `public.is_admin()` SECURITY DEFINER function.

## Contract state machine
```
pending_payment → [active, cancelled, disputed]
active → [delivery_submitted, cancelled, disputed]
delivery_submitted → [active, revision_requested, completed, cancelled, disputed]
revision_requested → [delivery_submitted, cancelled, disputed]
completed → []  ← TERMINAL
cancelled → []  ← TERMINAL
disputed → []   ← TERMINAL
```
Validator: `canTransitionContractStatus(current, next)` in `src/lib/contractWorkflow.ts`

## Core flows

### Auth
```
AuthContext → supabase.auth (PKCE) → ProtectedRoute → App
Session persisted in localStorage, stale tokens purged on page load.
```

### Job lifecycle
```
JobPost page → jobs service → JobBoard → proposals → contract creation → escrow payment
```

### Contract lifecycle
```
Proposal accepted → pending_payment → (Dhmad escrow funded) → active
→ freelancer submits delivery → client accepts/requests revision
→ completed → escrow released to freelancer wallet
```

### Payment (Dhmad escrow)
```
Frontend → dhmad-create-escrow (edge fn) → Dhmad API → webhook → dhmad-webhook (edge fn) → DB update
Release: dhmad-release-escrow (edge fn) → Dhmad API → funds to freelancer
```

### Messaging
```
Realtime subscription on conversations + messages tables.
Messages support soft-delete (deleted_at timestamp, not hard delete).
Attachments: bucket "message_attachments", scoped to conversation participants.
```

### File uploads
```
Client validates (uploadPolicy.ts) → secure-upload edge function validates again
→ stores in Supabase Storage → logs to upload_audit_log table
Fallback: direct supabase.storage upload for specific buckets (avatars, contract-files)
```

## Edge functions (15 total)
| Function | Purpose |
|----------|---------|
| secure-upload | Validated file upload |
| admin-user-control | Suspend/restore/delete users |
| dhmad-create-escrow | Create payment escrow |
| dhmad-release-escrow | Release funds to freelancer |
| dhmad-refund-escrow | Refund to client |
| dhmad-webhook | Payment event handler (HMAC verified) |
| dhmad-checkout-session | Initiate checkout |
| dhmad-get-escrow-status | Query escrow state |
| dhmad-process-payout | Process payout |
| flouci-initiate-payment | Start Flouci payment |
| flouci-verify-payment | Verify completion |
| reconcile-payment | Payment reconciliation |
| hire-proposal-fallback | Backup hire flow |
| send-email | Transactional emails (Resend) |
| cron-process-timeouts | Auto-cancel expired contracts |

## Key services
```
src/services/jobs.ts       — Job CRUD, search, filters
src/services/proposals.ts  — Proposal submission, status updates
src/services/contracts.ts  — Contract lifecycle, delivery, completion
src/services/messages.ts   — Messaging, attachments, read receipts
```

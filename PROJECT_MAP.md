🗺️ WorkedIn TN — MASTER CONTEXT MAP (vFINAL)

IMPORTANT: SINGLE SOURCE OF TRUTH
This file defines system structure, execution rules, and safe coding boundaries.
Agents MUST NOT explore outside defined flow.

🚀 0. SESSION BOOT SEQUENCE (ABSOLUTE START RULE)

On every new session, the agent MUST ONLY do this:

1. SYSTEM ANCHOR FILES (read first)
src/App.tsx
src/routes/
src/lib/supabase.ts
src/contexts/AuthContext.tsx
src/lib/contractWorkflow.ts
2. DEFINE ENTRY POINT

Agent must pick ONE starting point:

a page (src/pages/*)
OR a route (src/routes/*)
3. STOP GLOBAL THINKING

❌ No project-wide exploration
❌ No full folder scanning
❌ No “understanding entire codebase first”

✔ Only follow imports from entry point downward

🤖 1. EXECUTION PROTOCOL (AEP)

When working on a feature:

Identify entry point (page/route)
Trace service layer (src/services)
Trace shared logic (src/lib)
Verify DB schema (Section 7)
Identify side effects (payments/messages/contracts)
Apply minimal safe change
Validate types + tests
🧠 2. CORE EXECUTION RULES
A. NO EXPLORATION RULE
Never search entire repo
Never open unrelated files
Never scan folders for understanding

👉 Only follow import chains

B. FILE READ LIMIT
Max 3 new file reads per task
Reuse already read files
Do not reopen unchanged files
C. CACHE RULE
Once a file is read → assume it is known
Do not re-read unless necessary for modification
D. DOWNWARD TRACE ONLY

Allowed flow:

Page → Service → Lib → DB

❌ Forbidden:

DB → guessing UI
service → guessing full app usage
reverse architecture scanning
E. STOP CONDITIONS (MANDATORY)

Stop immediately if:

no clear import path exists
multiple branches appear
uncertainty after 1 step

Ask user instead of exploring

⚖️ 3. MUTATION RULES
UI
Safe to modify (src/pages, components)
Services / Hooks
Medium risk → check dependencies first
Contracts / Auth / Payments
HIGH RISK → MUST inspect:
src/lib/supabase.ts
src/lib/contractWorkflow.ts
🧭 4. DECISION PRIORITY

When multiple options exist:

Existing logic > new logic
Service layer > UI logic
Minimal change > refactor
Strict typing > assumptions
🧠 5. CONFIDENCE RULE
High confidence → act directly
Medium → check 1 file then act
Low → STOP and ask user
🧱 6. PROJECT ARCHITECTURE
Frontend
React 19 + TS + Vite
React Router DOM
State
Zustand
Data
React Query + Supabase
Backend
Supabase (PostgreSQL + Auth + Realtime)
UI
Tailwind + Design System
Framer Motion
📁 7. CORE STRUCTURE
pages/ → routes UI
services/ → business logic
lib/ → core utilities
components/ → reusable UI
routes/ → routing layer
🗄️ 8. DATABASE MODEL (SUPABASE)
profiles → freelancer_profiles (1:1)
profiles → jobs (1:N)
jobs → proposals (1:N)
contracts → messages (1:N)
contracts → milestones (1:N)
wallets → transactions (1:N)

ALL tables use RLS (Row Level Security)

🔄 9. CORE SYSTEM FLOWS
Auth Flow

AuthContext → Supabase → ProtectedRoute → App

Job Flow

JobPost → jobs service → JobBoard → proposals → contracts

Contract Flow

contracts service → contractWorkflow → messages → payments

Realtime
Chat → useRealtimeChat
Notifications → useRealtimeNotifications
Presence → usePresence

Payment & Verification Flow

- Flouci payments and deposits can run in DEV mode by appending `mock_success=true` in `flouci.ts`.
- `PaymentSuccess.tsx` intercepts these mock transactions to instantly credit the user's wallet or fund the contract's escrow directly, bypassing the production webhook requirement.

Upload & Delivery Flow

- Contract delivery uploads MUST use the prefix `submissions/review/` or `submissions/final/` instead of `deliveries/` to prevent Brave Shields/ad-blockers from blocking requests.
- Since the remote `secure-upload` Edge function can be outdated (and can reject the submissions prefix), uploads in both `ContractWorkspacePage.tsx` and `Messages.tsx` use direct storage uploads via `supabase.storage.from('contract-files').upload()`, matching database RLS permissions.

🔥 10. HOT FILES (START HERE ALWAYS)
Tier 1 (critical)
src/App.tsx
src/routes/
src/lib/supabase.ts
src/contexts/AuthContext.tsx
src/lib/contractWorkflow.ts
Tier 2 (logic)
src/services/jobs.ts
src/services/proposals.ts
src/services/contracts.ts
src/services/messages.ts
Tier 3 (UI entry)
src/pages/JobBoard.tsx
src/pages/Messages.tsx
src/pages/JobPost.tsx
🧭 FINAL RULE

👉 This system is NOT for exploration
👉 It is for direct path execution

Agents MUST:

start from entry point
follow imports downward
stop when path ends
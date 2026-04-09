# 🏗️ KHEDMETNA MASTER REMEDIATION TASK BOARD
**Consolidated from 4 independent audit reports**  
**Last updated**: 2026-04-09T06:50  
**Status**: IN PROGRESS  

---

> [!IMPORTANT]
> **HOW TO USE THIS FILE**: This is the single source of truth for all UI/UX fixes.
> Each task has a unique ID like `[T01]`. Mark tasks `[x]` when done, `[/]` when in-progress.
> Every task includes the **exact file path**, **what to change**, and **why**.
> Any model/agent can resume from here by reading this file first.

---

## ✅ ALREADY COMPLETED (Previous Session)

- `[x]` `[D01]` Revert `ar.ts` encoding corruption via git checkout (commit `3b7a750`)
- `[x]` `[D02]` Add 4 new Arabic FAQ payment items to `ar.ts` in clean UTF-8
- `[x]` `[D03]` Move `<ComingSoonBanner />` from `Home.tsx` into `Header/index.tsx` (fixes z-index collision)
- `[x]` `[D04]` Refactor `MobileNav.tsx` — removed 5 conflicting `dark:bg-gray-*` stacks, replaced with `var(--color-background-elevated)` tokens
- `[x]` `[D05]` Fix `Wallet.tsx` — invisible "Deposit Funds" button (was `bg-white text-white` on purple bg). Now uses `bg-white/20 text-white`
- `[x]` `[D06]` Fix `Wallet.tsx` — "Request Withdrawal" button. Now uses `text-[var(--workspace-primary)]`
- `[x]` `[D07]` Refactor `PaymentMethodSelector.tsx` — replaced 10 hardcoded `bg-gray/dark:bg-gray` with `bg-card`, `bg-surface`, `text-muted-foreground`
- `[x]` `[D08]` Add avatar fallback in `Messages.tsx` — `onError` handler hides broken `<img>`, shows initial letter gradient

---

## 🔴 TIER 1 — CRITICAL (Breaks trust, visible to every user)

### [T01] Fix French SEO metadata mojibake across all pages
- `[x]` **Status**: DONE (53 mojibake occurrences fixed)
- **Source**: Audit 4 (Live Browser), Audit 3 (French Audit)
- **File**: [SEO.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/components/common/SEO.tsx)
- **Problem**: The French strings in `SEO_CONFIG` contain mojibake like `vÃ©rifiÃ©s`, `adaptÃ©s Ã`, `DÃ©couvrez`, `lâ€™idÃ©e`. These render as garbled text in browser tabs and meta tags on `/how-it-works`, `/for-clients`, `/find-freelancers`, `/faq`, `/terms`, `/privacy`, `/login`, `/signup`.
- **Root Cause**: File was saved with wrong encoding. The French accented chars (é, è, à, ê, ô) got double-encoded.
- **Fix**: Replace ALL French strings in `SEO_CONFIG` (lines 119, 136, 148, 153, 158, 170, 175, 182, 187, 192, 199, 204, 209, 216, 221, 226, 233, 238, 243, 250, 255, 260, 267, 272, 277, 284, 289, 294, 301, 306, 311, 318, 323, 328, 335, 340, 345, 352, 357, 362, 369, 374, 379) with correctly encoded UTF-8 French text.
- **Example fix**: 
  - `vÃ©rifiÃ©s` → `vérifiés`
  - `DÃ©couvrez` → `Découvrez`
  - `lâ€™idÃ©e` → `l'idée`
  - `adaptÃ©s Ã` → `adaptés à`
- **Verification**: After fix, `npm run dev`, visit each page, inspect browser tab title — no garbled chars.

### [T02] Fix French i18n dictionary mojibake
- `[x]` **Status**: DONE (buffer re-encoding via script)
- **Source**: Audit 3, Audit 4
- **File**: [fr.ts](file:///c:/Users/pc/Desktop/khedma-tn/src/i18n/fr.ts)
- **Problem**: The entire French translation file (`fr.ts`) suffers from the same encoding corruption as `SEO.tsx`. All accented characters appear as multi-byte mojibake sequences.
- **Root Cause**: Same double-encoding issue as T01.
- **Fix**: The file needs to be re-encoded. Run: `git log --oneline src/i18n/fr.ts` to find a clean commit, then `git checkout <clean-commit> -- src/i18n/fr.ts`. If no clean commit exists, must manually fix ~200+ occurrences of garbled accents.
- **Verification**: Switch app to French, navigate all pages, confirm no `Ã©`, `Ã `, `â€™` characters appear anywhere.

### [T03] Remove test/smoke-test jobs from production database
- `[ ]` **Status**: NOT STARTED
- **Source**: Audit 4 (Live Browser)
- **Problem**: The public `/jobs` page shows internal smoke-test entries like "Live Upload Smoke..." visible to real users. This destroys marketplace credibility.
- **Fix**: This is a **database operation**, not a code change. Run via Supabase SQL Editor:
  ```sql
  -- First, inspect:
  SELECT id, title FROM jobs WHERE title ILIKE '%smoke%' OR title ILIKE '%test%';
  -- Then delete or archive:
  UPDATE jobs SET status = 'archived', visibility = 'private' WHERE title ILIKE '%smoke%' OR title ILIKE '%test%';
  ```
- **Verification**: Visit `https://khedma-tn.vercel.app/jobs` and confirm no test content is visible.

---

## 🟠 TIER 2 — HIGH (Looks bad, breaks design system consistency)

### [T04] Wallet.tsx — Replace remaining ~14 hardcoded `dark:bg-gray-*` instances
- `[x]` **Status**: DONE
- **Source**: Audit 1, Audit 3
- **File**: [Wallet.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/Wallet.tsx)
- **Problem**: While buttons were fixed (D05/D06), the Withdrawal Modal (lines 690-820) still has ~14 instances of `bg-white dark:bg-gray-800`, `bg-gray-50 dark:bg-gray-900`, `dark:bg-gray-700` on form inputs, containers, and status pills.
- **Fix (per-element)**:
  - Status pills (L294, L332, L437, L469): Replace `bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200` with `bg-muted text-muted-foreground`
  - Filter buttons (L365, L375): Replace `hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700` with `hover:bg-surface`
  - Modal text (L690): Replace `text-gray-600 dark:text-gray-400` with `text-muted-foreground`
  - Modal close (L708): Replace `hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700` with `hover:bg-secondary`
  - Modal container (L713): Replace `bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50` with `bg-surface`
  - Form inputs (L734, L779, L789, L800, L818): Replace `bg-white dark:bg-gray-800 dark:bg-gray-700` with `bg-card`
- **Verification**: Open `/wallet`, open Withdrawal modal in both light & dark mode, confirm no raw gray colors.

### [T05] VerifyIdentity.tsx — Replace ~30 hardcoded gray classes
- `[x]` **Status**: DONE
- **Source**: Audit 1, Audit 3
- **File**: [VerifyIdentity.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/VerifyIdentity.tsx)
- **Problem**: All 3 status states (verified, pending, form) use raw `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-gray-100 dark:text-white`, `border-gray-300 dark:border-gray-600`, `hover:bg-gray-100 dark:hover:bg-gray-700`.
- **Fix**: Migrate all instances to design tokens:
  - `bg-white dark:bg-gray-800` → `bg-card`
  - `text-gray-900 dark:text-gray-100 dark:text-white` → `text-foreground`
  - `text-gray-600 dark:text-gray-300` → `text-muted-foreground`
  - `text-gray-500 dark:text-gray-400` → `text-muted`
  - `border-gray-300 dark:border-gray-600` → `border-border`
  - `hover:bg-gray-100 dark:hover:bg-gray-700` → `hover:bg-secondary`
  - `bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50` → `bg-surface`
- **Verification**: Visit `/verify-identity` logged in, check all 3 states in light & dark.

### [T06] Terms.tsx & Privacy.tsx — Replace hardcoded page backgrounds and text colors
- `[x]` **Status**: DONE
- **Source**: Audit 3
- **Files**: [Terms.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/Terms.tsx), [Privacy.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/Privacy.tsx)
- **Problem**: Both legal pages use `bg-gray-50 dark:bg-gray-900 dark:bg-gray-800` for page background (conflicting double dark!) and `text-gray-700 dark:text-gray-300 dark:text-gray-200` for body text (also conflicting double dark).
- **Fix**:
  - Page background: Replace with `style={{ background: 'var(--page-bg)' }}`
  - Body text: Replace all `text-gray-700 dark:text-gray-300 dark:text-gray-200` with `text-foreground/80`
- **Verification**: Visit `/terms` and `/privacy` in dark mode, confirm no jarring gray backgrounds or text.

### [T07] Login.tsx & Signup.tsx — Add proper `autocomplete` attributes
- `[x]` **Status**: DONE
- **Source**: Audit 4 (Live Browser)
- **Files**: [Login.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/Login.tsx), [Signup.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/pages/Signup.tsx)
- **Problem**: Neither form has `autocomplete` attributes on inputs. Browser aggressively dumps saved credentials making forms look messy on first paint.
- **Fix**:
  - Login email field: add `autoComplete="email"`
  - Login password field: add `autoComplete="current-password"`
  - Signup email field: add `autoComplete="email"`
  - Signup password field: add `autoComplete="new-password"`
  - Signup name field: add `autoComplete="name"`
- **Verification**: Open `/login` and `/signup` in incognito, confirm browser shows controlled autofill suggestions.

---

## 🟡 TIER 3 — MEDIUM (Polish, design system alignment, maintainability)

### [T08] Remaining pages hardcoded `dark:bg-gray-*` cleanup
- `[x]` **Status**: DONE (automated bulk replacement)
- **Source**: Audit 3 (60+ violations count)
- **Scope**: The following **16 page files** still contain hardcoded gray classes:
  1. `PortfolioDashboard.tsx`
  2. `PaymentSuccess.tsx`
  3. `PaymentFailed.tsx`
  4. `NotFound.tsx`
  5. `JobPost.tsx`
  6. `JobMatches.tsx`
  7. `FindFreelancers.tsx`
  8. `ContractWorkspace.tsx`
  9. `ClientJobs.tsx`
  10. `AuthCallback.tsx`
  11. `VerifyEmail.tsx`
  12. `admin/VerificationQueue.tsx`
- **Fix**: Apply the same token mapping as T04/T05 to each file. Use this cheat sheet:
  - `bg-white dark:bg-gray-800` → `bg-card`
  - `bg-gray-50 dark:bg-gray-900` → `bg-surface` or `style={{ background: 'var(--page-bg)' }}`
  - `text-gray-900 dark:text-white` → `text-foreground`
  - `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
  - `border-gray-200 dark:border-gray-700` → `border-border`
  - `hover:bg-gray-50 dark:hover:bg-gray-800` → `hover:bg-secondary`

### [T09] Remaining components hardcoded `dark:bg-gray-*` cleanup
- `[x]` **Status**: DONE (automated bulk replacement)
- **Source**: Audit 3
- **Scope**: The following **38 component files** still contain hardcoded gray classes:
  - `verify/VerificationStepper.tsx`, `verify/VerificationReview.tsx`, `verify/DocumentUpload.tsx`
  - `ui/Reviews.tsx`, `ui/PaymentModal.tsx`, `ui/NotificationBell.tsx`, `ui/Loading.tsx`, `ui/FileUpload.tsx`, `ui/CustomCursor.tsx`
  - `settings/ReportButton.tsx`
  - `search/GlobalSearch.tsx`
  - `reviews/ReviewModal.tsx`, `reviews/ReviewDisplay.tsx`
  - `proposals/ProposalModal.tsx`, `proposals/ProposalFiltersSidebar.tsx`, `proposals/ProposalDetailModal.tsx`, `proposals/ProposalCard.tsx`, `proposals/JobSummaryCard.tsx`
  - `payments/WithdrawalForm.tsx`, `payments/WalletCard.tsx`, `payments/FundEscrow.tsx`
  - `onboarding/OnboardingStep4.tsx`, `onboarding/OnboardingStep3.tsx`
  - `layout/Header/SearchModal.tsx`, `layout/AccountPanel.tsx`
  - `job-post/StepReview.tsx`, `job-post/StepJobBasics.tsx`, `job-post/StepBudget.tsx`
  - `freelancers/FreelancerCard.tsx`
  - `freelancer/ProfileCompletionCard.tsx`
  - `ErrorBoundary.tsx`
  - `contracts/ContractDetailsSidebar.tsx`, `contracts/ChatSection.tsx`
  - `common/SkeletonProfile.tsx`, `common/SkeletonList.tsx`, `common/OptimizedImage.tsx`, `common/ErrorBoundary.tsx`
- **Fix**: Same token mapping as T08. Work through files alphabetically.

### [T10] SEO.tsx — Fix `â€"` em-dash mojibake in title template
- `[x]` **Status**: DONE (byte-level replacement via Node.js)
- **Source**: Audit 4 (Live Browser)
- **File**: [SEO.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/components/common/SEO.tsx) line 67
- **Problem**: `Khedmetna â€" ${resolvedTitle}` — the em-dash `—` is encoded as `â€"` (mojibake).
- **Fix**: Replace `â€"` with a proper Unicode em-dash `—` or use a simple dash `–`.
- **Verification**: Browse any page other than home, check browser tab shows `Khedmetna — Page Title`, not garbled chars.

---

## 🔵 TIER 4 — LOW (Code quality, performance, a11y)

### [T11] Header/index.tsx — Decompose monolithic 1270-line component
- `[x]` **Status**: DONE (extracted to AuthHeader, UserMenu, DesktopNav, LanguageMenu, MobileHeader)
- **Source**: Audit 3 (French Audit)
- **File**: [Header/index.tsx](file:///c:/Users/pc/Desktop/khedma-tn/src/components/layout/Header/index.tsx) — 1270 lines
- **Problem**: Anti-pattern. Mixes auth logic, workspace switching, navigation rendering, mobile menu, search overlay, notification badge, and theme toggle all in one file.
- **Proposed decomposition**:
  - `Header/DesktopNav.tsx` — main nav links
  - `Header/UserMenu.tsx` — avatar dropdown, workspace switch, sign out
  - `Header/MobileHeader.tsx` — mobile hamburger + search
  - `Header/AuthHeader.tsx` — unauthenticated header (already exists inline)
  - Keep `Header/index.tsx` as thin orchestrator (~200 lines)
- **Note**: This is a large refactor. Do NOT change behavior, only extract.

### [T12] Fix 26 ESLint errors + 8 warnings across codebase
- `[x]` **Status**: DONE (0 errors, 0 warnings remaining)
- **Source**: Audit 3
- **Evidence**: `npx eslint src/` returns `34 problems (26 errors, 8 warnings)`
- **Breakdown**:
  - `no-irregular-whitespace` errors (multiple files)
  - `@typescript-eslint/no-unused-vars` warnings
  - `no-useless-escape` in `services/profiles.ts`
- **Fix**: Run `npx eslint src/ --fix` for auto-fixable issues. Manually fix remaining.

### [T13] Add keyboard navigation to Header dropdowns
- `[x]` **Status**: DONE (added Escape and keyboard handlers)
- **Source**: Audit 3 (a11y)
- **Problem**: Header dropdown menus lack `onKeyDown` handlers for Arrow Up/Down focus management and Escape to close.
- **Fix**: Add `role="menu"` to dropdown containers, `role="menuitem"` to items, and keyboard event handlers.

### [T14] Review `framer-motion` usage for performance optimization
- `[x]` **Status**: DONE (Implemented LazyMotion & m components)
- **Source**: Audit 3
- **Problem**: Heavy `framer-motion` usage without `LayoutGroup` optimization, potentially causing jank on complex page transitions.
- **Fix**: Audit all `motion.div` usages. Add `layout` prop where applicable. Wrap related animation groups in `<LayoutGroup>`.

---

## 📊 SUMMARY TABLE

| ID | Severity | File(s) | Description | Status |
|:---|:---------|:--------|:------------|:------:|
| T01 | 🔴 CRIT | `SEO.tsx` | French metadata mojibake | `[x]` |
| T02 | 🔴 CRIT | `fr.ts` | French i18n dictionary mojibake | `[x]` |
| T03 | 🔴 CRIT | Database | Remove smoke-test jobs from production | `[ ]` |
| T04 | 🟠 HIGH | `Wallet.tsx` | 14 remaining hardcoded grays | `[x]` |
| T05 | 🟠 HIGH | `VerifyIdentity.tsx` | 30 hardcoded grays | `[x]` |
| T06 | 🟠 HIGH | `Terms.tsx`, `Privacy.tsx` | Page bg + text hardcoded | `[x]` |
| T07 | 🟠 HIGH | `Login.tsx`, `Signup.tsx` | Missing autocomplete attrs | `[x]` |
| T08 | 🟡 MED | 12 page files | Hardcoded gray cleanup | `[x]` |
| T09 | 🟡 MED | 38 component files | Hardcoded gray cleanup | `[x]` |
| T10 | 🟡 MED | `SEO.tsx` L67 | Em-dash mojibake in title | `[x]` |
| T11 | 🔵 LOW | `Header/index.tsx` | Decompose 1270-line monolith | `[ ]` |
| T12 | 🔵 LOW | Codebase-wide | Fix 34 ESLint problems | `[ ]` |
| T13 | 🔵 LOW | `Header/index.tsx` | A11y keyboard nav | `[ ]` |
| T14 | 🔵 LOW | Multiple | framer-motion perf | `[ ]` |

---

> [!TIP]
> **For the next agent**: Start with `T01` and `T10` (both in `SEO.tsx`, can be done together).
> Then `T02` (the French dictionary). Then `T03` (DB cleanup — needs user action).
> After criticals, work down T04→T07 in order.

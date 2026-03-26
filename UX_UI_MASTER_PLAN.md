# Khedma TN UX and UI Master Plan

Generated: 2026-03-26
Goal: Unify product styling and interaction quality across the app while keeping product identity and feature behavior stable.

## Scope and Standards

- Consistency target: 70% to 90% shared visual language across pages.
- Design system first, then pages.
- Every phase must end with implementation, QA, and GitHub push for Vercel verification.
- Mobile and desktop parity is mandatory.
- RTL and LTR parity is mandatory.

## Phase 1 Audit Findings (Completed)

### Critical findings (P1)

1. Page shell inconsistency
- Multiple page wrappers use different widths and paddings (container-custom, max-w-5xl, max-w-6xl).
- Background tokens vary by raw hex and mixed utility classes.
- Impact: visual rhythm breaks between core routes.
- Examples:
  - src/pages/ClientJobs.tsx
  - src/pages/Wallet.tsx
  - src/pages/JobPost.tsx

2. Card style dialects
- Pages mix card, premium-panel, glass-card, and handcrafted rounded/border/shadow stacks.
- Impact: users see different component personalities for equivalent content blocks.
- Examples:
  - src/pages/FreelancerDashboard.tsx
  - src/pages/SearchResults.tsx
  - src/pages/ClientJobs.tsx

3. Header/search modal style drift
- Search modal uses inline style-heavy visual rules that bypass shared tokens.
- Impact: interaction and visual language diverge from standardized surfaces and focus states.
- Example:
  - src/components/layout/Header/SearchModal.tsx

4. Legacy stylesheet risk
- App.css contains Vite starter root/logo styles that can conflict with app shell assumptions.
- Impact: unpredictable layout constraints and maintenance overhead.
- Example:
  - src/App.css

5. Theme config hygiene
- Tailwind theme had duplicate extension blocks before cleanup pass, increasing drift risk.
- Impact: token governance complexity and accidental overrides.
- Example:
  - tailwind.config.js

### Medium findings (P2)

1. Form pattern inconsistency
- Input/select/error styles vary across Settings, SearchResults, ResetPassword, VerifyIdentity.
- Examples:
  - src/pages/SearchResults.tsx
  - src/pages/ResetPassword.tsx
  - src/pages/VerifyIdentity.tsx

2. Empty-state inconsistency
- Empty states differ in spacing, icon sizing, text hierarchy, CTA prominence.
- Examples:
  - src/pages/ClientDashboard.tsx
  - src/pages/Wallet.tsx
  - src/pages/ClientJobs.tsx

3. Motion inconsistency
- Transition durations and hover elevations differ by page and component family.

## Work Breakdown Structure

## Phase 2 Design System Token Cleanup
Status: In progress

Tasks:
1. Normalize shell tokens for page backgrounds and section paddings. (Completed for Client Dashboard, Client Jobs, Search Results)
2. Lock surface tokens for primary card, elevated card, and glass card use-cases. (Completed for Client Dashboard, Client Jobs, Search Results)
3. Define approved border radius tiers and shadow tiers. (Completed)
4. Document token usage rules in this file. (Completed)

Approved tiers:
- Radius tier A (card): radius-card (1rem)
- Radius tier B (panel): radius-panel (1.75rem)
- Radius tier C (shell): radius-shell (2rem)
- Elevation tier 1: elevation-1 (standard surface)
- Elevation tier 2: elevation-2 (important/promoted surface)
- Elevation modal: elevation-modal (overlays/modals)

Usage rules:
- Use card for default surface blocks and lists.
- Use premium-panel plus radius-panel for highlighted analytical or dashboard blocks.
- Use glass-card plus radius-shell for hero shells only.
- Avoid arbitrary rounded values like rounded-[28px], rounded-[30px], rounded-[32px] in pages.
- Avoid hardcoded shadow stacks in pages; use elevation tiers unless a justified exception is documented.

Acceptance criteria:
- No new raw page background hex values added in pages.
- Core routes use shared shell classes.

## Phase 3 Core Component Standardization
Status: Not started

Tasks:
1. Finalize Button variant hierarchy and state map. (Initial pass completed)
2. Standardize Input, Select, Textarea, FileUpload to one style contract. (Initial pass completed for Search Results controls)
3. Standardize Modal, Tabs, Badge, EmptyState primitives. (Initial pass completed)
4. Refactor SearchModal to consume shared primitives. (Initial pass completed)

Acceptance criteria:
- Shared primitives cover at least 80% of UI surfaces on core routes.

## Phase 4 Navigation and Header Harmonization
Status: Not started

Tasks:
1. Align top nav spacing, icon scale, and active state behavior. (Initial pass completed)
2. Harmonize search interactions and keyboard hint visuals. (Initial pass completed)
3. Standardize workspace switch, notification, and profile trigger sizes. (Initial pass completed for header profile and notification triggers)

Acceptance criteria:
- Header behavior and visual rhythm are identical across client and freelancer shells.

## Phase 5 Form UX Unification
Status: Not started

Tasks:
1. Create form field spacing and helper/error hierarchy rules. (Initial pass completed)
2. Apply rules to JobPost, Settings, VerifyIdentity, auth forms. (Initial pass completed for Settings, VerifyIdentity, Reset/Forgot password, Login/Signup)
3. Standardize submit loading, disabled, and success feedback. (Initial pass completed for JobPost wizard and Settings payment/profile actions)

Acceptance criteria:
- Form state visuals are consistent across all high-traffic forms.

## Phase 6 Data Display Pattern Unification
Status: Not started

Tasks:
1. Standardize stat cards. (Initial pass completed)
2. Standardize table headers, row density, and status chips. (Initial pass completed for Wallet, Client Dashboard, Contracts List, Job Proposals tabs)
3. Standardize list cards and item action areas. (Initial pass completed)

Acceptance criteria:
- Dashboard, wallet, proposals, contracts follow same data pattern family.

## Phase 7 Page Shell Consistency Pass
Status: In progress

Tasks:
1. Apply unified shell to key routes first:
   - client dashboard
   - freelancer dashboard
   - jobs/new
   - jobs
   - settings
   - wallet
   - contracts
2. Replace custom one-off shell wrappers with approved shell recipe.

Progress update:
- unified shell wrappers applied for wallet, contracts, my proposals, and freelancer earnings
- added `page-shell-content-narrow` utility for consistent narrow core-route pages
- unified shell wrappers now applied on remaining key routes: freelancer dashboard, jobs/new, jobs, and settings

Acceptance criteria:
- Core route transitions feel native to one product.

## Phase 8 Motion and Interaction Polish
Status: Completed

Tasks:
1. Define motion timing scale and easing map.
2. Reduce visual noise from excessive hover effects.
3. Keep meaningful page-load and state-change animations only.

Progress update:
- added global motion timing/easing scale and reduced-motion fallback in shared CSS
- reduced excessive hover lift and shadow intensity in core button/card primitives and client dashboard surfaces
- reduced transition noise in settings, verify-identity, and find-freelancers by replacing broad `transition-all` with targeted motion properties

Acceptance criteria:
- Motion is purposeful and coherent.

## Phase 9 Accessibility and Responsive QA
Status: In progress

Tasks:
1. Keyboard traversal and focus checks.
2. Contrast checks and touch target checks.
3. Mobile overflow and spacing checks for all core flows.

Progress update:
- added keyboard semantics for clickable card surfaces in client dashboard
- replaced non-semantic clickable containers in verify-identity upload and consent areas
- added ARIA pressed/labels on find-freelancers view mode toggles
- added keyboard semantics and ARIA labels for clickable cards/controls in job board, search results, and job proposals flows
- added keyboard semantics for messages conversation rows and client onboarding avatar upload trigger

Acceptance criteria:
- No critical accessibility regressions in major flows.

## Phase 10 Performance and Bundle Hygiene
Status: Not started

Tasks:
1. Audit heavy visual effects and remove expensive non-essential layers.
2. Verify no major style regression on low-end devices.

Acceptance criteria:
- UX improvements do not degrade runtime experience.

## Phase 11 Visual Regression and Acceptance
Status: Not started

Tasks:
1. Capture before and after screenshots for core routes.
2. Validate RTL and LTR visual parity.

Acceptance criteria:
- Stakeholder sign-off on consistency target.

## Phase 12 Release Governance
Status: Not started

Tasks:
1. Add lightweight UI checklist for future PRs.
2. Require shared primitives for new pages.

Acceptance criteria:
- Reduced style drift in future work.

## Execution Mode

Per phase:
1. Implement task slice.
2. Run diagnostics and targeted QA.
3. Commit and push to main.
4. Verify on Vercel.
5. Move to next slice.

## Next Task (Start Now)

Phase 6 completed (initial pass):
- standardized stat cards, status chips, table structure, list cards, and item action areas across client dashboard, wallet, contracts list, job proposals, my proposals, and client jobs

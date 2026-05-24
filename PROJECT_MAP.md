# WorkedIn TN - Core Project Map & Architecture

Welcome! This document is the **Single Source of Truth** for WorkedIn TN. It acts as the "Agent Memory Map" to bootstrap any AI agent or contributor instantly without needing to scan the entire repository.

---

## 🚀 1. Tech Stack Overview
- **Frontend Core:** React 19, TypeScript, Vite
- **Backend & Database:** Supabase (Auth, PostgreSQL, Row Level Security, Storage, Realtime)
- **State Management:** Zustand (lightweight reactive stores)
- **Routing:** React Router Dom v7
- **Forms & Validation:** React Hook Form + Zod (for robust schema-based validation)
- **Styling:** Vanilla CSS powered by custom Design System tokens (`design-system/`) + Tailwind CSS (hybrid styling)
- **Icons & Animations:** Lucide React, Framer Motion
- **Testing:** Playwright (E2E, Accessibility, visual regression), Vitest (Unit/Integration tests)
- **Analytics & Errors:** PostHog, Sentry

---

## 📁 2. Key Directories & Architecture
- `src/` - Core application code
  - `src/main.tsx` & `src/App.tsx` - App entry and global context providers.
  - `src/routes/` - Route definitions, wrappers (`index.tsx`), and route guards.
  - `src/pages/` - Page-level entrypoints matching route definitions (e.g. `Messages.tsx`).
  - `src/components/` - Highly modular UI components and layouts.
    - `src/components/chat/` - Atomic chat components (`ChatSidebar`, `ChatThread`, `ChatInputArea`, `MessageBubble`) using Framer Motion.
    - `src/components/contracts/` - Contract lifecycle components (e.g. `ContractModals`).
  - `src/contexts/` - React contexts (e.g. `AuthContext.tsx` handles Supabase sessions).
  - `src/lib/` - Shared services, API clients, workspace routing rules, and helper utilities.
- `design-system/` - Design token infrastructure
  - `tokens/` - Primitive & semantic colors, typography, spacing, shadows, and radii (JSON format).
  - `build/token-compiler.js` - Compiles JSON tokens into CSS, SCSS, and JavaScript exports.
  - `output/` - Auto-generated compiled tokens (Do not edit directly!).
- `supabase/` - Database schemas, migrations, security policies, and seed data.
- `e2e/` - End-to-end Playwright tests, accessibility audits, and testing matrix.
- `scripts/` - CI/CD operational scripts (budget checks, avatar consistency audits, internationalization checks).

---

## 🗄️ 3. Database Schema Quick-Reference
WorkedIn TN features a PostgreSQL database hosted on Supabase. Below are the key tables and relationships:

| Table Name | Primary Key | Key Relationships / Purpose |
| :--- | :--- | :--- |
| **`profiles`** | `id` (UUID) | Extends `auth.users`. Contains core user data, `user_type` (freelancer, client, both), and preferred language. |
| **`freelancer_profiles`** | `id` (UUID) | Extends `profiles(id)`. Houses freelancer-specific metrics (hourly rate, completed jobs, success rate, skills). |
| **`portfolio_items`** | `id` (UUID) | FK: `freelancer_id -> freelancer_profiles`. Freelancer work samples, metadata, and media links. |
| **`jobs`** | `id` (UUID) | FK: `client_id -> profiles`. Job postings with budget, required skills, duration, and status. |
| **`proposals`** | `id` (UUID) | FKs: `job_id -> jobs`, `freelancer_id -> freelancer_profiles`. Bid amounts, delivery times, and status. |
| **`contracts`** | `id` (UUID) | FKs to `jobs`, `proposals`, `freelancers`, and `clients`. Handles financial amounts and escrow status. |
| **`milestones`** | `id` (UUID) | FK: `contract_id -> contracts`. Tracks milestones and approvals for fixed-price contracts. |
| **`messages`** | `id` (UUID) | Direct or contract-based chat messages. Supports attachments. |
| **`reviews`** | `id` (UUID) | FK: `contract_id -> contracts`. Double-blind ratings (1-5 stars) + breakdown metrics. |
| **`wallets`** | `id` (UUID) | FK: `user_id -> profiles`. Tracks balance, pending, earned, and withdrawn funds. |
| **`transactions`** | `id` (UUID) | FK: `user_id -> profiles`. Full ledger of all financial deposits, releases, fees, and payouts. |
| **`withdrawals`** | `id` (UUID) | FK: `user_id -> profiles`. Payout requests via Bank Transfer, D17, etc. (min 20 TND). |

---

## 🎨 4. Styling & The Design Token System
Instead of writing raw hexadecimal colors or arbitrary margin/padding values, follow the **Design System rules**:
- **Semantic Tokens:** Always style components using the semantic custom properties defined in `design-system/output/tokens.css` (e.g. `var(--color-text-primary)`, `var(--spacing-4)`, `var(--radius-md)`).
- **Dark Mode Support:** Theme switching is handled automatically. Semantic colors shift based on the application of the `.dark` class to the HTML document.
- **Modifying Styles:** If a styling color, radius, or font size needs modification, **never edit standard CSS outputs**. Instead:
  1. Modify the relevant JSON source in `design-system/tokens/`.
  2. Run `npm run tokens:compile` to rebuild the stylesheets.

---

## 🛠️ 5. Critical Developer & Agent Directives
To maintain codebase integrity, any assistant or developer working on this codebase **must adhere to these 6 golden rules**:

1. **Strict Types & Lints:** Ensure no TypeScript compiler errors. Run `npm run lint` and verify files strictly.
2. **Do Not Bypass RLS (Row Level Security):** All client-side queries must go through the Supabase client (`src/lib/supabase.ts`) utilizing the user's active session. Never request structural modifications that disable or weaken RLS in `supabase/`.
3. **Preserve Workspace Hydration:** When editing profiles, authentication contexts, or layouts, guarantee the active workspace context (freelancer vs. client mode) and session cache hydrate flawlessly to prevent layout flashes.
4. **Compile Tokens on Design System Changes:** If design tokens are updated, immediately execute `npm run tokens:compile` to synchronize CSS variables.
5. **Run Audits Locally:** Before declaring a feature complete, run the strict budget and internationalization compliance check: `npm run audit:strict`.
6. **Prioritize Playwright E2E Verification:** For routing, login, checkout, or critical flow edits, execute `npm run test:e2e` to prevent regressions.

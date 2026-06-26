# WorkedIn TN — Tunisian Freelance Marketplace

**WorkedIn TN** is a premium, localized freelance marketplace platform custom-tailored for the Tunisian digital economy. It enables freelancers and clients to connect, post jobs, bid with proposals, coordinate work under secure contracts, escrow milestones, transact via Tunisian payout methods (D17, bank transfers), and communicate in real-time.

This repository serves as the single source of truth for the **production web client**, the **semantic design system compiler**, **comprehensive automation scripts**, and **End-to-End browser simulation suites**.

---

## 📋 Table of Contents

1. [Key Features & Capabilities](#-key-features--capabilities)
2. [Architecture & Layering](#-architecture--layering)
3. [Technology Stack](#-technology-stack)
4. [Getting Started & Development](#-getting-started--development)
5. [Database Schema & RLS](#-database-schema--rls)
6. [Design System & Semantic Tokens](#-design-system--semantic-tokens)
7. [Testing Strategy & Quality Control](#-testing-strategy--quality-control)
8. [Strict Engineering Guidelines](#-strict-engineering-guidelines)
9. [Recent Milestones & Changes](#-recent-milestones--changes)

---

## ✨ Key Features & Capabilities

*   💼 **Job & Proposal Lifecycle:** Clients post details, parameters, and budgets. Freelancers submit custom bids (hourly or fixed-price), attach work samples, and monitor proposal status.
*   🔒 **Escrow-Backed Contracts:** Secure milestones lock client funds in escrow. Freelancers receive payment automatically upon client review and milestone approval.
*   💳 **Tunisian Wallet & Ledger:** Direct financial ledger tracking pending/earned balances. Payout requests integrated with Tunisian methods (D17, local bank transfers) with strict validation limits (min 20 TND).
*   💬 **Real-Time Workspace Chat:** Multi-threaded communication channel powered by Supabase Realtime, with contract context and attachments.
*   🎨 **Design System Tokens:** Unified light/dark mode support compiled from raw JSON design tokens. No hardcoded colors, spacing, or radii.
*   ✅ **Compliance Queue:** Admin control panels and queue management to moderate users, check identity verifications, and audit user statuses.

---

## 🏗️ Architecture & Layering

The codebase is built on a clean, decoupled design pattern separating route-backed page layouts, reusable component trees, global contexts, database service integrations, and the compiled design system.

```
WorkedIn TN Client App
 ├── Routes (Protected routing, workspace guards, hydration status)
 ├── Pages (Route-backed page layouts, queries, URL state management)
 ├── Components (Modular, reusable layout blocks and UI widgets)
 │    ├── Chat (Messaging threads, bubbles, message input areas)
 │    ├── Contracts (Escrow panels, milestones status, feedback forms)
 │    ├── Profile (Upwork-style presentation grids, expertise sections)
 │    ├── Settings (Profile forms, hourly rates, languages, and details)
 │    └── UI (Design system baseline components: Buttons, Modals, Inputs)
 ├── Contexts (Session and Workspace state managers)
 ├── Services & Libs (Supabase API layer, validators, formatting helpers)
 └── Design Tokens (Compiled design framework outputs)
```

### Key Source Directory Structure

*   [src/](file:///c:/Users/pc/Desktop/workedin_tn/src) — **Application Source Code**
    *   [pages/](file:///c:/Users/pc/Desktop/workedin_tn/src/pages) — Route entry-points (e.g. [JobBoard.tsx](file:///c:/Users/pc/Desktop/workedin_tn/src/pages/JobBoard.tsx), [FreelancerProfile.tsx](file:///c:/Users/pc/Desktop/workedin_tn/src/pages/FreelancerProfile.tsx))
    *   [components/](file:///c:/Users/pc/Desktop/workedin_tn/src/components) — Component trees grouped by domain layer
        *   [ui/](file:///c:/Users/pc/Desktop/workedin_tn/src/components/ui) — Base UI components: [Button.tsx](file:///c:/Users/pc/Desktop/workedin_tn/src/components/ui/Button.tsx), [Modal.tsx](file:///c:/Users/pc/Desktop/workedin_tn/src/components/ui/Modal.tsx), [Input.tsx](file:///c:/Users/pc/Desktop/workedin_tn/src/components/ui/Input.tsx)
    *   [contexts/](file:///c:/Users/pc/Desktop/workedin_tn/src/contexts) — Context modules: [AuthContext.tsx](file:///c:/Users/pc/Desktop/workedin_tn/src/contexts/AuthContext.tsx)
    *   [routes/](file:///c:/Users/pc/Desktop/workedin_tn/src/routes) — Protected routing configuration, workspace logic
    *   [lib/](file:///c:/Users/pc/Desktop/workedin_tn/src/lib) — Core utilities (API services, validators, date formatters)
*   [design-system/](file:///c:/Users/pc/Desktop/workedin_tn/design-system) — **Visual Token Infrastructure**
    *   [tokens/](file:///c:/Users/pc/Desktop/workedin_tn/design-system/tokens) — Token source files (colors, typography, spacing, shadows, radii, animations)
    *   [build/](file:///c:/Users/pc/Desktop/workedin_tn/design-system/build) — Token compiler script compiling variables into CSS/SCSS/JS/JSON
*   [e2e/](file:///c:/Users/pc/Desktop/workedin_tn/e2e) — **Browser Simulation Suites (Playwright)**
    *   Integrates accessibility check matrices, visual regression snapshots, and route protection checks.
*   [supabase/](file:///c:/Users/pc/Desktop/workedin_tn/supabase) — **Database Schema & SQL migrations**
*   [scripts/](file:///c:/Users/pc/Desktop/workedin_tn/scripts) — **CI/CD Quality Control Audits**

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.9, Vite 6.4, React Router DOM v7 |
| **Styling & Theme** | Tailwind CSS 3.4, Semantic Design Tokens (Custom Compiler) |
| **State Management** | Zustand (Global and Session states) |
| **Forms & Validation**| React Hook Form, Zod (Schema validation) |
| **Database & API** | Supabase (PostgreSQL), Realtime Database Subscription, RLS Policies |
| **Monitoring** | Sentry 10.46 (Error tracking), PostHog 1.335 (Analytics) |
| **Testing Suite** | Playwright 1.58 (E2E), Vitest 4.0 (Unit/Integration) |

---

## 🚀 Getting Started & Development

### 1. Installation
```bash
# Clone the repository
git clone <repo-url>
cd workedin_tn

# Install packages
npm install
```

### 2. Launch Local Environment
```bash
# Compile design system variables
npm run tokens:compile

# Start the Vite local server
npm run dev
```
Navigate to `http://localhost:5173` to view the application.

### 3. Local Quality Verification
Proactively run our strict audit pipeline locally before submitting pull requests:
```bash
npm run audit:strict
```
This script validates ESLint rules, avatar compliance, i18n key completeness, unit test passes, bundle budgets, and Playwright E2E accessibility compliance.

---

## 🗄️ Database Schema & RLS

The database is built on PostgreSQL (hosted via Supabase) and leverages Row Level Security (RLS) to enforce strict user authorization directly at the data layer.

### Core Ledger and Table Definitions

| Table | Relation | Purpose |
| :--- | :--- | :--- |
| **`auth.users`** | — | Core auth credentials managed by Supabase |
| **`profiles`** | One-to-One with `auth.users` | Stores basic profiles, avatars, and type definitions (freelancer vs. client) |
| **`freelancer_profiles`**| One-to-One with `profiles` | Stores freelancer hourly rates, experience years, portfolio links, and skills |
| **`client_profiles`** | One-to-One with `profiles` | Stores client company website, industries, and timelines |
| **`jobs`** | Foreign Key to `client_profiles` | Details for job postings, pricing milestones, and active status |
| **`proposals`** | FK to `jobs` & `freelancers` | Project bids submitted by freelancers, detailing rates and coverage |
| **`contracts`** | FK to `proposals` & `jobs` | Binds client and freelancer. Tracks active milestones and escrow values |
| **`milestones`** | Foreign Key to `contracts` | Specific project milestones with funding and verification status |
| **`messages`** | FK to `contracts` | Direct communication thread containing text and file attachments |
| **`wallets`** | Foreign Key to `profiles` | Tracks virtual ledger balances (available, pending, earned, withdrawn) |
| **`transactions`** | Foreign Key to `wallets` | Immutable accounting ledger for transactions, payments, and payouts |
| **`withdrawals`** | Foreign Key to `profiles` | Payout requests (D17, Bank transfer) with a min cap of 20 TND |

---

## 🎨 Design System & Semantic Tokens

To ensure pixel-perfect brand consistency, WorkedIn TN enforces style guidelines using **Semantic Design Tokens** instead of hardcoded CSS values.

### Theme Compilation Pipeline
All design parameters are configured inside [design-system/tokens/](file:///c:/Users/pc/Desktop/workedin_tn/design-system/tokens) as JSON variables. Running `npm run tokens:compile` compiles these variables into:
- [CSS custom properties](file:///c:/Users/pc/Desktop/workedin_tn/design-system/output/tokens.css)
- [SCSS variables](file:///c:/Users/pc/Desktop/workedin_tn/design-system/output/tokens.scss)
- [JS Exports](file:///c:/Users/pc/Desktop/workedin_tn/design-system/output/tokens.js)

### Dark Mode Toggle
Dark mode works seamlessly by appending the `.dark` class to the `<html>` node. Tailwind class modifiers (e.g. `dark:bg-zinc-900`) hook directly into semantic token overrides.

---

## 🧪 Testing Strategy & Quality Control

### Unit & Component Integration (Vitest)
Unit and integration tests are colocated inside the `src/` directory. They verify custom hooks, state handlers, translation parameters, and formatting helper functions.
```bash
npm run test:run         # Execute single test pass
npm run test:ui          # Open vitest UI dashboard
npm run test:coverage    # Generate code coverage matrix
```

### End-to-End Test Engine (Playwright)
Playwright E2E suites reside inside the [e2e/](file:///c:/Users/pc/Desktop/workedin_tn/e2e) directory. They launch full headless/headed browser sessions to run workflows like payment processing, identity verification, chat sending, and milestone releases.
```bash
npm run test:e2e             # Execute full E2E test suite
npm run test:e2e:debug       # Step-by-step debugger inspector
npm run test:e2e:a11y:strict # Automated WCAG 2.1 accessibility matrix
npm run test:e2e:visual      # Image pixel-diff visual regression audit
```

---

## ⚠️ Strict Engineering Guidelines

1. **TypeScript Strictness**: No implicit `any` types. Provide explicit definitions for custom functions, React hooks, and API returns.
2. **Row Level Security (RLS)**: Never bypass RLS controls. Fetch database elements using the default client in [supabase.ts](file:///c:/Users/pc/Desktop/workedin_tn/src/lib/supabase.ts). RLS queries are verified inside E2E routing tests.
3. **No Hardcoded Styles**: Standard components must not use raw CSS strings. Use token properties such as `var(--color-text-primary)` to preserve dark mode compatibility.
4. **Prevent Layout Flashing**: Leverage cached auth session values in Zustand stores to avoid content flashes during initial routes mounting.
5. **SEO & Accessibility**: Maintain WCAG 2.1 compliance. Elements must feature proper `aria-` labels, visible focus indicators (`focus-visible:ring-2`), and semantic HTML outlines.

---

## 📅 Recent Milestones & Changes

### ✅ Portfolio Management Re-architecting
- Decoupled Portfolio links and items management from settings.
- Relocated the external portfolio links (e.g. Behance, personal sites) directly to the **Portfolio Dashboard** (`/freelancer/portfolio`) as an inline editing interface.
- Removed obsolete inputs and edit shortcuts from the profile Settings forms and public Freelancer Profile layouts.
- Added strict URL schema formatting to automatically prepend `https://` to external web references.

### ✅ Alert & Dialog Upgrades
- Replaced all raw browser `window.confirm()` delete dialogs inside the Portfolio views with the custom, design-system-integrated `Modal` component.
- Implemented styled destructive actions (using themed buttons, loading status spinners, and overlay backdrop animations).

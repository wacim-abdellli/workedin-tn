# WorkedIn TN - Tunisian Freelance Marketplace

**WorkedIn TN** is a comprehensive Tunisian freelance marketplace platform built with modern web technologies. It connects freelancers and clients for job posting, proposals, contracts, payments, and messaging—with a professional, localized experience.

This repository contains the **production web client**, **design system infrastructure**, **comprehensive test suites**, and **operational automation scripts** for the WorkedIn TN product.

---

## 📋 Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Project Architecture](#project-architecture)
3. [Getting Started](#getting-started)
4. [Directory Structure](#directory-structure)
5. [Database Schema](#database-schema)
6. [Design System](#design-system)
7. [Testing Strategy](#testing-strategy)
8. [Development Workflow](#development-workflow)
9. [Critical Guidelines](#critical-guidelines)
10. [Recent Major Updates](#recent-major-updates)

---

## 🚀 Tech Stack Overview

### Core Frontend
- **Framework:** React 19 + TypeScript 5.9
- **Build Tool:** Vite 6.4
- **Routing:** React Router DOM v7 with advanced route guards
- **Styling:** Hybrid approach (Design System tokens + Tailwind CSS 3.4)
- **Forms & Validation:** React Hook Form + Zod (type-safe schema validation)
- **State Management:** Zustand (lightweight, reactive stores)
- **Animations & Effects:** Framer Motion 12.29
- **Icon Library:** Lucide React 0.563

### Backend & Database
- **Backend as a Service:** Supabase (PostgreSQL database)
- **Authentication:** Supabase Auth with session persistence
- **Security:** Row Level Security (RLS) policies on all tables
- **File Storage:** Supabase Storage for user uploads
- **Realtime Communication:** Supabase Realtime for chat messages

### Analytics & Error Tracking
- **Error Tracking:** Sentry 10.46 (production error monitoring)
- **Analytics:** PostHog 1.335 (product analytics and feature tracking)

### Testing & Quality
- **Unit & Integration Tests:** Vitest 4.0 with React Testing Library
- **End-to-End Tests:** Playwright 1.58 (automated browser testing)
- **Accessibility Testing:** Axe-core + Playwright for a11y compliance
- **Visual Regression:** Playwright visual comparison snapshots
- **Code Quality:** ESLint 9.39 with React-specific rules

### Package Management
- **Node Version:** ≥ 20.0.0
- **Package Manager:** npm (all dependencies modern and up-to-date)

---

## 🏗️ Project Architecture

### Application Layers

```
WorkedIn TN Application
├── Pages (Route-backed UI entrypoints)
├── Components (Reusable UI building blocks)
├── Contexts (Global state - Auth, Workspace)
├── Services (API clients, Supabase queries)
├── Utilities (Helpers, validators, formatters)
└── Design Tokens (Visual design system)
```

### Core Entry Points
- **[src/main.tsx](src/main.tsx)** - React root, mounts to DOM, configures providers
- **[src/App.tsx](src/App.tsx)** - Global context providers and layout wrapper
- **[src/index.css](src/index.css)** - Global styles and design token imports

### Routing & Pages
- **[src/routes/index.tsx](src/routes/index.tsx)** - Route graph and configuration
- **[src/routes/routeDefinitions.tsx](src/routes/routeDefinitions.tsx)** - Individual route definitions with guards
- **[src/pages/](src/pages/)** - Page-level components matching route definitions (e.g., `Messages.tsx`, `FreelancerProfile.tsx`, `JobBoard.tsx`)

### Authentication & Workspace
- **[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)** - Supabase session management, user data hydration
- **[src/lib/workspaceRoutes.ts](src/lib/workspaceRoutes.ts)** - Workspace routing logic (freelancer vs. client mode)
- **[src/lib/supabase.ts](src/lib/supabase.ts)** - Supabase client configuration with RLS enforcement

### Component Library
- **[src/components/chat/](src/components/chat/)** - Atomic chat components with Framer Motion animations
  - `ChatSidebar`, `ChatThread`, `ChatInputArea`, `MessageBubble`
- **[src/components/contracts/](src/components/contracts/)** - Contract lifecycle management
  - `ContractModals`, `MilestoneTracker`, `ContractStatus`
- **[src/components/profile/](src/components/profile/)** - User profile views (redesigned Upwork-style)
  - `ProfileHero`, `ProfileSection`, `ProfileActionSidebar`
- **[src/components/layout/](src/components/layout/)** - Layout wrappers and navigation
  - `Header`, `Sidebar`, `Footer`, `MobileNav`

### Shared Utilities
- **[src/lib/](src/lib/)** - Core services and utilities
  - API client functions
  - Validation helpers
  - Formatting utilities (currency, dates, etc.)
  - Policy modules (permissions, workspace rules)

---

## 🎯 Getting Started

### Prerequisites
- Node 20+ installed
- npm configured
- Supabase account (for local/staging development)

### Day-1 Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test:run

# Open app in browser
# Navigate to http://localhost:5173
```

### Quick Verification

Run the **strict audit** before submitting changes:

```bash
npm run audit:strict
```

This runs:
- ESLint type checking
- Avatar consistency audit
- i18n compliance check
- Unit test suite
- Build budget verification
- Accessibility E2E tests

### Common Development Tasks

```bash
# Watch mode testing with UI
npm run test:ui

# E2E tests (headed, interactive)
npm run test:e2e:headed

# E2E tests with debugging
npm run test:e2e:debug

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint the entire codebase
npm run lint

# Check bundle size budget
npm run build:budget

# Compile design tokens (if design tokens modified)
npm run tokens:compile

# i18n compliance audit
npm run i18n:audit:strict

# Accessibility audit
npm run test:e2e:a11y:strict
```

---

## 📁 Directory Structure

```
workedin_tn/
├── src/                              # Application source code (SOURCE OF TRUTH)
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # Global providers and layout
│   ├── index.css                     # Global styles and token imports
│   ├── assets/                       # Images, fonts, static files
│   ├── components/                   # Reusable UI components
│   │   ├── chat/                     # Chat messaging UI components
│   │   ├── contracts/                # Contract management components
│   │   ├── profile/                  # User profile components
│   │   ├── layout/                   # Layout and navigation
│   │   └── [other components]/
│   ├── config/                       # Configuration (API endpoints, feature flags)
│   ├── contexts/                     # React contexts (Auth, Workspace, etc.)
│   ├── lib/                          # Shared services and utilities
│   │   ├── supabase.ts              # Supabase client configuration
│   │   ├── workspaceRoutes.ts       # Workspace routing logic
│   │   └── [other utilities]/
│   ├── pages/                        # Page-level components (route-backed)
│   │   ├── Messages.tsx
│   │   ├── FreelancerProfile.tsx
│   │   ├── JobBoard.tsx
│   │   └── [other pages]/
│   ├── routes/                       # Route definitions and guards
│   │   ├── index.tsx                # Route configuration
│   │   └── routeDefinitions.tsx     # Individual route definitions
│   └── styles/                       # CSS and styling utilities
│
├── design-system/                    # Design token infrastructure
│   ├── tokens/                       # Token source files (JSON)
│   │   ├── colors.json              # Color palette (primitive + semantic)
│   │   ├── typography.json          # Font families, sizes, weights
│   │   ├── spacing.json             # Spacing scale
│   │   ├── shadows.json             # Elevation and shadow system
│   │   ├── radii.json               # Border radius scale
│   │   └── animations.json          # Duration and easing values
│   ├── build/                        # Token compilation tools
│   │   └── token-compiler.js        # Token compiler (CSS, SCSS, JS output)
│   ├── output/                       # Auto-generated compiled tokens
│   │   ├── tokens.css               # CSS custom properties
│   │   ├── tokens.scss              # SCSS variables
│   │   ├── tokens.js                # JavaScript exports
│   │   └── tokens.json              # JSON format
│   ├── README.md                     # Design system documentation
│   └── IMPLEMENTATION_STATUS.md      # Task completion status
│
├── e2e/                              # End-to-end tests
│   ├── auth.spec.ts                 # Authentication flow tests
│   ├── job-post.spec.ts             # Job posting workflow
│   ├── proposal.spec.ts             # Proposal submission tests
│   ├── payment-flow.spec.ts         # Payment and wallet tests
│   ├── wallet.spec.ts               # Wallet functionality
│   ├── contract.spec.ts             # Contract lifecycle
│   ├── a11y-matrix.spec.ts          # Accessibility compliance matrix
│   ├── visual-regression.spec.ts    # Visual regression testing
│   ├── routing-matrix.spec.ts       # Route protection matrix
│   ├── fixtures/                    # Playwright fixtures and utilities
│   ├── support/                     # Test support utilities
│   ├── TEST_ARCHITECTURE.md         # E2E testing architecture
│   └── QUICK_START.md               # E2E testing quick start
│
├── supabase/                         # Database migrations and RLS
│   ├── migrations/                  # SQL migration files
│   └── policies/                    # Row Level Security policies
│
├── scripts/                          # Operational and CI/CD scripts
│   ├── check-bundle-budgets.mjs     # Monitor bundle size
│   ├── check-avatar-consistency.mjs # Validate avatar implementation
│   ├── check-design-token-compliance.mjs  # Token compliance audit
│   ├── i18n-audit.mjs               # i18n completeness check
│   ├── dependency-audit.mjs         # Security and audit deps
│   ├── release-control.mjs          # Release workflow automation
│   └── [other operational scripts]/
│
├── public/                           # Static assets served directly
│   ├── manifest.json                # PWA manifest
│   ├── robots.txt                   # SEO robots file
│   ├── sitemap.xml                  # SEO sitemap
│   └── brand/                       # Brand assets
│
├── api/                              # API route handlers (if applicable)
│   ├── health.ts
│   ├── ready.ts
│   └── live.ts
│
├── playwright.config.ts              # Playwright test configuration
├── vite.config.ts                    # Vite build configuration
├── vitest.config.ts                  # Vitest unit test configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── tsconfig.json                     # TypeScript base configuration
├── tsconfig.app.json                 # TypeScript app-specific config
├── tsconfig.node.json                # TypeScript node scripts config
├── eslint.config.js                  # ESLint configuration
├── package.json                      # Dependencies and npm scripts
├── vercel.json                       # Vercel deployment config
│
├── PROJECT_MAP.md                    # Architecture and agent reference
├── PROFILE_REDESIGN_SUMMARY.md       # Profile page redesign details
├── TODO.md                           # Active tasks and progress
└── README.md                         # This file

```

---

## 🗄️ Database Schema

### PostgreSQL Tables (Hosted on Supabase)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| **`auth.users`** | `id`, `email`, `created_at` | Supabase auth layer |
| **`profiles`** | `id`, `user_type`, `preferred_language` | Core user data; extends auth.users |
| **`freelancer_profiles`** | `id`, `hourly_rate`, `success_rate`, `skills` | Freelancer-specific metrics; FK → profiles |
| **`client_profiles`** | `id`, `company_name`, `industry` | Client-specific info; FK → profiles |
| **`jobs`** | `id`, `title`, `budget`, `status`, `client_id` | Job postings; FK → profiles(client_id) |
| **`proposals`** | `id`, `job_id`, `freelancer_id`, `bid_amount`, `status` | Freelancer bids; FK → jobs, freelancer_profiles |
| **`contracts`** | `id`, `job_id`, `proposal_id`, `freelancer_id`, `client_id`, `amount`, `status` | Accepted agreements; escrow tracking |
| **`milestones`** | `id`, `contract_id`, `amount`, `status` | Fixed-price contract milestones; FK → contracts |
| **`messages`** | `id`, `sender_id`, `recipient_id`, `contract_id`, `content`, `created_at` | Direct and contract chat; supports attachments |
| **`reviews`** | `id`, `contract_id`, `rater_id`, `rating`, `breakdown` | Ratings (1-5 stars) with metrics; FK → contracts |
| **`wallets`** | `id`, `user_id`, `balance`, `pending`, `earned`, `withdrawn` | Financial tracking; FK → profiles |
| **`transactions`** | `id`, `user_id`, `type`, `amount`, `status` | Full ledger; FK → profiles |
| **`withdrawals`** | `id`, `user_id`, `amount`, `method`, `status` | Payout requests (Bank Transfer, D17, etc.); min 20 TND |

### Row Level Security (RLS)

**All tables enforce RLS policies via Supabase:**
- Users can only read/write their own records
- Contracts visible to involved parties
- Financial data access restricted to transaction owner
- Admin override policies for moderators

### Data Integrity Rules
- Cascade deletes on contract termination
- Escrow amount locked until milestone approval
- Withdrawal minimum: 20 TND
- Transaction immutability (no updates, only inserts)

---

## 🎨 Design System

### Overview

The **Design System** is a centralized token infrastructure that ensures visual consistency across the platform. Instead of hardcoding colors, spacing, or fonts, all styles use **semantic design tokens** defined in JSON and compiled to CSS custom properties.

### Token Categories

#### 1. Colors (`design-system/tokens/colors.json`)
- **Primitive Colors:** Purple, Amber, Neutral, Green, Red, Blue, Indigo (each with 10 shades)
- **Semantic Colors:**
  - Brand colors (primary, secondary, accent)
  - Text colors (primary, secondary, tertiary, disabled)
  - Background colors (base, elevated, subtle)
  - Border colors (subtle, default, strong)
  - Status colors (success, warning, error, info)
- **Dark Mode Support:** Automatic color switching via `.dark` class

#### 2. Typography (`design-system/tokens/typography.json`)
- **Font Families:** Heading, Body, Monospace
- **Font Sizes:** xs (12px) → 6xl (60px)
- **Font Weights:** Light → Extrabold
- **Line Heights:** Tight → Relaxed
- **Letter Spacing:** Tighter → Wider

#### 3. Spacing (`design-system/tokens/spacing.json`)
- **Scale:** 0 → 64 (increments of 4px)
- **Semantic Tokens:** button-padding, card-padding, section-gap, input-padding

#### 4. Shadows (`design-system/tokens/shadows.json`)
- **Elevation System:** 0-4 (subtle to prominent)
- **Glow Effects:** Primary, Accent

#### 5. Radii (`design-system/tokens/radii.json`)
- **Scale:** none → full
- **Semantic:** button, input, card, modal, badge

#### 6. Animations (`design-system/tokens/animations.json`)
- **Durations:** instant → slower
- **Easing:** Linear, ease-in, ease-out, ease-in-out, bounce
- **Semantic:** hover, focus, modal, toast, page transitions

### Using Design Tokens

#### In CSS
```css
.component {
  color: var(--color-text-primary);
  background: var(--color-background-base);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevation-1);
  transition: all var(--duration-normal) var(--easing-ease-out);
}
```

#### In JavaScript
```typescript
import tokens from '../design-system/output/tokens.js';

const primaryColor = tokens.colors.semantic.brand.primary.value;
```

### Compilation

When token sources are modified:

```bash
npm run tokens:compile
```

This generates:
- `design-system/output/tokens.css` (CSS custom properties)
- `design-system/output/tokens.scss` (SCSS variables)
- `design-system/output/tokens.js` (JavaScript exports)
- `design-system/output/tokens.json` (JSON format)

### Current Implementation Status ✅

- ✅ Token source files created
- ✅ Token compiler built
- ✅ Outputs generated (CSS, SCSS, JS, JSON)
- ✅ Integrated into application
- ✅ Dark/Light mode support
- ✅ All semantic color tokens defined
- ✅ Typography system complete
- ✅ Spacing system complete
- ✅ Shadow/elevation system complete

---

## 🧪 Testing Strategy

### Unit & Integration Tests (Vitest)

**Run tests:**
```bash
npm run test:run         # Single run
npm run test:ui         # Interactive UI
npm run test:coverage   # Coverage report
```

**Location:** Tests colocated with source in `src/`

**Coverage:**
- Component logic (hooks, state management)
- Utility functions
- API client functions
- Validation schemas

### End-to-End Tests (Playwright)

**Run tests:**
```bash
npm run test:e2e                    # Run all tests
npm run test:e2e:headed            # See browser window
npm run test:e2e:debug             # Step-through debugging
npm run test:e2e:ui                # Interactive test runner
npm run test:e2e:report            # View last run report
npm run test:e2e:a11y:strict       # Accessibility audit
npm run test:e2e:visual            # Visual regression
npm run test:e2e:visual:update     # Update visual baselines
```

**Location:** `e2e/`

**Test Coverage:**
- **Authentication:** Login, signup, session persistence, logout
- **Job Board:** Job creation, filtering, search
- **Proposals:** Submission, status tracking
- **Contracts:** Acceptance, milestone tracking, payment
- **Messaging:** Direct messages, contract-based chat
- **Wallet:** Balance tracking, withdrawals, transactions
- **Routing:** Protected routes, workspace isolation
- **Accessibility:** WCAG 2.1 Level AA compliance
- **Visual Regression:** Screenshot comparison across updates

### Accessibility (a11y)

**Compliance Level:** WCAG 2.1 Level AA

**Testing Tools:**
- Axe-core (automated a11y scanning)
- Manual testing in E2E suite
- Keyboard navigation verification
- Screen reader compatibility

**Run a11y audit:**
```bash
npm run test:e2e:a11y:strict
```

### Test Architecture

See [e2e/TEST_ARCHITECTURE.md](e2e/TEST_ARCHITECTURE.md) for:
- Test file organization
- Fixture patterns
- Custom commands
- Database seeding strategy
- Authentication workflows

---

## 🔧 Development Workflow

### 1. Starting Work

```bash
# Clone and install
git clone <repo>
cd workedin_tn
npm install

# Start dev server
npm run dev

# Create feature branch
git checkout -b feature/description
```

### 2. Making Changes

**Always maintain:**
- TypeScript strict mode (no `any` types)
- ESLint compliance (`npm run lint`)
- Design token usage (no hardcoded colors)
- Workspace hydration (auth state, session cache)
- RLS enforcement (all DB queries via Supabase client)

### 3. Before Committing

```bash
# Lint check
npm run lint

# Unit tests
npm run test:run

# Build verification
npm run build

# Budget check
npm run build:budget

# i18n compliance
npm run i18n:audit:strict

# Avatar consistency
npm run avatar:audit
```

### 4. Pre-PR Verification

Run the **strict audit** (includes all checks above):

```bash
npm run audit:strict
```

Also run E2E tests if modifying:
- Authentication flows
- Routing/navigation
- Contract workflows
- Payment functionality

```bash
npm run test:e2e
```

### 5. Code Review Checklist

Before submitting a PR, verify:
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Tests pass (unit + e2e)
- [ ] Design tokens used (not hardcoded values)
- [ ] Dark/Light mode tested
- [ ] i18n strings added
- [ ] Accessibility verified
- [ ] Bundle budget not exceeded
- [ ] Workspace hydration preserved (if touching auth/routing)
- [ ] RLS policies respected (if touching DB)

---

## 📋 Critical Guidelines

### Rule 1: Strict TypeScript

- No `any` types
- Enable strict mode everywhere
- Use explicit return types
- Validate schemas with Zod

### Rule 2: RLS Enforcement

All database queries **must** respect Row Level Security:
- Use `src/lib/supabase.ts` client (enforces RLS)
- Never bypass RLS policies
- Validate user permissions on client
- Trust server-side RLS for security

### Rule 3: Preserve Workspace Hydration

When editing auth, profile, or routing code:
- Avoid `localStorage` mutations that cause layout flashes
- Use Zustand stores for transient UI state
- Preserve session cache behavior
- Test with `npm run test:e2e` before merge

### Rule 4: Design Token Compliance

- **Never hardcode colors, spacing, shadows, or radii**
- Always use CSS custom properties: `var(--color-text-primary)`
- Update tokens in `design-system/tokens/` (JSON)
- Recompile: `npm run tokens:compile`
- Test dark mode: Toggle `.dark` class on `<html>`

### Rule 5: Compile Tokens on Changes

If you modify any `design-system/tokens/*.json` file:

```bash
npm run tokens:compile
```

This regenerates CSS, SCSS, JS, and JSON outputs.

### Rule 6: Run Audits Before Merge

Always run the complete audit suite:

```bash
npm run audit:strict
```

This includes:
- ESLint type checking
- Avatar consistency audit
- i18n compliance
- Unit test suite
- Build budget verification
- Accessibility E2E tests

---

## 🎯 Recent Major Updates

### ✅ Profile Page Redesign (Upwork-Style)

**Completed:**
- Redesigned `ProfileHero` component with larger avatar (7rem), green availability dot, verification checkmark
- Updated `ProfileSection` with larger fonts (text-lg), better spacing, edit buttons
- Enhanced `ProfileActionSidebar` with "Availability & Rates", "Portfolio Links", edit controls
- Full dark/light mode support using design tokens
- Responsive design (mobile-first)

**Files Changed:**
- `src/components/profile/ProfileHero.tsx`
- `src/components/profile/ProfileSection.tsx`
- `src/components/profile/ProfileActionSidebar.tsx`
- `src/pages/FreelancerProfile.tsx`

**Result:** Professional Upwork-matching profile UI with proper visual hierarchy and interactivity.

### ✅ Design System Implementation (Task 1)

**Completed:**
- Comprehensive token source files (colors, typography, spacing, shadows, radii, animations)
- Token compiler with multi-format output (CSS, SCSS, JS, JSON)
- Light/Dark mode support with CSS custom properties
- Integration into application via `src/styles/design-tokens.css`
- Complete documentation and usage guide

**Status:** ✅ Ready for production use

### 📝 Active Tasks

See [TODO.md](TODO.md) for current work items.

---

## 🔗 Quick Links

**Core Files:**
- [App Entry](src/main.tsx)
- [App Shell](src/App.tsx)
- [Route Definitions](src/routes/index.tsx)
- [Auth Context](src/contexts/AuthContext.tsx)
- [Supabase Client](src/lib/supabase.ts)

**Documentation:**
- [Design System](design-system/README.md)
- [E2E Testing](e2e/README.md)
- [Project Map](PROJECT_MAP.md)
- [Scripts README](scripts/README.md)

**Configuration:**
- [Vite Config](vite.config.ts)
- [TypeScript Config](tsconfig.json)
- [ESLint Config](eslint.config.js)
- [Tailwind Config](tailwind.config.js)
- [Playwright Config](playwright.config.ts)

---

## ⚠️ Legacy Note

Some files in the repository may reference older project names (`Khedma`, `Khedmetna`). **The runtime source of truth is always the `src/` code.** Legacy documentation files should not be trusted for current behavior.

---

## 📞 For Help

- Check [PROJECT_MAP.md](PROJECT_MAP.md) for architecture questions
- Review [e2e/TEST_ARCHITECTURE.md](e2e/TEST_ARCHITECTURE.md) for testing guidance
- See [scripts/README.md](scripts/README.md) for operational tasks
- Run `npm run audit:strict` for quality verification

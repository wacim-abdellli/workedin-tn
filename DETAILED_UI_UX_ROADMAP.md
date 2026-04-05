# Detailed UI/UX Overhaul Roadmap: Dark Mode & Zinc Theme Enforcements

This roadmap maps every page grouping in the app, analyzing where the dark mode adaptation, legacy purple colors, contrasts, component sizes, and gradations are currently broken or disjointed.

## 1. Authentication & Onboarding Flow
**Goal:** Completely neutralize purple branding, ensure crisp text contrast on deep Zinc backgrounds, and simplify cards.
- **`src/pages/Login.tsx` | `src/pages/Signup.tsx`**
  - **Issue:** Legacy purple gradients on icons, OAuth callbacks (e.g., `Securing session...` loader in screenshot has a dark purple background).
  - **Fix:** Convert loader backgrounds to `#18181b` (`zinc-900`) and replace `<div className="bg-primary-900">` with pure `bg-zinc-900`.
- **`src/pages/AuthCallback.tsx` / Email Verification**
  - **Issue:** The callback success/loading states still utilize `text-primary-500` loading spinners.
  - **Fix:** Migrate to `text-zinc-500` and use simple borders.
- **`src/components/auth/OnboardingFlow.tsx` / Client/Freelancer Setup**
  - **Issue:** Multi-step wizard indicators (`1, 2, 3`) use purple borders or backgrounds.
  - **Fix:** Active steps should be `bg-white text-zinc-900` (in dark mode) or `bg-zinc-900 text-white` (in light mode), inactive steps `text-zinc-500`.

## 2. Dashboard Ecosystem (Client & Freelancer)
**Goal:** Create a 10/10 structure focused on information density without bleeding colors.
- **`src/pages/ClientDashboard.tsx` & `src/pages/FreelancerDashboard.tsx`**
  - **Issue:** The "Need something done?" CTA card burns bright yellow/accent colors that clash heavily with the deep black theme.
  - **Fix:** Desaturate or convert to a sleek monochrome card with a subtle border.
  - **Issue:** Empty state cards ("No active projects" / "0 TND Spent") have mismatched grays or slight glow effects `shadow-lg shadow-primary...`.
  - **Fix:** Enforce strict minimal CSS: `bg-[#18181b] border border-zinc-800`.

## 3. Job Posting Flow (`/jobs/new`)
**Goal:** Transform the lengthy, clunky wizard into a seamless SaaS-like form.
- **`src/components/jobs/JobPostWizard.tsx` & Steps (`src/components/jobs/steps/*`)**
  - **Issue:** The 4-step top navigation items (Job details, Budget, Visibility, Review) have slightly tinted borders, and rounded corners look bubbly.
  - **Fix:** Convert to square or slightly rounded tabs. Active state border should be pure white (dark mode) or black (light mode).
  - **Issue:** "Required skills" pills (`Graphic Design`, etc.) use a faint blue or purple hue with dark text that is unreadable.
  - **Fix:** Implement strict neutral pills: `bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800`.
  - **Issue:** Input backgrounds for `Project title` and `<textarea>` are pitch black with invisible placeholder text.
  - **Fix:** Focus rings must be `ring-zinc-600` and inputs `bg-[#18181b] placeholder-zinc-500`.

## 4. Messaging & Inbox (`/messages`)
**Goal:** Clean up the chat UI to be as elegant as modern iOS/macOS messaging apps.
- **`src/pages/Messages.tsx` and `src/components/messages/*`**
  - **Issue:** Left sidebar conversation lists have dark grey hover states `hover:bg-zinc-800` that look mushy.
  - **Fix:** Make active thread `bg-zinc-800 border-l-2 border-white` and others transparent.
  - **Issue:** Message bubbles are massive, round, and lack proper contrast. The text input at the bottom has a yellow/gold border.
  - **Fix:** Bubbles should be compact, `<div className="rounded-2xl max-w-[70%]">`. Output text input border `border-zinc-800` with `focus:border-zinc-500`.

## 5. Freelancer Directory & Job Board
**Goal:** Consistent listing cards with strong typographic hierarchy.
- **`src/pages/JobBoard.tsx` & `src/pages/FindFreelancers.tsx`**
  - **Issue:** Filter sidebar checkboxes and select inputs use native blue outlines or old global `text-primary`.
  - **Fix:** Restyle form controls with `@tailwindcss/forms` plugin configuration or global `.checkbox` overrides using Zinc/Neutral.

## 6. Global Components & Overlays
**Goal:** Universal consistency across all interactive elements.
- **Notification Dropdown (`src/components/layout/Header/NotificationBell.tsx`)**
  - **Issue:** In the screenshot, the dropdown is floating with a literal `bg-purple-900/50` or similar deep purple tint!
  - **Fix:** Replace entire menu background with `bg-[#18181b] border border-zinc-800 shadow-2xl`.
- **Modals (e.g., Proposals, Payment Escrow)**
  - **Issue:** Black overlays `bg-black/50` are fine, but the modal body often defaults to a mixed grey.
  - **Fix:** Solid `#18181b` card, sharp borders, absolute high-contrast typography.

## UI/UX Master Action Plan Grouping:
1. **[PHASE A]** Global Components & Forms: Notifications, Dialogs, Dropdowns, Input fields, Checkboxes.
2. **[PHASE B]** Setup & Auth Wizard: Completing the clean sweep of Login, Callback, and Onboarding screens.
3. **[PHASE C]** Post Project Wizard (`/jobs/new`): Deep dive into step UI, inputs, and skill tags contrast.
4. **[PHASE D]** Messaging Interface (`/messages`): Slimming chat bubbles and fixing input fields.
5. **[PHASE E]** Dashboards: Rebalancing "bright yellow" cards and dark gray widgets.

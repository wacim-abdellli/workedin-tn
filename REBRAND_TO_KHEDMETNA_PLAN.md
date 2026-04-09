# Rebrand Plan: Khedma -> Khedmetna

Date: 2026-04-09
Decision: Rebrand the public product name to `Khedmetna` and use `khedmetna.tn`.

## Goal

Make the app feel clearly renamed to Tunisian users without confusion, while avoiding risky technical churn.

The right approach is:
- change the public-facing brand now
- change the domain now
- keep most internal technical identifiers stable for the moment

This avoids breaking deployments, tests, logs, Supabase config, and old automation while still making the product feel fully renamed.

---

## Core Rule

### Change now
- public brand name
- public domain
- SEO and canonical URLs
- legal and support contact addresses
- visible UI copy
- visible logos/wordmarks

### Do not rush now
- repo folder name
- package name
- Supabase project ref
- internal `x-client-info`
- Vercel project slug
- audit/history docs unless they are actively used by launch operations

That split gives the cleanest rollout.

---

## Recommended Brand Strategy

### Final public brand
- `Khedmetna`

### Final public domain
- `khedmetna.tn`

### Transition wording
For 2-6 weeks, use:
- `Khedmetna`
- optionally: `Khedmetna, formerly Khedma` in one or two places only

Do not spread "formerly Khedma" everywhere.
Use it only where it reduces user confusion:
- landing hero or footer
- one announcement/banner
- one email/update

---

## Rebrand Phases

## Phase 1 - Public Brand Cutover

This is the highest-priority phase.

### 1.1 User-facing brand text

Update visible app brand references from `Khedma` / `Khedma TN` to `Khedmetna`.

High-value surfaces already confirmed in repo:
- `src/components/common/SEO.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Notifications.tsx`
- `src/pages/FreelancerEarnings.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/ui/Logo.tsx`
- `public/logos/*.svg`
- `index.html`

### 1.2 i18n copy

Critical: most user-facing text is translation-driven.

Confirmed major surfaces:
- `src/i18n/en.ts`
- `src/i18n/fr.ts`
- `src/i18n/ar.ts`

Change:
- `Khedma`
- `Khedma TN`
- `Khedma.tn`

To:
- `Khedmetna`
- `Khedmetna.tn`

Be careful with:
- FAQ text
- auth text
- SEO text
- newsletter text
- copyright
- trust/payment wording
- legal wording

### 1.3 SEO and canonicals

Critical files:
- `src/components/common/SEO.tsx`
- `src/pages/FindFreelancers.tsx`
- `src/pages/JobBoard.tsx`
- any other page with hardcoded canonical or title references

Change:
- site name
- title prefix/suffix
- default site URL
- canonical URLs
- meta descriptions mentioning Khedma

### 1.4 Public contact addresses

Confirmed current live strings:
- `support@khedma.tn`
- `privacy@khedma.tn`
- `legal@khedma.tn`
- `contact@khedma.tn`

Key files:
- `src/pages/FAQ.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Privacy.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/routing/AccountStatusGate.tsx`

Decision needed:
- either create equivalent `@khedmetna.tn` addresses before cutover
- or temporarily point UI to a transitional mailbox you already control

Do not ship a visible new brand with old contact addresses unless the transition is explicit.

### 1.5 Logos and wordmarks

Confirmed visible assets:
- `public/logos/logo-mono-black.svg`
- `public/logos/logo-mono-white.svg`
- `public/logos/logo-og.svg`
- `public/logos/logo-primary.svg`
- `public/logos/logo-primary-dark.svg`
- `public/logos/logo-social.svg`
- `public/logos/logo-stacked.svg`
- `public/logos/logo-stacked-dark.svg`
- `src/components/ui/Logo.tsx`
- root `Logo.tsx`

These need text replacement from `Khedma` / `Khedma TN` to `Khedmetna`.

Do not forget:
- Open Graph image
- social/logo variants
- dark/light versions

---

## Phase 2 - Domain Cutover

### 2.1 App URL config

Confirmed current surface:
- `.env.example`
- `src/components/common/SEO.tsx`
- deployment guides
- planning docs

Update:
- `VITE_APP_URL=https://khedmetna.tn`
- all public canonical URL defaults

### 2.2 Production/staging domain references

Confirmed current references include:
- `https://khedma.tn`
- `https://staging.khedma.tn`
- `deploy@khedma.tn`

High-value operational docs:
- `DEPLOYMENT_GUIDE_PRODUCTION.md`
- `DEPLOYMENT_GUIDE_STAGING.md`

Before launch:
- choose final production domain
- choose whether staging stays subdomain-based or Vercel-preview-based

### 2.3 Redirect strategy

Recommended:
- `khedmetna.tn` becomes canonical
- old domain/URLs redirect permanently to new canonical domain
- Vercel production domain and SEO canonical must match

---

## Phase 3 - Trust and User Clarity

This is what prevents user confusion.

### 3.1 One short transition message

Recommended copy:
- `Khedmetna is the new name of Khedma. Same platform, same mission, new home at khedmetna.tn.`

Use in:
- one site banner or homepage announcement
- one email / social announcement
- optionally one footer/help mention

Do not overdo it.

### 3.2 Legal clarity

Critical files:
- `src/pages/Terms.tsx`
- `src/pages/Privacy.tsx`
- i18n legal sections in:
  - `src/i18n/en.ts`
  - `src/i18n/fr.ts`
  - `src/i18n/ar.ts`

Need to ensure:
- company/platform naming is consistent
- domain references are consistent
- support/privacy/legal contacts are consistent
- if transition wording is used, it is legally clean

### 3.3 Payment and trust wording

Critical because the product already had payment sensitivity.

Update any visible wording that says:
- Khedma holds funds
- Khedma messages
- Khedma promise
- Khedma trust

These should become:
- Khedmetna holds funds / facilitates funding
- Khedmetna messages
- Khedmetna promise

Or be updated to match the real chosen payment model at launch.

---

## Phase 4 - Non-User-Facing Technical Follow-Up

These can wait until after the public rebrand ships.

### Keep for now
- repo name `khedma-tn`
- package name `khedma-tn`
- internal headers like `x-client-info: khedma-tn`
- test fixture emails like `client-test@khedma.tn`
- Supabase/Vercel project slugs if changing them adds risk

Reason:
They are internal identifiers, not launch blockers.

### Revisit later
- package rename
- repository rename
- test email rename
- internal monitoring labels
- design-system package names

---

## Confirmed Rebrand Surfaces Found In Repo

## Highest-priority launch surfaces
- `.env.example`
- `src/components/common/SEO.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/FindFreelancers.tsx`
- `src/pages/JobBoard.tsx`
- `src/pages/Notifications.tsx`
- `src/pages/FreelancerEarnings.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/routing/AccountStatusGate.tsx`
- `src/components/ui/Logo.tsx`
- `public/logos/*.svg`
- `index.html`
- `src/i18n/en.ts`
- `src/i18n/fr.ts`
- `src/i18n/ar.ts`

## Operational/domain surfaces
- `DEPLOYMENT_GUIDE_PRODUCTION.md`
- `DEPLOYMENT_GUIDE_STAGING.md`
- `PAYMENT_EMAIL_OPTIONS_GUIDE.md`
- `MASTER_EXECUTION_PLAN.md`

## Test/data surfaces
- `e2e/fixtures/auth.ts`
- `e2e/auth.spec.ts`
- `e2e/README.md`
- `e2e/PRE_TEST_CHECKLIST.md`
- `e2e/setup-test-users.md`
- `e2e/routing-matrix.spec.ts`
- `e2e/support/roleStateMocks.ts`
- `scripts/setup-e2e-test-accounts.mjs`
- `scripts/update-e2e-test-accounts.mjs`

## Lower-priority/history/archive surfaces
- `audit/**`
- `design-system/**`
- old planning docs

These do not need to block launch unless they are currently used operationally.

---

## Execution Order

### Step 1
Secure:
- `khedmetna.tn`
- required mailboxes for the new domain

### Step 2
Do the public rebrand patch:
- branding
- i18n
- SEO
- visible emails
- visible domain references
- logos

### Step 3
Deploy and cut over:
- app URL
- Vercel/custom domain
- canonicals
- redirects

### Step 4
Publish one short transition announcement

### Step 5
Clean lower-priority technical/internal references later

---

## Launch-Safe Rebrand Rule

If a user can see it, search it, email it, bookmark it, or trust it:
- update it now

If only developers, tests, or internal tooling see it:
- change it later unless it blocks launch

---

## Recommended Next Task

Run a strict implementation slice for:
- public brand text
- visible domain references
- SEO/canonical updates
- visible support/legal/privacy emails
- logo wordmark text

Do not start with package/repo/internal slug renames.

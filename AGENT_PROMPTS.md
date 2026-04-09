# Agent Prompts â€” Khedmetna
**Orchestrator**: Kiro (Chief Technical Auditor)  
**Date**: 2026-04-09  
**Rule**: Each agent gets ONE task. No scope creep. Report back with code only.

---

## ðŸ¤– WHICH AI MODEL TO USE FOR EACH TASK

| Task | Best Model | Fallback |
|------|-----------|----------|
| Agent A (Payment UI) | **Claude Sonnet 4.5** | GPT-5.4 |
| Agent B (Dhmad Backend) | **Claude Sonnet 4.5** | GPT-5.4 |
| Agent C (FAQ Update) | **Gemini 3.1 Pro** | GPT-5.4 mini |
| Agent D (Coming Soon Banner) | **Gemini 3.1 Pro** | GPT-5.4 mini |

**If you have limited credits**: Sonnet 4.5 for A+B (complex), Gemini 3.1 for C+D (simple).

---

---

# ðŸ¤– AGENT A â€” Payment Method Selector UI

**Model**: Claude Sonnet 3.5 or GPT-4o  
**Estimated time**: 45-60 min  
**Complexity**: HIGH

---

## PROMPT FOR AGENT A:

```
You are a senior React/TypeScript developer working on Khedmetna, a Tunisian freelance marketplace.

## YOUR SINGLE TASK
Create a PaymentMethodSelector component that shows Dhmad as the active payment method and Flouci/D17 as "Coming Soon".

## CODEBASE CONTEXT

Tech stack: React 18, TypeScript, Tailwind CSS, Vite
i18n: Custom hook `useTranslation()` from `@/i18n` â€” returns `{ t, tx, language }`
Icons: lucide-react
Existing payment types: `src/types/payment.ts` (already has PaymentMethodType)
Existing components pattern: functional components, no class components
CSS: Uses design tokens (var(--workspace-primary), var(--surface-bg), etc.)
Dark mode: supported via Tailwind dark: prefix

## FILE 1 â€” CREATE: `src/config/paymentMethods.ts`

```typescript
// Define this exact structure:

export interface PaymentMethodConfig {
  id: 'dhmad' | 'flouci' | 'd17';
  available: boolean;
  comingSoon: boolean;
  recommended?: boolean;
  icon: 'Shield' | 'Wallet' | 'Building2';
  name: { en: string; ar: string; fr: string };
  description: { en: string; ar: string; fr: string };
  features: { en: string[]; ar: string[]; fr: string[] };
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'dhmad',
    available: true,
    comingSoon: false,
    recommended: true,
    icon: 'Shield',
    name: {
      en: 'Dhmad Escrow',
      ar: 'Ø¶Ù…Ø§Ù† Ø¯Ø­Ù…Ø§Ø¯',
      fr: 'DÃ©pÃ´t Dhmad',
    },
    description: {
      en: 'Secure escrow â€” funds held until work is approved',
      ar: 'Ø¶Ù…Ø§Ù† Ø¢Ù…Ù† â€” ØªÙØ­ØªØ¬Ø² Ø§Ù„Ø£Ù…ÙˆØ§Ù„ Ø­ØªÙ‰ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù…Ù„',
      fr: 'DÃ©pÃ´t sÃ©curisÃ© â€” fonds conservÃ©s jusqu\'Ã  approbation',
    },
    features: {
      en: ['Escrow protection', 'Dispute resolution', 'Used by Tunisie Freelance'],
      ar: ['Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¶Ù…Ø§Ù†', 'Ø­Ù„ Ø§Ù„Ù†Ø²Ø§Ø¹Ø§Øª', 'Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ù‚Ø¨Ù„ ØªÙˆÙ†Ø³ ÙØ±ÙŠÙ„Ø§Ù†Ø³'],
      fr: ['Protection par dÃ©pÃ´t', 'RÃ©solution des litiges', 'UtilisÃ© par Tunisie Freelance'],
    },
  },
  {
    id: 'flouci',
    available: false,
    comingSoon: true,
    icon: 'Wallet',
    name: {
      en: 'Flouci Wallet',
      ar: 'Ù…Ø­ÙØ¸Ø© ÙÙ„ÙˆØ³ÙŠ',
      fr: 'Portefeuille Flouci',
    },
    description: {
      en: 'Pay with your Flouci mobile wallet',
      ar: 'Ø§Ø¯ÙØ¹ Ø¨Ù…Ø­ÙØ¸Ø© ÙÙ„ÙˆØ³ÙŠ Ø§Ù„Ù…Ø­Ù…ÙˆÙ„Ø©',
      fr: 'Payez avec votre portefeuille Flouci',
    },
    features: {
      en: ['Mobile wallet', 'Instant transfers', '250K+ Tunisian users'],
      ar: ['Ù…Ø­ÙØ¸Ø© Ù…ÙˆØ¨Ø§ÙŠÙ„', 'ØªØ­ÙˆÙŠÙ„Ø§Øª ÙÙˆØ±ÙŠØ©', '+250 Ø£Ù„Ù Ù…Ø³ØªØ®Ø¯Ù… ØªÙˆÙ†Ø³ÙŠ'],
      fr: ['Portefeuille mobile', 'Virements instantanÃ©s', '250K+ utilisateurs'],
    },
  },
  {
    id: 'd17',
    available: false,
    comingSoon: true,
    icon: 'Building2',
    name: {
      en: 'D17 (La Poste)',
      ar: 'Ø¯ÙŠ17 (Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„ØªÙˆÙ†Ø³ÙŠ)',
      fr: 'D17 (La Poste)',
    },
    description: {
      en: 'Pay with D17 e-dinar from La Poste Tunisienne',
      ar: 'Ø§Ø¯ÙØ¹ Ø¨Ø§Ù„Ø¯ÙŠÙ†Ø§Ø± Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ D17 Ù…Ù† Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„ØªÙˆÙ†Ø³ÙŠ',
      fr: 'Payez avec le e-dinar D17 de La Poste',
    },
    features: {
      en: ['E-dinar payments', 'La Poste network', 'Government-backed'],
      ar: ['Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø§Ù„Ø¯ÙŠÙ†Ø§Ø± Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ', 'Ø´Ø¨ÙƒØ© Ø§Ù„Ø¨Ø±ÙŠØ¯', 'Ù…Ø¯Ø¹ÙˆÙ… Ø­ÙƒÙˆÙ…ÙŠØ§Ù‹'],
      fr: ['Paiements e-dinar', 'RÃ©seau La Poste', 'Soutenu par l\'Ã‰tat'],
    },
  },
];
```

## FILE 2 â€” CREATE: `src/components/payment/PaymentMethodSelector.tsx`

Requirements:
- Props: `{ selectedMethod: string; onSelect: (id: string) => void; showComingSoon?: boolean }`
- Available methods: selectable cards with border highlight on selection
- Coming soon methods: greyed out, dashed border, Clock badge, NOT clickable
- Separator between available and coming soon sections with label
- Info note at bottom: "More payment methods coming soon"
- Support RTL (Arabic) â€” use `dir` attribute based on language
- Use lucide-react icons: Shield, Wallet, Building2, Check, Clock, Info
- Mobile responsive
- No hardcoded strings â€” use the PaymentMethodConfig name/description/features

Visual spec for AVAILABLE card:
- White/surface background
- 2px solid border, primary color when selected
- Left: icon in colored circle
- Right: name + "Recommended" badge (if recommended) + Check icon when selected
- Below name: description text
- Below description: 2-3 feature pills with Check icons

Visual spec for COMING SOON card:
- Muted/grey background, 50% opacity
- Dashed border
- Same layout but greyed
- "Coming Soon" badge with Clock icon (amber color)
- cursor-not-allowed

## FILE 3 â€” UPDATE: `src/pages/Wallet.tsx`

Find the deposit modal section (search for `isDepositModalOpen`).
Add PaymentMethodSelector ABOVE the amount input.
Default selectedMethod state = 'dhmad'.
Only call initiatePayment when selectedMethod === 'dhmad' (it's the only available one).

## STRICT RULES
- TypeScript strict â€” no `any`
- No inline styles â€” Tailwind only
- No new dependencies
- Must pass: `npx tsc --noEmit`
- Must not break existing Wallet functionality
- Test that build passes: `npm run build`

## DELIVERABLE
Provide the complete content of all 3 files. Nothing else.
```

---

---

# ðŸ¤– AGENT B â€” Dhmad Integration Infrastructure

**Model**: Claude Sonnet 3.5 or GPT-4o  
**Estimated time**: 45-60 min  
**Complexity**: HIGH

---

## PROMPT FOR AGENT B:

```
You are a senior backend/fullstack developer working on Khedmetna, a Tunisian freelance marketplace built on Supabase + React.

## YOUR SINGLE TASK
Build the Dhmad escrow integration infrastructure. No live API calls yet â€” use mock responses in dev mode. The structure must be production-ready so we only need to swap in real API keys when Dhmad approves us.

## CODEBASE CONTEXT

- Supabase Edge Functions: Deno runtime, TypeScript
- Existing pattern: see `supabase/functions/flouci-initiate-payment/` for reference
- Client service pattern: see `src/services/payments.ts` for reference
- Dev mode check: `import.meta.env.DEV` (client) / `Deno.env.get('DENO_ENV') === 'development'` (edge)
- Logger: `import { logger } from '@/lib/logger'`
- Supabase client: `import { supabase } from '@/lib/supabase'`
- All amounts in TND (not millimes â€” Dhmad uses TND directly)

## FILE 1 â€” CREATE: `src/services/dhmad.ts`

```typescript
// Dhmad Escrow Service
// Docs: https://docs.dhmad.tn
// Sandbox: https://sandbox.dhmad.tn/api/v1
// Production: https://dhmad.tn/api/v1

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface DhmadEscrowRequest {
  amount: number;           // TND
  buyer_id: string;         // Khedmetna user ID (client)
  seller_id: string;        // Khedmetna user ID (freelancer)
  contract_id: string;      // Khedmetna contract ID
  description: string;      // Human-readable description
}

export interface DhmadEscrowResponse {
  escrow_id: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  amount: number;
  payment_url?: string;     // URL to redirect user for funding
  created_at: string;
}

export interface DhmadReleaseResponse {
  success: boolean;
  escrow_id: string;
  status: 'released';
  released_at: string;
}

export interface DhmadRefundResponse {
  success: boolean;
  escrow_id: string;
  status: 'refunded';
  refunded_at: string;
}

// createEscrow, releaseEscrow, refundEscrow, getEscrowStatus
// Each function:
// 1. In DEV mode (import.meta.env.DEV): return realistic mock data
// 2. In PROD mode: call the corresponding Supabase Edge Function
// 3. Proper try/catch with logger.error
// 4. Throw Error with Arabic message on failure
```

Implement all 4 functions with the above pattern.

## FILE 2 â€” CREATE: `supabase/functions/dhmad-create-escrow/index.ts`

```typescript
// Deno Edge Function
// Called by: src/services/dhmad.ts createEscrow()
// Calls: Dhmad API POST /escrows
// Also updates: contracts table (dhmad_escrow_id column)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Env vars needed (set via: npx supabase secrets set):
// DHMAD_API_KEY=sk_live_...
// DHMAD_BASE_URL=https://dhmad.tn/api/v1 (or sandbox URL)
// SUPABASE_URL (auto-injected)
// SUPABASE_SERVICE_ROLE_KEY (auto-injected)

// Request body: DhmadEscrowRequest
// Response: DhmadEscrowResponse or { error: string }

// Logic:
// 1. Parse request body
// 2. Call Dhmad API: POST ${DHMAD_BASE_URL}/escrows
//    Headers: Authorization: Bearer ${DHMAD_API_KEY}
//    Body: { amount, buyer_id, seller_id, reference: contract_id, description }
// 3. On success: update contracts table SET dhmad_escrow_id = data.escrow_id WHERE id = contract_id
// 4. Return Dhmad response
// 5. On any error: return { error: message } with appropriate status code

// CORS headers: include for browser calls
// Add TODO comment: "Replace mock with real Dhmad API call when credentials available"
```

## FILE 3 â€” CREATE: `supabase/functions/dhmad-release-escrow/index.ts`

Same pattern as above but:
- Request body: `{ escrow_id: string; contract_id: string }`
- Calls: POST ${DHMAD_BASE_URL}/escrows/${escrow_id}/release
- On success: update contracts SET payment_status = 'released', status = 'completed'
- Returns: DhmadReleaseResponse

## FILE 4 â€” CREATE: `supabase/functions/dhmad-refund-escrow/index.ts`

Same pattern but:
- Request body: `{ escrow_id: string; contract_id: string; reason: string }`
- Calls: POST ${DHMAD_BASE_URL}/escrows/${escrow_id}/refund
- On success: update contracts SET payment_status = 'refunded', status = 'cancelled'
- Returns: DhmadRefundResponse

## FILE 5 â€” CREATE: `supabase/migrations/[use timestamp 20260409120000]_add_dhmad_escrow_id.sql`

```sql
-- Add Dhmad escrow tracking to contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS dhmad_escrow_id TEXT,
  ADD COLUMN IF NOT EXISTS dhmad_payment_url TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_dhmad_escrow_id
  ON contracts(dhmad_escrow_id)
  WHERE dhmad_escrow_id IS NOT NULL;

COMMENT ON COLUMN contracts.dhmad_escrow_id IS 'Dhmad escrow ID for external escrow tracking';
COMMENT ON COLUMN contracts.dhmad_payment_url IS 'Dhmad payment URL for client to fund escrow';
```

## STRICT RULES
- Deno-compatible imports only in Edge Functions (no Node.js)
- No `any` types
- All error messages in Arabic for user-facing errors
- Dev mode mocks must return realistic data shapes
- Must include CORS headers in Edge Functions
- Add TODO comments everywhere real API calls will go

## DELIVERABLE
Provide complete content of all 5 files. Nothing else.
```

---

---

# ðŸ¤– AGENT C â€” FAQ Payment Section Update

**Model**: GPT-4o mini or Gemini 1.5 Flash  
**Estimated time**: 15-20 min  
**Complexity**: LOW

---

## PROMPT FOR AGENT C:

```
You are working on Khedmetna, a Tunisian freelance marketplace.

## YOUR SINGLE TASK
Update the FAQ page to add payment method information.

## FILE TO UPDATE: `src/pages/FAQ.tsx`

Read the existing file and add a new FAQ section about payments. Add these Q&As in the appropriate place (after existing payment questions if any, or as a new "Payments" section):

Questions to add (in all 3 languages â€” Arabic, French, English):

Q1: "What payment methods are available?"
A1: "Currently we support Dhmad escrow for secure transactions. Flouci wallet and D17 (La Poste) are coming soon. Dhmad holds your funds securely until work is approved â€” the same system used by Tunisie Freelance."

Q2: "Is Dhmad safe?"
A2: "Yes. Dhmad is a Tunisian escrow platform authorized to hold funds as a trusted third party. Your money is protected until you approve the work."

Q3: "When will Flouci and D17 be available?"
A3: "We're actively working on adding Flouci and D17. They will be available soon. We'll notify all users when they launch."

Q4: "What happens if there's a dispute?"
A4: "If there's a disagreement, Dhmad holds the funds while the dispute is resolved. Neither party can access the money until the issue is settled."

## RULES
- Match the existing FAQ component structure exactly
- Support Arabic (RTL), French, English
- Use the existing i18n pattern in the file
- Do not change any existing FAQ items
- Do not add new dependencies

## DELIVERABLE
Provide the complete updated FAQ.tsx file content.
```

---

---

# ðŸ¤– AGENT D â€” Coming Soon Banner Component

**Model**: GPT-4o mini or Gemini 1.5 Flash  
**Estimated time**: 15-20 min  
**Complexity**: LOW

---

## PROMPT FOR AGENT D:

```
You are working on Khedmetna, a Tunisian freelance marketplace.

## YOUR SINGLE TASK
Create a dismissible "Coming Soon" banner for the homepage announcing Flouci and D17 payment methods.

## FILE 1 â€” CREATE: `src/components/common/ComingSoonBanner.tsx`

Requirements:
- Gradient background: from indigo-600 to purple-600
- Text (3 languages):
  - EN: "ðŸŽ‰ Coming Soon: Flouci & D17 payment methods â€” more ways to pay on Khedmetna!"
  - AR: "ðŸŽ‰ Ù‚Ø±ÙŠØ¨Ø§Ù‹: Ø·Ø±Ù‚ Ø¯ÙØ¹ ÙÙ„ÙˆØ³ÙŠ Ùˆ D17 â€” Ø§Ù„Ù…Ø²ÙŠØ¯ Ù…Ù† Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ø¯ÙØ¹ Ø¹Ù„Ù‰ Ø®Ø¯Ù…Ø©!"
  - FR: "ðŸŽ‰ BientÃ´t : Flouci & D17 â€” plus de moyens de paiement sur Khedmetna !"
- Dismissible: X button on the right
- Persistence: use localStorage key `khedma_banner_dismissed_payment_v1`
- If dismissed, don't show again
- Responsive: full width, centered text on mobile
- Use `useTranslation()` from `@/i18n` for language detection
- Use lucide-react X icon for close button

## FILE 2 â€” UPDATE: `src/pages/Home.tsx`

Import and add `<ComingSoonBanner />` as the FIRST element inside the page's root div, before the Header component.

## RULES
- No new dependencies
- TypeScript strict
- Tailwind only, no inline styles
- Must not break existing Home page

## DELIVERABLE
Provide complete content of ComingSoonBanner.tsx and the relevant updated section of Home.tsx (just the import + usage, not the whole file).
```

---

## ðŸ“‹ ORCHESTRATOR REVIEW CHECKLIST

When agents return their work, I (Kiro) will verify:

### Agent A output:
- [ ] `src/config/paymentMethods.ts` â€” correct structure
- [ ] `src/components/payment/PaymentMethodSelector.tsx` â€” renders correctly
- [ ] `src/pages/Wallet.tsx` â€” selector integrated, default = 'dhmad'
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

### Agent B output:
- [ ] `src/services/dhmad.ts` â€” all 4 functions, dev mocks work
- [ ] 3 Edge Functions â€” correct Deno syntax, CORS headers
- [ ] Migration file â€” correct SQL, timestamp in filename
- [ ] No Node.js imports in Edge Functions
- [ ] TypeScript strict

### Agent C output:
- [ ] FAQ updated with 4 new Q&As
- [ ] All 3 languages present
- [ ] Existing FAQ items unchanged
- [ ] Build passes

### Agent D output:
- [ ] Banner component created
- [ ] localStorage dismissal works
- [ ] Home.tsx updated correctly
- [ ] Build passes

---

## ðŸš¨ WHAT TO DO WITH AGENT OUTPUT

1. Agent gives you code â†’ paste it into the files
2. Run: `npx tsc --noEmit` â†’ must show 0 errors
3. Run: `npm run build` â†’ must succeed
4. Report back to me (Kiro) with:
   - Which agent completed
   - Any errors found
   - Screenshot or output of build result

I will then review, approve, and tell you what to commit.

**DO NOT commit anything until I approve it.**

---

**Last Updated**: 2026-04-09  
**Orchestrator**: Kiro  
**Status**: Ready to dispatch agents

---

## ðŸ¤– UPDATED MODEL LIST (2026)

| Agent | Task | Best Model | Why |
|-------|------|-----------|-----|
| A | Payment UI | **Claude Sonnet 4.5** | Best at complex React + TypeScript + i18n |
| B | Dhmad Backend | **Claude Sonnet 4.5** | Best at Supabase Edge Functions + Deno |
| C | FAQ Update | **Gemini 3.1 Pro** | Fast, accurate for simple JSX edits |
| D | Coming Soon Banner | **Gemini 3.1 Pro** | Fast, accurate for simple components |

**Alternatives if limits hit**:
- GPT-5.4 â†’ works for all 4 tasks
- GPT-5.4 mini â†’ fine for C and D only
- Gemini 3.1 Flash â†’ fine for C and D only


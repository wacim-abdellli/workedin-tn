# 🤖 AGENT TASK: T09 — Design Token Migration (33 Component Files)

**Project**: Khedmetna — Tunisian Freelance Marketplace
**Stack**: React 18, TypeScript, Tailwind CSS, Vite
**Date**: 2026-04-09

---

## YOUR SINGLE TASK

Replace hardcoded Tailwind gray classes with semantic design tokens across 33 component files.
No logic changes. No new dependencies. CSS classes only.

---

## TOKEN MAPPING REFERENCE

```
BACKGROUNDS
bg-gray-50                    → bg-surface
bg-gray-100                   → bg-muted
bg-gray-200                   → bg-secondary
bg-gray-400 (as bg)           → bg-muted
dark:bg-gray-600              → REMOVE
dark:bg-gray-700              → REMOVE
dark:bg-gray-700/50           → REMOVE
dark:bg-gray-800              → REMOVE

TEXT
text-gray-100                 → text-muted/20 (decorative only)
text-gray-200                 → text-muted-foreground
text-gray-300                 → text-muted
text-gray-400                 → text-muted
dark:text-gray-100            → REMOVE
dark:text-gray-200            → REMOVE
dark:text-gray-300            → REMOVE
dark:text-gray-400            → REMOVE
dark:hover:text-white         → KEEP (intentional contrast)
placeholder:text-gray-400     → placeholder:text-muted

BORDERS
border-gray-50                → border-border
border-gray-200               → border-border
dark:border-gray-600          → REMOVE
dark:border-gray-700          → REMOVE

HOVER
hover:bg-gray-200             → hover:bg-secondary
dark:hover:bg-gray-700        → REMOVE
dark:hover:bg-gray-700/50     → REMOVE

SHADOWS
shadow-gray-200/50            → shadow-border/50

DO NOT TOUCH
- Status/semantic colors: green-*, red-*, blue-*, yellow-*, orange-*, purple-*, amber-*
- Glass effects: white/10, white/5, black/20, zinc-*
- Primary/accent: primary-*, accent-*, workspace-*
- dark-* custom tokens (dark-700, dark-800 etc — these are custom, not Tailwind gray)
- Gradient backgrounds that are intentional page-level design
- Star rating colors (text-gray-300 used for empty stars — change to text-muted)

---

## FILE 1 — `src/components/ErrorBoundary.tsx`

Line 75:
```
BEFORE: hover:bg-gray-200 dark:bg-gray-700
AFTER:  hover:bg-secondary
```

---

## FILE 2 — `src/components/auth/AuthShell.tsx`

Line 35 — page gradient (KEEP — intentional design):
```
from-gray-50 via-gray-100 to-gray-50  → KEEP (page-level gradient)
```

Line 76:
```
BEFORE: bg-gray-100
AFTER:  bg-muted
```

---

## FILE 3 — `src/components/common/OptimizedImage.tsx`

Line 54:
```
BEFORE: bg-gray-200 dark:bg-gray-700
AFTER:  bg-secondary
```

Line 59:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 4 — `src/components/contracts/ChatSection.tsx`

Line 99:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 117:
```
BEFORE: bg-gray-200 dark:bg-gray-700
AFTER:  bg-secondary
```

Line 149:
```
BEFORE: dark:text-gray-100
AFTER:  (remove dark:text-gray-100 — text-foreground handles it)
```

Line 190:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 196:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

Line 210:
```
BEFORE: bg-gray-200 dark:bg-gray-700
AFTER:  bg-secondary
```

Lines 212, 213, 214 — typing indicator dots:
```
BEFORE: bg-gray-400
AFTER:  bg-muted
```

Line 249:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 5 — `src/components/contracts/ContractDetailsSidebar.tsx`

Lines 93, 98, 177, 180, 210, 213, 235 — all icon colors:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 6 — `src/components/freelancers/FreelancerCard.tsx`

Line 158:
```
BEFORE: border-gray-50
AFTER:  border-border
```

Line 187:
```
BEFORE: dark:text-gray-300
AFTER:  (remove — text-muted-foreground handles it)
```

---

## FILE 7 — `src/components/job-post/JobWizardLayout.tsx`

Line 134:
```
BEFORE: bg-gray-100
AFTER:  bg-muted
```

---

## FILE 8 — `src/components/job-post/StepJobBasics.tsx`

Line 120:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 234:
```
BEFORE: placeholder:text-gray-400
AFTER:  placeholder:text-muted
```

---

## FILE 9 — `src/components/job-post/StepReview.tsx`

Lines 70, 74, 78 — tag pills:
```
BEFORE: bg-gray-100 ... dark:bg-white/10
AFTER:  bg-muted ... dark:bg-white/10
```
(keep dark:bg-white/10 — it's a glass effect)

Lines 97, 110, 120, 128, 136 — icon colors:
```
BEFORE: text-gray-400 dark:text-muted
AFTER:  text-muted
```
(remove redundant dark:text-muted — same token)

Line 172:
```
BEFORE: dark:text-gray-400
AFTER:  (remove — text-muted handles it)
```

---

## FILE 10 — `src/components/jobs/FilterSidebar.tsx`

Line 111:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 11 — `src/components/jobs/JobCard.tsx`

Line 52 — hardcoded hex colors in JS object (status color map):
```
BEFORE: border: '#6B7280', bg: '#F3F4F6', text: '#374151', gradient: 'from-gray-500 to-slate-500'
AFTER:  KEEP AS-IS — these are programmatic status colors, not Tailwind classes
```

---

## FILE 12 — `src/components/layout/AccountPanel.tsx`

Line 276:
```
BEFORE: shadow-gray-200/50
AFTER:  shadow-border/50
```

Line 290:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 349:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 364:
```
BEFORE: dark:text-gray-100
AFTER:  (remove)
```

Line 367:
```
BEFORE: text-gray-400 dark:text-muted
AFTER:  text-muted
```

Line 372:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 382:
```
BEFORE: dark:text-gray-200
AFTER:  (remove)
```

Line 462:
```
BEFORE: bg-gray-100 ... dark:text-gray-300
AFTER:  bg-muted ... (remove dark:text-gray-300)
```

Line 476:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 484:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 490:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 551:
```
BEFORE: bg-gray-200 dark:bg-gray-700 dark:bg-card/10
AFTER:  bg-border
```

Line 562:
```
BEFORE: dark:text-gray-400
AFTER:  (remove)
```

Line 588:
```
BEFORE: dark:text-gray-100
AFTER:  (remove)
```

Line 591:
```
BEFORE: bg-gray-100 ... dark:text-gray-400
AFTER:  bg-muted ... (remove dark:text-gray-400)
```

Line 596:
```
BEFORE: text-gray-400 dark:text-muted
AFTER:  text-muted
```

---

## FILE 13 — `src/components/onboarding/OnboardingShell.tsx`

Line 71:
```
BEFORE: bg-gray-100 dark:bg-white/10
AFTER:  bg-muted dark:bg-white/10
```
(keep dark:bg-white/10 — glass effect)

Line 91:
```
BEFORE: bg-gray-50/60
AFTER:  bg-surface/60
```

Lines 98, 99:
```
BEFORE: bg-gray-100
AFTER:  bg-muted
```

---

## FILE 14 — `src/components/onboarding/OnboardingStep3.tsx`

Line 146:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

---

## FILE 15 — `src/components/onboarding/OnboardingStep4.tsx`

Line 88:
```
BEFORE: bg-gray-100 ... dark:text-gray-400
AFTER:  bg-muted ... (remove dark:text-gray-400)
```

Line 128 — dark gradient button (KEEP — intentional dark UI element):
```
from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black → KEEP
```

Lines 171, 195:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 16 — `src/components/payments/FundEscrow.tsx`

Line 118:
```
BEFORE: dark:bg-gray-700/50
AFTER:  (remove — bg-surface handles it)
```

Line 127:
```
BEFORE: bg-gray-200 dark:bg-gray-700 dark:bg-gray-600
AFTER:  bg-border
```

---

## FILE 17 — `src/components/payments/WalletCard.tsx`

Lines 83, 84, 85 — skeleton loading bars:
```
BEFORE: bg-gray-200 dark:bg-gray-700
AFTER:  bg-secondary
```

Line 112:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

---

## FILE 18 — `src/components/payments/WithdrawalForm.tsx`

Line 134:
```
BEFORE: dark:hover:bg-gray-700
AFTER:  (remove)
```

Line 142:
```
BEFORE: dark:bg-gray-700/50
AFTER:  (remove — bg-surface handles it)
```

Line 188:
```
BEFORE: dark:border-gray-600
AFTER:  (remove — border-border handles it)
```

Line 250:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 19 — `src/components/proposals/JobSummaryCard.tsx`

Line 40:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 20 — `src/components/proposals/ProposalCard.tsx`

Lines 73, 116:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Lines 75, 79 — separator pipes:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

Line 110:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 21 — `src/components/proposals/ProposalDetailModal.tsx`

Line 127:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 148:
```
BEFORE: dark:text-gray-200
AFTER:  (remove)
```

Line 170:
```
BEFORE: hover:bg-gray-200 dark:bg-gray-700/50
AFTER:  hover:bg-secondary
```

Line 197 — separator pipe:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

Lines 203, 235:
```
BEFORE: dark:text-gray-200
AFTER:  (remove)
```

Lines 260, 263:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 306:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 351:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 22 — `src/components/proposals/ProposalFiltersSidebar.tsx`

Line 32:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Lines 37, 54, 75:
```
BEFORE: dark:text-gray-200
AFTER:  (remove)
```

---

## FILE 23 — `src/components/proposals/ProposalModal.tsx`

Lines 116, 146, 168, 189:
```
BEFORE: dark:text-gray-100
AFTER:  (remove — text-foreground handles it)
```

Line 126:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 158:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 217:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 24 — `src/components/reviews/ReviewDisplay.tsx`

Lines 95, 186, 222 — empty star color:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

Lines 112, 132 — rating bar backgrounds:
```
BEFORE: bg-gray-200 dark:bg-gray-700
AFTER:  bg-secondary
```

Line 261:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

---

## FILE 25 — `src/components/reviews/ReviewModal.tsx`

Lines 102, 159 — empty star color:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

Line 255:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 26 — `src/components/settings/ReportButton.tsx`

Line 105:
```
BEFORE: text-gray-400 ... disabled:hover:text-gray-400
AFTER:  text-muted ... disabled:hover:text-muted
```

---

## FILE 27 — `src/components/ui/ErrorBoundary.tsx`

Line 54:
```
BEFORE: bg-gray-50
AFTER:  bg-surface
```

---

## FILE 28 — `src/components/ui/FileUpload.tsx`

Line 52:
```
BEFORE: dark:text-gray-200
AFTER:  (remove)
```

Line 111:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

---

## FILE 29 — `src/components/ui/FullScreenLoader.tsx`

Line 14:
```
BEFORE: bg-gray-50
AFTER:  bg-surface
```

---

## FILE 30 — `src/components/ui/PaymentModal.tsx`

Line 90:
```
BEFORE: bg-gray-300 dark:bg-dark-500
AFTER:  bg-muted
```
(keep dark:bg-dark-500 only if dark-500 is a custom token — otherwise remove)

Lines 220, 232, 244 — inactive tab state:
```
BEFORE: hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-dark-700/50
AFTER:  hover:bg-secondary
```

---

## FILE 31 — `src/components/ui/Reviews.tsx`

Lines 87, 203, 310 — empty star color:
```
BEFORE: text-gray-300
AFTER:  text-muted
```

Line 327 — rating bar background:
```
BEFORE: bg-gray-200 dark:bg-gray-700
AFTER:  bg-secondary
```

---

## FILE 32 — `src/components/verify/DocumentUpload.tsx`

Line 94:
```
BEFORE: dark:border-gray-600
AFTER:  (remove — border-border handles it)
```

Line 96:
```
BEFORE: dark:bg-gray-700 ... text-gray-400
AFTER:  (remove dark:bg-gray-700) ... text-muted
```

Line 101:
```
BEFORE: text-gray-400
AFTER:  text-muted
```

Line 106:
```
BEFORE: dark:bg-gray-700 dark:text-gray-200
AFTER:  (remove both — tokens handle it)
```

Line 109:
```
BEFORE: dark:text-gray-300
AFTER:  (remove)
```

Line 126:
```
BEFORE: dark:text-gray-400 dark:hover:text-white
AFTER:  (remove dark:text-gray-400, keep dark:hover:text-white)
```

---

## FILE 33 — `src/components/verify/VerificationReview.tsx`

Line 41:
```
BEFORE: dark:text-gray-200
AFTER:  (remove)
```

Lines 86, 89, 92 — edit buttons:
```
BEFORE: dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700
AFTER:  (remove all three dark: overrides — tokens handle it)
```

Line 106:
```
BEFORE: dark:hover:bg-gray-700/50
AFTER:  (remove)
```

Line 123:
```
BEFORE: dark:text-gray-400 dark:hover:text-white
AFTER:  (remove dark:text-gray-400, keep dark:hover:text-white)
```

---

## STRICT RULES

- NO logic changes
- NO import changes
- NO new dependencies
- DO NOT touch: green-*, red-*, blue-*, yellow-*, orange-*, purple-*, amber-*, primary-*, accent-*, dark-*, zinc-*, workspace-*
- DO NOT touch glass effects: white/10, white/5, black/20
- DO NOT touch intentional gradient backgrounds (gray-800, gray-900 in OnboardingStep4 dark button)
- KEEP dark:hover:text-white where it appears (intentional contrast)
- Provide complete updated file for ALL 33 files

---

## DELIVERABLE

Provide the complete updated content for all 33 files in this order:
1. src/components/ErrorBoundary.tsx
2. src/components/auth/AuthShell.tsx
3. src/components/common/OptimizedImage.tsx
4. src/components/contracts/ChatSection.tsx
5. src/components/contracts/ContractDetailsSidebar.tsx
6. src/components/freelancers/FreelancerCard.tsx
7. src/components/job-post/JobWizardLayout.tsx
8. src/components/job-post/StepJobBasics.tsx
9. src/components/job-post/StepReview.tsx
10. src/components/jobs/FilterSidebar.tsx
11. src/components/jobs/JobCard.tsx
12. src/components/layout/AccountPanel.tsx
13. src/components/onboarding/OnboardingShell.tsx
14. src/components/onboarding/OnboardingStep3.tsx
15. src/components/onboarding/OnboardingStep4.tsx
16. src/components/payments/FundEscrow.tsx
17. src/components/payments/WalletCard.tsx
18. src/components/payments/WithdrawalForm.tsx
19. src/components/proposals/JobSummaryCard.tsx
20. src/components/proposals/ProposalCard.tsx
21. src/components/proposals/ProposalDetailModal.tsx
22. src/components/proposals/ProposalFiltersSidebar.tsx
23. src/components/proposals/ProposalModal.tsx
24. src/components/reviews/ReviewDisplay.tsx
25. src/components/reviews/ReviewModal.tsx
26. src/components/settings/ReportButton.tsx
27. src/components/ui/ErrorBoundary.tsx
28. src/components/ui/FileUpload.tsx
29. src/components/ui/FullScreenLoader.tsx
30. src/components/ui/PaymentModal.tsx
31. src/components/ui/Reviews.tsx
32. src/components/verify/DocumentUpload.tsx
33. src/components/verify/VerificationReview.tsx

---

## VERIFICATION (run after applying all files)

```bash
npx tsc --noEmit
npm run build
```

Both must pass with 0 errors.

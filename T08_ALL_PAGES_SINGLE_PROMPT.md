# 🤖 AGENT TASK: T08 — Design Token Migration (7 Pages)

**Project**: Khedmetna — Tunisian Freelance Marketplace  
**Stack**: React 18, TypeScript, Tailwind CSS, Vite  
**Date**: 2026-04-09

---

## YOUR SINGLE TASK

Replace hardcoded Tailwind gray classes with semantic design tokens across 7 page files.

**No logic changes. No new dependencies. CSS classes only.**

---

## DESIGN TOKEN REFERENCE

Use these EXACT replacements everywhere:

```
BACKGROUNDS
bg-gray-50                          → bg-surface
bg-gray-100                         → bg-muted
bg-gray-200                         → bg-secondary
bg-gray-400 (as background)         → bg-muted
dark:bg-gray-700                    → REMOVE (token handles dark mode)
dark:bg-gray-700/50                 → REMOVE (token handles dark mode)
dark:bg-gray-800                    → REMOVE (token handles dark mode)
dark:bg-gray-900                    → REMOVE (token handles dark mode)

TEXT
text-gray-100 (decorative only)     → text-muted/20
text-gray-200                       → text-muted-foreground
text-gray-300                       → text-muted
text-gray-400                       → text-muted
dark:text-gray-200                  → REMOVE (token handles dark mode)
dark:text-gray-300                  → REMOVE (token handles dark mode)
dark:text-gray-400                  → REMOVE (token handles dark mode)
dark:hover:text-gray-300            → REMOVE (token handles dark mode)

BORDERS
border-gray-200                     → border-border
border-gray-300                     → border-border
dark:border-gray-700                → REMOVE (token handles dark mode)

HOVER
hover:bg-gray-200                   → hover:bg-secondary

DO NOT TOUCH
- Status colors: green-*, red-*, blue-*, yellow-*, orange-*, purple-*, amber-*
- Glass effects: white/10, black/20, white/5 (intentional)
- Primary/accent colors: primary-*, accent-*
- Any color inside a conditional that represents a specific status
```

---

## FILE 1 — `src/pages/PortfolioDashboard.tsx`

### Change 1 — Line 125: Page background
```tsx
// BEFORE
<div className="min-h-screen bg-gray-50 pb-20 bg-card">

// AFTER
<div className="min-h-screen bg-surface pb-20">
```

### Change 2 — Line 132: Subtitle text
```tsx
// BEFORE
<p className="text-muted mt-1 dark:text-gray-400">{t.portfolio.subtitle}</p>

// AFTER
<p className="text-muted-foreground mt-1">{t.portfolio.subtitle}</p>
```

### Change 3 — Lines 139 & 145: View mode toggle buttons (apply to BOTH)
```tsx
// BEFORE
className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-primary-600' : 'text-gray-400 hover:text-muted-foreground'}`}

// AFTER
className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-muted text-primary-600' : 'text-muted hover:text-muted-foreground'}`}
```

### Change 4 — Line 194: Empty image placeholder
```tsx
// BEFORE
<div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 bg-card">

// AFTER
<div className="w-full h-full bg-muted flex items-center justify-center text-muted">
```

### Change 5 — Lines 201 & 207: Action buttons overlay (apply to BOTH)
```tsx
// BEFORE
className="p-2 bg-white rounded-full text-muted-foreground hover:text-primary-600 transition-colors bg-card dark:text-gray-200"

// AFTER
className="p-2 bg-card rounded-full text-muted-foreground hover:text-primary-600 transition-colors"
```

### Change 6 — Line 218: Item description
```tsx
// BEFORE
<p className="text-sm text-muted line-clamp-2 dark:text-gray-400">{item.description}</p>

// AFTER
<p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
```

### Change 7 — Lines 223 & 228: Skill tags (apply to BOTH)
```tsx
// BEFORE
<span key={i} className="px-2 py-1 bg-gray-50 text-muted-foreground text-xs rounded-md border border-border bg-card dark:text-gray-300">

// AFTER
<span key={i} className="px-2 py-1 bg-surface text-muted-foreground text-xs rounded-md border border-border">
```

### Change 8 — Line 239: Empty state icon wrapper
```tsx
// BEFORE
<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 bg-card">

// AFTER
<div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
```

### Change 9 — Line 240: Empty state icon
```tsx
// BEFORE
<ImageIcon className="w-8 h-8 text-gray-300" />

// AFTER
<ImageIcon className="w-8 h-8 text-muted" />
```

### Change 10 — Line 243: Empty state description
```tsx
// BEFORE
<p className="text-muted mb-6 max-w-sm mx-auto dark:text-gray-400">{t.portfolio.empty.description}</p>

// AFTER
<p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t.portfolio.empty.description}</p>
```

---

## FILE 2 — `src/pages/PaymentFailed.tsx`

### Change 1 — Line 65: Tips section background
```tsx
// BEFORE
<div className="bg-surface dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-right">

// AFTER
<div className="bg-surface rounded-xl p-4 mb-6 text-right">
```

### Change 2 — Line 99: Home link
```tsx
// BEFORE
className="flex items-center justify-center gap-2 text-muted hover:text-muted-foreground dark:hover:text-gray-300 mt-4"

// AFTER
className="flex items-center justify-center gap-2 text-muted hover:text-muted-foreground mt-4"
```

---

## FILE 3 — `src/pages/NotFound.tsx`

### Change 1 — Line 16: Decorative 404 number
```tsx
// BEFORE
<span className="text-[160px] font-black leading-none tracking-tighter text-gray-100 dark:text-white/5">

// AFTER
<span className="text-[160px] font-black leading-none tracking-tighter text-muted/20 dark:text-white/5">
```

### Change 2 — Line 36: Back button (simplify — remove ALL redundant dark: classes)
```tsx
// BEFORE
className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground dark:text-gray-200 transition hover:bg-surface dark:border-white/10 border-border dark:bg-white/5 dark:text-gray-300 dark:hover:bg-card/10"

// AFTER
className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground transition hover:bg-surface"
```

---

## FILE 4 — `src/pages/JobMatches.tsx`

### Change 1 — Line 331: Skill tags
```tsx
// BEFORE
className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground dark:text-gray-200"

// AFTER
className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
```

### Change 2 — Line 348: Voice playback button (non-playing state)
```tsx
// BEFORE
: 'bg-gray-100 text-foreground dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700'

// AFTER
: 'bg-muted text-foreground hover:bg-secondary'
```

---

## FILE 5 — `src/pages/FindFreelancers.tsx`

### Change 1 — Line 380: View mode separator
```tsx
// BEFORE
<div className="h-6 w-px bg-gray-200 dark:bg-gray-700 dark:bg-white/10" />

// AFTER
<div className="h-6 w-px bg-border" />
```

---

## FILE 6 — `src/pages/ContractWorkspace.tsx`

### Change 1 — Line 361: Status indicator dot (default/inactive state only)
```tsx
// BEFORE
currentStatus === 'completed' ? 'bg-blue-500' : 'bg-gray-400'

// AFTER
currentStatus === 'completed' ? 'bg-blue-500' : 'bg-muted'
```

---

## FILE 7 — `src/pages/ClientJobs.tsx`

### Change 1 — Line 138: Inactive tab state
```tsx
// BEFORE
: 'text-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-300'

// AFTER
: 'text-muted hover:text-foreground'
```

### Change 2 — Line 218: Posted time text
```tsx
// BEFORE
<p className="text-sm text-gray-400">

// AFTER
<p className="text-sm text-muted">
```

---

## STRICT RULES

- ❌ Do NOT change any logic, state, or functionality
- ❌ Do NOT add or remove imports
- ❌ Do NOT touch status colors (green, red, blue, yellow, orange, purple)
- ❌ Do NOT touch glass effects (white/10, black/20)
- ❌ Do NOT touch primary/accent colors
- ✅ ONLY change the exact className strings listed above
- ✅ Remove redundant dark: classes when the token already handles dark mode
- ✅ Provide the complete updated file for EACH of the 7 files

---

## DELIVERABLE

Provide the complete updated content for all 7 files in this order:
1. `src/pages/PortfolioDashboard.tsx`
2. `src/pages/PaymentFailed.tsx`
3. `src/pages/NotFound.tsx`
4. `src/pages/JobMatches.tsx`
5. `src/pages/FindFreelancers.tsx`
6. `src/pages/ContractWorkspace.tsx`
7. `src/pages/ClientJobs.tsx`

---

## VERIFICATION (run after applying all files)

```bash
npx tsc --noEmit
npm run build
grep -rn "gray-[0-9]" src/pages/PortfolioDashboard.tsx src/pages/PaymentFailed.tsx src/pages/NotFound.tsx src/pages/JobMatches.tsx src/pages/FindFreelancers.tsx src/pages/ContractWorkspace.tsx src/pages/ClientJobs.tsx
```

Expected results:
- `npx tsc --noEmit` → 0 errors
- `npm run build` → success
- `grep` → 0 results (no hardcoded grays remain)

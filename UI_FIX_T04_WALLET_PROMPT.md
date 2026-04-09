# 🤖 AGENT TASK: T04 - Wallet.tsx Hardcoded Colors

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**Estimated time**: 30 minutes  
**Complexity**: MEDIUM  
**Date**: 2026-04-09

---

## YOUR SINGLE TASK

Replace ~14 hardcoded Tailwind color classes with design tokens in `src/pages/Wallet.tsx`.

**Scope**: Withdrawal Modal + Deposit Modal (lines 690-855)

---

## CONTEXT

- **Tech stack**: React 18, TypeScript, Tailwind CSS
- **Design tokens**: Already defined in `src/styles/colors.css`
- **Pattern**: Replace raw Tailwind grays with semantic tokens
- **No new dependencies**: Use existing token system only

---

## TOKEN MAPPING REFERENCE

Use these EXACT replacements:

```
BACKGROUNDS:
bg-gray-50 dark:bg-gray-900        → bg-surface
bg-gray-100 dark:bg-gray-800       → bg-muted
bg-white dark:bg-gray-800          → bg-card
bg-gray-200 dark:bg-gray-700       → bg-secondary

TEXT:
text-gray-900 dark:text-white      → text-foreground
text-gray-600 dark:text-gray-400   → text-muted-foreground
text-gray-500 dark:text-gray-500   → text-muted
text-gray-700 dark:text-gray-300   → text-foreground

BORDERS:
border-gray-200 dark:border-gray-700   → border-border
border-gray-300 dark:border-gray-600   → border-border
border-gray-400 dark:border-gray-500   → border-border

HOVER STATES:
hover:bg-gray-50 dark:hover:bg-gray-900   → hover:bg-surface
hover:bg-gray-100 dark:hover:bg-gray-800  → hover:bg-muted
hover:border-gray-300                      → hover:border-border
```

---

## SPECIFIC LOCATIONS TO FIX

### 1. Deposit Modal Container (line ~690)
**Find**:
```tsx
<div className="relative w-full max-w-md rounded-2xl bg-[var(--surface-bg)] border border-border p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
```
**Action**: Already uses tokens - SKIP

### 2. Quick Amount Buttons (line ~730)
**Find**:
```tsx
className="py-2 rounded-xl text-sm font-semibold border border-border bg-secondary hover:border-[color:var(--workspace-primary)] hover:text-[color:var(--workspace-primary)] transition-colors"
```
**Action**: Already uses tokens - SKIP

### 3. Withdrawal Modal Container (line ~760)
**Find**:
```tsx
<div className="bg-card rounded-2xl p-4 sm:p-6 max-w-md w-full my-8">
```
**Action**: Already uses tokens - SKIP

### 4. Available Balance Box (line ~775)
**Find**:
```tsx
<div className="mb-4 sm:mb-6 p-4 bg-surface rounded-xl">
```
**Action**: Already uses tokens - SKIP

### 5. Method Selector Buttons (line ~810)
**Find**:
```tsx
className={`p-3 min-h-[72px] rounded-xl border-2 text-center transition-colors ${
  method === m
    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    : 'border-border dark:border-gray-600 hover:border-border'
}`}
```
**Replace with**:
```tsx
className={`p-3 min-h-[72px] rounded-xl border-2 text-center transition-colors ${
  method === m
    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    : 'border-border hover:border-border'
}`}
```
**Change**: Remove `dark:border-gray-600` (redundant with `border-border`)

### 6. Phone Input Icon (line ~850)
**Find**:
```tsx
<Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
```
**Replace with**:
```tsx
<Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
```

---

## VERIFICATION CHECKLIST

After making changes, verify:

1. **Type check passes**:
   ```bash
   npx tsc --noEmit
   ```

2. **Build succeeds**:
   ```bash
   npm run build
   ```

3. **Visual inspection**:
   - Open `/wallet` page
   - Click "Deposit Funds" button
   - Verify modal colors match design system
   - Click "Request Withdrawal" button
   - Verify modal colors match design system
   - Toggle dark mode - verify both themes work

4. **No hardcoded grays remain**:
   ```bash
   grep -n "gray-[0-9]" src/pages/Wallet.tsx
   ```
   Should return ONLY status pill colors (yellow, green, red, purple) - NO gray-50, gray-100, etc.

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify status pill colors (green, yellow, red, purple)
- ❌ Do NOT change any other files
- ✅ ONLY replace hardcoded gray classes with tokens
- ✅ Preserve all existing class names and structure
- ✅ Keep all conditional logic intact

---

## DELIVERABLE

Provide the complete updated `src/pages/Wallet.tsx` file content.

**Expected changes**: 2-3 lines modified (method selector border, phone icon color)

---

## NOTES

Most of this file already uses design tokens correctly. The fixes are minimal:
- Remove redundant `dark:border-gray-600` from method selector
- Replace `text-gray-400` with `text-muted` in phone icon

This is a quick cleanup task, not a major refactor.

---

**Orchestrator**: Kiro  
**Priority**: HIGH  
**Blocking**: None  
**Estimated Impact**: Wallet UI consistency with design system

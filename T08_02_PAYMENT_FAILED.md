# 🤖 AGENT TASK: T08-02 Payment Failed Page

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/PaymentFailed.tsx`  
**Estimated time**: 10 minutes  
**Complexity**: LOW  
**Priority**: MEDIUM

---

## YOUR SINGLE TASK

Replace ~3 hardcoded Tailwind gray classes with design tokens in PaymentFailed.tsx.

---

## CONTEXT

- **Tech stack**: React 18, TypeScript, Tailwind CSS
- **Design tokens**: Already defined in `src/styles/colors.css`
- **Pattern**: Replace raw Tailwind grays with semantic tokens
- **No new dependencies**: Use existing token system only

---

## TOKEN MAPPING

```
BACKGROUNDS:
dark:bg-gray-700/50   → (remove, bg-surface handles it)

TEXT:
dark:hover:text-gray-300  → (remove, hover:text-muted-foreground handles it)
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 65 - Tips section background
**Find**:
```tsx
<div className="bg-surface dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-right">
```
**Replace**:
```tsx
<div className="bg-surface rounded-xl p-4 mb-6 text-right">
```
**Note**: Remove `dark:bg-gray-700/50` - `bg-surface` token already handles dark mode

### 2. Line 99 - Home link hover state
**Find**:
```tsx
className="flex items-center justify-center gap-2 text-muted hover:text-muted-foreground dark:hover:text-gray-300 mt-4"
```
**Replace**:
```tsx
className="flex items-center justify-center gap-2 text-muted hover:text-muted-foreground mt-4"
```
**Note**: Remove `dark:hover:text-gray-300` - `hover:text-muted-foreground` token already handles dark mode

---

## VERIFICATION CHECKLIST

After making changes:

1. **Type check**:
   ```bash
   npx tsc --noEmit
   ```
   Expected: 0 errors

2. **Build**:
   ```bash
   npm run build
   ```
   Expected: Success

3. **Check for remaining grays**:
   ```bash
   grep -n "gray-[0-9]" src/pages/PaymentFailed.tsx
   ```
   Expected: 0 results

4. **Visual test**:
   - Open `/payment/failed` page
   - Verify tips section background
   - Hover over home link
   - Toggle dark mode - verify both themes work

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify error/warning colors (red, amber)
- ✅ ONLY remove redundant dark mode classes
- ✅ Keep all existing class names and structure

---

## DELIVERABLE

Provide the complete updated `src/pages/PaymentFailed.tsx` file content.

**Expected changes**: 2 lines modified (removed redundant dark: classes)

---

**Orchestrator**: Kiro  
**Priority**: MEDIUM  
**Blocking**: None  
**Estimated Impact**: Payment failed page consistency with design system

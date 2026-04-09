# 🤖 AGENT TASK: T08-05 Find Freelancers Page

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/FindFreelancers.tsx`  
**Estimated time**: 10 minutes  
**Complexity**: LOW  
**Priority**: MEDIUM

---

## YOUR SINGLE TASK

Replace ~2 hardcoded Tailwind gray classes with design tokens in FindFreelancers.tsx.

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
bg-gray-200           → bg-border
dark:bg-gray-700      → (remove, bg-border handles it)
dark:bg-white/10      → (keep, intentional glass effect)
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 380 - View mode separator divider
**Find**:
```tsx
<div className="h-6 w-px bg-gray-200 dark:bg-gray-700 dark:bg-white/10" />
```
**Replace**:
```tsx
<div className="h-6 w-px bg-border" />
```
**Note**: Removed `dark:bg-gray-700` and `dark:bg-white/10` - `bg-border` token handles dark mode properly

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
   grep -n "gray-[0-9]" src/pages/FindFreelancers.tsx
   ```
   Expected: 0 results

4. **Visual test**:
   - Open `/find-freelancers` page
   - Look for view mode toggle buttons (grid/list)
   - Verify separator divider between buttons is visible
   - Toggle dark mode - verify divider visible in both themes

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify button colors or icons
- ✅ ONLY replace hardcoded gray classes with tokens
- ✅ Remove redundant dark: classes
- ✅ Keep all existing class names and structure

---

## DELIVERABLE

Provide the complete updated `src/pages/FindFreelancers.tsx` file content.

**Expected changes**: 1 line modified (gray classes → tokens)

---

**Orchestrator**: Kiro  
**Priority**: MEDIUM  
**Blocking**: None  
**Estimated Impact**: Find freelancers page consistency with design system

# 🤖 AGENT TASK: T08-03 Not Found (404) Page

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/NotFound.tsx`  
**Estimated time**: 10 minutes  
**Complexity**: LOW  
**Priority**: LOW

---

## YOUR SINGLE TASK

Replace ~3 hardcoded Tailwind gray classes with design tokens in NotFound.tsx.

---

## CONTEXT

- **Tech stack**: React 18, TypeScript, Tailwind CSS
- **Design tokens**: Already defined in `src/styles/colors.css`
- **Pattern**: Replace raw Tailwind grays with semantic tokens
- **No new dependencies**: Use existing token system only

---

## TOKEN MAPPING

```
TEXT:
text-gray-100         → text-muted (for decorative 404 number)
dark:text-gray-200    → (remove, text-foreground handles it)
dark:text-gray-300    → (remove, text-foreground handles it)
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 16 - Big 404 number (decorative)
**Find**:
```tsx
<span className="text-[160px] font-black leading-none tracking-tighter text-gray-100 dark:text-white/5">
```
**Replace**:
```tsx
<span className="text-[160px] font-black leading-none tracking-tighter text-muted/20 dark:text-white/5">
```
**Note**: Changed `text-gray-100` to `text-muted/20` for subtle decorative effect

### 2. Line 36 - Back button
**Find**:
```tsx
className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground dark:text-gray-200 transition hover:bg-surface dark:border-white/10 border-border dark:bg-white/5 dark:text-gray-300 dark:hover:bg-card/10"
```
**Replace**:
```tsx
className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground transition hover:bg-surface"
```
**Note**: Removed ALL redundant dark: classes - tokens handle everything

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
   grep -n "gray-[0-9]" src/pages/NotFound.tsx
   ```
   Expected: 0 results

4. **Visual test**:
   - Open any invalid URL (e.g., `/this-does-not-exist`)
   - Verify 404 page displays correctly
   - Check decorative "404" number is subtle
   - Hover over "Go back" button
   - Toggle dark mode - verify both themes work

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify the decorative 404 number too much (keep it subtle)
- ✅ ONLY replace hardcoded gray classes with tokens
- ✅ Remove redundant dark: classes
- ✅ Keep all existing class names and structure

---

## DELIVERABLE

Provide the complete updated `src/pages/NotFound.tsx` file content.

**Expected changes**: 2 lines modified (gray classes → tokens, removed redundant dark: classes)

---

**Orchestrator**: Kiro  
**Priority**: LOW  
**Blocking**: None  
**Estimated Impact**: 404 page consistency with design system

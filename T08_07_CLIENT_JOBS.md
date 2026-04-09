# 🤖 AGENT TASK: T08-07 Client Jobs Page

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/ClientJobs.tsx`  
**Estimated time**: 10 minutes  
**Complexity**: LOW  
**Priority**: MEDIUM

---

## YOUR SINGLE TASK

Replace ~3 hardcoded Tailwind gray classes with design tokens in ClientJobs.tsx.

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
text-gray-400             → text-muted
dark:text-gray-400        → (remove, token handles it)
dark:hover:text-gray-300  → (remove, token handles it)
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 138 - Tab button inactive state
**Find**:
```tsx
${activeTab === tab 
  ? 'tab-pill-active bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' 
  : 'text-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-300'
}
```
**Replace**:
```tsx
${activeTab === tab 
  ? 'tab-pill-active bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' 
  : 'text-muted hover:text-foreground'
}
```
**Note**: Removed `dark:text-gray-400` and `dark:hover:text-gray-300` - tokens handle it

### 2. Line 218 - Job posted time text
**Find**:
```tsx
<p className="text-sm text-gray-400">
```
**Replace**:
```tsx
<p className="text-sm text-muted">
```

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
   grep -n "gray-[0-9]" src/pages/ClientJobs.tsx
   ```
   Expected: 0 results

4. **Visual test**:
   - Open `/client/jobs` page (need to be logged in as client)
   - Click through tabs (All, Open, In Progress, etc.)
   - Verify inactive tab text color
   - Hover over inactive tabs
   - Check "Posted X days ago" text color
   - Toggle dark mode - verify all states work

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify active tab colors (accent colors)
- ✅ ONLY replace hardcoded gray classes with tokens
- ✅ Remove redundant dark: classes
- ✅ Keep all existing class names and structure
- ✅ Preserve conditional logic (active vs inactive tabs)

---

## DELIVERABLE

Provide the complete updated `src/pages/ClientJobs.tsx` file content.

**Expected changes**: 2 lines modified (gray classes → tokens, removed redundant dark: classes)

---

**Orchestrator**: Kiro  
**Priority**: MEDIUM  
**Blocking**: None  
**Estimated Impact**: Client jobs page consistency with design system

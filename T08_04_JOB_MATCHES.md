# 🤖 AGENT TASK: T08-04 Job Matches Page

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/JobMatches.tsx`  
**Estimated time**: 15 minutes  
**Complexity**: MEDIUM  
**Priority**: HIGH

---

## YOUR SINGLE TASK

Replace ~5 hardcoded Tailwind gray classes with design tokens in JobMatches.tsx.

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
bg-gray-100           → bg-muted
hover:bg-gray-200     → hover:bg-secondary
dark:bg-gray-700      → (remove, token handles it)

TEXT:
dark:text-gray-200    → (remove, token handles it)
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 331 - Skill tags
**Find**:
```tsx
className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground dark:text-gray-200"
```
**Replace**:
```tsx
className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
```
**Note**: Remove `dark:text-gray-200` - `text-muted-foreground` token handles it

### 2. Line 348 - Voice playback button (complex conditional)
**Find**:
```tsx
${playingVoice === freelancer.id
    ? 'bg-primary-100 text-primary-700'
    : 'bg-gray-100 text-foreground dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700'
}
```
**Replace**:
```tsx
${playingVoice === freelancer.id
    ? 'bg-primary-100 text-primary-700'
    : 'bg-muted text-foreground hover:bg-secondary'
}
```
**Note**: Simplified - removed all dark: classes, tokens handle everything

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
   grep -n "gray-[0-9]" src/pages/JobMatches.tsx
   ```
   Expected: 0 results

4. **Visual test**:
   - Open `/job-matches` page (may need to be logged in as client)
   - Verify skill tags display correctly
   - Click voice playback button (if available)
   - Verify button states (normal vs playing)
   - Toggle dark mode - verify both themes work

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify primary/accent colors (purple, blue)
- ✅ ONLY replace hardcoded gray classes with tokens
- ✅ Remove redundant dark: classes
- ✅ Keep all existing class names and structure
- ✅ Preserve conditional logic (playing vs not playing states)

---

## DELIVERABLE

Provide the complete updated `src/pages/JobMatches.tsx` file content.

**Expected changes**: 2 lines modified (gray classes → tokens, removed redundant dark: classes)

---

**Orchestrator**: Kiro  
**Priority**: HIGH  
**Blocking**: None  
**Estimated Impact**: Job matches page consistency with design system

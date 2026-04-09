# 🤖 AGENT TASK: T08-06 Contract Workspace Page

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/ContractWorkspace.tsx`  
**Estimated time**: 10 minutes  
**Complexity**: LOW  
**Priority**: MEDIUM

---

## YOUR SINGLE TASK

Replace ~2 hardcoded Tailwind gray classes with design tokens in ContractWorkspace.tsx.

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
bg-gray-400   → bg-muted (for status indicator dot)
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 361 - Contract status indicator dot
**Find**:
```tsx
<span className={`w-2 h-2 rounded-full ${currentStatus === 'active' ? 'bg-green-500' :
    currentStatus === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
}`}></span>
```
**Replace**:
```tsx
<span className={`w-2 h-2 rounded-full ${currentStatus === 'active' ? 'bg-green-500' :
    currentStatus === 'completed' ? 'bg-blue-500' : 'bg-muted'
}`}></span>
```
**Note**: Changed `bg-gray-400` to `bg-muted` for default/inactive status

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
   grep -n "gray-[0-9]" src/pages/ContractWorkspace.tsx
   ```
   Expected: 0 results

4. **Visual test**:
   - Open `/contracts/[id]` page (need active contract)
   - Look for status indicator dot
   - Verify colors:
     - Active = green
     - Completed = blue
     - Other = muted gray
   - Toggle dark mode - verify all status colors work

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify status colors (green, blue)
- ✅ ONLY replace hardcoded gray-400 with bg-muted
- ✅ Keep all existing class names and structure
- ✅ Preserve conditional logic (status-based colors)

---

## DELIVERABLE

Provide the complete updated `src/pages/ContractWorkspace.tsx` file content.

**Expected changes**: 1 line modified (bg-gray-400 → bg-muted)

---

**Orchestrator**: Kiro  
**Priority**: MEDIUM  
**Blocking**: None  
**Estimated Impact**: Contract workspace page consistency with design system

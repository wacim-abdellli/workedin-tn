# 🤖 AGENT TASK: T08-01 Portfolio Dashboard

**Model**: Claude Sonnet 4.5 or GPT-5.4  
**File**: `src/pages/PortfolioDashboard.tsx`  
**Estimated time**: 20 minutes  
**Complexity**: MEDIUM  
**Priority**: HIGH

---

## YOUR SINGLE TASK

Replace ~15 hardcoded Tailwind gray classes with design tokens in PortfolioDashboard.tsx.

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
bg-gray-50        → bg-surface
bg-gray-100       → bg-muted
dark:bg-gray-*    → (remove, token handles it)

TEXT:
text-gray-200     → text-muted-foreground
text-gray-300     → text-muted
text-gray-400     → text-muted
dark:text-gray-*  → (remove, token handles it)

BORDERS:
border-gray-200   → border-border
```

---

## SPECIFIC FIXES NEEDED

### 1. Line 125 - Page background
**Find**:
```tsx
<div className="min-h-screen bg-gray-50 pb-20 bg-card">
```
**Replace**:
```tsx
<div className="min-h-screen bg-surface pb-20">
```
**Note**: Remove duplicate `bg-card`, use `bg-surface` for page background

### 2. Line 132 - Subtitle text
**Find**:
```tsx
<p className="text-muted mt-1 dark:text-gray-400">{t.portfolio.subtitle}</p>
```
**Replace**:
```tsx
<p className="text-muted-foreground mt-1">{t.portfolio.subtitle}</p>
```

### 3. Lines 139 & 145 - View mode buttons
**Find**:
```tsx
className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-primary-600' : 'text-gray-400 hover:text-muted-foreground'}`}
```
**Replace**:
```tsx
className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-muted text-primary-600' : 'text-muted hover:text-muted-foreground'}`}
```
**Apply to BOTH grid and list buttons**

### 4. Line 194 - Empty portfolio image placeholder
**Find**:
```tsx
<div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 bg-card">
```
**Replace**:
```tsx
<div className="w-full h-full bg-muted flex items-center justify-center text-muted">
```

### 5. Lines 201 & 207 - Portfolio item action buttons
**Find**:
```tsx
className="p-2 bg-white rounded-full text-muted-foreground hover:text-primary-600 transition-colors bg-card dark:text-gray-200"
```
**Replace**:
```tsx
className="p-2 bg-card rounded-full text-muted-foreground hover:text-primary-600 transition-colors"
```
**Apply to BOTH edit and delete buttons**

### 6. Line 218 - Portfolio item description
**Find**:
```tsx
<p className="text-sm text-muted line-clamp-2 dark:text-gray-400">{item.description}</p>
```
**Replace**:
```tsx
<p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
```

### 7. Lines 223 & 228 - Skill tags
**Find**:
```tsx
<span key={i} className="px-2 py-1 bg-gray-50 text-muted-foreground text-xs rounded-md border border-border bg-card dark:text-gray-300">
```
**Replace**:
```tsx
<span key={i} className="px-2 py-1 bg-surface text-muted-foreground text-xs rounded-md border border-border">
```
**Apply to BOTH skill tags and "+X more" tag**

### 8. Line 239 - Empty state icon container
**Find**:
```tsx
<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 bg-card">
```
**Replace**:
```tsx
<div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
```

### 9. Line 240 - Empty state icon
**Find**:
```tsx
<ImageIcon className="w-8 h-8 text-gray-300" />
```
**Replace**:
```tsx
<ImageIcon className="w-8 h-8 text-muted" />
```

### 10. Line 243 - Empty state description
**Find**:
```tsx
<p className="text-muted mb-6 max-w-sm mx-auto dark:text-gray-400">{t.portfolio.empty.description}</p>
```
**Replace**:
```tsx
<p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t.portfolio.empty.description}</p>
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
   grep -n "gray-[0-9]" src/pages/PortfolioDashboard.tsx
   ```
   Expected: 0 results (no hardcoded grays remain)

4. **Visual test**:
   - Open `/portfolio` page
   - Toggle between grid/list view
   - Verify colors match design system
   - Toggle dark mode - verify both themes work

---

## STRICT RULES

- ❌ Do NOT change any logic or functionality
- ❌ Do NOT add new dependencies
- ❌ Do NOT modify status colors (green, red, blue, purple)
- ✅ ONLY replace hardcoded gray classes with tokens
- ✅ Remove redundant `dark:` classes when token handles it
- ✅ Keep all existing class names and structure

---

## DELIVERABLE

Provide the complete updated `src/pages/PortfolioDashboard.tsx` file content.

**Expected changes**: ~10 lines modified (gray classes → tokens)

---

**Orchestrator**: Kiro  
**Priority**: HIGH  
**Blocking**: None  
**Estimated Impact**: Portfolio page consistency with design system

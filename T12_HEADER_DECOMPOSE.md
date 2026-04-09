# 🤖 AGENT TASK: T12 — Header index.tsx Cleanup

**File**: `src/components/layout/Header/index.tsx`  
**Current**: 258 lines  
**Estimated time**: 20 minutes  
**Complexity**: LOW  
**Priority**: LOW

---

## CURRENT STATE

The Header is already well-decomposed:
- `AuthHeader.tsx` — unauthenticated header
- `DesktopNav.tsx` — desktop navigation
- `UserMenu.tsx` — user dropdown
- `LanguageMenu.tsx` — language switcher
- `MobileHeader.tsx` — mobile drawer
- `SearchModal.tsx` — search overlay
- `index.tsx` — orchestrator (258 lines)

258 lines is already reasonable. The original audit flagged it at 1270 lines — that was already fixed.

---

## YOUR TASK

Review `src/components/layout/Header/index.tsx` and:

1. **Remove any dead code** — unused variables, commented-out blocks, unused imports
2. **Extract any inline logic** that belongs in a sub-component
3. **Add missing JSDoc** on the main export
4. **Ensure clean separation** — index.tsx should only orchestrate, not render complex UI

---

## SPECIFIC CHECKS

### 1. Unused imports
Scan the import list — remove anything not used in the file.

### 2. Inline event handlers
Any `onClick` or `onKeyDown` with more than 2 lines of logic should be extracted to a named function above the return statement.

### 3. Inline styles or hardcoded values
Move any magic numbers or hardcoded strings to named constants at the top of the file.

### 4. Add component JSDoc
```tsx
/**
 * Main application header.
 * Renders AuthHeader for unauthenticated users,
 * or the full header with navigation, search, and user menu for authenticated users.
 */
export function Header() {
```

---

## STRICT RULES

- ❌ Do NOT change any functionality
- ❌ Do NOT move logic to new files (keep it simple)
- ❌ Do NOT change any visual output
- ✅ Only cleanup: remove dead code, extract named handlers, add JSDoc
- ✅ File should be ≤ 250 lines after cleanup

---

## VERIFICATION

```bash
npx tsc --noEmit
npm run build
```

Visual test: Header renders correctly on all pages.

---

## DELIVERABLE

Provide complete updated `src/components/layout/Header/index.tsx`.

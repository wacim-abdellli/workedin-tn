# UI Fix Agent Prompts
**Orchestrator**: Kiro  
**Date**: 2026-04-09  
**Purpose**: Parallel UI fixes while waiting for Dhmad response

---

## 🤖 AGENT UI-1: Arabic Encoding Fix

**Model**: Gemini 3.1 Pro  
**Time**: 5 minutes  
**Complexity**: LOW

### PROMPT:

```
You are fixing an encoding bug in a React i18n file.

## YOUR TASK
Revert the corrupted Arabic translation file and verify it's clean UTF-8.

## CONTEXT
The file `src/i18n/ar.ts` was recently edited and now contains mojibake (garbled characters like â€" instead of proper Arabic). This is visible on live production pages.

## STEPS

1. Check current encoding:
```bash
file src/i18n/ar.ts
```

2. Revert to last good version:
```bash
git log --oneline src/i18n/ar.ts  # Find last commit before corruption
git checkout <commit-hash> src/i18n/ar.ts
```

3. Verify the file now contains clean Arabic:
```bash
head -20 src/i18n/ar.ts  # Should show proper Arabic characters
```

4. If git history is unclear, manually inspect the file and ensure:
   - No `â€"` characters
   - No `Ã©` or similar mojibake
   - All Arabic text uses proper Unicode characters

## DELIVERABLE
Confirm the file is reverted and encoding is clean. Provide the git commit hash used for revert.
```

---

## 🤖 AGENT UI-2: Fix Hidden Banner

**Model**: Claude Sonnet 4.5  
**Time**: 15 minutes  
**Complexity**: MEDIUM

### PROMPT:

```
You are a senior React developer fixing a z-index layout bug.

## YOUR TASK
Make the ComingSoonBanner visible on the homepage by fixing its z-index collision with the fixed Header.

## PROBLEM
The banner exists in DOM but is invisible because:
- `Home.tsx` renders `<ComingSoonBanner />` before `<Header />`
- `Header` uses `fixed top-0 z-50` positioning
- Banner renders in normal document flow BEHIND the fixed header

## SOLUTION (Choose One)

### Option A (Recommended): Move banner into Header
```tsx
// src/components/layout/Header/index.tsx
// Add ComingSoonBanner as FIRST child inside <header>

import ComingSoonBanner from '@/components/common/ComingSoonBanner';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 ...">
      <ComingSoonBanner />  {/* ← Add here */}
      
      {/* existing header content */}
      <div className="border-b ...">
        {/* nav, logo, etc */}
      </div>
    </header>
  );
}

// src/pages/Home.tsx
// REMOVE <ComingSoonBanner /> from here
```

### Option B: Make banner fixed with higher z-index
```tsx
// src/components/common/ComingSoonBanner.tsx
// Change root div to:
<div className="fixed top-0 left-0 right-0 z-[60] ...">

// src/components/layout/Header/index.tsx
// Add top padding to push header down:
<header className="fixed top-[40px] left-0 right-0 z-50 ...">
```

## RULES
- Do NOT break existing Header functionality
- Banner dismiss button must still work
- localStorage persistence must still work
- Must work in both light and dark mode

## DELIVERABLE
Provide the complete updated files. Specify which option you chose and why.
```

---

## 🤖 AGENT UI-3: MobileNav Token Refactor

**Model**: Claude Sonnet 4.5  
**Time**: 30 minutes  
**Complexity**: HIGH

### PROMPT:

```
You are a senior React developer refactoring a component to use design tokens.

## YOUR TASK
Fix the MobileNav component by removing conflicting Tailwind classes and using design tokens.

## PROBLEM
`src/components/layout/MobileNav.tsx` has severe dark mode bugs caused by conflicting classes:

Line 255:
```tsx
className="bg-white dark:bg-gray-800 dark:bg-gray-900 p-2 dark:bg-[var(--color-bg-muted)]"
// ← THREE different dark backgrounds conflict!
```

Line 278:
```tsx
className="hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-white dark:bg-gray-800 dark:bg-gray-900/5"
// ← FOUR conflicting backgrounds!
```

## DESIGN TOKENS AVAILABLE
Use these CSS variables instead of hardcoded Tailwind colors:

- `var(--color-background-base)` - Main background
- `var(--color-background-elevated)` - Cards, modals
- `var(--color-background-hover)` - Hover states
- `var(--color-text-primary)` - Main text
- `var(--color-text-secondary)` - Muted text
- `var(--color-border-default)` - Borders
- `var(--color-border-subtle)` - Subtle borders
- `var(--workspace-primary)` - Brand color

## REFACTOR STRATEGY

1. Find all instances of:
   - `bg-white` → `style={{ background: 'var(--color-background-elevated)' }}`
   - `dark:bg-gray-800` → remove (token handles it)
   - `dark:bg-gray-900` → remove (token handles it)
   - `text-gray-900` → `style={{ color: 'var(--color-text-primary)' }}`
   - `text-gray-500` → `style={{ color: 'var(--color-text-secondary)' }}`
   - `border-gray-200` → `style={{ borderColor: 'var(--color-border-default)' }}`

2. For hover states, use inline event handlers:
```tsx
<button
  style={{ background: 'var(--color-background-elevated)' }}
  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background-hover)'}
  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background-elevated)'}
>
```

3. Keep Tailwind utility classes for:
   - Layout (flex, grid, gap, p-*, m-*)
   - Typography (text-sm, font-bold)
   - Transitions (transition-colors)

## RULES
- Do NOT change component logic or functionality
- Do NOT add new dependencies
- Must work in both light and dark mode
- TypeScript strict mode must pass

## DELIVERABLE
Provide the complete refactored `MobileNav.tsx` file.
```

---

## 🤖 AGENT UI-4: Wallet Token Refactor

**Model**: Claude Sonnet 4.5  
**Time**: 45 minutes  
**Complexity**: HIGH

### PROMPT:

```
You are a senior React developer refactoring a large component to use design tokens.

## YOUR TASK
Refactor `src/pages/Wallet.tsx` to replace 36+ hardcoded colors with design tokens.

## PROBLEM
The Wallet page ignores the design system and uses hardcoded Tailwind colors everywhere:

Line 203:
```tsx
className="bg-white dark:bg-gray-800 text-purple-600 ..."
// ← Should use tokens
```

Line 210:
```tsx
className="bg-white dark:bg-gray-800/20 hover:bg-white ..."
// ← Invisible button in light mode!
```

Line 365:
```tsx
className="bg-card border border-border rounded-lg hover:bg-gray-50 dark:bg-gray-900 ..."
// ← Mixing tokens and hardcoded colors
```

## DESIGN TOKENS AVAILABLE

### Backgrounds
- `var(--color-background-base)` - Page background
- `var(--color-background-elevated)` - Cards, modals
- `var(--color-background-hover)` - Hover states
- `var(--surface-bg)` - Alternative surface

### Text
- `var(--color-text-primary)` - Main text
- `var(--color-text-secondary)` - Muted text
- `var(--foreground)` - Alternative primary text

### Borders
- `var(--color-border-default)` - Standard borders
- `var(--color-border-subtle)` - Subtle borders
- `var(--border)` - Alternative border

### Brand & Status
- `var(--workspace-primary)` - Primary brand color
- `var(--color-success)` - Green (earnings, positive)
- `var(--color-error)` - Red (withdrawals, negative)
- `var(--color-warning)` - Amber (pending)

## REFACTOR STRATEGY

### 1. Buttons
```tsx
// BEFORE (broken in light mode)
className="bg-white text-purple-600 hover:bg-purple-50"

// AFTER
className="bg-[var(--workspace-primary)] text-white hover:opacity-90"
```

### 2. Cards
```tsx
// BEFORE
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"

// AFTER
style={{ 
  background: 'var(--color-background-elevated)',
  borderColor: 'var(--color-border-default)'
}}
```

### 3. Status Colors
```tsx
// BEFORE
className="text-green-600 dark:text-green-400"

// AFTER
style={{ color: 'var(--color-success)' }}
```

### 4. Text
```tsx
// BEFORE
className="text-gray-900 dark:text-white"

// AFTER
style={{ color: 'var(--color-text-primary)' }}
```

## CRITICAL FIX
The "Deposit Funds" button is currently INVISIBLE in light mode:
```tsx
// Line 210 - BROKEN
className="bg-white/20 hover:bg-white/30 text-white"
// ← White text on white background!

// FIX
className="bg-white/20 hover:bg-white/30 text-[var(--workspace-primary)]"
// OR better:
className="bg-[var(--workspace-primary)]/20 hover:bg-[var(--workspace-primary)]/30 text-[var(--workspace-primary)]"
```

## RULES
- Do NOT change component logic or functionality
- Do NOT break existing Wallet features
- Must work in both light and dark mode
- All buttons must be visible with proper contrast
- TypeScript strict mode must pass

## DELIVERABLE
Provide the complete refactored `Wallet.tsx` file with all hardcoded colors replaced.
```

---

## 📋 ORCHESTRATOR CHECKLIST

When agents return their work:

### Agent UI-1 (Arabic Fix):
- [ ] `src/i18n/ar.ts` reverted to clean version
- [ ] No mojibake characters visible
- [ ] File encoding is UTF-8
- [ ] Git commit hash documented

### Agent UI-2 (Banner Fix):
- [ ] Banner visible on homepage
- [ ] No z-index collision with Header
- [ ] Dismiss button works
- [ ] localStorage persistence works
- [ ] Works in light and dark mode

### Agent UI-3 (MobileNav):
- [ ] No conflicting Tailwind classes
- [ ] All colors use design tokens
- [ ] Dark mode works perfectly
- [ ] No visual glitches
- [ ] TypeScript compiles

### Agent UI-4 (Wallet):
- [ ] All 36+ hardcoded colors replaced
- [ ] Deposit button visible in light mode
- [ ] All buttons have proper contrast
- [ ] Dark mode works perfectly
- [ ] TypeScript compiles

---

## VERIFICATION COMMANDS

After each agent completes:

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Visual test
npm run dev
# Then manually verify the specific component/page
```

---

**Last Updated**: 2026-04-09  
**Status**: Ready to dispatch agents  
**Blocked By**: None - all UI fixes are independent

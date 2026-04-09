# 🤖 AGENT TASK: T14 — framer-motion Optimization

**Files**:
- `src/components/ui/CustomCursor.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/RouteProgress.tsx`
- `src/components/layout/AccountPanel.tsx`

**Estimated time**: 30 minutes  
**Complexity**: LOW-MEDIUM  
**Priority**: LOW

---

## CURRENT STATE

framer-motion is used in 4 files. The audit flagged potential missing `LayoutGroup` optimizations and unnecessary re-renders.

---

## YOUR TASK

Review each file and apply these optimizations where applicable:

---

## OPTIMIZATION RULES

### Rule 1 — `AnimatePresence` must have `mode` prop
```tsx
// BAD
<AnimatePresence>

// GOOD
<AnimatePresence mode="wait">
// or
<AnimatePresence mode="sync">
```

### Rule 2 — Add `layout` prop to elements that change size/position
```tsx
// If a motion element changes width/height/position dynamically:
<motion.div layout>
```

### Rule 3 — Use `LayoutGroup` when multiple animated elements share layout
```tsx
import { LayoutGroup } from 'framer-motion';

<LayoutGroup>
  <motion.div layout />
  <motion.div layout />
</LayoutGroup>
```

### Rule 4 — Add `will-change: transform` hint for GPU acceleration
```tsx
// In motion elements that animate frequently:
<motion.div style={{ willChange: 'transform' }}>
```

### Rule 5 — Reduce bundle size — use specific imports
```tsx
// BAD
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// GOOD — only import what you use
import { motion, AnimatePresence } from 'framer-motion';
```

### Rule 6 — `useReducedMotion` for accessibility
```tsx
import { useReducedMotion } from 'framer-motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };
}
```

---

## FILE-SPECIFIC INSTRUCTIONS

### `src/components/ui/Toast.tsx`
- Check if `AnimatePresence` has `mode` prop — add `mode="sync"` if missing
- Toast items should animate in/out independently — `mode="sync"` is correct
- Add `layout` to the toast container if toasts shift position when one is removed

### `src/components/ui/RouteProgress.tsx`
- Progress bar animates on route change — ensure `willChange: 'transform'` or `willChange: 'width'`
- Should use `useReducedMotion` — if user prefers reduced motion, skip animation

### `src/components/ui/CustomCursor.tsx`
- Custom cursor animates on every mouse move — this is performance-sensitive
- Ensure it uses `useMotionValue` and `useSpring` (not `animate`) for smooth performance
- Add `willChange: 'transform'` to the cursor element
- Wrap in `useReducedMotion` check — hide custom cursor if user prefers reduced motion

### `src/components/layout/AccountPanel.tsx`
- Check if `AnimatePresence` has `mode` prop
- Panel slides in/out — `mode="wait"` is appropriate
- Add `layout` if panel content changes height dynamically

---

## STRICT RULES

- ❌ Do NOT change animation values (duration, easing, etc.)
- ❌ Do NOT change visual behavior
- ❌ Do NOT add new dependencies
- ✅ Only add missing props (`mode`, `layout`, `willChange`)
- ✅ Add `useReducedMotion` where missing
- ✅ Clean up unused framer-motion imports

---

## VERIFICATION

```bash
npx tsc --noEmit
npm run build
```

Visual test:
- Toast notifications animate correctly
- Route progress bar shows on navigation
- Custom cursor moves smoothly (if enabled)
- Account panel slides in/out correctly

---

## DELIVERABLE

Provide complete updated content for all 4 files.

If a file already has all optimizations applied, state: "FILE X — already optimized, no changes needed."

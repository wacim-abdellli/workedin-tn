# 🤖 AGENT TASK: T11 + T13 — Header Keyboard Navigation (A11y)

**Files**:
- `src/components/layout/Header/UserMenu.tsx`
- `src/components/layout/Header/DesktopNav.tsx`
- `src/components/layout/Header/MobileHeader.tsx`

**Estimated time**: 45 minutes  
**Complexity**: MEDIUM  
**Priority**: LOW (but good for accessibility)

---

## CURRENT STATE

Already done:
- ✅ `UserMenu.tsx` has `role="menu"`, `role="menuitem"`, `aria-expanded`, `aria-haspopup`, Escape key
- ✅ `DesktopNav.tsx` has `role="menu"`, `aria-expanded`, `aria-haspopup`, Escape key
- ✅ `MobileHeader.tsx` has `aria-label` on close button

Missing:
- ❌ Arrow Up/Down navigation between menu items
- ❌ Tab trapping inside open menus
- ❌ Focus returns to trigger button when menu closes
- ❌ MobileHeader missing `role="dialog"` and `aria-modal` on drawer

---

## YOUR TASK

Add Arrow key navigation and focus management to the 3 Header components.

---

## FILE 1 — `src/components/layout/Header/UserMenu.tsx`

### Add Arrow key navigation to the menu

Find the existing `handleKeyDown` function (around line 49) and expand it:

```tsx
// BEFORE
const handleKeyDown = (event: KeyboardEvent) => {
  if (userMenuOpen && event.key === "Escape") {
    setUserMenuOpen(false);
  }
};

// AFTER
const menuRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

const handleKeyDown = (event: KeyboardEvent) => {
  if (!userMenuOpen) return;

  if (event.key === "Escape") {
    setUserMenuOpen(false);
    triggerRef.current?.focus(); // return focus to trigger
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;

    const focused = document.activeElement;
    const arr = Array.from(items);
    const idx = arr.indexOf(focused as HTMLElement);

    if (event.key === "ArrowDown") {
      const next = idx < arr.length - 1 ? arr[idx + 1] : arr[0];
      next.focus();
    } else {
      const prev = idx > 0 ? arr[idx - 1] : arr[arr.length - 1];
      prev.focus();
    }
  }
};
```

Add `ref={menuRef}` to the `role="menu"` div.
Add `ref={triggerRef}` to the trigger button.
Change `document.addEventListener` to use the new handler.

### Focus first item when menu opens

Find where `setUserMenuOpen(true)` is called and add:
```tsx
setUserMenuOpen(true);
// Focus first menu item after render
setTimeout(() => {
  const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
  first?.focus();
}, 10);
```

---

## FILE 2 — `src/components/layout/Header/DesktopNav.tsx`

Same pattern as UserMenu. Find the existing Escape handler (line 39) and expand:

```tsx
const menuRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

// In the keydown handler:
if (event.key === "Escape") {
  setNavMoreOpen(false);
  triggerRef.current?.focus();
  return;
}

if (event.key === "ArrowDown" || event.key === "ArrowUp") {
  event.preventDefault();
  const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
  if (!items || items.length === 0) return;
  const arr = Array.from(items);
  const idx = arr.indexOf(document.activeElement as HTMLElement);
  if (event.key === "ArrowDown") {
    (idx < arr.length - 1 ? arr[idx + 1] : arr[0]).focus();
  } else {
    (idx > 0 ? arr[idx - 1] : arr[arr.length - 1]).focus();
  }
}
```

Add `ref={menuRef}` to `role="menu"` div.
Add `ref={triggerRef}` to trigger button.

---

## FILE 3 — `src/components/layout/Header/MobileHeader.tsx`

Add `role="dialog"` and `aria-modal` to the mobile drawer:

Find the main drawer container div and add:
```tsx
role="dialog"
aria-modal="true"
aria-label={t.common?.navigation || "Navigation menu"}
```

Add Escape key to close the drawer:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      onClose();
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [isOpen, onClose]);
```

---

## STRICT RULES

- ❌ Do NOT change any visual styling
- ❌ Do NOT change any logic or state management
- ❌ Do NOT add new dependencies
- ✅ Only add keyboard event handlers and ARIA attributes
- ✅ Keep all existing functionality intact
- ✅ Use `useRef` from existing React import

---

## VERIFICATION

```bash
npx tsc --noEmit
npm run build
```

Manual test:
1. Tab to user menu trigger → Enter to open → Arrow Down/Up to navigate → Escape to close → focus returns to trigger
2. Tab to "More" nav button → Enter to open → Arrow Down/Up → Escape → focus returns
3. Open mobile menu → press Escape → drawer closes

---

## DELIVERABLE

Provide complete updated content for all 3 files.

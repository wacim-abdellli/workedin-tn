# Khedma TN — Logo Integration Prompt
# Feed this to your agent verbatim.

---

## CONTEXT

A new `Logo.tsx` component has been created at `src/components/ui/Logo.tsx`.
It renders an inline SVG logo — no external files, no img tags, no broken paths on reload.

The component has 3 variants:
- `full` — horizontal lockup (mark + "khedmatn" wordmark) — use in Header
- `mark` — icon only — use for favicon or tight spaces
- `pill` — violet pill badge — use as the beta/workspace tag beside the logo

It has 4 sizes: `xs`, `sm`, `md`, `lg`

---

## TASK 1 — Copy the file

The file `Logo.tsx` already exists. Copy it to:
```
src/components/ui/Logo.tsx
```

Also add the export to `src/components/ui/index.ts`:
```ts
export { Logo } from './Logo';
```

---

## TASK 2 — Update Header (src/components/layout/Header/index.tsx)

### Step 1: Add import at the top
```tsx
import { Logo } from '../../ui/Logo';
```

### Step 2: Find the logo button/link block

The current logo renders something like:
```tsx
<button onClick={() => navigate('/')} className="flex items-center">
  <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
</button>
```

or a `<Link to="/">` wrapping an `<img>`.

### Step 3: Replace it with this exact block

```tsx
<button
  onClick={() => navigate('/')}
  className="flex items-center focus:outline-none"
  aria-label="Go to homepage"
>
  <Logo variant="full" size="sm" />
</button>
```

Do NOT add any extra className or style to the Logo itself.
Do NOT wrap it in another img or div.
Do NOT keep the old img tag.

### Step 4: Find the beta/version badge

The header has a small badge next to the logo that says "beta" or shows a version tag.
It currently looks like:
```tsx
<span className="...">beta</span>
// or
<Badge>beta</Badge>
```

Replace it with:
```tsx
<Logo variant="pill" size="xs" />
```

If no beta badge exists, skip this step.

---

## TASK 3 — Update Footer (src/components/layout/Footer.tsx)

### Step 1: Add import
```tsx
import { Logo } from '../ui/Logo';
```

### Step 2: Find the footer logo

Currently renders an img or text-based logo in the footer.

Replace with:
```tsx
<Logo variant="full" size="sm" />
```

The footer is typically on a dark background (`bg-secondary-900`).
The wordmark uses `var(--text-primary)` which in dark mode resolves to `#f8f7ff` — correct.
No additional changes needed for dark mode.

---

## TASK 4 — Update public/index.html (favicon)

Find:
```html
<link rel="icon" ... />
```

Replace with an inline SVG favicon using a data URI:
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 40'><polygon points='0,20 10,4 16,4 8,20 16,36 10,36' fill='%237C3AED'/><polygon points='32,20 22,4 28,4 32,20 28,36 22,36' fill='%23D97706'/><polygon points='14,14 18,14 16,20' fill='%237C3AED'/><polygon points='14,26 18,26 16,20' fill='%23D97706'/></svg>" />
```

This is the mark-only icon as a data URI — no file needed, works instantly.

Also update the `<title>` tag if it still says "Vite + React" or similar:
```html
<title>Khedma TN — Tunisia's Freelance Marketplace</title>
```

---

## DEFINITION OF DONE

- [ ] `src/components/ui/Logo.tsx` file in place
- [ ] `Logo` exported from `src/components/ui/index.ts`
- [ ] Header logo button uses `<Logo variant="full" size="sm" />`
- [ ] Old `<img src={logoSrc}>` removed from Header
- [ ] Beta badge replaced with `<Logo variant="pill" size="xs" />` (if it existed)
- [ ] Footer logo updated to `<Logo variant="full" size="sm" />`
- [ ] Favicon updated to inline SVG data URI
- [ ] Page title updated in index.html
- [ ] Logo renders correctly in both light and dark mode
- [ ] No console errors about missing logo files
- [ ] Clicking logo still navigates to /

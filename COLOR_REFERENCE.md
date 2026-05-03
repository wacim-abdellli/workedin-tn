# Loading Styles Color Reference

## Freelancer Theme (Purple)

### Primary Colors
- **Main**: `#9333ea` (purple-600)
- **Hover**: `#7e22ce` (purple-700)
- **Active**: `#6b21a8` (purple-800)
- **Light**: `#faf5ff` (purple-50)
- **Dim**: `rgba(147, 51, 234, 0.12)`

### Usage
- Logo: Purple variant (20-icon-square-purple.svg)
- Spinners: Purple
- Progress bars: Purple gradient
- Buttons: Purple background/border
- Glow effects: Purple shadow

### CSS Variables
```css
--workspace-primary: #9333ea
--workspace-primary-hover: #7e22ce
--workspace-primary-active: #6b21a8
--workspace-primary-light: #faf5ff
--workspace-primary-dim: rgba(147, 51, 234, 0.12)
```

---

## Client Theme (Gold/Amber)

### Primary Colors
- **Main**: `#d97706` (amber-600)
- **Hover**: `#b45309` (amber-700)
- **Active**: `#92400e` (amber-800)
- **Light**: `#fffbeb` (amber-50)
- **Dim**: `rgba(217, 119, 6, 0.12)`

### Usage
- Logo: Amber variant (13-icon-square-amber.svg)
- Spinners: Gold
- Progress bars: Gold gradient
- Buttons: Gold background/border
- Glow effects: Gold shadow

### CSS Variables
```css
--workspace-primary: #d97706
--workspace-primary-hover: #b45309
--workspace-primary-active: #92400e
--workspace-primary-light: #fffbeb
--workspace-primary-dim: rgba(217, 119, 6, 0.12)
```

---

## Admin Theme (Indigo)

### Primary Colors
- **Main**: `#6366f1` (indigo-600)
- **Hover**: `#4f46e5` (indigo-700)
- **Active**: `#4338ca` (indigo-800)
- **Light**: `#eef2ff` (indigo-50)
- **Dim**: `rgba(99, 102, 241, 0.12)`

### Usage
- Logo: Purple variant (uses freelancer logo)
- Spinners: Indigo
- Progress bars: Indigo gradient
- Buttons: Indigo background/border
- Glow effects: Indigo shadow

### CSS Variables
```css
--workspace-primary: #6366f1
--workspace-primary-hover: #4f46e5
--workspace-primary-active: #4338ca
--workspace-primary-light: #eef2ff
--workspace-primary-dim: rgba(99, 102, 241, 0.12)
```

---

## How Colors Switch

### Automatic Switching
Colors automatically switch based on the workspace class applied to the container:

1. **No class** (default): Freelancer theme (purple)
2. **`.workspace-client`**: Client theme (gold)
3. **`.workspace-admin`**: Admin theme (indigo)

### Detection Logic
The workspace is detected in this order:

1. **URL Path**:
   - `/client/*` → Client theme
   - `/freelancer/*` → Freelancer theme
   - `/admin/*` → Admin theme
   - `/jobs/new` → Client theme
   - `/find-freelancers` → Client theme
   - `/jobs` → Freelancer theme

2. **localStorage**:
   - `profile.active_mode === 'client'` → Client theme
   - Otherwise → Freelancer theme

3. **Default**: Freelancer theme (purple)

---

## Dark Mode

All themes work in dark mode with adjusted opacity and brightness:

### Dark Mode Adjustments
- Background colors are darker
- Text colors are lighter
- Shadows are stronger
- Glow effects are more prominent
- Primary colors remain the same

### Example (Freelancer in Dark Mode)
```css
.dark {
  --color-bg-base: #0a0a0a;
  --color-text-primary: #fafafa;
  --workspace-primary: #9333ea; /* Same purple */
  --workspace-glow: 0 0 40px rgba(147, 51, 234, 0.45); /* Stronger glow */
}
```

---

## Visual Examples

### Freelancer Loading State
```
┌─────────────────────────────┐
│                             │
│    [Purple Logo]            │
│                             │
│   Loading your workspace    │
│   Please wait...            │
│                             │
│   ▓▓▓▓▓░░░░░░░░░░░░░       │ ← Purple progress
│                             │
│   • • •                     │ ← Purple dots
│                             │
└─────────────────────────────┘
```

### Client Loading State
```
┌─────────────────────────────┐
│                             │
│    [Gold Logo]              │
│                             │
│   Loading your workspace    │
│   Please wait...            │
│                             │
│   ▓▓▓▓▓░░░░░░░░░░░░░       │ ← Gold progress
│                             │
│   • • •                     │ ← Gold dots
│                             │
└─────────────────────────────┘
```

### Error Page (Freelancer)
```
┌─────────────────────────────┐
│    [Purple Logo Badge]      │
│                             │
│         ⚠️                  │
│                             │
│   Something went wrong      │
│   An error occurred...      │
│                             │
│  [Refresh] [Back to home]   │
│   Purple    Purple solid    │
│   outline                   │
└─────────────────────────────┘
```

### Error Page (Client)
```
┌─────────────────────────────┐
│    [Gold Logo Badge]        │
│                             │
│         ⚠️                  │
│                             │
│   Something went wrong      │
│   An error occurred...      │
│                             │
│  [Refresh] [Back to home]   │
│   Gold      Gold solid      │
│   outline                   │
└─────────────────────────────┘
```

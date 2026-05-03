# Color Migration Guide - Hardcoded to CSS Variables

## Common Hardcoded Colors to Replace

### Backgrounds
- `#0a0a0a` → `var(--color-bg-base)`
- `#ffffff` → `var(--color-bg-base)`
- `bg-white` → `bg-[var(--color-bg-base)]` or `bg-background`
- `bg-black` → `bg-[var(--color-bg-base)]`
- `bg-white/[0.02]` → `bg-[var(--color-bg-subtle)]`
- `bg-white/5` → `bg-[var(--color-bg-muted)]`
- `bg-white/10` → `bg-[var(--color-bg-elevated)]`

### Text Colors
- `text-white` → `text-[var(--color-text-primary)]`
- `text-white/90` → `text-[var(--color-text-primary)]`
- `text-white/50` → `text-[var(--color-text-secondary)]`
- `text-white/40` → `text-[var(--color-text-tertiary)]`
- `text-black` → `text-[var(--color-text-primary)]`
- `text-gray-900` → `text-[var(--color-text-primary)]`
- `text-gray-600` → `text-[var(--color-text-secondary)]`
- `text-gray-500` → `text-[var(--color-text-tertiary)]`

### Borders
- `border-white/5` → `border-[var(--color-border-subtle)]`
- `border-white/10` → `border-[var(--color-border-default)]`
- `border-white/20` → `border-[var(--color-border-strong)]`
- `border-gray-200` → `border-[var(--color-border-default)]`
- `border-gray-300` → `border-[var(--color-border-strong)]`

### Brand Colors (Workspace-aware)
- `#9333ea` (purple) → `var(--workspace-primary)`
- `#7e22ce` (purple-700) → `var(--workspace-primary-hover)`
- `#E8820C` (amber) → `var(--workspace-primary)` (in client mode)
- `text-violet-300` → `text-[var(--workspace-primary-mid)]`
- `text-violet-400` → `text-[var(--workspace-primary)]`
- `bg-violet-500/10` → `bg-[var(--workspace-primary-dim)]`
- `border-violet-500/30` → `border-[color-mix(in_srgb,var(--workspace-primary)_30%,transparent)]`

### Status Colors
- `text-emerald-300` → `text-[var(--color-status-success)]`
- `bg-emerald-500/10` → `bg-[var(--color-status-success-bg)]`
- `text-red-500` → `text-[var(--color-status-error)]`
- `bg-red-500/10` → `bg-[var(--color-status-error-bg)]`
- `text-amber-500` → `text-[var(--color-status-warning)]`
- `bg-amber-500/10` → `bg-[var(--color-status-warning-bg)]`
- `text-blue-500` → `text-[var(--color-status-info)]`
- `bg-blue-500/10` → `bg-[var(--color-status-info-bg)]`

### Gradients & Complex Backgrounds
```css
/* OLD */
bg-[radial-gradient(90%_160%_at_0%_0%,rgba(139,92,246,0.12)_0%,transparent_48%),#0a0a0a]

/* NEW */
style={{ 
  background: 'radial-gradient(90% 160% at 0% 0%, color-mix(in srgb, var(--workspace-primary) 12%, transparent) 0%, transparent 48%), var(--color-bg-base)' 
}}
```

### Shadows
- `shadow-black/20` → `shadow-[var(--shadow-md)]`
- `shadow-lg` → `shadow-[var(--shadow-lg)]`

## Pattern Examples

### Before:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
```

### After:
```tsx
<div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] border-[var(--color-border-default)]">
```

### Before (inline styles):
```tsx
<div style={{ background: '#0a0a0a', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}>
```

### After (inline styles):
```tsx
<div style={{ 
  background: 'var(--color-bg-base)', 
  color: 'var(--color-text-primary)', 
  borderColor: 'var(--color-border-subtle)' 
}}>
```

## Priority Order
1. Fix backgrounds (most visible)
2. Fix text colors
3. Fix borders
4. Fix brand colors
5. Fix status colors
6. Fix shadows and effects

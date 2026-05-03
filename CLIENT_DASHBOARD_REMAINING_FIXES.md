# ClientDashboard Remaining Fixes

## Sections to Fix:

### 1. Active Projects Section
- Replace: `border-white/5` → `border-[var(--color-border-subtle)]`
- Replace: `bg-white/[0.01]` → `bg-[var(--color-bg-subtle)]`
- Replace: `text-orange-300` → `text-[var(--workspace-primary-mid)]`
- Replace: `text-orange-400` → `text-[var(--workspace-primary)]`
- Replace: `hover:text-orange-300` → hover with inline style
- Replace: `bg-white/5` → `bg-[var(--color-bg-subtle)]`
- Replace: `text-white/40` → `text-[var(--color-text-tertiary)]`
- Replace: `bg-orange-600` → `bg-[var(--workspace-primary)]`
- Replace: `hover:bg-orange-500` → hover with inline style
- Replace: `text-white/90` → `text-[var(--color-text-primary)]`
- Replace: `text-white/50` → `text-[var(--color-text-secondary)]`
- Replace: `text-white/20` → `text-[var(--color-border-default)]`
- Replace: `text-white/70` → `text-[var(--color-text-secondary)]`

### 2. Recent Proposals Section
- Same pattern as above

### 3. Active Contracts Section
- Same pattern as above

### 4. CTA Widget
- Replace: `border-orange-500/20` → `border-[color-mix(in_srgb,var(--workspace-primary)_20%,transparent)]`
- Replace: `from-orange-500/10 via-[#0f0f0f] to-[#0a0a0a]` → use CSS variables
- Replace: `bg-orange-500/20` → `bg-[color-mix(in_srgb,var(--workspace-primary)_20%,transparent)]`
- Replace: `border-orange-500/30` → `border-[color-mix(in_srgb,var(--workspace-primary)_30%,transparent)]`
- Replace: `bg-orange-500/20` → `bg-[color-mix(in_srgb,var(--workspace-primary)_20%,transparent)]`
- Replace: `text-orange-300` → `text-[var(--workspace-primary-mid)]`
- Replace: `text-white` → `text-[var(--color-text-primary)]`
- Replace: `text-orange-200/60` → `text-[var(--color-text-secondary)]`
- Replace: `bg-orange-600` → `bg-[var(--workspace-primary)]`
- Replace: `hover:bg-orange-500` → hover with inline style

### 5. Monthly Summary Widget
- Same pattern as sections above

### 6. Quick Actions
- Same pattern as sections above

## Status: Partially Complete
- ✅ Command Center Banner
- ✅ Stats Cards
- ✅ jobStatusClass function
- ✅ Loading skeletons
- ⏳ Active Projects Section
- ⏳ Recent Proposals Section
- ⏳ Active Contracts Section
- ⏳ CTA Widget
- ⏳ Monthly Summary Widget
- ⏳ Quick Actions
